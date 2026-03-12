
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MySubjects.css";

const MySubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await fetch("http://localhost:8000/subjects/");
                if (!response.ok) {
                    throw new Error("Failed to fetch subjects");
                }
                const data = await response.json();
                setSubjects(data.subjects);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    const handleNotesClick = (subjectId, topic) => {
        console.log(`Viewing notes for ${subjectId} - ${topic}`);
        navigate(`/notes/${subjectId.toLowerCase()}/${topic}`);
    };

    const handleChatClick = (subjectId, topic) => {
        console.log(`Starting chat for ${subjectId} - ${topic}`);
        localStorage.setItem("subject", subjectId.toLowerCase());
        navigate(`/chat?topic=${topic}`);
    };

    if (loading) return <div className="loading">Loading subjects...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="subjects-container">
            <h1>My Subjects</h1>
            <button className="back-btn" onClick={() => navigate("/student-dashboard")}>Back to Dashboard</button>
            <div className="subjects-grid">
                {subjects.map((subject) => (
                    <div key={subject.name} className="subject-card">
                        <h2>{subject.name.toUpperCase()}</h2>
                        <ul className="topics-list">
                            {subject.topics.map((topic) => (
                                <li key={topic} className="topic-item">
                                    <span className="topic-name">{topic}</span>
                                    <div className="topic-actions">
                                        <button className="action-btn notes-btn" onClick={() => handleNotesClick(subject.name, topic)}>Notes</button>
                                        <button className="action-btn chat-btn" onClick={() => handleChatClick(subject.name, topic)}>Chat</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MySubjects;
