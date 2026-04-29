import { apiFetch } from '../services/api';
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getMindmap } from "../services/api";
import Mindmap from "../components/Mindmap";
import "./MindmapPage.css";

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

const MindmapPage = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [selectedMindmap, setSelectedMindmap] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await apiFetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/subjects/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Failed to fetch subjects");
                const data = await response.json();
                setSubjects(data.subjects || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (subjectId) {
            handleFetchMindmap(subjectId);
        } else {
            setSelectedMindmap(null);
        }
    }, [subjectId]);

    const handleFetchMindmap = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getMindmap(id, token);
            setSelectedMindmap(data);
        } catch (err) {
            setError("Failed to load mindmap. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectSelect = (id) => {
        navigate(`/mindmap/${id.toLowerCase()}`);
    };

    const handleTopicClick = (topic) => {
        if (subjectId) {
            navigate(`/topic-view/${subjectId.toLowerCase()}/${topic}`);
        }
    };

    return (
        <div className="mindmap-page">
            <div className="mindmap-header-inline">
                <h1>Academic Subject Overviews</h1>
                <p>Visualize your learning path with interactive mindmaps</p>
            </div>

            {!subjectId ? (
                <div className="subject-selection-grid">
                    {subjects.map((subj) => (
                        <div
                            key={subj.name}
                            className="subject-select-card"
                            onClick={() => handleSubjectSelect(subj.name)}
                        >
                            <span className="subject-icon">
                                {SUBJECT_ICONS[subj.name.toLowerCase()] || SUBJECT_ICONS.default}
                            </span>
                            <h3>{subj.name}</h3>
                            <p>{subj.topics?.length || 0} main topics</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mindmap-container">
                    <div className="mindmap-header">
                        <h2>
                            {SUBJECT_ICONS[subjectId.toLowerCase()] || SUBJECT_ICONS.default} {subjectId.toUpperCase()} Mindmap
                        </h2>
                        <button className="change-subject-btn" onClick={() => navigate("/mindmap")}>
                            Change Academic Subject
                        </button>
                    </div>

                    {loading ? (
                        <div className="mindmap-loader">
                            <div className="spinner" />
                            <p>Generating detailed mindmap with AI...</p>
                        </div>
                    ) : error ? (
                        <div className="mindmap-error">
                            <p>{error}</p>
                            <button onClick={() => handleFetchMindmap(subjectId)}>Try Again</button>
                        </div>
                    ) : selectedMindmap ? (
                        <Mindmap data={selectedMindmap} onTopicClick={handleTopicClick} />
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default MindmapPage;
