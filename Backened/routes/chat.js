import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Thread from "../models/Threads.js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
console.log(
    "Gemini API Key loaded:",
    Boolean(process.env.GEMINI_API_KEY)
);

const router = express.Router();

// Initialize Gemini API
const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
      })
    : null;


// Test API
router.get("/test", (req, res) => {
    res.json({
        message: "SigmaGPT API is working!",
    });
});


// Get all threads
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({})
            .sort({ updatedAt: -1 });

        res.json(threads);

    } catch (error) {
        console.error("Fetch threads error:", error.message);

        res.status(500).json({
            error: "Failed to fetch threads",
            details: error.message,
        });
    }
});


// Get messages of a thread
router.get("/thread/:threadId", async (req, res) => {
    try {
        const thread = await Thread.findOne({
            threadId: req.params.threadId,
        });

        if (!thread) {
            return res.status(404).json({
                error: "Thread not found",
            });
        }

        res.json(thread.messages || []);

    } catch (error) {
        console.error("Fetch chat error:", error.message);

        res.status(500).json({
            error: "Failed to fetch chat",
            details: error.message,
        });
    }
});


// Delete a thread
router.delete("/thread/:threadId", async (req, res) => {
    try {
        const deletedThread = await Thread.findOneAndDelete({
            threadId: req.params.threadId,
        });

        if (!deletedThread) {
            return res.status(404).json({
                error: "Thread not found",
            });
        }

        res.json({
            success: "Thread deleted successfully",
        });

    } catch (error) {
        console.error("Delete thread error:", error.message);

        res.status(500).json({
            error: "Failed to delete thread",
            details: error.message,
        });
    }
});


// Send message and receive Gemini response
router.post("/chats", async (req, res) => {
    const { threadId, message } = req.body;

    // Validate input
    if (
        !threadId ||
        typeof message !== "string" ||
        !message.trim()
    ) {
        return res.status(400).json({
            error: "threadId and a valid message are required",
        });
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY || !ai) {
        return res.status(500).json({
            error: "GEMINI_API_KEY missing. Check your Backend .env file.",
        });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: "MongoDB is not connected.",
        });
    }

    try {
        const cleanMessage = message.trim();

        console.log("Received message:", cleanMessage);

        // Find or create thread
        let thread = await Thread.findOne({ threadId });

        if (!thread) {
            thread = new Thread({
                threadId,
                title: cleanMessage.slice(0, 60),
                messages: [],
            });
        }

        // Prepare recent conversation history as plain text
        const previousMessages = thread.messages
            .slice(-10)
            .map((chat) => {
                const role =
                    chat.role === "assistant" ? "Assistant" : "User";

                return `${role}: ${chat.content}`;
            });

        const conversationHistory = previousMessages.join("\n");

        const input = conversationHistory
            ? `${conversationHistory}\nUser: ${cleanMessage}`
            : cleanMessage;

        // Generate response using Gemini Interactions API
        const response = await ai.interactions.create({
            model: "gemini-3.8-flash",
            input: input,
        });

        const assistantReply = response.output_text;

        if (
            typeof assistantReply !== "string" ||
            !assistantReply.trim()
        ) {
            console.error(
                "Gemini returned no text:",
                JSON.stringify(response)
            );

            throw new Error("Gemini returned an empty response");
        }

        // Save messages after successful response
        thread.messages.push(
            {
                role: "user",
                content: cleanMessage,
            },
            {
                role: "assistant",
                content: assistantReply.trim(),
            }
        );

        await thread.save();

        // Return response to frontend
        res.json({
            reply: assistantReply.trim(),
            threadId,
        });

    } catch (error) {
        console.error("Gemini API error:", error.message);

        res.status(500).json({
            error: "Failed to generate AI response",
            details: error.message,
        });
    }
});

export default router;