import { apiFetch } from '../services/api';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { startPersonalizedCourse, answerOnboardingQuestion, generateSyllabus } from "../services/api";
import "./CourseOnboarding.css";

function CourseOnboarding() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [courseId, setCourseId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingCourses, setExistingCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const response = await apiFetch(`${BASE_URL}/subjects/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.subjects) {
            const personalized = data.subjects.filter(s => s.is_personalized);
            setExistingCourses(personalized);
        }
      } catch (err) {
        console.error("Failed to fetch custom courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [token]);

  // Initial step is entering the topic.
  const handleStartCourse = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await startPersonalizedCourse(topic, token);
      if (res.status === "success") {
        setCourseId(res.course_id);
        setMessages([{ type: "ai", text: res.message }]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start initialization.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (customAnswer) => {
    const userAns = customAnswer || currentInput;
    if (!userAns.trim()) return;
    
    // Immediately clear the input field to prevent stale text from lingering
    setCurrentInput("");
    
    setMessages(prev => [...prev, { type: "user", text: userAns }]);
    setLoading(true);

    try {
      const res = await answerOnboardingQuestion(courseId, userAns, token);
      if (res.next_action === "review_syllabus") {
        navigate(`/personalized/review/${courseId}`, { state: { syllabus: res.syllabus } });
      } else if (res.next_action === "generate_syllabus") {
        // Show the transition message
        setMessages(prev => [...prev, { type: "ai", text: res.message }]);
        
        // Let it render for a moment, then auto-trigger building
        const syllabusRes = await generateSyllabus(courseId, token);
        if (syllabusRes.status === "success" && syllabusRes.next_action === "review_syllabus") {
            navigate(`/personalized/review/${courseId}`, { state: { syllabus: syllabusRes.syllabus } });
        } else {
            setMessages(prev => [...prev, { type: "ai", text: "Something went wrong while generating the syllabus... " + (syllabusRes.message || "") }]);
        }
      } else {
        setMessages(prev => [...prev, { type: "ai", text: res.message }]);
      }
    } catch (err) {
      console.error(err);
      alert("Error sending answer.");
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.type !== "ai") return msg.text;

    // Check for [[OPTIONS: ...]] syntax
    const match = msg.text.match(/\[\[OPTIONS:\s*(.*?)\]\]/);
    if (match) {
      const baseText = msg.text.replace(match[0], "").trim();
      const options = match[1].split(",").map(opt => opt.trim());

      return (
        <>
          <p>{baseText}</p>
          <div className="onboarding-options">
            {options.map((opt, i) => (
              <button 
                key={i} 
                className="onboarding-option-btn" 
                onClick={() => handleAnswerSubmit(opt)}
                disabled={loading}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      );
    }

    return msg.text;
  };

  if (!courseId) {
    return (
      <div className="onboarding-container">
        {loadingCourses ? (
            <div className="onboarding-loading">Loading your course hub...</div>
        ) : (
            <div className="course-hub-wrapper">
              {existingCourses.length > 0 && (
                <div className="existing-courses-section">
                  <h2 className="hub-section-title">My Personalized Courses</h2>
                  <div className="existing-courses-grid">
                    {existingCourses.map(course => (
                      <div key={course.id} className="existing-course-card" onClick={() => navigate(`/personalized/course/${course.id}`)}>
                        <div className="course-card-icon">📚</div>
                        <h3 className="course-card-title">{course.name}</h3>
                        <p className="course-card-meta">Continue Learning →</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="onboarding-card">
                <div className="onboarding-icon">🌟</div>
                <h2>Explore a New Topic</h2>
                <p>Tell us what you want to learn, and your personal AI tutor will build a customized plan for you.</p>
                <input
                  type="text"
                  className="onboarding-input"
                  placeholder="e.g., Quantum Computing, History of Rome..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleStartCourse() }}
                />
                <button className="onboarding-btn" onClick={handleStartCourse} disabled={loading}>
                  {loading ? "Initializing..." : "Start Journey"}
                </button>
              </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-chat-card">
        <div className="chat-header">
           <h2>Personalizing Your Course: <b>{topic}</b></h2>
        </div>
        <div className="onboarding-messages">
          {messages.map((m, i) => (
            <div key={i} className={`onboarding-msg ${m.type === "ai" ? "ai-msg" : "user-msg"}`}>
              {renderMessageContent(m)}
            </div>
          ))}
          {loading && (
            <div className="onboarding-msg ai-msg typing">
              <div className="typing-dots"><span></span><span></span><span></span></div>
              Tutor is thinking...
            </div>
          )}
        </div>
        <div className="onboarding-input-area">
          <input
            type="text"
            placeholder="Type your answer or select an option above..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAnswerSubmit() }}
            disabled={loading}
          />
          <button className="onboarding-send-btn" onClick={() => handleAnswerSubmit()} disabled={loading || !currentInput.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseOnboarding;
