import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
    getNotes,
    startChat,
    getHistory,
    getChatSessions,
    searchChats,
    sendMessageStream,
    generateQuestions,
    getQuestions,
    submitQuiz,
    getCodeProblem,
    submitCode
} from "../services/api";
import ChatSidebar from "./ChatSidebar";
import CodeProblemOverlay from "../components/CodeProblemOverlay";
import CodeBlock from "../components/CodeBlock";
import "./TopicView.css";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TopicView = () => {
    const { subjectId, topic: topicParam } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const chatIdParam = searchParams.get("chatId");

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

    // Quiz states
    const [quizActive, setQuizActive] = useState(false);
    const [quizData, setQuizData] = useState([]);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [generatingQuiz, setGeneratingQuiz] = useState(false);
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    
    // Code Problem states
    const [codeProblemActive, setCodeProblemActive] = useState(false);
    const [codeProblemData, setCodeProblemData] = useState(null);
    const [submittingCode, setSubmittingCode] = useState(false);

    // Track previous chatId and topic to detect transitions
    const prevChatIdRef = useRef(null);
    const prevTopicRef = useRef(null);
    const messagesRef = useRef([]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const [showHistory, setShowHistory] = useState(false);
    const [notesActive, setNotesActive] = useState(true);
    const [chatActive, setChatActive] = useState(true);
    const [notesWidth, setNotesWidth] = useState(50); // percentage
    const isResizing = useRef(false);

    const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
    const topicDropdownRef = useRef(null);
    const sendingRef = useRef(false);
    const messagesEndRef = useRef(null);

    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchAllTopics = async () => {
            try {
                const response = await fetch(`${BASE_URL}/subjects/`);
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
        const handleClickOutside = (event) => {
            if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target)) {
                setTopicDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

            // Update refs for the new topic
            prevTopicRef.current = topicParam;

            // Auto-load notes on mount as per user request
            fetchNotes(subjectId, topicParam);
            // Load sessions for history
            loadSessions().then(() => {
                if (chatIdParam) {
                    handleSelectChat(chatIdParam);
                } else {
                    // Automatically start/resume chat for the topic
                    autoStartChat(subjectId, topicParam);
                }
            });
        }
    }, [subjectId, topicParam, chatIdParam]);

    useEffect(() => {
        if (chatId) {
            prevChatIdRef.current = chatId;
        }
    }, [chatId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Resizing Logic
    useEffect(() => {
        if (!isResizing.current) return;

        const handleMouseMove = (e) => {
            const container = document.querySelector(".topic-view-container");
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            if (newWidth > 15 && newWidth < 85) {
                setNotesWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = "default";
            document.body.style.userSelect = "auto";
            // Force a re-render to cleanup effect if needed, though ref change doesn't trigger it
            // We use a state to track active resizing for the effect
            setResizingState(false);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing.current]); // This will be triggered by setResizingState

    const [resizingState, setResizingState] = useState(false);

    const handleMouseDown = (e) => {
        isResizing.current = true;
        setResizingState(true);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
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

            if (history.quiz_status === "pending" && subjectId !== "javascript") {
                setQuizActive(true);
                fetchActiveQuiz(id);
            } else {
                setQuizActive(false);
                setQuizData([]);
                setQuizAnswers({});
            }

            if (history.code_problem_status === "pending" && subjectId === "javascript") {
                fetchActiveCodeProblem(id);
            } else {
                setCodeProblemActive(false);
                setCodeProblemData(null);
            }

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

                // Check for special system trigger
                if (aiText.startsWith("[SYSTEM:QUIZ_TRIGGER]")) {
                    const cleanText = aiText.replace("[SYSTEM:QUIZ_TRIGGER]", "").trim();
                    setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { sender: "ai", text: cleanText || "Wait, before we continue, let's review what we've learned so far!" };
                        return updated;
                    });
                    // Trigger quiz fetch
                    await fetchActiveQuiz(chatId);
                    // We can stop here or let it finish, but usually it's a short system message
                    if (done) break;
                } else if (aiText.startsWith("[SYSTEM:CODE_PROBLEM_TRIGGER]")) {
                    const cleanText = aiText.replace("[SYSTEM:CODE_PROBLEM_TRIGGER]", "").trim();
                    setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { sender: "ai", text: cleanText || "Let's test your skills with a quick coding challenge!" };
                        return updated;
                    });
                    // Trigger code problem fetch
                    await fetchActiveCodeProblem(chatId);
                    if (done) break;
                } else {
                    setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            sender: "ai",
                            text: aiText
                        };
                        return updated;
                    });
                }
            }
        } catch (error) {
            console.error("Streaming failed", error);
        } finally {
            sendingRef.current = false;
            setLoading(false);
        }
    };

    const fetchActiveQuiz = async (id = chatId) => {
        try {
            const res = await getQuestions(id, token);
            if (res.quiz && res.quiz.length > 0) {
                setQuizData(res.quiz);
                // Initialize answers
                const initialAnswers = {};
                res.quiz.forEach((q, i) => {
                    initialAnswers[i] = "";
                });
                setQuizAnswers(initialAnswers);
                setQuizActive(true);
            }
        } catch (err) {
            console.error("Failed to fetch active quiz", err);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!chatId) return;
        setGeneratingQuiz(true);
        try {
            const res = await generateQuestions(chatId, token);
            if (res.status === "success" || res.status === "pending") {
                if (res.type === "code" || (subjectId === "javascript" && res.status === "pending")) {
                    await fetchActiveCodeProblem(chatId);
                } else {
                    await fetchActiveQuiz(chatId);
                }
            } else {
                alert(res.detail || "Failed to generate questions. Try chatting more first.");
            }
        } catch (err) {
            console.error(err);
            alert("Error generating questions.");
        } finally {
            setGeneratingQuiz(false);
        }
    };

    const handleQuizOptionChange = (qIndex, value) => {
        setQuizAnswers(prev => ({ ...prev, [qIndex]: value }));
    };

    const handleSubmitQuiz = async () => {
        setSubmittingQuiz(true);
        // Format payload - wrap in 'answers' to match Pydantic QuizSubmission
        const answersList = quizData.map((q, i) => ({
            ...q,
            user_answer: quizAnswers[i] || ""
        }));

        const payload = { answers: answersList };

        try {
            const res = await submitQuiz(chatId, payload, token);
            if (res.status === "success") {
                setQuizActive(false);
                setQuizData([]);
                setQuizAnswers({});

                // Add the feedback as an AI message immediately
                setMessages(prev => [
                    ...prev,
                    { sender: "ai", text: `### Quiz Evaluation\n\n${res.feedback}` }
                ]);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit quiz.");
        } finally {
            setSubmittingQuiz(false);
        }
    };

    const renderQuizOverlay = () => {
        return (
            <div className="quiz-overlay">
                <div className="quiz-overlay-card">
                    <h3>Evaluation Time! 📝</h3>
                    <p className="quiz-intro">Please answer the following questions to continue our chat:</p>

                    {quizData.map((q, idx) => (
                        <div key={idx} className="quiz-question-item">
                            <p className="question-text"><strong>Q{idx + 1}:</strong> {q.question}</p>

                            {q.type === "mcq" ? (
                                <div className="mcq-options-vertical">
                                    {(q.options || []).map((opt, oIdx) => (
                                        <label key={oIdx} className="mcq-option-label">
                                            <input
                                                type="radio"
                                                name={`q-${idx}`}
                                                value={opt}
                                                checked={quizAnswers[idx] === opt}
                                                onChange={() => handleQuizOptionChange(idx, opt)}
                                            />
                                            <span className="option-text">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    className="normal-q-textarea"
                                    placeholder="Type your answer here..."
                                    value={quizAnswers[idx] || ""}
                                    onChange={(e) => handleQuizOptionChange(idx, e.target.value)}
                                    rows="3"
                                />
                            )}
                        </div>
                    ))}

                    <button
                        className="submit-quiz-inline-btn"
                        onClick={handleSubmitQuiz}
                        disabled={submittingQuiz}
                    >
                        {submittingQuiz ? "Submitting..." : "Submit Answers"}
                    </button>
                </div>
            </div>
        );
    };

    const fetchActiveCodeProblem = async (id = chatId) => {
        try {
            const res = await getCodeProblem(id, token);
            if (res.problem) {
                setCodeProblemData(res.problem);
                setCodeProblemActive(true);
            }
        } catch (err) {
            console.error("Failed to fetch code problem", err);
        }
    };

    const handleSubmitCode = async (studentCode) => {
        setSubmittingCode(true);
        try {
            const res = await submitCode(chatId, { code: studentCode }, token);
            if (res.status === "success") {
                setCodeProblemActive(false);
                setCodeProblemData(null);

                // Add feedback to chat
                setMessages(prev => [
                    ...prev,
                    { sender: "ai", text: `### Coding Challenge Feedback\n\n${res.feedback}` }
                ]);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit code.");
        } finally {
            setSubmittingCode(false);
        }
    };

    return (
        <>
            <div className={`topic-view-layout ${quizActive ? "content-blurred" : ""}`}>
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

                        <div className="topic-dropdown-container" ref={topicDropdownRef}>
                            <button
                                className={`topic-dropdown-trigger ${topicDropdownOpen ? "active" : ""}`}
                                onClick={() => setTopicDropdownOpen(!topicDropdownOpen)}
                            >
                                <span className="current-topic-text">{topicParam}</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chevron-icon">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            {topicDropdownOpen && (
                                <ul className="topic-dropdown-menu">
                                    {allTopics.map((t) => (
                                        <li
                                            key={t}
                                            className={`topic-dropdown-item ${t === topicParam ? "current" : ""}`}
                                            onClick={() => {
                                                navigate(`/topic-view/${subjectId}/${t}`);
                                                setTopicDropdownOpen(false);
                                            }}
                                        >
                                            <span className="topic-dot"></span>
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

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
                                    <ReactMarkdown 
                                        components={{
                                            code: CodeBlock
                                        }}
                                    >
                                        {notes}
                                    </ReactMarkdown>
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
                                            messages
                                                .filter(msg => !msg.text.startsWith("[SYSTEM:"))
                                                .map((msg, i) => (
                                                    <div key={i} className={`message ${msg.sender}`}>
                                                        <div className="message-content">
                                                            <ReactMarkdown 
                                                                components={{
                                                                    code: CodeBlock
                                                                }}
                                                            >
                                                                {msg.text}
                                                            </ReactMarkdown>
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
                                            placeholder={quizActive || codeProblemActive ? "Please complete the challenge to continue chatting..." : "Ask a question..."}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            disabled={loading || quizActive || codeProblemActive}
                                        />
                                        <button type="submit" disabled={loading || !input.trim() || quizActive || codeProblemActive}>
                                            Send
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {quizActive && quizData.length > 0 && renderQuizOverlay()}
            {codeProblemActive && codeProblemData && (
                <CodeProblemOverlay 
                    problem={codeProblemData} 
                    onSubmit={handleSubmitCode}
                    submitting={submittingCode}
                />
            )}
        </>
    );
};

export default TopicView;
