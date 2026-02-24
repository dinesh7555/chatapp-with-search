
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const StudentDashboard = () => {
    const navigate = useNavigate();

    const handleDownloadSyllabus = () => {
        // Assuming syllabus.pdf is in the public folder
        const link = document.createElement('a');
        link.href = '/syllabus.pdf';
        link.download = 'syllabus.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="dashboard-container">
            <h1>Student Dashboard</h1>
            <div className="dashboard-actions">
                <div className="card" onClick={handleDownloadSyllabus}>
                    <h2>Download Syllabus</h2>
                    <p>Click to download the course syllabus.</p>
                </div>
                <div className="card" onClick={() => navigate("/my-subjects")}>
                    <h2>My Subjects</h2>
                    <p>View your subjects and topics.</p>
                </div>
            </div>
            <button className="logout-btn" onClick={() => {
                localStorage.removeItem("token");
                navigate("/");
                window.location.reload();
            }}>Logout</button>
        </div>
    );
};

export default StudentDashboard;
