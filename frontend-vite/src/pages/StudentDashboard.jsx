import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logout, getAllChatSessions, getResources, downloadResource } from "../services/api";
import SkillProficiency from "./SkillProficiency";
import QuickStats from "./QuickStats";
import "./StudentDashboard.css";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SUBJECT_ICONS = {
    physics: "⚛️",
    chemistry: "🧪",
    mathematics: "📐",
    biology: "🧬",
    english: "📖",
    history: "🏛️",
    geography: "🌍",
    social: "🗺️",
    javascript: "📜",
    java: "☕",
    default: "📚",
};

const MOTIVATIONAL_QUOTES = [
    "The beautiful thing about learning is that no one can take it away from you.",
    "An investment in knowledge pays the best interest.",
    "Education is the passport to the future.",
    "The more that you read, the more things you will know.",
    "Live as if you were to die tomorrow. Learn as if you were to live forever.",
];

// 🏆 MOCK DATA FOR STUDENT JOURNEY
const MOCK_JOURNEY_TOPICS = [
    { id: 1, name: "Intro to Physics", status: "completed", score: 95 },
    { id: 2, name: "Kinematics", status: "completed", score: 88 },
    { id: 3, name: "Newton's Laws", status: "current", score: 45 },
    { id: 4, name: "Work & Energy", status: "locked", score: 0 },
    { id: 5, name: "Rotation", status: "locked", score: 0 },
];

const MOCK_STATS = {
    consistency: 85,
    curiosity: 72,
    totalTopics: 24,
    completedTopics: 12
};

/* ─────────────────────────────────────────────
   SubjectsNavDropdown — self-contained navbar widget
   Fetches subjects once, renders Subject → Topic cascade
───────────────────────────────────────────── */
const SubjectsNavDropdown = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [subjectMenuOpen, setSubjectMenuOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [topicMenuOpen, setTopicMenuOpen] = useState(false);
    const [topicPanelTop, setTopicPanelTop] = useState(0);
    const containerRef = useRef(null);
    const subjectPanelRef = useRef(null);

    // Fetch subjects when the dropdown is first opened
    useEffect(() => {
        if (!subjectMenuOpen || subjects.length > 0) return;
        const fetchSubjects = async () => {
            setLoadingSubjects(true);
            try {
                const response = await fetch(`${BASE_URL}/subjects/`);
                if (!response.ok) throw new Error("Failed to fetch subjects");
                const data = await response.json();
                setSubjects(data.subjects || []);
            } catch (err) {
                console.error("Subjects fetch error:", err);
            } finally {
                setLoadingSubjects(false);
            }
        };
        fetchSubjects();
    }, [subjectMenuOpen]);

    // Close everything when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setSubjectMenuOpen(false);
                setSelectedSubject(null);
                setTopicMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubjectHover = (subject, e) => {
        setSelectedSubject(subject);
        setTopicMenuOpen(true);
        // Calculate the top of the hovered row relative to the subject panel
        if (e && subjectPanelRef.current) {
            const rowRect = e.currentTarget.getBoundingClientRect();
            const panelRect = subjectPanelRef.current.getBoundingClientRect();
            setTopicPanelTop(rowRect.top - panelRect.top);
        }
    };

    const handleTopicClick = (subject, topic) => {
        navigate(`/topic-view/${subject.name.toLowerCase()}/${topic}`);
        setSubjectMenuOpen(false);
        setSelectedSubject(null);
        setTopicMenuOpen(false);
    };

    return (
        <div className="nav-subjects-wrapper" ref={containerRef}>
            {/* Trigger button */}
            <button
                className={`nav-subjects-btn ${subjectMenuOpen ? "active" : ""}`}
                onClick={() => {
                    setSubjectMenuOpen((v) => !v);
                    if (subjectMenuOpen) {
                        setSelectedSubject(null);
                        setTopicMenuOpen(false);
                    }
                }}
            >
                <span className="nav-subjects-icon">🎓</span>
                Subjects
                <span className={`nav-caret ${subjectMenuOpen ? "open" : ""}`}>▾</span>
            </button>

            {/* Subject list panel */}
            {subjectMenuOpen && (
                <div className="nav-dropdown nav-subjects-panel" ref={subjectPanelRef}>
                    <div className="nav-dropdown-header">My Subjects</div>
                    {loadingSubjects ? (
                        <div className="nav-dropdown-loading">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="nav-skeleton" />
                            ))}
                        </div>
                    ) : subjects.length === 0 ? (
                        <div className="nav-dropdown-empty">No subjects found</div>
                    ) : (
                        <ul className="nav-subject-list">
                            {(subjects || []).map((subject) => (
                                <li
                                    key={subject.name}
                                    className={`nav-subject-item ${selectedSubject?.name === subject.name ? "highlighted" : ""
                                        }`}
                                    onMouseEnter={(e) => handleSubjectHover(subject, e)}
                                    onClick={(e) => handleSubjectHover(subject, e)}
                                >
                                    <span className="nav-subject-emoji">
                                        {SUBJECT_ICONS[subject.name.toLowerCase()] || SUBJECT_ICONS.default}
                                    </span>
                                    <span className="nav-subject-name">{subject.name}</span>
                                    <span className="nav-subject-count">
                                        {subject.topics.length}
                                    </span>
                                    <span className="nav-subject-chevron">›</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Topic list panel — flies out to the right */}
            {subjectMenuOpen && topicMenuOpen && selectedSubject && (
                <div
                    className="nav-dropdown nav-topics-panel"
                    style={{ top: `calc(100% + 8px + ${topicPanelTop}px)` }}
                >
                    <div className="nav-dropdown-header">
                        {SUBJECT_ICONS[selectedSubject.name.toLowerCase()] || SUBJECT_ICONS.default}{" "}
                        {selectedSubject.name}
                    </div>
                    <ul className="nav-topic-list">
                        {(selectedSubject?.topics || []).map((topic) => (
                            <li
                                key={topic}
                                className="nav-topic-item"
                                onClick={() => handleTopicClick(selectedSubject, topic)}
                            >
                                <span className="nav-topic-dot">•</span>
                                <span className="nav-topic-name">{topic}</span>
                                <span className="nav-topic-arrow">→</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Main StudentDashboard
───────────────────────────────────────────── */
const StudentDashboard = () => {
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [recentSessions, setRecentSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(true);
    const [greeting, setGreeting] = useState("Good morning");
    const [quote] = useState(
        MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
    );

    const username = localStorage.getItem("username") || "Student";
    const token = localStorage.getItem("token");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 17) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    useEffect(() => {
        const fetchSessions = async () => {
            if (!token) return;
            try {
                setLoadingSessions(true);
                const res = await getAllChatSessions(token);
                const sessions = (res.sessions || []).slice(0, 6);
                setRecentSessions(sessions);
            } catch (err) {
                console.error("Failed to fetch sessions", err);
            } finally {
                setLoadingSessions(false);
            }
        };
        fetchSessions();
    }, [token]);

    useEffect(() => {
        const fetchResources = async () => {
            if (!token) return;
            try {
                setLoadingResources(true);
                const data = await getResources(token);
                setResources(data || []);
            } catch (err) {
                console.error("Failed to fetch resources", err);
            } finally {
                setLoadingResources(false);
            }
        };
        fetchResources();
    }, [token]);

    const handleDownloadSyllabus = () => {
        const link = document.createElement("a");
        link.href = "/syllabus.pdf";
        link.download = "syllabus.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleLogoutConfirm = async () => {
        await logout();
        localStorage.removeItem("role");
        window.location.reload();
    };

    const handleContinueLearning = (session) => {
        const subject = session.subject_id || "physics";
        const topic = session.topic || session.title || "Introduction";

        if (session.subject_id) {
            localStorage.setItem("subject", session.subject_id.toLowerCase());
        }

        navigate(`/topic-view/${subject}/${topic}`);
    };

    const handleDownloadResource = async (resource) => {
        try {
            const blob = await downloadResource(resource.id, token);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = resource.filename.split("_").slice(2).join("_") || resource.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download resource");
        }
    };

    const getSubjectFromSession = (session) => {
        return session.subject_id || "physics";
    };

    const lastStudied = recentSessions[0];
    const lastSubject = lastStudied ? getSubjectFromSession(lastStudied) : null;

    return (
        <div className="dashboard-container">
            {/* Background decoration */}
            <div className="bg-decoration" aria-hidden="true">
                <div className="bg-circle bg-circle-1" />
                <div className="bg-circle bg-circle-2" />
                <div className="bg-circle bg-circle-3" />
                <div className="bg-grid" />
            </div>

            <div className="dashboard-inner">
                {/* ── TOP NAV ── */}
                <nav className="dash-topbar">
                    <div className="brand-mark">
                        <span className="brand-icon">📚</span>
                        <span className="brand-name">EduLearn</span>
                    </div>

                    {/* ── SUBJECTS NAV ITEM ── */}
                    <SubjectsNavDropdown />

                    <button
                        className="nav-subjects-btn"
                        onClick={() => navigate("/mindmap")}
                    >
                        <span className="nav-subjects-icon">🧠</span>
                        Mindmap
                    </button>

                    <button
                        className="logout-btn"
                        onClick={() => setShowLogoutModal(true)}
                    >
                        Sign out
                    </button>
                </nav>

                {/* ── HERO GREETING ── */}
                <section className="hero-section">
                    <div className="hero-left">
                        <p className="greeting-label">{greeting} 👋</p>
                        <h1 className="hero-title">
                            Welcome back,<br />
                            <span className="hero-name">{username}</span>
                        </h1>
                        <p className="hero-quote">"{quote}"</p>
                    </div>

                    {lastStudied && (
                        <div
                            className="continue-card"
                            onClick={() => handleContinueLearning(lastStudied)}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="continue-chip">▶ Continue Learning</div>
                            <div className="continue-subject-icon">
                                {SUBJECT_ICONS[lastSubject] || SUBJECT_ICONS.default}
                            </div>
                            <div className="continue-topic-name">
                                {lastStudied.title || "Last Session"}
                            </div>
                            <div className="continue-subject-label">
                                {lastSubject?.toUpperCase()}
                            </div>
                            <div className="continue-cta">Pick up where you left off →</div>
                        </div>
                    )}
                </section>

                {/* ── SKILL PROFICIENCY ── */}
                <SkillProficiency />

                {/* ── MY LEARNING JOURNEY (MOCK) ── */}
                <section className="section-block journey-section">
                    <div className="section-header-row">
                        <h2 className="section-title">My Learning Journey 🚀</h2>
                        <div className="journey-summary-badges">
                            <div className="journey-badge">
                                <span className="badge-label">Mastery Growth</span>
                                <span className="badge-value">+12%</span>
                            </div>
                            <div className="journey-badge">
                                <span className="badge-label">Curiosity Index</span>
                                <span className="badge-value">{MOCK_STATS.curiosity}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="journey-layout-grid">
                        {/* Skill Tree / Path */}
                        <div className="skill-tree-container">
                            <h3>Topic Progress Path</h3>
                            <div className="skill-path">
                                {MOCK_JOURNEY_TOPICS.map((topic, index) => (
                                    <div key={topic.id} className={`path-node ${topic.status}`}>
                                        <div className="node-circle">
                                            {topic.status === 'completed' ? '✓' : topic.status === 'current' ? '⭐️' : '🔒'}
                                        </div>
                                        <div className="node-info">
                                            <span className="node-name">{topic.name}</span>
                                            {topic.status !== 'locked' && (
                                                <span className="node-score">{topic.score}% Mastery</span>
                                            )}
                                        </div>
                                        {index < MOCK_JOURNEY_TOPICS.length - 1 && <div className="node-connector" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gauges / Stats */}
                        <div className="journey-stats-aside">
                            <QuickStats />
                        </div>
                    </div>
                </section>

                {/* ── QUICK ACTIONS ── */}
                <section className="section-block">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="quick-actions-grid">
                        <div className="action-card action-subjects" onClick={() => navigate("/my-subjects")}>
                            <span className="action-icon">🎓</span>
                            <div className="action-text">
                                <h3>My Subjects</h3>
                                <p>Browse topics and study materials</p>
                            </div>
                            <span className="action-arrow">→</span>
                        </div>
                        <div className="action-card action-syllabus" onClick={handleDownloadSyllabus}>
                            <span className="action-icon">📄</span>
                            <div className="action-text">
                                <h3>Download Syllabus</h3>
                                <p>Get your complete course PDF</p>
                            </div>
                            <span className="action-arrow">↓</span>
                        </div>
                    </div>
                </section>

                {/* ── RECENT STUDY SESSIONS ── */}
                <section className="section-block">
                    <div className="section-header-row">
                        <h2 className="section-title">Recently Studied</h2>
                        {recentSessions.length > 0 && (
                            <button className="view-all-btn" onClick={() => navigate("/my-subjects")}>
                                View all →
                            </button>
                        )}
                    </div>

                    {loadingSessions ? (
                        <div className="sessions-loading">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="session-skeleton" />
                            ))}
                        </div>
                    ) : recentSessions.length === 0 ? (
                        <div className="sessions-empty">
                            <span className="empty-icon">🌱</span>
                            <p>No study sessions yet. Start learning to track your progress!</p>
                            <button className="start-btn" onClick={() => navigate("/my-subjects")}>
                                Start Studying
                            </button>
                        </div>
                    ) : (
                        <div className="sessions-grid">
                            {(recentSessions || []).map((session, i) => {
                                const sub = getSubjectFromSession(session);
                                return (
                                    <div
                                        key={session.chat_id || i}
                                        className="session-card"
                                        style={{ animationDelay: `${i * 0.07}s` }}
                                        onClick={() => handleContinueLearning(session)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div className="session-icon-wrap">
                                            <span className="session-icon">
                                                {SUBJECT_ICONS[sub] || SUBJECT_ICONS.default}
                                            </span>
                                        </div>
                                        <div className="session-info">
                                            <div className="session-topic">
                                                {session.title || "Untitled Session"}
                                            </div>
                                            <div className="session-subject">{sub?.toUpperCase()}</div>
                                        </div>
                                        <span className="session-resume">Resume →</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── RESOURCES ── */}
                <section className="section-block">
                    <h2 className="section-title">Resources</h2>
                    {loadingResources ? (
                        <div className="sessions-loading">
                            {[1, 2].map((i) => (
                                <div key={i} className="session-skeleton" />
                            ))}
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="sessions-empty">
                            <span className="empty-icon">📂</span>
                            <p>No resources available for your branch yet.</p>
                        </div>
                    ) : (
                        <div className="sessions-grid">
                            {(resources || []).map((res, i) => (
                                <div
                                    key={res.id}
                                    className="session-card"
                                    style={{ animationDelay: `${i * 0.05}s` }}
                                >
                                    <div className="session-icon-wrap">
                                        <span className="session-icon">📄</span>
                                    </div>
                                    <div className="session-info">
                                        <div className="session-topic">{res.title}</div>
                                        <div className="session-subject">
                                            {res.subject?.toUpperCase()} | {res.teacher_name}
                                        </div>
                                    </div>
                                    <button
                                        className="session-resume"
                                        style={{ background: "none", border: "none", color: "var(--color-accent)", cursor: "pointer" }}
                                        onClick={() => handleDownloadResource(res)}
                                    >
                                        Download ↓
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── STUDY TIPS ── */}
                <section className="section-block study-tips-section">
                    <h2 className="section-title">Study Tips</h2>
                    <div className="tips-grid">
                        {[
                            { icon: "⏱️", tip: "Study in 25-min focused sprints with 5-min breaks (Pomodoro)." },
                            { icon: "✍️", tip: "Write summaries in your own words to reinforce memory." },
                            { icon: "💬", tip: "Use the AI tutor to ask questions anytime you're stuck." },
                        ].map((item, i) => (
                            <div key={i} className="tip-card" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                                <span className="tip-icon">{item.icon}</span>
                                <p className="tip-text">{item.tip}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ── LOGOUT MODAL ── */}
            {showLogoutModal && (
                <div
                    className="logout-modal-overlay"
                    onClick={() => setShowLogoutModal(false)}
                >
                    <div
                        className="logout-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-icon">👋</div>
                        <h3>Sign out?</h3>
                        <p>Your progress is saved. You can always come back and continue learning.</p>
                        <div className="logout-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Stay
                            </button>
                            <button className="confirm-btn" onClick={handleLogoutConfirm}>
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;