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
import useHeartbeat from "./hooks/useHeartbeat";

function App() {
  const [authenticated, setAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // Track activity heartbeats globally for students
  useHeartbeat(token, role);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setAuthenticated(false);
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
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;