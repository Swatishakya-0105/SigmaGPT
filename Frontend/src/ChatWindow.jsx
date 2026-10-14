import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        setReply,
        currThreadId,
        setPrevChats,
        setNewChat
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const getReply = async () => {
        const message = prompt.trim();

        if (!message || loading) {
            return;
        }

        setLoading(true);
        setNewChat(false);

        // Show user's message immediately
        setPrevChats((prevChats) => [
            ...prevChats,
            {
                role: "user",
                content: message
            }
        ]);

        setPrompt("");

        try {
            // Request timeout: 35 seconds
            const controller = new AbortController();

            const timeoutId = setTimeout(() => {
                controller.abort();
            }, 35000);

            let response;

            try {
                response = await fetch(
                    "http://localhost:8080/api/chats",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            message,
                            threadId: currThreadId
                        }),
                        signal: controller.signal
                    }
                );
            } finally {
                clearTimeout(timeoutId);
            }

            // Read backend response
            const data = await response.json();

            console.log("Backend response:", data);

            if (!response.ok) {
                throw new Error(
                    data.details ||
                    data.error ||
                    `Request failed with status ${response.status}`
                );
            }

            if (!data.reply) {
                throw new Error(
                    "The server returned an empty AI response."
                );
            }

            // Save AI reply in context
            setReply(data.reply);

            // Display AI response
            setPrevChats((prevChats) => [
                ...prevChats,
                {
                    role: "assistant",
                    content: data.reply
                }
            ]);

        } catch (error) {
            console.error("Chat API error:", error);

            let errorMessage;

            if (error.name === "AbortError") {
                errorMessage =
                    "Request timed out after 35 seconds. Check the backend terminal and Gemini API.";
            } else if (error instanceof TypeError) {
                errorMessage =
                    "Cannot connect to the backend. Check whether your server is running on port 8080.";
            } else {
                errorMessage = error.message;
            }

            setPrevChats((prevChats) => [
                ...prevChats,
                {
                    role: "assistant",
                    content: `Sorry, something went wrong: ${errorMessage}`
                }
            ]);

        } finally {
            // Always stop the loading animation
            setLoading(false);
        }
    };

    const handleProfileClick = () => {
        setIsOpen((previous) => !previous);
    };

    return (
        <div className="chatWindow">

            {/* Navbar */}
            <div className="navbar">
                <span>
                    SigmaGPT{" "}
                    <i className="fa-solid fa-chevron-down"></i>
                </span>

                <div
                    className="userIconDiv"
                    onClick={handleProfileClick}
                >
                    <span className="userIcon">
                        <i className="fa-solid fa-user"></i>
                    </span>
                </div>
            </div>

            {/* Profile dropdown */}
            {isOpen && (
                <div className="dropDown">
                    <div className="dropDownItem">
                        <i className="fa-solid fa-gear"></i>
                        {" "}Settings
                    </div>

                    <div className="dropDownItem">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        {" "}Upgrade plan
                    </div>

                    <div className="dropDownItem">
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        {" "}Log out
                    </div>
                </div>
            )}

            {/* Chat messages */}
            <Chat />

            {/* Loading indicator */}
            <div className="loader">
                <ScaleLoader
                    color="#777"
                    loading={loading}
                />
            </div>

            {/* Message input */}
            <div className="chatInput">
                <div className="inputBox">
                    <input
                        type="text"
                        placeholder="Ask anything..."
                        value={prompt}
                        onChange={(event) =>
                            setPrompt(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (
                                event.key === "Enter" &&
                                !event.shiftKey
                            ) {
                                event.preventDefault();
                                getReply();
                            }
                        }}
                        disabled={loading}
                    />

                    <button
                        id="submit"
                        type="button"
                        onClick={getReply}
                        disabled={loading || !prompt.trim()}
                        aria-label="Send message"
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </button>
                </div>

                <p className="info">
                    SigmaGPT can make mistakes. Check important information.
                </p>
            </div>

        </div>
    );
}

export default ChatWindow;