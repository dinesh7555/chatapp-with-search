import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import MySubjects from "./pages/MySubjects";
import TeacherDashboard from "./pages/TeacherDashboard";
import TopicView from "./pages/TopicView";
import CodeEditor from "./pages/CodeEditor";
import MindmapPage from "./pages/MindmapPage";
import FlashCards from "./pages/FlashCards";
import StudentLayout from "./components/StudentLayout";
import CourseOnboarding from "./pages/CourseOnboarding";
import SyllabusReview from "./pages/SyllabusReview";
import PersonalizedCourseView from "./pages/PersonalizedCourseView";
import useHeartbeat from "./hooks/useHeartbeat";
import { verifyToken } from "./services/api";
import { useEffect } from "react";

function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      const res = await verifyToken(storedToken);
      if (res && res.id) {
        setAuthenticated(true);
      } else {
        // verifyToken handles the localStorage cleanup and redirect on 401
        setAuthenticated(false);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setAuthenticated(false);
  }

  if (loading) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#fdf8f0", 
        color: "#2c1f0e",
        fontFamily: "serif" 
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner" style={{ marginBottom: "1rem", fontSize: "2rem" }}>🎓</div>
          <p>Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Auth onAuth={() => setAuthenticated(true)} />;
  }

  if (role === "admin") {
    return <AdminDashboard onLogout={handleLogout} />;
  }
  if (role === "teacher") {
    return <TeacherDashboard onLogout={handleLogout} />;
  }

  return (
    <Router>
      <Routes>
        <Route element={<StudentLayout />}>
          <Route path="/" element={<StudentDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/my-subjects" element={<MySubjects />} />
          <Route path="/topic-view/:subjectId/:topic" element={<TopicView />} />
          <Route path="/code-editor/:subjectId/:topic" element={<CodeEditor />} />
          <Route path="/mindmap" element={<MindmapPage />} />
          <Route path="/mindmap/:subjectId" element={<MindmapPage />} />
          <Route path="/flashcards" element={<FlashCards />} />
          <Route path="/flashcards/:subjectId" element={<FlashCards />} />
          <Route path="/personalized/onboarding" element={<CourseOnboarding />} />
          <Route path="/personalized/review/:courseId" element={<SyllabusReview />} />
          <Route path="/personalized/course/:courseId" element={<PersonalizedCourseView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;