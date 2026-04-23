import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllChatSessions, getResources, downloadResource } from "../services/api";
import SkillProficiency from "./SkillProficiency";
import CompetencyRadar from "./CompetencyRadar";
import QuickStats from "./QuickStats";
import "./StudentDashboard.css";

const SUBJECT_ICONS = {
    operating_systems: "💻",
    database_management: "🗄️",
    computer_networks: "🌐",
    data_structures: "🌲",
    artificial_intelligence: "🤖",
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



const StudentDashboard = () => {
    const navigate = useNavigate();
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

    const handleContinueLearning = (session) => {
        const subject = session.subject_id || "operating_systems";
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
        return session.subject_id || "operating_systems";
    };

    const lastStudied = recentSessions[0];
    const lastSubject = lastStudied ? getSubjectFromSession(lastStudied) : null;

    return (
        <div className="dashboard-container">
            <div className="dashboard-inner">


                <section className="hero-section">
                    <div className="hero-left">
                        <p className="greeting-label">{greeting} 👋</p>
                        <h1 className="hero-title">
                            Welcome back,<br />
                            <span className="hero-name">{username}</span>
                        </h1>
                        <p className="hero-quote">"{quote}"</p>
                    </div>

                    <div className="hero-right">
                        <QuickStats />
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
                    </div>
                </section>

                <div className="skills-row-grid">
                    <SkillProficiency />
                    <CompetencyRadar />
                </div>

                <section className="section-block">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="quick-actions-grid">
                        <div className="action-card action-subjects" onClick={() => navigate("/my-subjects")}>
                            <span className="action-icon">🎓</span>
                            <div className="action-text">
                                <h3>My Academic Subjects</h3>
                                <p>Browse topics and study materials</p>
                            </div>
                            <span className="action-arrow">→</span>
                        </div>
                        <div className="action-card action-personalized" onClick={() => navigate("/personalized/onboarding")}>
                            <span className="action-icon">🌟</span>
                            <div className="action-text">
                                <h3>Explore New Topic</h3>
                                <p>Create a personalized learning course</p>
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
                            {recentSessions.map((session, i) => {
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
                            {resources.map((res, i) => (
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
        </div>
    );
};

export default StudentDashboard;