import { useState } from "react";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";

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

  return <Chat onLogout={handleLogout} />;
}

export default App;
