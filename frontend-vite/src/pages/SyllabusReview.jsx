import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { reviewSyllabus, getCourseState } from "../services/api";
import "./SyllabusReview.css";

function SyllabusReview() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [syllabus, setSyllabus] = useState(location.state?.syllabus || []);
  const [hierarchicalSyllabus, setHierarchicalSyllabus] = useState(location.state?.hierarchical_syllabus || []);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);

  useEffect(() => {
    const fetchFallbackSyllabus = async () => {
      if (syllabus.length === 0 || hierarchicalSyllabus.length === 0) {
        setLoadingSyllabus(true);
        try {
          const res = await getCourseState(courseId, token);
          if (res.syllabus) setSyllabus(res.syllabus);
          if (res.hierarchical_syllabus) setHierarchicalSyllabus(res.hierarchical_syllabus);
        } catch (err) {
          console.error("Error fetching fallback syllabus:", err);
        } finally {
          setLoadingSyllabus(false);
        }
      }
    };

    fetchFallbackSyllabus();
  }, [courseId, syllabus.length, hierarchicalSyllabus.length, token]);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await reviewSyllabus(courseId, true, null, token);
      if (res.status === "success" && res.next_action === "view_module") {
        navigate(`/personalized/course/${courseId}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error approving syllabus.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      const res = await reviewSyllabus(courseId, false, feedback, token);
      if (res.status === "success" && res.syllabus) {
        setSyllabus(res.syllabus);
        setHierarchicalSyllabus(res.hierarchical_syllabus || []);
        setFeedback("");
      }
    } catch (err) {
      console.error(err);
      alert("Error revising syllabus.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingSyllabus) {
    return (
      <div className="syllabus-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Recovering your syllabus...</p>
        </div>
      </div>
    );
  }

  if (!syllabus || syllabus.length === 0) {
    return <div className="syllabus-container">No syllabus found to review.</div>;
  }

  return (
    <div className="syllabus-container">
      <div className="syllabus-header">
        <h2>Your Personalized Course Syllabus</h2>
        <p>Review the modules below. You can approve to start learning, or provide feedback if you want changes.</p>
      </div>

      <div className="syllabus-modules hierarchical">
        {hierarchicalSyllabus.length > 0 ? (
          hierarchicalSyllabus.map((chapter, cIdx) => (
            <div key={cIdx} className="chapter-review-group">
              <div className="chapter-review-header">
                <h3>Unit {cIdx + 1}: {chapter.chapter_title}</h3>
                <p className="chapter-desc">{chapter.chapter_description}</p>
              </div>
              <div className="chapter-topics">
                {chapter.topics.map((mod, index) => (
                  <div key={mod.id || index} className="module-card">
                    <div className="module-content">
                      <h4>{mod.title}</h4>
                      <p>{mod.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          syllabus.map((mod, index) => (
            <div key={mod.id || index} className="module-card">
              <div className="module-number">Unit {index + 1}</div>
              <div className="module-content">
                <h3>{mod.title}</h3>
                <p>{mod.description}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="syllabus-actions-card">
        <h3>Looks good?</h3>
        <button className="approve-btn" onClick={handleApprove} disabled={loading}>
          {loading ? "Processing..." : "Approve & Start Learning"}
        </button>

        <div className="revision-section">
          <p>Or request changes (e.g., "Add more focus on practical examples" or "Make it shorter"):</p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Type your feedback here..."
            disabled={loading}
          />
          <button className="revise-btn" onClick={handleRevise} disabled={loading || !feedback.trim()}>
            {loading ? "Revising..." : "Request Revision"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SyllabusReview;
