import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
    getNotes,
    startChat,
    sendMessageStream,
    getHistory,
    getChatSessions,
    searchChats
} from "../services/api";
import ChatSidebar from "./ChatSidebar";
import "./TopicView.css";

const TopicView = () => {
    const { subjectId, topic: topicParam } = useParams();
    const navigate = useNavigate();

    const [topic, setTopic] = useState(topicParam);
    const [allTopics, setAllTopics] = useState([]);
    const [notes, setNotes] = useState("");
    const [loadingNotes, setLoadingNotes] = useState(true);

    // Chat states
    const [sessions, setSessions] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const [showHistory, setShowHistory] = useState(false);
    const [notesActive, setNotesActive] = useState(true);
    const [chatActive, setChatActive] = useState(true);
    const [notesWidth, setNotesWidth] = useState(50); // percentage
    const isResizing = useRef(false);

    const sendingRef = useRef(false);
    const messagesEndRef = useRef(null);

    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchAllTopics = async () => {
            try {
                const response = await fetch("http://localhost:8000/subjects/");
                if (response.ok) {
                    const data = await response.json();
                    const currentSubject = data.subjects.find(
                        (s) => s.name.toLowerCase() === subjectId.toLowerCase()
                    );
                    if (currentSubject) {
                        setAllTopics(currentSubject.topics);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch topics:", err);
            }
        };

        if (subjectId) {
            fetchAllTopics();
        }
    }, [subjectId]);

    useEffect(() => {
        if (subjectId && topicParam) {
            // Update localStorage to ensure API calls use the correct subject
            localStorage.setItem("subject", subjectId.toLowerCase());

            setTopic(topicParam);
            // Reset states for new topic
            setNotes("");
            setLoadingNotes(true);
            setMessages([]);
            setChatId(null);

            // Auto-load notes on mount as per user request
            fetchNotes(subjectId, topicParam);
            // Load sessions for history
            loadSessions();
            // Automatically start/resume chat for the topic
            autoStartChat(subjectId, topicParam);
        }
    }, [subjectId, topicParam]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Resizing Logic
    const handleMouseDown = (e) => {
        isResizing.current = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    const handleMouseMove = (e) => {
        if (!isResizing.current) return;

        // Calculate new width as percentage of the container
        const container = document.querySelector(".topic-view-container");
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        // Constrain between 10% and 90%
        if (newWidth > 10 && newWidth < 90) {
            setNotesWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
    };

    const fetchNotes = async (sId = subjectId, tName = topicParam) => {
        try {
            setLoadingNotes(true);
            const data = await getNotes(sId, tName);
            // Change data.content to data.notes to match backend response
            setNotes(data.notes || "No notes available for this topic.");
        } catch (err) {
            console.error("Error fetching notes:", err);
            setNotes("Failed to load notes.");
        } finally {
            setLoadingNotes(false);
        }
    };

    const loadSessions = async () => {
        try {
            const res = await getChatSessions(token);
            setSessions(res.sessions || []);
        } catch (err) {
            console.error("Failed to load sessions", err);
        }
    };

    const autoStartChat = async (sId = subjectId, tName = topicParam) => {
        try {
            setLoading(true);
            localStorage.setItem("subject", sId.toLowerCase());
            const data = await startChat(token, tName);
            setChatId(data.chat_id);

            // If reusing session, fetch history
            if (data.reused) {
                const history = await getHistory(data.chat_id, token);
                const normalized = (history.messages || []).map(m => ({
                    sender: m.role ? (m.role === "assistant" ? "ai" : "user") : (m.sender || "user"),
                    text: m.content || m.text || ""
                }));
                setMessages(normalized);
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error("Error starting chat:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChat = async (id) => {
        try {
            setChatId(id);
            const history = await getHistory(id, token);

            // Normalize message formats consistent with backend/streaming
            const normalized = (history.messages || []).map(m => ({
                sender: m.role ? (m.role === "assistant" ? "ai" : "user") : (m.sender || "user"),
                text: m.content || m.text || ""
            }));
            setMessages(normalized);

            const chat = sessions.find(s => s.chat_id === id);
            if (chat && chat.title) {
                // Topic remains consistent for notes, but we could update if chat title is different
                // setTopic(chat.title);
            }
        } catch (err) {
            console.error("Failed to load chat history", err);
        }
    };

    const handleNewChat = async () => {
        try {
            // Clear current chat to start fresh for the same topic
            setMessages([]);
            setChatId(null);

            const res = await startChat(token, topic);
            setChatId(res.chat_id);

            // Refresh sidebar sessions to show the new "New Chat" session
            await loadSessions();
        } catch (err) {
            console.error("Failed to start fresh chat", err);
        }
    };

    const handleSearch = async (query) => {
        if (!query.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }
        const res = await searchChats(query, token);
        setSearchResults(res.results || []);
        setIsSearching(true);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !chatId || sendingRef.current) return;

        sendingRef.current = true;
        setLoading(true);

        const userText = input;
        setInput("");

        setMessages((prev) => [
            ...prev,
            { sender: "user", text: userText },
            { sender: "ai", text: "" } // placeholder for AI response
        ]);

        try {
            const res = await sendMessageStream(chatId, userText, token);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let aiText = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                aiText += chunk;

                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        sender: "ai",
                        text: aiText
                    };
                    return updated;
                });
            }
        } catch (error) {
            console.error("Streaming failed", error);
        } finally {
            sendingRef.current = false;
            setLoading(false);
        }
    };

    return (
        <div className="topic-view-layout">
            <div className="topic-view-main">
                <header className="topic-view-header">
                    <div className="header-left">
                        <button className="back-link" onClick={() => navigate("/my-subjects")}>
                            <span className="back-icon">‹</span> Subjects
                        </button>
                        <div className="topic-info">
                            <span className="subject-label">{subjectId?.toUpperCase()}</span>
                            <h1>{topicParam}</h1>
                        </div>
                    </div>

                    <nav className="topic-nav">
                        {allTopics.map((t) => (
                            <button
                                key={t}
                                className={`nav-topic-item ${t === topicParam ? "active" : ""}`}
                                onClick={() => navigate(`/topic-view/${subjectId}/${t}`)}
                            >
                                {t}
                            </button>
                        ))}
                        <div className="nav-divider"></div>
                        <button
                            className="nav-code-btn"
                            onClick={() => navigate(`/code-editor/${subjectId}/${topicParam}`)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="code-icon">
                                <polyline points="16 18 22 12 16 6"></polyline>
                                <polyline points="8 6 2 12 8 18"></polyline>
                            </svg>
                            Code
                        </button>
                    </nav>

                    <div className="header-actions">
                        <button className="history-toggle" onClick={() => setShowHistory(!showHistory)}>
                            {showHistory ? "Hide History" : "Chat History"}
                        </button>
                    </div>
                </header>

                <div className="topic-view-container split-view">
                    {/* Left Panel: Notes */}
                    <div className="notes-panel" style={{ width: `${notesWidth}%`, flex: "none" }}>
                        <div className="panel-header">
                            <h2>Notes</h2>
                        </div>
                        <div className="notes-content markdown-body">
                            {loadingNotes ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Preparing study material for {topic}...</p>
                                </div>
                            ) : (
                                <ReactMarkdown>{notes}</ReactMarkdown>
                            )}
                        </div>
                    </div>

                    {/* Resizer Handle */}
                    <div className="resizer-handle" onMouseDown={handleMouseDown}></div>

                    {/* Right Panel: Chat */}
                    <div className="chat-panel" style={{ width: `${100 - notesWidth}%`, flex: "none" }}>
                        <div className="panel-header">
                            <h2>AI Tutor</h2>
                            <button
                                className={`history-toggle ${showHistory ? "active" : ""}`}
                                onClick={() => setShowHistory(!showHistory)}
                                title="Past Conversations"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="clock-icon">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </button>
                        </div>

                        <div className="chat-body-container">
                            {showHistory && (
                                <ChatSidebar
                                    sessions={isSearching ? searchResults : sessions}
                                    activeChatId={chatId}
                                    onSelectChat={handleSelectChat}
                                    onNewChat={handleNewChat}
                                    onSearch={handleSearch}
                                />
                            )}

                            <div className="chat-interaction-area">
                                <div className="chat-messages">
                                    {messages.length === 0 ? (
                                        <div className="chat-empty">
                                            Ask anything about <strong>{topic}</strong> to start learning!
                                        </div>
                                    ) : (
                                        messages.map((msg, i) => (
                                            <div key={i} className={`message ${msg.sender}`}>
                                                <div className="message-content">
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {loading && (
                                        <div className="message ai typing">
                                            <span className="dot">.</span>
                                            <span className="dot">.</span>
                                            <span className="dot">.</span>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form className="chat-input-area" onSubmit={handleSendMessage}>
                                    <input
                                        type="text"
                                        placeholder="Ask a question..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button type="submit" disabled={loading || !input.trim()}>
                                        Send
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopicView;
