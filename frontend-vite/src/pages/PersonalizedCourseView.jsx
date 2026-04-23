import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
    getModuleContent,
    startChat,
    getHistory,
    sendMessageStream,
    getCourseState,
    getChatSessions,
    deleteChat,
    searchChats
} from "../services/api";
import CodeBlock from "../components/CodeBlock";
import CurriculumSidebar from "../components/CurriculumSidebar";
import ChatSidebar from "./ChatSidebar";
import MyNotesPanel from "../components/MyNotesPanel";
import "./TopicView.css";

const PersonalizedCourseView = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [content, setContent] = useState("");
    const [loadingContent, setLoadingContent] = useState(true);
    const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
    const [subjectData, setSubjectData] = useState(null);
    const [currentTopic, setCurrentTopic] = useState("");

    // Quiz states
    const [quizActive, setQuizActive] = useState(false);
    const [quizData, setQuizData] = useState([]);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [quizResults, setQuizResults] = useState(null);


    // Chat states
    const [sessions, setSessions] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    // Resizing states
    const [notesWidth, setNotesWidth] = useState(() => {
        const saved = localStorage.getItem("preferredNotesWidth");
        return saved ? parseFloat(saved) : 50;
    });
    const [resizingState, setResizingState] = useState(false);
    const isResizing = useRef(false);
    const workspaceRef = useRef(null);

    // My Notes state
    const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
    const [courseName, setCourseName] = useState("");

    const sendingRef = useRef(false);
    const messagesEndRef = useRef(null);

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "Student";

    useEffect(() => {
        const initialize = async () => {
            if (courseId) {
                await fetchContent();
                await autoStartChat();
            }
        };
        initialize();
    }, [courseId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ── Resizer Effect ──
    useEffect(() => {
        if (!resizingState) return;

        const handleMouseMove = (e) => {
            if (!workspaceRef.current) return;
            const containerRect = workspaceRef.current.getBoundingClientRect();
            let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            if (newWidth < 15) newWidth = 15;
            if (newWidth > 85) newWidth = 85;

            setNotesWidth(newWidth);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            setResizingState(false);
            document.body.classList.remove("resizing-active");
            localStorage.setItem("preferredNotesWidth", notesWidth);
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

    const fetchContent = async () => {
        try {
            setLoadingContent(true);
            setQuizResults(null);
            const stateRes = await getCourseState(courseId, token);
            if (stateRes.syllabus) {
                setCourseName(stateRes.topic || "Personalized Course");
                const currentModIdx = stateRes.current_module_index || 0;
                const activeTopic = stateRes.syllabus[currentModIdx]?.title || "";
                setCurrentTopic(activeTopic);

                const units = (stateRes.hierarchical_syllabus && stateRes.hierarchical_syllabus.length > 0)
                    ? stateRes.hierarchical_syllabus.map((ch, idx) => ({
                        id: `unit_${idx}`,
                        title: ch.chapter_title,
                        topics: ch.topics.map(t => t.title)
                    }))
                    : (stateRes.syllabus.length > 0 ? [
                        {
                            id: `unit_${courseId}`,
                            title: stateRes.topic || "Personalized Course",
                            topics: stateRes.syllabus.map(mod => mod.title || mod)
                        }
                    ] : []);

                if (units.length > 0) {
                    setSubjectData({
                        id: courseId,
                        units: units
                    });
                }
            }

            const moduleToFetch = stateRes.current_module_index !== undefined ? stateRes.current_module_index : 0;
            const data = await getModuleContent(courseId, moduleToFetch, token);
            setContent(data.content || "Welcome to your personalized course!");
            
            if (data.quiz && data.quiz.length > 0) {
                setQuizData(data.quiz);
            } else {
                setQuizData([]);
            }

        } catch (err) {
            console.error("Error fetching content:", err);
            setContent("Failed to load module content.");
        } finally {
            setLoadingContent(false);
        }
    };

    const handleTopicSelect = async (topic) => {
        if (!subjectData || !subjectData.units) return;
        let globalIdx = 0;
        let found = false;
        for (const unit of subjectData.units) {
            const localIdx = unit.topics.indexOf(topic);
            if (localIdx !== -1) {
                globalIdx += localIdx;
                found = true;
                break;
            }
            globalIdx += unit.topics.length;
        }

        if (found) {
            setIsCurriculumOpen(false);
            setLoadingContent(true);
            setCurrentTopic(topic);
            setQuizResults(null);
            try {
                const data = await getModuleContent(courseId, globalIdx, token);
                setContent(data.content || "Could not load content.");
                if (data.quiz && data.quiz.length > 0) {
                    setQuizData(data.quiz);
                } else {
                    setQuizData([]);
                }
                setMessages([]);

            } catch (err) {
                console.error("Error fetching topic content:", err);
            } finally {
                setLoadingContent(false);
            }
        }
    };

    const loadSessions = async () => {
        try {
            localStorage.setItem("subject", courseId);
            const data = await getChatSessions(token);
            setSessions(data.sessions || []);
        } catch (err) {
            console.error("Failed to load sessions:", err);
        }
    };

    const autoStartChat = async () => {
        try {
            setLoading(true);
            localStorage.setItem("subject", courseId);
            const data = await startChat(token, "Personalized Session");
            setChatId(data.chat_id);

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
            await loadSessions();
        } catch (err) {
            console.error("Error starting chat:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChat = async (selectedId) => {
        try {
            setLoading(true);
            setChatId(selectedId);
            const history = await getHistory(selectedId, token);
            const normalized = (history.messages || []).map(m => ({
                sender: m.role ? (m.role === "assistant" ? "ai" : "user") : (m.sender || "user"),
                text: m.content || m.text || ""
            }));
            setMessages(normalized);
            setShowHistory(false);
        } catch (err) {
            console.error("Failed to load chat history:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = async () => {
        try {
            setLoading(true);
            const data = await startChat(token, "Personalized Session");
            setChatId(data.chat_id);
            setMessages([]);
            setShowHistory(false);
            await loadSessions();
        } catch (err) {
            console.error("Failed to start new chat:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChat = async (idToDelete) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteChat(idToDelete, token);
            if (chatId === idToDelete) {
                setChatId(null);
                setMessages([]);
            }
            await loadSessions();
        } catch (err) {
            console.error("Failed to delete chat:", err);
        }
    };

    const handleSearch = async (query) => {
        if (!query.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await searchChats(query, token);
            setSearchResults(res.results || []);
        } catch (err) {
            console.error("Search failed:", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !chatId || sendingRef.current) return;
        sendingRef.current = true;
        setLoading(true);
        const userText = input;
        setInput("");
        setMessages((prev) => [...prev, { sender: "user", text: userText }, { sender: "ai", text: "" }]);
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
                    updated[updated.length - 1] = { sender: "ai", text: aiText };
                    return updated;
                });
            }
            await loadSessions();
        } catch (error) {
            console.error("Streaming failed", error);
        } finally {
            sendingRef.current = false;
            setLoading(false);
        }
    };

    const handleQuizOptionChange = (qIndex, value) => {
        setQuizAnswers(prev => ({ ...prev, [qIndex]: value }));
    };

    const handleSubmitQuiz = () => {
        setSubmittingQuiz(true);
        let score = 0;
        
        const detailedResults = quizData.map((q, idx) => {
            const isCorrect = quizAnswers[idx] === q.answer;
            if (isCorrect) score++;
            return {
                question: q.question,
                userAnswer: quizAnswers[idx] || "No answer",
                correctAnswer: q.answer,
                isCorrect
            };
        });

        setQuizResults({
            score,
            total: quizData.length,
            details: detailedResults
        });

        setQuizActive(false);
        setQuizAnswers({});
        setSubmittingQuiz(false);
    };
    
    // Global "App Lock" for Quiz
    useEffect(() => {
        if (quizActive) {
            document.body.classList.add("quiz-active-lock");
        } else {
            document.body.classList.remove("quiz-active-lock");
        }

        // Cleanup on unmount
        return () => {
            document.body.classList.remove("quiz-active-lock");
        };
    }, [quizActive]);

    const renderQuizOverlay = () => {
        return (
            <div className="quiz-overlay">
                <div className="quiz-overlay-card">
                    <button className="close-quiz-btn" onClick={() => setQuizActive(false)}>✖</button>
                    <h3>End of Topic Review 📝</h3>
                    <p className="quiz-intro">Test your knowledge on <strong>{currentTopic}</strong>!</p>

                    {quizData.map((q, idx) => (
                        <div key={idx} className="quiz-question-item">
                            <p className="question-text"><strong>Q{idx + 1}:</strong> {q.question}</p>

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


    return (
        <div className="topic-view-page">
            <CurriculumSidebar
                subjectData={subjectData}
                currentTopic={currentTopic}
                onTopicSelect={handleTopicSelect}
                isOpen={isCurriculumOpen}
                onClose={() => setIsCurriculumOpen(false)}
            />

            <div className="topic-workspace" ref={workspaceRef}>
                {/* Left Panel: Study Material */}
                <div className="workspace-panel left-panel" style={{ width: `${notesWidth}%` }}>
                    <div className="panel-header-new">
                        <div className="panel-header-left">
                            <button className="hamburger-btn" onClick={() => setIsCurriculumOpen(true)}>
                                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            </button>
                            <span className="panel-title-text">Study Material</span>
                        </div>
                    </div>

                    <div className="panel-content-area">
                        <div className="notes-container markdown-body">
                            {loadingContent ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Loading course...</p>
                                </div>
                            ) : (
                                <ReactMarkdown components={{ code: CodeBlock }}>{content}</ReactMarkdown>
                            )}
                            
                            {!loadingContent && quizData.length > 0 && (
                                <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '2px dashed #e2e8f0', paddingTop: '30px', paddingBottom: '20px' }}>
                                    <button 
                                        onClick={() => setQuizActive(true)}
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#6366f1',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '1em',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                            transition: 'background-color 0.2s, transform 0.1s'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
                                        onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
                                        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                                    >
                                        📝 Take Topic Quiz →
                                    </button>

                                    {quizResults && (
                                        <div className="quiz-results-container" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                                            <h3 style={{ marginTop: 0, color: '#1e293b' }}>Quiz Results: {quizResults.score} / {quizResults.total}</h3>
                                            {quizResults.details.map((res, i) => (
                                                <div key={i} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: i < quizResults.details.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Q{i+1}: {res.question}</p>
                                                    <p style={{ margin: '0 0 5px 0', color: res.isCorrect ? '#16a34a' : '#dc2626' }}>
                                                        Your Answer: {res.userAnswer} {res.isCorrect ? '✅' : '❌'}
                                                    </p>
                                                    {!res.isCorrect && (
                                                        <p style={{ margin: '0', color: '#16a34a', fontWeight: 'bold' }}>
                                                            Correct Answer: {res.correctAnswer}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                                        <p>I'm your personal tutor. How can I help you with <strong>{currentTopic}</strong> today?</p>
                                    </div>
                                ) : (
                                    messages.filter(msg => !msg.text.startsWith("[SYSTEM:")).map((msg, i) => (
                                        <div key={i} className={`message-bubble ${msg.sender}`}>
                                            <div className="bubble-content">
                                                <ReactMarkdown components={{ code: CodeBlock }}>{msg.text}</ReactMarkdown>
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
                                    placeholder={quizActive ? "Complete quiz..." : "Message AI Tutor..."}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={loading || quizActive}
                                />
                                <button type="submit" disabled={loading || !input.trim() || quizActive}>

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
            <div 
                className={`curriculum-overlay ${isCurriculumOpen ? "active" : ""}`} 
                onClick={() => setIsCurriculumOpen(false)}
            />
            {quizActive && quizData.length > 0 && renderQuizOverlay()}
            <MyNotesPanel 

                isOpen={isNotesPanelOpen} 
                onClose={() => setIsNotesPanelOpen(false)} 
                subjectId={courseId} 
                displayName={courseName}
            />
        </div>
    );
};

export default PersonalizedCourseView;
