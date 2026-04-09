import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import "./StudentNavbar.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
    }, [subjectMenuOpen, subjects.length]);

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

    const closeTimerRef = useRef(null);

    const handleMouseEnter = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        setSubjectMenuOpen(true);
    };

    const handleMouseLeave = () => {
        closeTimerRef.current = setTimeout(() => {
            setSubjectMenuOpen(false);
            setSelectedSubject(null);
            setTopicMenuOpen(false);
        }, 300); 
    };

    const handleSubjectHover = (subject, e) => {
        setSelectedSubject(subject);
        setTopicMenuOpen(true);
        if (e && subjectPanelRef.current) {
            const rowRect = e.currentTarget.getBoundingClientRect();
            const panelRect = subjectPanelRef.current.getBoundingClientRect();
            setTopicPanelTop(rowRect.top - panelRect.top);
        }
    };

    const handleUnitClick = (subject, unit) => {
        navigate(`/unit-topics/${subject.id}/${unit.id}`);
        setSubjectMenuOpen(false);
        setSelectedSubject(null);
        setTopicMenuOpen(false);
    };

    return (
        <div 
            className="nav-subjects-wrapper" 
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className={`nav-btn ${subjectMenuOpen ? "active" : ""}`}
                onClick={() => navigate("/my-subjects")}
            >
                <span className="nav-btn-icon">🎓</span>
                <span>Subjects</span>
            </button>

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
                            {subjects.map((subject) => (
                                <li
                                    key={subject.name}
                                    className={`nav-subject-item ${selectedSubject?.name === subject.name ? "highlighted" : ""}`}
                                    onMouseEnter={(e) => handleSubjectHover(subject, e)}
                                    onClick={(e) => handleSubjectHover(subject, e)}
                                >
                                    <span className="nav-subject-emoji">
                                        {SUBJECT_ICONS[subject.name.toLowerCase()] || SUBJECT_ICONS.default}
                                    </span>
                                    <span className="nav-subject-name">{subject.name}</span>
                                    <span className="nav-subject-count">
                                        {subject.topics?.length || 0}
                                    </span>
                                    <span className="nav-subject-chevron">›</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {subjectMenuOpen && topicMenuOpen && selectedSubject && (
                <div
                    className="nav-dropdown nav-topics-panel"
                    style={{ top: `calc(100% + 8px + ${topicPanelTop}px)` }}
                >
                    <div className="nav-dropdown-header">
                        {SUBJECT_ICONS[selectedSubject.name.toLowerCase()] || SUBJECT_ICONS.default}{" "}
                        {selectedSubject.name}
                    </div>
                    <ul className="nav-unit-list">
                        {(selectedSubject?.units || []).map((unit) => (
                            <li
                                key={unit.id}
                                className="nav-unit-item"
                                onClick={() => handleUnitClick(selectedSubject, unit)}
                            >
                                <span className="nav-topic-dot">•</span>
                                <span className="nav-unit-name">{unit.title?.replace(/Chapter/g, 'Unit') || "Untitled Unit"}</span>
                                <span className="nav-topic-arrow">→</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        title: "5-Day Streak!",
        message: "You've been studying for 5 days in a row! Keep it up 🔥",
        time: "10 mins ago",
        read: false,
        type: "success"
    },
    {
        id: 2,
        title: "New Resource Added",
        message: "A new syllabus PDF has been uploaded for Operating Systems.",
        time: "2 hours ago",
        read: false,
        type: "info"
    },
    {
        id: 3,
        title: "Mindmap Generated",
        message: "Your Database Normalization mindmap is ready to view.",
        time: "1 day ago",
        read: true,
        type: "success"
    }
];

const NotificationDropdown = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <div className="nav-dropdown-wrapper" ref={containerRef}>
            <button className="nav-icon-btn" onClick={() => setOpen(!open)}>
                <span className="nav-btn-icon">🔔</span>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {open && (
                <div className="nav-dropdown notification-panel">
                    <div className="nav-dropdown-header">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <button className="mark-read-btn" onClick={markAllRead}>
                                Mark all read
                            </button>
                        )}
                    </div>
                    {notifications.length === 0 ? (
                        <div className="nav-dropdown-empty">No notifications</div>
                    ) : (
                        <ul className="notification-list">
                            {notifications.map((n) => (
                                <li
                                    key={n.id}
                                    className={`notification-item ${!n.read ? "unread" : ""}`}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    <div className={`notification-icon ${n.type}`}>
                                        {n.type === 'success' ? '✨' : '📝'}
                                    </div>
                                    <div className="notification-content">
                                        <h4>{n.title}</h4>
                                        <p>{n.message}</p>
                                        <span className="notification-time">{n.time}</span>
                                    </div>
                                    {!n.read && <div className="unread-dot" />}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

const StudentNavbar = ({ setIsNotesPanelOpen }) => {
    const navigate = useNavigate();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const profileMenuRef = useRef(null);
    const username = localStorage.getItem("username") || "Student";

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogoutConfirm = async () => {
        await logout();
        localStorage.removeItem("role");
        window.location.reload();
    };

    return (
        <>
            <header className="dash-header fixed-nav">
                <nav className="dash-topbar">
                    <div className="nav-left">
                        <div 
                            className="brand-mark"
                            onClick={() => navigate("/")}
                            style={{ cursor: "pointer" }}
                        >
                            <span className="brand-icon">📚</span>
                            <span className="brand-name">EduLearn</span>
                        </div>
                    </div>

                    <div className="nav-center">
                        <SubjectsNavDropdown />

                        <button className="nav-btn" onClick={() => navigate("/mindmap")}>
                            <span className="nav-btn-icon">🧠</span>
                            <span>Mindmap</span>
                        </button>

                        <button className="nav-btn" onClick={() => setIsNotesPanelOpen(true)}>
                            <span className="nav-btn-icon">📝</span>
                            <span>My Notes</span>
                        </button>

                        <button className="nav-btn" onClick={() => navigate("/flashcards")}>
                            <span className="nav-btn-icon">🗂️</span>
                            <span>Flash Cards</span>
                        </button>
                    </div>

                    <div className="nav-right">
                        <NotificationDropdown />
                        
                        <div className="nav-profile-wrapper" ref={profileMenuRef}>
                            <div className="nav-profile-trigger" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                                <div className="profile-avatar">
                                    {username.charAt(0).toUpperCase()}
                                </div>
                                <span className="profile-name">{username}</span>
                                <span className={`profile-chevron ${profileMenuOpen ? 'open' : ''}`}>▼</span>
                            </div>

                            {profileMenuOpen && (
                                <div className="nav-dropdown profile-dropdown">
                                    <div className="dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                                        <span className="dropdown-icon">⚙️</span>
                                        <span>Settings</span>
                                    </div>
                                    <div className="dropdown-item logout-item" onClick={() => { setShowLogoutModal(true); setProfileMenuOpen(false); }}>
                                        <span className="dropdown-icon">↪</span>
                                        <span>Sign out</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
            </header>

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
        </>
    );
};

export default StudentNavbar;
