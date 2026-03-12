import { useEffect, useState } from "react";
import {
  getStudents,
  getAdmins,
  getTeachers,
  deleteUser,
  createUser,
  createStudent,
  updateStudentStatus,
  logout
} from "../services/api";
import "./AdminDashboard.css";

export default function AdminDashboard({ onLogout }) {
  const token = localStorage.getItem("token");

  // Data states
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");

  // Create student form
  const [newStudentUsername, setNewStudentUsername] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [newStudentRollNo, setNewStudentRollNo] = useState("");
  const [newStudentCourseId, setNewStudentCourseId] = useState("");
  const [newStudentStatus, setNewStudentStatus] = useState("active");

  // Create admin form
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Create teacher form
  const [teacherUsername, setTeacherUsername] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [teacherDepartment, setTeacherDepartment] = useState("");
  const [teacherDesignation, setTeacherDesignation] = useState("");

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [token]);

  async function loadAllData() {
    try {
      const [studentData, adminData, teacherData] = await Promise.all([
        getStudents(token),
        getAdmins(token),
        getTeachers(token)
      ]);
      setStudents(studentData || []);
      setAdmins(adminData || []);
      setTeachers(teacherData || []);
    } catch (err) {
      console.error("Failed to load data", err);
    }
  }

  // ── Student Functions ──
  async function handleCreateStudent() {
    if (!newStudentUsername || !newStudentEmail || !newStudentPassword || !newStudentRollNo || !newStudentCourseId) {
      alert("All fields are required");
      return;
    }

    try {
      const res = await createStudent(
        {
          username: newStudentUsername,
          email: newStudentEmail,
          password: newStudentPassword,
          roll_no: newStudentRollNo,
          course_id: newStudentCourseId,
          status: newStudentStatus,
        },
        token
      );

      if (res.message) {
        alert("Student created successfully");
        await loadAllData();
        // Clear form
        setNewStudentUsername("");
        setNewStudentEmail("");
        setNewStudentPassword("");
        setNewStudentRollNo("");
        setNewStudentCourseId("");
        setNewStudentStatus("active");
      } else {
        alert(res.detail || "Creation failed");
      }
    } catch (err) {
      console.error("Create student failed", err);
      alert("Failed to create student");
    }
  }

  async function handleDeleteStudent(studentId) {
    const confirmDelete = window.confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    try {
      await deleteUser(studentId, token);
      alert("Student deleted successfully");
      setSelectedStudents((prev) => prev.filter((id) => id !== studentId));
      await loadAllData();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete student");
    }
  }

  async function handleStatusChange(studentId, newStatus) {
    try {
      const res = await updateStudentStatus(studentId, newStatus, token);
      if (res.message) {
        alert(`Student status updated to ${newStatus}`);
        await loadAllData();
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
      await loadAllData();
    } catch (err) {
      console.error("Bulk update failed", err);
      alert("Some updates failed");
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
      await loadAllData();
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

  // ── Admin Functions ──
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
        await loadAllData();
      } else {
        alert(res.detail || "Creation failed");
      }
    } catch (err) {
      console.error("Create admin failed", err);
    }
  }

  // ── Teacher Functions ──
  async function handleCreateTeacher() {
    if (!teacherUsername || !teacherEmail || !teacherPassword || !teacherSubject || !teacherDepartment || !teacherDesignation) {
      alert("All fields required");
      return;
    }
    try {
      const res = await createUser(
        {
          username: teacherUsername,
          email: teacherEmail,
          password: teacherPassword,
          role: "teacher",
          subject: teacherSubject,
          department: teacherDepartment,
          designation: teacherDesignation
        },
        token
      );
      if (res.message) {
        alert("Teacher created successfully");
        setTeacherUsername("");
        setTeacherEmail("");
        setTeacherPassword("");
        setTeacherSubject("");
        setTeacherDepartment("");
        setTeacherDesignation("");
        await loadAllData();
      } else {
        alert(res.detail || "Creation failed");
      }
    } catch (err) {
      console.error("Create teacher failed", err);
    }
  }

  async function handleDeleteTeacher(teacherId) {
    const confirmDelete = window.confirm("Are you sure you want to delete this teacher?");
    if (!confirmDelete) return;

    try {
      await deleteUser(teacherId, token);
      alert("Teacher deleted successfully");
      await loadAllData();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete teacher");
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
    <div className="admin-layout">
      {/* Header */}
      <header className="admin-header">
        <h2>Admin Dashboard</h2>
        <button className="admin-logout-btn" onClick={() => setShowLogoutModal(true)}>
          Logout
        </button>
      </header>

      <main className="admin-content">
        {/* Create Admin Section */}
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

        {/* Create Teacher Section */}
        <section className="admin-section">
          <h3>Create Teacher</h3>
          <div className="admin-form-grid">
            <input
              className="admin-input"
              placeholder="Username"
              value={teacherUsername}
              onChange={(e) => setTeacherUsername(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Email"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
            />
            <input
              className="admin-input"
              type="password"
              placeholder="Password"
              value={teacherPassword}
              onChange={(e) => setTeacherPassword(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Subject"
              value={teacherSubject}
              onChange={(e) => setTeacherSubject(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Department"
              value={teacherDepartment}
              onChange={(e) => setTeacherDepartment(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Designation"
              value={teacherDesignation}
              onChange={(e) => setTeacherDesignation(e.target.value)}
            />
          </div>
          <button className="admin-btn-primary" onClick={handleCreateTeacher}>
            Create Teacher
          </button>
        </section>

        {/* Create Student Section */}
        <section className="admin-section">
          <h3>Create Student</h3>
          <div className="admin-form-grid">
            <input
              className="admin-input"
              placeholder="Username"
              value={newStudentUsername}
              onChange={(e) => setNewStudentUsername(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Email"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
            />
            <input
              className="admin-input"
              type="password"
              placeholder="Password"
              value={newStudentPassword}
              onChange={(e) => setNewStudentPassword(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Roll Number"
              value={newStudentRollNo}
              onChange={(e) => setNewStudentRollNo(e.target.value)}
            />
            <input
              className="admin-input"
              placeholder="Course ID"
              value={newStudentCourseId}
              onChange={(e) => setNewStudentCourseId(e.target.value)}
            />
            <select
              className="admin-select"
              value={newStudentStatus}
              onChange={(e) => setNewStudentStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button className="admin-btn-primary" onClick={handleCreateStudent}>
            Create Student
          </button>
        </section>

        {/* Students Table */}
        <section className="admin-section">
          <div className="section-header">
            <h3>Students ({filteredStudents.length})</h3>

            {/* Filter Controls */}
            <div className="filter-controls">
              <select
                className="admin-select-small"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                className="admin-select-small"
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

          {filteredStudents.length === 0 ? (
            <p className="admin-empty">No students found</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
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
                        <span className={`status-badge ${student.status}`}>
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
                            onClick={() => handleDeleteStudent(student.id)}
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

        {/* Teachers Table */}
        <section className="admin-section">
          <h3>Teachers ({teachers.length})</h3>
          {teachers.length === 0 ? (
            <p className="admin-empty">No teachers found</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>{teacher.id}</td>
                      <td>{teacher.username}</td>
                      <td>{teacher.email}</td>
                      <td>{teacher.department}</td>
                      <td>{teacher.designation}</td>
                      <td>
                        <button
                          className="admin-btn-danger"
                          onClick={() => handleDeleteTeacher(teacher.id)}
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

        {/* Admins Table */}
        <section className="admin-section">
          <h3>Admins ({admins.length})</h3>
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