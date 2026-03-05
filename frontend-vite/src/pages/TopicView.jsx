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

    const sendingRef = useRef(false);
    const messagesEndRef = useRef(null);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (subjectId && topic) {
            fetchNotes();
            autoStartChat();
            loadSessions();
        }
    }, [subjectId, topic]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchNotes = async (refresh = false) => {
        setLoadingNotes(true);
        try {
            const data = await getNotes(subjectId, topic, refresh);
            setNotes(data.notes || "No notes available for this topic.");
        } catch (error) {
            console.error("Error fetching notes:", error);
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

    const autoStartChat = async () => {
        try {
            localStorage.setItem("subject", subjectId.toLowerCase());
            const res = await startChat(token, topic);
            setChatId(res.chat_id);

            const history = await getHistory(res.chat_id, token);
            // Normalize history messages (handle both 'sender/text' and 'role/content' formats)
            const normalized = (history.messages || []).map(m => ({
                sender: m.role ? (m.role === "assistant" ? "ai" : "user") : (m.sender || "user"),
                text: m.content || m.text || ""
            }));
            setMessages(normalized);
        } catch (error) {
            console.error("Error starting chat session:", error);
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
            <ChatSidebar
                sessions={isSearching ? searchResults : sessions}
                activeChatId={chatId}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                onSearch={handleSearch}
            />

            <div className="topic-view-main">
                <header className="topic-view-header">
                    <div className="topic-info">
                        <span className="subject-tag">{subjectId.toUpperCase()}</span>
                        <h1>{topic}</h1>
                    </div>
                </header>

                <div className="topic-view-container">
                    {/* Left Panel: Notes */}
                    <div className="notes-panel">
                        <div className="panel-header">
                            <h2>Notes</h2>
                            <button
                                className="regenerate-btn"
                                onClick={() => fetchNotes(true)}
                                disabled={loadingNotes}
                                title="Regenerate notes with AI"
                            >
                                {loadingNotes ? "Regenerating..." : "Regenerate Content"}
                            </button>
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

                    {/* Right Panel: Chat */}
                    <div className="chat-panel">
                        <div className="panel-header">
                            <h2>AI Tutor</h2>
                        </div>
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
    );
};

export default TopicView;
