
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./Notes.css";

const Notes = () => {
    const { subjectId, topic } = useParams();
    const navigate = useNavigate();
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNotes = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `http://localhost:8000/subjects/notes?subject_id=${subjectId}&topic=${topic}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Failed to fetch notes");
                }

                const data = await response.json();
                setNotes(data.notes);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (subjectId && topic) {
            fetchNotes();
        }
    }, [subjectId, topic]);

    return (
        <div className="notes-page-container">
            <header className="notes-header">
                <div>
                    <h1>{topic.toUpperCase()}</h1>
                    <p style={{ color: "#94a3b8", margin: "0.5rem 0 0" }}>Subject: {subjectId.toUpperCase()}</p>
                </div>
                <button className="back-btn" onClick={() => navigate("/my-subjects")}>
                    ← Back to Subjects
                </button>
            </header>

            <main className="notes-content-wrapper">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Generating academic notes for {topic}...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">
                        <h3>Error Generating Notes</h3>
                        <p>{error}</p>
                        <button className="back-btn" onClick={() => navigate("/my-subjects")}>
                            Back to Subjects
                        </button>
                    </div>
                ) : (
                    <div className="markdown-content">
                        <ReactMarkdown>{notes}</ReactMarkdown>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notes;
