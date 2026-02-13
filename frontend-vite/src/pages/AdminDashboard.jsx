import { useEffect, useState } from "react";
import { getUsers, deleteUser, createUser, getAdmins , logout} from "../services/api";
import "./AdminDashboard.css";

export default function AdminDashboard({ onLogout }) {
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [showLogoutModal, setShowLogoutModal] = useState(false);


  useEffect(() => {
    async function loadData() {
      try {
        const studentData = await getUsers(token);
        const adminData = await getAdmins(token);
        setUsers(studentData || []);
        setAdmins(adminData || []);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    }
    loadData();
  }, [token]);

  async function handleDelete(userId) {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;
    try {
      await deleteUser(userId, token);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  async function handleCreateStudent() {
    if (!newUsername || !newEmail || !newPassword) {
      alert("All fields required");
      return;
    }
    try {
      const res = await createUser(
        { username: newUsername, email: newEmail, password: newPassword, role: "student" },
        token
      );
      if (res.message) {
        alert("Student created successfully");
        const updated = await getUsers(token);
        setUsers(updated || []);
        setNewUsername("");
        setNewEmail("");
        setNewPassword("");
      } else {
        alert(res.detail || "Creation failed");
      }
    } catch (err) {
      console.error("Create failed", err);
    }
  }

  async function handleCreateAdmin() {
    if (!adminUsername || !adminEmail || !adminPassword) {
      alert("All fields required");
      return;
    }
    try {
      const res = await createUser(
        { username: adminUsername, email: adminEmail, password: adminPassword, role: "admin" },
        token
      );
      if (res.message) {
        alert("Admin created successfully");
        setAdminUsername("");
        setAdminEmail("");
        setAdminPassword("");
      } else {
        alert(res.detail || "Creation failed");
      }
    } catch (err) {
      console.error("Create admin failed", err);
    }
  }

    async function handleLogoutConfirm() {
    try {
        await logout();  // 🔥 calls backend & deletes Redis session
    } catch (err) {
        console.error("Logout failed", err);
    } finally {
        onLogout(); // clears localStorage + navigates to login
    }
    }


  return (
    <div className="admin-layout">

      
      <header className="admin-header">
        <h2>Admin Dashboard</h2>
        <button
            className="admin-btn logout"
            onClick={() => setShowLogoutModal(true)}
            >
            Logout
        </button>
      </header>

      <main className="admin-content">

        
        <section className="admin-section">
          <h3>Create Admin</h3>
          <div className="admin-form-row">
            <input
              className="admin-input"
              placeholder="Username"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
            <input
              className="admin-input"
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            <button className="admin-btn-primary" onClick={handleCreateAdmin}>
              Create Admin
            </button>
          </div>
        </section>

        <section className="admin-section">
          <h3>Create Student</h3>
          <div className="admin-form-row">
            <input
              className="admin-input"
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <input
              className="admin-input"
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button className="admin-btn-primary" onClick={handleCreateStudent}>
              Create Student
            </button>
          </div>
        </section>

        <section className="admin-section">
          <h3>Students</h3>
          {users.length === 0 ? (
            <p className="admin-empty">No students found</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-section">
          <h3>Admins</h3>
          {admins.length === 0 ? (
            <p className="admin-empty">No admins found</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.id}</td>
                      <td>{admin.username}</td>
                      <td>{admin.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showLogoutModal && (
            <div className="logout-modal-overlay">
                <div className="logout-modal">
                <h3>Confirm Logout</h3>
                <p>Are you sure you want to logout?</p>
                <div className="logout-actions">
                    <button
                    className="cancel-btn"
                    onClick={() => setShowLogoutModal(false)}
                    >
                    Cancel
                    </button>
                    <button
                    className="confirm-btn"
                    onClick={handleLogoutConfirm}
                    >
                    Logout
                    </button>
                </div>
                </div>
            </div>
            )}
      </main>
    </div>
  );
}
