// import { useState } from "react";
// import Auth from "./pages/Auth";
// import Chat from "./pages/Chat";

// function App() {
//   const [authenticated, setAuthenticated] = useState(
//     !!localStorage.getItem("token")
//   );

//   function handleLogout() {
//     setAuthenticated(false);
//   }

//   return authenticated ? (
//     <Chat onLogout={handleLogout} />
//   ) : (
//     <Auth onAuth={() => setAuthenticated(true)} />
//   );
// }

// export default App;


import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import MySubjects from "./pages/MySubjects";
import Notes from "./pages/Notes";
import TeacherDashboard from "./pages/TeacherDashboard";

function App() {
  const [authenticated, setAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  const role = localStorage.getItem("role");

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
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/my-subjects" element={<MySubjects />} />
        {/* Keeping Chat as a route if needed, or maybe it's accessed differently now */}
        <Route path="/chat" element={<Chat onLogout={handleLogout} />} />
        <Route path="/notes/:subjectId/:topic" element={<Notes />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;