import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./UnitTopics.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const formatTopicTitle = (topicString) => {
    if (!topicString) return "";
    return topicString
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const UnitTopics = () => {
    const { subjectId, unitId } = useParams();
    const [subject, setSubject] = useState(null);
    const [unit, setUnit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubjectsAndFindUnit = async () => {
            try {
                const response = await fetch(`${BASE_URL}/subjects/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch subjects");
                }
                const data = await response.json();
                
                const foundSubject = data.subjects.find(
                    s => s.id.toLowerCase() === subjectId.toLowerCase()
                );
                
                if (!foundSubject) {
                    throw new Error("Subject not found");
                }

                setSubject(foundSubject);

                const foundUnit = foundSubject.units?.find(
                    u => u.id === unitId
                );

                if (!foundUnit) {
                    throw new Error("Unit not found within this subject");
                }

                setUnit(foundUnit);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjectsAndFindUnit();
    }, [subjectId, unitId]);

    const handleTopicClick = (topic) => {
        navigate(`/topic-view/${subjectId.toLowerCase()}/${topic}`);
    };

    if (loading) return <div className="loading">Loading topics...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    const formattedUnitTitle = unit?.title?.replace(/CHAPTER/gi, 'Unit');

    return (
        <div className="unit-topics-page">
            <button className="back-btn" onClick={() => navigate("/my-subjects")}>
                ← Back to Subjects
            </button>
            <div className="unit-topics-header">
                <p className="subject-name">{subject?.name}</p>
                <h1>{formattedUnitTitle}</h1>
                <p className="topics-subtitle">
                    {unit?.topics?.length || 0} topic{(unit?.topics?.length !== 1) ? "s" : ""} in this unit
                </p>
            </div>

            <div className="topics-rule">
                <span className="topics-rule-dot" />
            </div>

            <div className="topics-container">
                {unit?.topics?.map((topic, index) => (
                    <div 
                        key={`${topic}-${index}`} 
                        className="topic-card"
                        onClick={() => handleTopicClick(topic)}
                    >
                        <div className="topic-card-content">
                            <h3 className="topic-card-title">
                                {formatTopicTitle(topic)}
                            </h3>
                        </div>
                        <span className="topic-action-arrow">→</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UnitTopics;
