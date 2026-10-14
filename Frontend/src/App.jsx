import "./App.css";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState } from "react";
import { v1 as uuidv1 } from "uuid";

function App() {
    const [prompt, setPrompt] = useState("");
    const [reply, setReply] = useState(null);

    const [currThreadId, setCurrThreadId] = useState(uuidv1());

    // Store all chat threads
    const [allThreads, setAllThreads] = useState([]);

    // Store previous chat messages
    const [prevChats, setPrevChats] = useState([]);

    // Store new chat state
    const [newChat, setNewChat] = useState(true);

    const providerValues = {
        prompt,
        setPrompt,
        reply,
        setReply,
        currThreadId,
        setCurrThreadId,
        allThreads,
        setAllThreads,
        prevChats,
        setPrevChats,
        newChat,
        setNewChat
    };

    return (
        <div className="app">
            <MyContext.Provider value={providerValues}>
                <Sidebar />
                <ChatWindow />
            </MyContext.Provider>
        </div>
    );
}

export default App;