import { useEffect, useState } from "react";
import {
  getStudents,
  getAdmins,
  getTeachers,
  deleteUser,
  createUser,
  createStudent,
  updateStudentStatus,
  logout,
  getStudentState
} from "../services/api";
import "./AdminDashboard.css";

export default function AdminDashboard({ onLogout }) {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "Admin";

  // Data states
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");

  // Modal state
  const [statsModal, setStatsModal] = useState({ show: false, student: null, state: null, loading: false });

  // Create student form
  const [newStudentUsername, setNewStudentUsername] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [newStudentRollNo, setNewStudentRollNo] = useState("");
  const [newStudentCourseId, setNewStudentCourseId] = useState("");
  const [newStudentYear, setNewStudentYear] = useState("");
  const [newStudentBranch, setNewStudentBranch] = useState("");
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
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    loadAllData();
  }, [token, filterYear, filterBranch, filterSubject]);

  // Reset topic when subject changes
  useEffect(() => {
    setFilterTopic("all");
  }, [filterSubject]);

  // Clear registration forms when switching tabs
  useEffect(() => {
    // Clear student form
    setNewStudentUsername("");
    setNewStudentEmail("");
    setNewStudentPassword("");
    setNewStudentRollNo("");
    setNewStudentCourseId("");
    setNewStudentYear("");
    setNewStudentBranch("");
    setNewStudentStatus("active");

    // Clear admin form
    setAdminUsername("");
    setAdminEmail("");
    setAdminPassword("");

    // Clear teacher form
    setTeacherUsername("");
    setTeacherEmail("");
    setTeacherPassword("");
    setTeacherSubject("");
    setTeacherDepartment("");
    setTeacherDesignation("");
  }, [activeTab]);

  async function loadAllData() {
    try {
      const [studentData, adminData, teacherData] = await Promise.all([
        getStudents(token, {
          year: filterYear,
          branch: filterBranch,
          subject: filterSubject
        }),
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
    if (!newStudentUsername || !newStudentEmail || !newStudentPassword || !newStudentRollNo || !newStudentYear || !newStudentBranch) {
      alert("Username, Email, Password, Roll No, Year, and Branch are required");
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
          year: parseInt(newStudentYear),
          branch: newStudentBranch,
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
        setNewStudentYear("");
        setNewStudentBranch("");
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

  async function handleViewStats(student) {
    if (filterSubject === "all" || filterTopic === "all") {
      alert("Please select a specific Academic Subject and Topic to view student stats.");
      return;
    }

    setStatsModal({ show: true, student, state: null, loading: true });

    try {
      const state = await getStudentState(token, filterSubject, filterTopic, student.id);
      if (state.detail) {
        throw new Error(state.detail);
      }
      setStatsModal({ show: true, student, state, loading: false });
    } catch (err) {
      console.error("Failed to load student state", err);
      setStatsModal({ show: false, student: null, state: null, loading: false });
      alert(err.message || "Failed to load student insights.");
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
    return statusMatch;
  });

  // Get unique courses for filter dropdown
  const uniqueCourses = [...new Set(students.map((s) => s.course_id))].sort();

  return (
    <div className="admin-layout">
      {/* Header */}
      <header className="admin-header">
        <h2>Welcome, {username}</h2>
        <button className="admin-logout-btn" onClick={() => setShowLogoutModal(true)}>
          Logout
        </button>
      </header>

      {/* Tabs */}
      <nav className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Students
        </button>
        <button
          className={`tab-btn ${activeTab === "teachers" ? "active" : ""}`}
          onClick={() => setActiveTab("teachers")}
        >
          Teachers
        </button>
        <button
          className={`tab-btn ${activeTab === "admins" ? "active" : ""}`}
          onClick={() => setActiveTab("admins")}
        >
          Admins
        </button>
      </nav>

      <main className="admin-content">
        {activeTab === "admins" && (
          <>
            {/* Create Admin Section */}
            <section className="admin-section">
              <h3>Create Admin</h3>
              <div className="admin-form-row">
                <input
                  className="admin-input"
                  placeholder="Username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  autoComplete="off"
                />
                <input
                  className="admin-input"
                  placeholder="Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  autoComplete="off"
                />
                <input
                  className="admin-input"
                  type="password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button className="admin-btn-primary" onClick={handleCreateAdmin}>
                  Create Admin
                </button>
              </div>
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
          </>
        )}

        {activeTab === "teachers" && (
          <>
            {/* Create Teacher Section */}
            <section className="admin-section">
              <h3>Create Teacher</h3>
              <div className="admin-form-grid">
                <input
                  className="admin-input"
                  placeholder="Username"
                  value={teacherUsername}
                  onChange={(e) => setTeacherUsername(e.target.value)}
                  autoComplete="off"
                />
                <input
                  className="admin-input"
                  placeholder="Email"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  autoComplete="off"
                />
                <input
                  className="admin-input"
                  type="password"
                  placeholder="Password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <input
                  className="admin-input"
                  placeholder="Academic Subject"
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
                              className="delete-btn-small"
                              onClick={() => handleDeleteTeacher(teacher.id)}
                            >
                              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "students" && (
          <>
            {/* Create Student Section */}
            <section className="admin-section">
              <h3>Create Student</h3>
              <div className="admin-form-grid">
                <input
                  className="admin-input"
                  placeholder="Username"
                  value={newStudentUsername}
                  onChange={(e) => setNewStudentUsername(e.target.value)}
                  autoComplete="off"
                />
                <input
                  className="admin-input"
                  placeholder="Email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  autoComplete="off"
                />
                <input
                  className="admin-input"
                  type="password"
                  placeholder="Password"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <input
                  className="admin-input"
                  placeholder="Roll Number"
                  value={newStudentRollNo}
                  onChange={(e) => setNewStudentRollNo(e.target.value)}
                />
                <input
                  className="admin-input"
                  placeholder="Course ID (Optional)"
                  value={newStudentCourseId}
                  onChange={(e) => setNewStudentCourseId(e.target.value)}
                />
                <input
                  className="admin-input"
                  type="number"
                  placeholder="Year"
                  value={newStudentYear}
                  onChange={(e) => setNewStudentYear(e.target.value)}
                />
                <input
                  className="admin-input"
                  placeholder="Branch (e.g. cse, csm)"
                  value={newStudentBranch}
                  onChange={(e) => setNewStudentBranch(e.target.value)}
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
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="all">All Years</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>

                  <select
                    className="admin-select-small"
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                  >
                    <option value="all">All Branches</option>
                    <option value="cse">CSE</option>
                    <option value="csm">CSM</option>
                  </select>

                  <select
                    className="admin-select-small"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="all">All Academic Subjects</option>
                    <option value="operating_systems">Operating Systems</option>
                    <option value="database_management">Database Management</option>
                    <option value="computer_networks">Computer Networks</option>
                    <option value="data_structures">Data Structures</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                  </select>

                  <select
                    className="admin-select-small"
                    value={filterTopic}
                    onChange={(e) => setFilterTopic(e.target.value)}
                    disabled={filterSubject === "all"}
                  >
                    <option value="all">All Topics</option>
                    {filterSubject !== "all" &&
                      (filterSubject === "operating_systems" ? ["process-management", "memory-management"] :
                        filterSubject === "database_management" ? ["sql-queries", "normalization"] :
                          filterSubject === "computer_networks" ? ["tcp-ip-model", "http-protocol"] :
                            filterSubject === "data_structures" ? ["linked-lists", "trees-graphs"] : []
                      ).map(t => <option key={t} value={t}>{t.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>)
                    }
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
                        <th>Year</th>
                        <th>Branch</th>
                        <th>Status</th>
                        <th>Actions</th>
                        <th>Delete</th>
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
                          <td>{student.year}</td>
                          <td>{student.branch}</td>
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
                                className="insights-btn-small"
                                onClick={() => handleViewStats(student)}
                                title="View student insights"
                              >
                                <svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="delete-btn-small"
                                onClick={() => handleDeleteStudent(student.id)}
                                title="Delete student"
                              >
                                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
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
          </>
        )}
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

      {/* Insights Modal */}
      {statsModal.show && (
        <div className="logout-modal-overlay">
          <div className="stats-modal">
            <h3>Insights for {statsModal.student.username}</h3>
            <p className="stats-topic">Topic: <strong>{filterTopic}</strong> ({filterSubject})</p>

            {statsModal.loading ? (
              <div className="stats-loading">Loading insights...</div>
            ) : statsModal.state ? (
              <>
                <div className="stats-grid">
                  <div className="stat-item">
                    <label>Mastery Level</label>
                    <div className="stat-value">{statsModal.state.mastery_level}%</div>
                    <div className="stat-bar"><div style={{ width: `${statsModal.state.mastery_level}%` }}></div></div>
                  </div>
                  <div className="stat-item">
                    <label>Learning Pace</label>
                    <div className="stat-value">{statsModal.state.learning_pace > 60 ? "Fast" : statsModal.state.learning_pace < 40 ? "Slow" : "Normal"} ({statsModal.state.learning_pace})</div>
                  </div>
                  <div className="stat-item">
                    <label>Engagement</label>
                    <div className="stat-value">{statsModal.state.engagement_score}%</div>
                  </div>
                  <div className="stat-item">
                    <label>Confusion</label>
                    <div className="stat-value">{statsModal.state.confusion_score}%</div>
                  </div>
                </div>

                <div className="misconceptions-section">
                  <h4>Identified Misconceptions</h4>
                  {statsModal.state.misconceptions && statsModal.state.misconceptions.length > 0 ? (
                    <ul>
                      {statsModal.state.misconceptions.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  ) : (
                    <p>No misconceptions identified yet.</p>
                  )}
                </div>
              </>
            ) : (
              <p>No data available for this student.</p>
            )}

            <div className="logout-actions" style={{ marginTop: '20px' }}>
              <button className="cancel-btn" onClick={() => setStatsModal({ show: false, student: null, state: null, loading: false })}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}