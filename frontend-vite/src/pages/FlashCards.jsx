
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./FlashCards.css";

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

const FlashCards = () => {
    const navigate = useNavigate();
    const { subjectId } = useParams();
    const [subjects, setSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [flashcards, setFlashcards] = useState([]);
    const [loadingFlashcards, setLoadingFlashcards] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [error, setError] = useState(null);

    const token = localStorage.getItem("token");

    // Fetch subjects list
    useEffect(() => {
        const fetchSubjects = async () => {
            setLoadingSubjects(true);
            try {
                const response = await fetch(`${BASE_URL}/subjects/`);
                if (!response.ok) throw new Error("Failed to fetch subjects");
                const data = await response.json();
                setSubjects(data.subjects || []);
            } catch (err) {
                console.error("Subjects fetch error:", err);
                setError("Failed to load subjects.");
            } finally {
                setLoadingSubjects(false);
            }
        };
        fetchSubjects();
    }, []);

    // Fetch flashcards for the selected subject
    useEffect(() => {
        if (!subjectId) {
            setFlashcards([]);
            return;
        }

        const fetchFlashcards = async () => {
            setLoadingFlashcards(true);
            setError(null);
            setCurrentIndex(0);
            setIsFlipped(false);
            try {
                const response = await fetch(`${BASE_URL}/subjects/${subjectId}/flashcards`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!response.ok) throw new Error("Failed to fetch flashcards");
                const data = await response.json();
                setFlashcards(data.flashcards || []);
            } catch (err) {
                console.error("Flashcards fetch error:", err);
                setError("Failed to load flashcards for " + subjectId);
            } finally {
                setLoadingFlashcards(false);
            }
        };
        fetchFlashcards();
    }, [subjectId, token]);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }, 150);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleSubjectSelect = (sub) => {
        navigate(`/flashcards/${sub.toLowerCase()}`);
    };

    return (
        <div className="flashcards-container">
            {/* Background decoration */}
            <div className="bg-decoration" aria-hidden="true">
                <div className="bg-circle bg-circle-1" />
                <div className="bg-circle bg-circle-2" />
                <div className="bg-grid" />
            </div>

            <div className="flashcards-inner">
                <nav className="flash-nav">
                    <button className="back-btn" onClick={() => navigate("/student-dashboard")}>
                        ← Back to Dashboard
                    </button>
                    <h1 className="flash-title">Flash Cards</h1>
                </nav>

                {error && <div className="flash-error">{error}</div>}

                {!subjectId ? (
                    <section className="subject-selection">
                        <h2 className="selection-heading">Select a subject to start</h2>
                        <div className="selection-grid">
                            {loadingSubjects ? (
                                [1, 2, 3, 4].map(i => <div key={i} className="selection-skeleton" />)
                            ) : (
                                subjects.map(sub => (
                                    <div 
                                        key={sub.name} 
                                        className="selection-card"
                                        onClick={() => handleSubjectSelect(sub.name)}
                                    >
                                        <span className="selection-icon">
                                            {SUBJECT_ICONS[sub.name.toLowerCase()] || SUBJECT_ICONS.default}
                                        </span>
                                        <span className="selection-name">{sub.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                ) : (
                    <section className="flashcard-viewer">
                        <div className="viewer-header">
                            <button className="change-subject-btn" onClick={() => navigate("/flashcards")}>
                                Δ Change Subject
                            </button>
                            <span className="current-subject-label">
                                {SUBJECT_ICONS[subjectId.toLowerCase()] || SUBJECT_ICONS.default} {subjectId.toUpperCase()}
                            </span>
                        </div>

                        {loadingFlashcards ? (
                            <div className="flashcard-loading">
                                <div className="loading-spinner" />
                                <p>Generating flashcards for you...</p>
                            </div>
                        ) : flashcards.length > 0 ? (
                            <div className="deck-container">
                                <div className="deck-progress">
                                    Card {currentIndex + 1} of {flashcards.length}
                                    <div className="progress-bar-bg">
                                        <div 
                                            className="progress-bar-fill" 
                                            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div 
                                    className={`flashcard-scene ${isFlipped ? 'is-flipped' : ''}`}
                                    onClick={handleFlip}
                                >
                                    <div className="flashcard-card">
                                        <div className="flashcard-face flashcard-front">
                                            <div className="card-ornament top-left"></div>
                                            <div className="card-ornament top-right"></div>
                                            <div className="card-content">
                                                <span className="card-label">QUESTION</span>
                                                <p className="card-text">{flashcards[currentIndex].question}</p>
                                            </div>
                                            <div className="card-footer">Click to flip ↺</div>
                                            <div className="card-ornament bottom-left"></div>
                                            <div className="card-ornament bottom-right"></div>
                                        </div>
                                        <div className="flashcard-face flashcard-back">
                                            <div className="card-ornament top-left"></div>
                                            <div className="card-ornament top-right"></div>
                                            <div className="card-content">
                                                <span className="card-label">ANSWER</span>
                                                <p className="card-text">{flashcards[currentIndex].answer}</p>
                                            </div>
                                            <div className="card-footer">Click to flip ↺</div>
                                            <div className="card-ornament bottom-left"></div>
                                            <div className="card-ornament bottom-right"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="deck-controls">
                                    <button className="control-btn" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
                                        ← Previous
                                    </button>
                                    <button className="flip-btn-main" onClick={(e) => { e.stopPropagation(); handleFlip(); }}>
                                        {isFlipped ? "Show Question" : "Show Answer"}
                                    </button>
                                    <button className="control-btn" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
                                        Next →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="no-flashcards">
                                No flashcards available for this subject.
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

export default FlashCards;
