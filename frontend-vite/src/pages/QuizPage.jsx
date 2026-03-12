import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { generateQuiz, submitQuiz } from "../services/api";
import "./QuizPage.css";

const QuizPage = () => {
    const { subjectId, topic } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const chatId = searchParams.get("chatId");

    const [quizData, setQuizData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!chatId) {
            setLoading(false);
            return;
        }

        const fetchQuiz = async () => {
            try {
                const data = await generateQuiz(chatId, token);
                setQuizData(data.quiz || []);
            } catch (err) {
                console.error("Failed to fetch quiz:", err);
                setQuizData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [chatId, token]);

    const handleOptionChange = (questionIndex, option) => {
        if (submitted) return;
        setAnswers({
            ...answers,
            [questionIndex]: option
        });
    };

    const handleSubmit = async () => {
        if (!quizData) return;
        let correctCount = 0;
        let incorrectQuestions = [];

        quizData.forEach((q, idx) => {
            const userAnswer = answers[idx];
            if (userAnswer === q.answer) {
                correctCount++;
            } else {
                incorrectQuestions.push({
                    question: q.question,
                    user_answer: userAnswer || "No Answer",
                    correct_answer: q.answer,
                    explanation: q.explanation
                });
            }
        });
        
        setScore(correctCount);
        setSubmitted(true);

        // Submit results to backend for AI context
        if (chatId) {
            try {
                await submitQuiz(chatId, {
                    score: correctCount,
                    total: quizData.length,
                    incorrect_questions: incorrectQuestions
                }, token);
            } catch (err) {
                console.error("Failed to submit quiz results to chat context:", err);
            }
        }
    };

    return (
        <div className="quiz-page-layout">
            <div className="quiz-page-main">
                <header className="quiz-page-header">
                    <div className="header-left">
                        {/* If we have a chatId we know it came from TopicView */}
                        <button className="back-link" onClick={() => {
                            if (chatId) {
                                navigate(`/topic-view/${subjectId}/${topic}?chatId=${chatId}`);
                            } else {
                                navigate(`/topic-view/${subjectId}/${topic}`);
                            }
                        }}>
                            <span className="back-icon">‹</span> Back to Notes
                        </button>
                        <div className="topic-info">
                            <span className="subject-label">{subjectId?.toUpperCase()}</span>
                            <h1>Quiz: {topic}</h1>
                        </div>
                    </div>
                </header>

                <div className="quiz-workspace">
                    <div className="quiz-content-panel">
                        {loading && (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Generating your custom quiz based on the conversation...</p>
                            </div>
                        )}

                        {!loading && (!quizData || quizData.length === 0) && (
                            <div className="quiz-empty-state">
                                <h2>Not enough history!</h2>
                                <p>Keep chatting with the AI Tutor to generate a personalized quiz.</p>
                            </div>
                        )}

                        {!loading && quizData && quizData.length > 0 && (
                            <div className="quiz-questions-container">
                                {submitted && (
                                    <div className="quiz-score-banner">
                                        <h2>You scored {score} out of {quizData.length}</h2>
                                    </div>
                                )}

                                {quizData.map((q, qIndex) => (
                                    <div key={qIndex} className="quiz-question-card">
                                        <p className="quiz-question-text">
                                            <strong>Question {qIndex + 1}:</strong> {q.question}
                                        </p>
                                        <div className="quiz-options-list">
                                            {q.options.map((opt, oIndex) => {
                                                const isSelected = answers[qIndex] === opt;
                                                const isCorrect = q.answer === opt;
                                                const showCorrect = submitted && isCorrect;
                                                const showWrong = submitted && isSelected && !isCorrect;

                                                let labelClass = "quiz-option-item";
                                                if (showCorrect) labelClass += " correct-option";
                                                if (showWrong) labelClass += " wrong-option";

                                                return (
                                                    <label key={oIndex} className={labelClass}>
                                                        <input
                                                            type="radio"
                                                            name={`question-${qIndex}`}
                                                            value={opt}
                                                            checked={isSelected}
                                                            onChange={() => handleOptionChange(qIndex, opt)}
                                                            disabled={submitted}
                                                        />
                                                        <span className="option-text">{opt}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {submitted && (
                                            <div className="quiz-explanation-box">
                                                <strong>Explanation:</strong> {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {!submitted && (
                                    <div className="quiz-actions">
                                        <button 
                                            className="submit-quiz-btn"
                                            onClick={handleSubmit}
                                            disabled={Object.keys(answers).length < quizData.length}
                                        >
                                            Submit Quiz
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
