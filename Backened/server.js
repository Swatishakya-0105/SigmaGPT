import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// Chat API routes
app.use("/api", chatRoutes);

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URL) {
            console.log("MongoDB URL missing. Database connection skipped.");
            return;
        }

        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected with Database!");
    } catch (err) {
        console.log("Failed to connect with DB:", err.message);
    }
};

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await connectDB();
});