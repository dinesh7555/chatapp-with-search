// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./MySubjects.css";

// const MySubjects = () => {
//     const [subjects, setSubjects] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const navigate = useNavigate();

//     useEffect(() => {
//         const fetchSubjects = async () => {
//             try {
//                 const response = await fetch("http://localhost:8000/subjects/");
//                 if (!response.ok) {
//                     throw new Error("Failed to fetch subjects");
//                 }
//                 const data = await response.json();
//                 setSubjects(data.subjects);
//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchSubjects();
//     }, []);

//     const handleTopicClick = (subjectId, topic) => {
//         console.log(`Viewing integrated topic view for ${subjectId} - ${topic}`);
//         navigate(`/topic-view/${subjectId.toLowerCase()}/${topic}`);
//     };

//     if (loading) return <div className="loading">Loading subjects...</div>;
//     if (error) return <div className="error">Error: {error}</div>;

//     return (
//         <div className="subjects-container">
//             <h1>My Subjects</h1>
//             <button className="back-btn" onClick={() => navigate("/student-dashboard")}>Back to Dashboard</button>
//             <div className="subjects-grid">
//                 {subjects.map((subject) => (
//                     <div key={subject.name} className="subject-card">
//                         <h2>{subject.name.toUpperCase()}</h2>
//                         <ul className="topics-list">
//                             {subject.topics.map((topic) => (
//                                 <li
//                                     key={topic}
//                                     className="topic-item"
//                                     onClick={() => handleTopicClick(subject.name, topic)}
//                                     style={{ cursor: "pointer" }}
//                                 >
//                                     <span className="topic-name">{topic}</span>
//                                 </li>
//                             ))}
//                         </ul>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default MySubjects;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MySubjects.css";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const MySubjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await fetch(`${BASE_URL}/subjects/`);
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

    const handleTopicClick = (subjectId, topic) => {
        console.log(`Viewing integrated topic view for ${subjectId} - ${topic}`);
        navigate(`/topic-view/${subjectId.toLowerCase()}/${topic}`);
    };

    if (loading) return <div className="loading">Loading subjects…</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="subjects-container">
            <button className="back-btn" onClick={() => navigate("/student-dashboard")}>
                ← Back to Dashboard
            </button>

            <h1>My Subjects</h1>
            <p className="subjects-subtitle">
                {subjects.length} subject{subjects.length !== 1 ? "s" : ""} enrolled
            </p>

            <div className="subjects-rule">
                <span className="subjects-rule-dot" />
            </div>

            <div className="subjects-grid">
                {subjects.map((subject) => (
                    <div key={subject.name} className="subject-card">
                        <div className="subject-card-header">
                            <h2>{subject.name}</h2>
                            <span className="subject-topic-count">
                                {subject.topics.length} topic{subject.topics.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <ul className="topics-list">
                            {subject.topics.map((topic) => (
                                <li
                                    key={topic}
                                    className="topic-item"
                                    onClick={() => handleTopicClick(subject.name, topic)}
                                >
                                    <span className="topic-name">{topic}</span>
                                    <span className="topic-arrow">→</span>
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