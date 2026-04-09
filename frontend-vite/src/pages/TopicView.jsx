import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
    submitCode,
    deleteChat
} from "../services/api";
import ChatSidebar from "./ChatSidebar";
import CurriculumSidebar from "../components/CurriculumSidebar";
import CodeProblemOverlay from "../components/CodeProblemOverlay";
import CodeBlock from "../components/CodeBlock";
import MyNotesPanel from "../components/MyNotesPanel";
import "./TopicView.css";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TopicView = () => {
    const { subjectId, topic: topicParam } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const chatIdParam = searchParams.get("chatId");

    const [topic, setTopic] = useState(topicParam);
    const [allTopics, setAllTopics] = useState([]);
    const [subjectData, setSubjectData] = useState(null);
    const [notes, setNotes] = useState("");
    const [loadingNotes, setLoadingNotes] = useState(true);

    // Chat states
    const [sessions, setSessions] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [pdfUrl, setPdfUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

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
    const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);

    // Track previous chatId and topic to detect transitions
    const prevChatIdRef = useRef(null);


    const [showHistory, setShowHistory] = useState(false);
    const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
    const [notesWidth, setNotesWidth] = useState(() => {
        const saved = localStorage.getItem("preferredNotesWidth");
        return saved ? parseFloat(saved) : 50;
    });
    const [resizingState, setResizingState] = useState(false);
    const isResizing = useRef(false);
    const workspaceRef = useRef(null);

    const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
    const topicDropdownRef = useRef(null);
    const sendingRef = useRef(false);
    const messagesEndRef = useRef(null);

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "Student";

    const pdfWrapperRef = useRef(null);
    const [pdfWidth, setPdfWidth] = useState(null);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                setPdfWidth(entries[0].contentRect.width - 20); // padding adjustment for scrollbars
            }
        });
        if (pdfWrapperRef.current) {
            observer.observe(pdfWrapperRef.current);
        }
        return () => observer.disconnect();
    }, [pdfUrl, isCurriculumOpen, notesWidth]);


    // 🔹 Load subjects and hierarchy
    useEffect(() => {
        const loadSubjects = async () => {
            if (!subjectId) return;
            try {
                const response = await fetch(`${BASE_URL}/subjects/`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    
                    // Normalize the subjectId from the URL for comparison
                    const normalizedUrlId = subjectId.replace(/ |%20/g, "_").toLowerCase();

                    const currentSubject = data.subjects.find(s => {
                        const normalizedId = s.id.replace(/ |%20/g, "_").toLowerCase();
                        return normalizedId === normalizedUrlId;
                    });

                    if (currentSubject) {
                        setAllTopics(currentSubject.topics || []);
                        setSubjectData(currentSubject);
                    }
                }
            } catch (err) {
                console.error("Failed to load subjects:", err);
            }
        };
        loadSubjects();
    }, [subjectId]);

    const handleTopicSelect = (newTopic) => {
        setIsCurriculumOpen(false);
        navigate(`/topic-view/${subjectId}/${newTopic}`);
    };

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
            // Normalize subjectId for API calls (e.g. "Data Structures" -> "data_structures")
            const normalizedSubject = subjectId.replace(/ |%20/g, "_").toLowerCase();
            localStorage.setItem("subject", normalizedSubject);

            setTopic(topicParam);
            // Reset states for new topic
            setNotes("");
            setPdfUrl(null);
            setNumPages(null);
            setPageNumber(1);
            setLoadingNotes(true);
            setMessages([]);
            setChatId(null);

            // Auto-load notes on mount as per user request
            fetchNotesOrPdf(normalizedSubject, topicParam);
            // Load sessions for history
            loadSessions().then(() => {
                if (chatIdParam) {
                    handleSelectChat(chatIdParam);
                } else {
                    // Automatically start/resume chat for the topic
                    autoStartChat(normalizedSubject, topicParam);
                }
            });
        }
    }, [subjectId, topicParam, chatIdParam]);

    // Global "App Lock" for Quiz/Code Challenges
    useEffect(() => {
        if (quizActive || codeProblemActive) {
            document.body.classList.add("quiz-active-lock");
        } else {
            document.body.classList.remove("quiz-active-lock");
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove("quiz-active-lock");
        };
    }, [quizActive, codeProblemActive]);

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
        if (!resizingState) return;

        const handleMouseMove = (e) => {
            if (!workspaceRef.current) return;
            const containerRect = workspaceRef.current.getBoundingClientRect();
            let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            // Constraints: 15% minimum, 85% maximum
            if (newWidth < 15) newWidth = 15;
            if (newWidth > 85) newWidth = 85;

            setNotesWidth(newWidth);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            setResizingState(false);
            document.body.classList.remove("resizing-active");
            
            // Persist preference
            localStorage.setItem("preferredNotesWidth", notesWidth.toString());
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizingState, notesWidth]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        isResizing.current = true;
        setResizingState(true);
        document.body.classList.add("resizing-active");
    };

    const fetchNotesOrPdf = async (sId = subjectId, tName = topicParam) => {
        try {
            setLoadingNotes(true);
            const url = `/pdfs/${sId}/${tName}.pdf`;
            const res = await fetch(url, { method: 'HEAD' });
            if (res.ok) {
                setPdfUrl(url);
                setLoadingNotes(false);
                return;
            }
        } catch (err) {
            console.error("PDF check failed, falling back to LLM notes:", err);
        }

        setPdfUrl(null);
        try {
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
            const normalizedSubject = sId.replace(/ |%20/g, "_").toLowerCase();
            localStorage.setItem("subject", normalizedSubject);
            
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
                if (history.code_problem_status === "pending" && (sId.toLowerCase() === "javascript" || sId.toLowerCase() === "java")) {
                    fetchActiveCodeProblem(data.chat_id);
                }
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
            const normalizedSubject = subjectId.replace(/ |%20/g, "_").toLowerCase();
            localStorage.setItem("subject", normalizedSubject);
            
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

            if (history.code_problem_status === "pending" && (subjectId === "javascript" || subjectId === "java")) {
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
            const normalizedSubject = subjectId.replace(/ |%20/g, "_").toLowerCase();
            localStorage.setItem("subject", normalizedSubject);

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

    const handleDeleteChat = async (id) => {
        if (!window.confirm("Are you sure you want to delete this chat session?")) {
            return;
        }

        try {
            await deleteChat(id, token);
            // Remove from local state
            setSessions(prev => prev.filter(s => s.chat_id !== id));
            
            // If the deleted chat was the active one, reset
            if (id === chatId) {
                setChatId(null);
                setMessages([]);
                setQuizActive(false);
                setCodeProblemActive(false);
            }
        } catch (err) {
            console.error("Failed to delete chat", err);
            alert("Failed to delete chat. Please try again.");
        }
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
        <div className={`topic-view-page ${quizActive ? "content-blurred" : ""}`}>
            <div className="topic-workspace" ref={workspaceRef}>
                {/* Left Panel: Study Material & Navigation */}
                <div className="workspace-panel left-panel" style={{ width: `${notesWidth}%` }}>
                    <div className="panel-header-new">
                        <div className="panel-header-left">
                            <button 
                                className="hamburger-btn"
                                onClick={() => setIsCurriculumOpen(true)}
                                aria-label="Open Topics"
                            >
                                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            </button>
                            <span className="panel-title-text">Study Notes</span>
                        </div>
                        <div className="panel-header-right">
                             <button
                                className="panel-code-btn"
                                onClick={() => navigate(`/code-editor/${subjectId}/${topicParam}`)}
                            >
                                <code>&lt;/&gt;</code> Code
                            </button>
                        </div>
                    </div>

                    <div className="panel-content-area">
                        <div className="notes-container markdown-body">
                            {loadingNotes && !pdfUrl ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Loading {topic}...</p>
                                </div>
                            ) : pdfUrl ? (
                                <div className="pdf-viewer-container">
                                    <div className="pdf-viewer-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '15px' }}>
                                        <button 
                                            disabled={pageNumber <= 1} 
                                            onClick={() => setPageNumber(prev => prev - 1)}
                                            style={{ padding: '8px 16px', border: 'none', background: pageNumber <= 1 ? '#ccc' : '#4f46e5', color: '#fff', borderRadius: '5px', cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer' }}
                                        >
                                            ← Previous
                                        </button>
                                        <span style={{ fontWeight: 'bold' }}>
                                            Page {pageNumber} of {numPages || '--'}
                                        </span>
                                        <button 
                                            disabled={pageNumber >= numPages} 
                                            onClick={() => setPageNumber(prev => prev + 1)}
                                            style={{ padding: '8px 16px', border: 'none', background: pageNumber >= numPages ? '#ccc' : '#4f46e5', color: '#fff', borderRadius: '5px', cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer' }}
                                        >
                                            Next →
                                        </button>
                                    </div>
                                    <div ref={pdfWrapperRef} style={{ display: 'flex', justifyContent: 'center', width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', minHeight: '600px', backgroundColor: '#e5e4e2' }}>
                                        <Document
                                            file={pdfUrl}
                                            onLoadSuccess={onDocumentLoadSuccess}
                                            loading={<div className="spinner"></div>}
                                        >
                                            <Page 
                                                pageNumber={pageNumber} 
                                                renderTextLayer={true} 
                                                renderAnnotationLayer={true} 
                                                width={pdfWidth}
                                            />
                                        </Document>
                                    </div>
                                </div>
                            ) : (
                                <ReactMarkdown components={{ code: CodeBlock }}>
                                    {notes}
                                </ReactMarkdown>
                            )}
                        </div>
                    </div>
                </div>

                {/* Resizer */}
                <div className="workspace-resizer" onMouseDown={handleMouseDown}></div>

                {/* Right Panel: AI Tutor */}
                <div className="workspace-panel right-panel" style={{ width: `${100 - notesWidth}%` }}>
                    <div className="panel-header-new">
                        <div className="panel-header-left">
                            <span className="ai-status-dot"></span>
                            <span className="panel-title-text">AI Tutor</span>
                        </div>
                        <div className="panel-header-right">
                             <button
                                className="history-toggle-pill"
                                onClick={() => setIsNotesPanelOpen(true)}
                            >
                                📝 My Notes
                            </button>
                            <button
                                className={`history-toggle-pill ${showHistory ? "active" : ""}`}
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                {showHistory ? "✖ Close Sidebar" : "📜 History"}
                            </button>
                        </div>
                    </div>

                    <div className="chat-workspace-body">
                        <div className={`history-sidebar-inline ${showHistory ? "open" : ""}`}>
                            <ChatSidebar
                                sessions={isSearching ? searchResults : sessions}
                                activeChatId={chatId}
                                onSelectChat={handleSelectChat}
                                onNewChat={handleNewChat}
                                onSearch={handleSearch}
                                onDeleteChat={handleDeleteChat}
                            />
                        </div>
                        
                        <div className="chat-interface-new">
                            <div className="chat-messages">
                                {messages.length === 0 ? (
                                    <div className="chat-welcome">
                                        <div className="welcome-bot-icon">🤖</div>
                                        <h3>Hello, {username}!</h3>
                                        <p>I'm your {subjectData?.name} tutor. How can I help you with <strong>{topicParam}</strong> today?</p>
                                        <div className="suggested-prompts">
                                            <button onClick={() => setInput(`Explain ${topicParam} in simple terms`)}>Explain in simple terms</button>
                                            <button onClick={() => setInput(`Give me a real-world example of ${topicParam}`)}>Real-world example</button>
                                        </div>
                                    </div>
                                ) : (
                                    messages
                                        .filter(msg => !msg.text.startsWith("[SYSTEM:"))
                                        .map((msg, i) => (
                                            <div key={i} className={`message-bubble ${msg.sender}`}>
                                                <div className="bubble-content">
                                                    <ReactMarkdown components={{ code: CodeBlock }}>
                                                        {msg.text}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))
                                )}
                                {loading && (
                                    <div className="message-bubble ai typing">
                                        <div className="typing-dots"><span></span><span></span><span></span></div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input-row" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    placeholder={quizActive || codeProblemActive ? "Complete challenge..." : "Message AI Tutor..."}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={loading || quizActive || codeProblemActive}
                                />
                                <button type="submit" disabled={loading || !input.trim() || quizActive || codeProblemActive}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </form>
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
            <div 
                className={`curriculum-overlay ${isCurriculumOpen ? "active" : ""}`} 
                onClick={() => setIsCurriculumOpen(false)}
            />
            <CurriculumSidebar
                isOpen={isCurriculumOpen}
                onClose={() => setIsCurriculumOpen(false)}
                subjectData={subjectData}
                currentTopic={topicParam}
                onTopicSelect={handleTopicSelect}
            />
            <MyNotesPanel 
                isOpen={isNotesPanelOpen} 
                onClose={() => setIsNotesPanelOpen(false)} 
                subjectId={subjectId} 
            />
        </div>
    );
};

export default TopicView;
