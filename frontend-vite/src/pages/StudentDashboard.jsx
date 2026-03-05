import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/api";
import "./StudentDashboard.css";

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleDownloadSyllabus = () => {
        const link = document.createElement('a');
        link.href = '/syllabus.pdf';
        link.download = 'syllabus.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleLogoutConfirm = async () => {
        await logout();                  // calls backend + clears localStorage
        localStorage.removeItem("role");
        window.location.reload();
    };

    return (
        <div className="dashboard-container">
            {/* Welcome section */}
            <div className="dashboard-welcome">
                <div className="dashboard-logo">📚</div>
                <h1>Welcome back</h1>
                <p className="dashboard-subtitle">What would you like to do today?</p>
            </div>

            {/* Action cards */}
            <div className="dashboard-actions">
                <div className="card" onClick={handleDownloadSyllabus}>
                    <span className="card-icon">📄</span>
                    <h2>Download Syllabus</h2>
                    <p>Get the complete course syllabus as a PDF.</p>
                </div>
                <div className="card" onClick={() => navigate("/my-subjects")}>
                    <span className="card-icon">🎓</span>
                    <h2>My Subjects</h2>
                    <p>Browse your subjects, topics, and start studying.</p>
                </div>
            </div>

            <button
                className="logout-btn"
                onClick={() => setShowLogoutModal(true)}
            >
                Sign out
            </button>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">
                        <h3>Confirm Logout</h3>
                        <p>Are you sure you want to sign out?</p>
                        <div className="logout-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => setShowLogoutModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={handleLogoutConfirm}
                            >
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