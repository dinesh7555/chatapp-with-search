import { useEffect, useState } from "react";
import {
    getStudents,
    createStudent,
    updateStudentStatus,
    deleteUser,
    logout,
    getStudentState,
    uploadResource,
    getResources,
    deleteResource
} from "../services/api";
import "./TeacherDashboard.css";

// 🏆 MOCK DATA FOR PROTOTYPE PRESENTATION
const MOCK_TOPICS = ["Process Mgmt", "Memory Mgmt", "Deadlocks", "Storage Mgmt", "Protection"];
const MOCK_HEATMAP_DATA = [
    { id: 101, name: "Alice Smith", scores: [85, 92, 45, 78, 60] },
    { id: 102, name: "Bob Johnson", scores: [40, 30, 20, 55, 10] },
    { id: 103, name: "Charlie Brown", scores: [95, 98, 92, 88, 90] },
    { id: 104, name: "David Wilson", scores: [65, 70, 75, 40, 55] },
    { id: 105, name: "Eva Garcia", scores: [25, 45, 30, 20, 15] },
];

const MOCK_AT_RISK = [
    { id: 102, name: "Bob Johnson", reason: "Critical Confusion in Memory Management", stress: 85 },
    { id: 105, name: "Eva Garcia", reason: "Declining Engagement in SQL Queries", stress: 92 },
];

const MOCK_CLASS_STATS = {
    avgMastery: 62,
    totalSessions: 148,
    activeStudents: 24,
    unresolvedMisconceptions: 12
};

export default function TeacherDashboard({ onLogout }) {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "Teacher";
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [activeTab, setActiveTab] = useState("students");

    // Filter states
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterYear, setFilterYear] = useState("all");
    const [filterBranch, setFilterBranch] = useState("all");
    const [filterSubject, setFilterSubject] = useState("all");
    const [filterTopic, setFilterTopic] = useState("all");

    // Modal state
    const [statsModal, setStatsModal] = useState({ show: false, student: null, state: null, loading: false });

    // Create student form states
    const [newUsername, setNewUsername] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRollNo, setNewRollNo] = useState("");
    const [newCourseId, setNewCourseId] = useState("");
    const [newYear, setNewYear] = useState("");
    const [newBranch, setNewBranch] = useState("");
    const [newStatus, setNewStatus] = useState("active");

    // Resource management states
    const [teacherResources, setTeacherResources] = useState([]);
    const [uploadingResource, setUploadingResource] = useState(false);
    const [resTitle, setResTitle] = useState("");
    const [resBranch, setResBranch] = useState("all");
    const [resSubject, setResSubject] = useState("all");
    const [resFile, setResFile] = useState(null);

    useEffect(() => {
        loadStudents();
        if (activeTab === "resources") {
            loadResources();
        }
    }, [token, filterYear, filterBranch, filterSubject, activeTab]);

    // Reset topic when subject changes
    useEffect(() => {
        setFilterTopic("all");
    }, [filterSubject]);

    // Clear student registration form when switching tabs
    useEffect(() => {
        setNewUsername("");
        setNewEmail("");
        setNewPassword("");
        setNewRollNo("");
        setNewCourseId("");
        setNewYear("");
        setNewBranch("");
        setNewStatus("active");
    }, [activeTab]);

    async function loadStudents() {
        try {
            const data = await getStudents(token, {
                year: filterYear,
                branch: filterBranch,
                subject: filterSubject
            });
            setStudents(data || []);
        } catch (err) {
            console.error("Failed to load students", err);
        }
    }

    async function handleCreateStudent() {
        if (!newUsername || !newEmail || !newPassword || !newRollNo || !newYear || !newBranch) {
            alert("Username, Email, Password, Roll No, Year, and Branch are required");
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
                    year: parseInt(newYear),
                    branch: newBranch,
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
                setNewYear("");
                setNewBranch("");
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

    async function handleViewStats(student) {
        if (filterSubject === "all" || filterTopic === "all") {
            alert("Please select a specific Subject and Topic to view student stats.");
            return;
        }

        setStatsModal({ show: true, student, state: null, loading: true });

        try {
            const state = await getStudentState(token, filterSubject, filterTopic, student.id);
            if (state.detail) {
                // Backend might return error in body even with 200 (if handled loosely)
                throw new Error(state.detail);
            }
            setStatsModal({ show: true, student, state, loading: false });
        } catch (err) {
            console.error("Failed to load student state", err);
            setStatsModal({ show: false, student: null, state: null, loading: false });
            alert(err.message || "Failed to load student insights.");
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

    async function loadResources() {
        try {
            const data = await getResources(token);
            setTeacherResources(data || []);
        } catch (err) {
            console.error("Failed to load resources", err);
        }
    }

    async function handleUploadResource() {
        if (!resTitle || !resFile || resBranch === "all" || resSubject === "all") {
            alert("Title, File, Branch, and Subject are required");
            return;
        }

        setUploadingResource(true);
        try {
            const res = await uploadResource({
                title: resTitle,
                branch: resBranch,
                subject: resSubject,
                file: resFile
            }, token);

            if (res.message) {
                alert("Resource uploaded successfully");
                setResTitle("");
                setResFile(null);
                await loadResources();
            } else {
                alert(res.detail || "Upload failed");
            }
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload resource");
        } finally {
            setUploadingResource(false);
        }
    }

    async function handleDeleteResource(resourceId) {
        if (!window.confirm("Are you sure you want to delete this resource?")) return;
        try {
            await deleteResource(resourceId, token);
            alert("Resource deleted successfully");
            await loadResources();
        } catch (err) {
            console.error("Delete resource failed", err);
            alert("Failed to delete resource");
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

    // Filter logic (status is still local, year/branch/subject are server-side)
    const filteredStudents = students.filter((student) => {
        const statusMatch = filterStatus === "all" || student.status === filterStatus;
        return statusMatch;
    });

    // Get unique courses for filter dropdown
    const uniqueCourses = [...new Set(students.map((s) => s.course_id))].sort();

    return (
        <div className="teacher-layout">
            {/* Header */}
            <header className="teacher-header">
                <h2>Welcome, {username}</h2>
                <button
                    className="teacher-logout-btn"
                    onClick={() => setShowLogoutModal(true)}
                >
                    Logout
                </button>
            </header>

            {/* Tabs (Only Students for now) */}
            <nav className="dashboard-tabs">
                <button
                    className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
                    onClick={() => setActiveTab("students")}
                >
                    Students
                </button>
                <button
                    className={`tab-btn ${activeTab === "resources" ? "active" : ""}`}
                    onClick={() => setActiveTab("resources")}
                >
                    Resources
                </button>
                <button
                    className={`tab-btn ${activeTab === "performance" ? "active" : ""}`}
                    onClick={() => setActiveTab("performance")}
                >
                    Class Performance 📈
                </button>
            </nav>

            <main className="teacher-content">
                {activeTab === "students" && (
                    <>
                        {/* Create Student Section */}
                        <section className="teacher-section">
                            <h3>Create Student</h3>
                            <div className="teacher-form-grid">
                                <input
                                    className="teacher-input"
                                    placeholder="Username"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    autoComplete="off"
                                />
                                <input
                                    className="teacher-input"
                                    placeholder="Email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    autoComplete="off"
                                />
                                <input
                                    className="teacher-input"
                                    type="password"
                                    placeholder="Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <input
                                    className="teacher-input"
                                    placeholder="Roll Number"
                                    value={newRollNo}
                                    onChange={(e) => setNewRollNo(e.target.value)}
                                />
                                <input
                                    className="teacher-input"
                                    placeholder="Course ID (Optional)"
                                    value={newCourseId}
                                    onChange={(e) => setNewCourseId(e.target.value)}
                                />
                                <input
                                    className="teacher-input"
                                    type="number"
                                    placeholder="Year"
                                    value={newYear}
                                    onChange={(e) => setNewYear(e.target.value)}
                                />
                                <select
                                    className="teacher-select"
                                    value={newBranch}
                                    onChange={(e) => setNewBranch(e.target.value)}
                                >
                                    <option value="">Select Branch</option>
                                    <option value="cse">CSE</option>
                                    <option value="csm">CSM</option>
                                </select>
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
                                        className="teacher-select-small"
                                        value={filterBranch}
                                        onChange={(e) => setFilterBranch(e.target.value)}
                                    >
                                        <option value="all">All Branches</option>
                                        <option value="cse">CSE</option>
                                        <option value="csm">CSM</option>
                                    </select>

                                    <select
                                        className="teacher-select-small"
                                        value={filterSubject}
                                        onChange={(e) => setFilterSubject(e.target.value)}
                                    >
                                        <option value="all">All Subjects</option>
                                        <option value="operating_systems">Operating Systems</option>
                                        <option value="database_management">Database Management</option>
                                        <option value="computer_networks">Computer Networks</option>
                                        <option value="data_structures">Data Structures</option>
                                        <option value="javascript">JavaScript</option>
                                        <option value="java">Java</option>
                                    </select>

                                    <select
                                        className="teacher-select-small"
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
                                                <th>Year</th>
                                                <th>Branch</th>
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
                                                    <td>{student.year}</td>
                                                    <td>{student.branch}</td>
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
                                                                className="insights-btn-small"
                                                                onClick={() => handleViewStats(student)}
                                                                title="View student insights"
                                                            >
                                                                <svg viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                                                            </button>
                                                            <button
                                                                className="delete-btn-small"
                                                                onClick={() => handleDelete(student.id)}
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

                {activeTab === "resources" && (
                    <>
                        <section className="teacher-section">
                            <h3>Upload New Resource</h3>
                            <div className="teacher-form-grid">
                                <input
                                    className="teacher-input"
                                    placeholder="Resource Title (e.g. Physics Chapter 1 Notes)"
                                    value={resTitle}
                                    onChange={(e) => setResTitle(e.target.value)}
                                />
                                <select
                                    className="teacher-select"
                                    value={resBranch}
                                    onChange={(e) => setResBranch(e.target.value)}
                                >
                                    <option value="all">Select Branch</option>
                                    <option value="cse">CSE</option>
                                    <option value="csm">CSM</option>
                                </select>
                                <select
                                    className="teacher-select"
                                    value={resSubject}
                                    onChange={(e) => setResSubject(e.target.value)}
                                >
                                    <option value="all">Select Subject</option>
                                    <option value="operating_systems">Operating Systems</option>
                                    <option value="database_management">Database Management</option>
                                    <option value="computer_networks">Computer Networks</option>
                                    <option value="data_structures">Data Structures</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="java">Java</option>
                                </select>
                                <input
                                    className="teacher-input"
                                    type="file"
                                    onChange={(e) => setResFile(e.target.files[0])}
                                />
                            </div>
                            <button
                                className="teacher-btn-primary"
                                onClick={handleUploadResource}
                                disabled={uploadingResource}
                            >
                                {uploadingResource ? "Uploading..." : "Upload Resource"}
                            </button>
                        </section>

                        <section className="teacher-section">
                            <h3>My Uploaded Resources ({teacherResources.length})</h3>
                            {teacherResources.length === 0 ? (
                                <p className="teacher-empty">No resources uploaded yet</p>
                            ) : (
                                <div className="teacher-table-wrapper">
                                    <table className="teacher-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Branch</th>
                                                <th>Subject</th>
                                                <th>Type</th>
                                                <th>Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teacherResources.map((res) => (
                                                <tr key={res.id}>
                                                    <td>{res.title}</td>
                                                    <td>{res.branch.toUpperCase()}</td>
                                                    <td>{res.subject.toUpperCase()}</td>
                                                    <td>{res.file_type}</td>
                                                    <td>{new Date(res.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <button
                                                            className="delete-btn-small"
                                                            onClick={() => handleDeleteResource(res.id)}
                                                            title="Delete resource"
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
                {activeTab === "performance" && (
                    <div className="performance-container">
                        {/* Stats Overview */}
                        <div className="stats-overview-grid">
                            <div className="stat-card-premium">
                                <div className="stat-icon">📊</div>
                                <div className="stat-content">
                                    <span className="stat-label">Avg Class Mastery</span>
                                    <span className="stat-value-big">{MOCK_CLASS_STATS.avgMastery}%</span>
                                </div>
                            </div>
                            <div className="stat-card-premium">
                                <div className="stat-icon">🔥</div>
                                <div className="stat-content">
                                    <span className="stat-label">Total Sessions</span>
                                    <span className="stat-value-big">{MOCK_CLASS_STATS.totalSessions}</span>
                                </div>
                            </div>
                            <div className="stat-card-premium">
                                <div className="stat-icon">👥</div>
                                <div className="stat-content">
                                    <span className="stat-label">Active Students</span>
                                    <span className="stat-value-big">{MOCK_CLASS_STATS.activeStudents}</span>
                                </div>
                            </div>
                            <div className="stat-card-premium highlight">
                                <div className="stat-icon">🚫</div>
                                <div className="stat-content">
                                    <span className="stat-label">Misconceptions</span>
                                    <span className="stat-value-big">{MOCK_CLASS_STATS.unresolvedMisconceptions}</span>
                                </div>
                            </div>
                        </div>

                        <div className="performance-main-grid">
                            {/* Heatmap Section */}
                            <section className="teacher-section heatmap-section">
                                <div className="section-header">
                                    <h3>Class Mastery Heatmap</h3>
                                    <p className="section-subtitle">Student Understanding across Current Topics</p>
                                </div>
                                <div className="heatmap-wrapper">
                                    <table className="heatmap-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                {MOCK_TOPICS.map(t => <th key={t}>{t}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {MOCK_HEATMAP_DATA.map(student => (
                                                <tr key={student.id}>
                                                    <td className="student-name-cell">{student.name}</td>
                                                    {student.scores.map((score, i) => (
                                                        <td
                                                            key={i}
                                                            className="heatmap-cell"
                                                            style={{
                                                                backgroundColor: score > 80 ? 'rgba(74, 222, 128, 0.8)' :
                                                                    score > 50 ? 'rgba(250, 204, 21, 0.8)' :
                                                                        'rgba(248, 113, 113, 0.8)'
                                                            }}
                                                        >
                                                            {score}%
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* At Risk Section */}
                            <section className="teacher-section at-risk-section">
                                <div className="section-header">
                                    <h3>⚠️ Students At Risk</h3>
                                    <p className="section-subtitle">Urgent intervention recommended</p>
                                </div>
                                <div className="at-risk-list">
                                    {MOCK_AT_RISK.map(student => (
                                        <div key={student.id} className="at-risk-card">
                                            <div className="risk-header">
                                                <span className="risk-name">{student.name}</span>
                                                <span className="risk-level">Stress: {student.stress}%</span>
                                            </div>
                                            <p className="risk-reason">{student.reason}</p>
                                            <div className="risk-actions">
                                                <button className="risk-btn contact">Contact</button>
                                                <button className="risk-btn assign">Assign Help</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </main>

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