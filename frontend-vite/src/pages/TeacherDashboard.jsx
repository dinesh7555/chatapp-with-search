import { useEffect, useState } from "react";
import { 
  getStudents, 
  createStudent, 
  updateStudentStatus,
  deleteUser,
  logout 
} from "../services/api";
import "./TeacherDashboard.css";

export default function TeacherDashboard({ onLogout }) {
  const token = localStorage.getItem("token");
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");

  // Create student form states
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRollNo, setNewRollNo] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [newStatus, setNewStatus] = useState("active");

  useEffect(() => {
    loadStudents();
  }, [token]);

  async function loadStudents() {
    try {
      const data = await getStudents(token);
      setStudents(data || []);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  }

  async function handleCreateStudent() {
    if (!newUsername || !newEmail || !newPassword || !newRollNo || !newCourseId) {
      alert("All fields are required");
      return;
    }

    try {
      const res = await createStudent(
        {
          username: newUsername,
          email: newEmail,
          password: newPassword,
          roll_no: newRollNo,
          course_id: newCourseId,
          status: newStatus,
        },
        token
      );

      if (res.message) {
        alert("Student created successfully");
        await loadStudents();
        // Clear form
        setNewUsername("");
        setNewEmail("");
        setNewPassword("");
        setNewRollNo("");
        setNewCourseId("");
        setNewStatus("active");
      } else {
        alert(res.detail || "Creation failed");
      }
    } catch (err) {
      console.error("Create student failed", err);
      alert("Failed to create student");
    }
  }

  async function handleStatusChange(studentId, newStatus) {
    try {
      const res = await updateStudentStatus(studentId, newStatus, token);
      if (res.message) {
        alert(`Student status updated to ${newStatus}`);
        await loadStudents();
      } else {
        alert(res.detail || "Status update failed");
      }
    } catch (err) {
      console.error("Status update failed", err);
      alert("Failed to update status");
    }
  }

  async function handleBulkStatusChange(newStatus) {
    if (selectedStudents.length === 0) {
      alert("Please select students first");
      return;
    }

    const confirmMsg = `Are you sure you want to mark ${selectedStudents.length} student(s) as ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const promises = selectedStudents.map((id) =>
        updateStudentStatus(id, newStatus, token)
      );
      await Promise.all(promises);
      alert(`${selectedStudents.length} student(s) updated successfully`);
      setSelectedStudents([]);
      await loadStudents();
    } catch (err) {
      console.error("Bulk update failed", err);
      alert("Some updates failed");
    }
  }

  async function handleDelete(studentId) {
    const confirmDelete = window.confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    try {
      await deleteUser(studentId, token);
      alert("Student deleted successfully");
      setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
      await loadStudents();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete student");
    }
  }

  async function handleBulkDelete() {
    if (selectedStudents.length === 0) {
      alert("Please select students first");
      return;
    }

    const confirmMsg = `⚠️ Are you sure you want to DELETE ${selectedStudents.length} student(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const promises = selectedStudents.map((id) => deleteUser(id, token));
      await Promise.all(promises);
      alert(`${selectedStudents.length} student(s) deleted successfully`);
      setSelectedStudents([]);
      await loadStudents();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Some deletions failed");
    }
  }

  function toggleSelectStudent(studentId) {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  function toggleSelectAll() {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id));
    }
  }

  async function handleLogoutConfirm() {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      onLogout();
    }
  }

  // Filter logic
  const filteredStudents = students.filter((student) => {
    const statusMatch = filterStatus === "all" || student.status === filterStatus;
    const courseMatch = filterCourse === "all" || student.course_id === filterCourse;
    return statusMatch && courseMatch;
  });

  // Get unique courses for filter dropdown
  const uniqueCourses = [...new Set(students.map((s) => s.course_id))].sort();

  return (
    <div className="teacher-layout">
      {/* Header */}
      <header className="teacher-header">
        <h2>Teacher Dashboard</h2>
        <button
          className="teacher-logout-btn"
          onClick={() => setShowLogoutModal(true)}
        >
          Logout
        </button>
      </header>

      <main className="teacher-content">
        {/* Create Student Section */}
        <section className="teacher-section">
          <h3>Create Student</h3>
          <div className="teacher-form-grid">
            <input
              className="teacher-input"
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <input
              className="teacher-input"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <input
              className="teacher-input"
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              className="teacher-input"
              placeholder="Roll Number"
              value={newRollNo}
              onChange={(e) => setNewRollNo(e.target.value)}
            />
            <input
              className="teacher-input"
              placeholder="Course ID"
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
            />
            <select
              className="teacher-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button className="teacher-btn-primary" onClick={handleCreateStudent}>
            Create Student
          </button>
        </section>

        {/* Students List Section */}
        <section className="teacher-section">
          <div className="section-header">
            <h3>Students ({filteredStudents.length})</h3>
            
            {/* Filter Controls */}
            <div className="filter-controls">
              <select
                className="teacher-select-small"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                className="teacher-select-small"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <option value="all">All Courses</option>
                {uniqueCourses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.length > 0 && (
            <div className="bulk-actions">
              <span className="bulk-count">
                {selectedStudents.length} selected
              </span>
              <button
                className="bulk-btn active"
                onClick={() => handleBulkStatusChange("active")}
              >
                Mark Active
              </button>
              <button
                className="bulk-btn inactive"
                onClick={() => handleBulkStatusChange("inactive")}
              >
                Mark Inactive
              </button>
              <button
                className="bulk-btn delete"
                onClick={handleBulkDelete}
              >
                Delete Selected
              </button>
            </div>
          )}

          {/* Students Table */}
          {filteredStudents.length === 0 ? (
            <p className="teacher-empty">No students found</p>
          ) : (
            <div className="teacher-table-wrapper">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          selectedStudents.length === filteredStudents.length &&
                          filteredStudents.length > 0
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Roll No</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleSelectStudent(student.id)}
                        />
                      </td>
                      <td>{student.id}</td>
                      <td>{student.username}</td>
                      <td>{student.email}</td>
                      <td>{student.roll_no}</td>
                      <td>{student.course_id}</td>
                      <td>
                        <span
                          className={`status-badge ${student.status}`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <select
                            className="status-select"
                            value={student.status}
                            onChange={(e) =>
                              handleStatusChange(student.id, e.target.value)
                            }
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                          <button
                            className="delete-btn-small"
                            onClick={() => handleDelete(student.id)}
                            title="Delete student"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Logout Modal */}
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
              <button className="confirm-btn" onClick={handleLogoutConfirm}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}