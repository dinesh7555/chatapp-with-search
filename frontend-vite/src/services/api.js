const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ---------- AUTH ---------- */

export async function registerUser(data) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginUser(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}


function getSubject() {
  return localStorage.getItem("subject") || "physics";
}

export async function startChat(token, topic) {
  const subject = getSubject();
  const res = await fetch(`${BASE_URL}/chat/start?subject_id=${subject}&topic=${encodeURIComponent(topic)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function sendMessage(chatId, message, token) {
  const subject = getSubject();
  const res = await fetch(
    `${BASE_URL}/chat/${chatId}/message/stream?subject_id=${subject}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

export async function sendMessageStream(chatId, message, token) {
  const subject = getSubject();
  const res = await fetch(`${BASE_URL}/chat/${chatId}/message/stream?subject_id=${subject}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  return res;
}

export async function getHistory(chatId, token) {
  const subject = getSubject();
  const res = await fetch(
    `${BASE_URL}/chat/${chatId}/history?subject_id=${subject}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}



export async function getChatSessions(token) {
  const subject = getSubject();
  const res = await fetch(
    `${BASE_URL}/chat/sessions?subject_id=${subject}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getAllChatSessions(token) {
  const res = await fetch(`${BASE_URL}/chat/sessions/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function searchChats(query, token) {
  const subject = getSubject();
  const res = await fetch(
    `${BASE_URL}/search?subject_id=${subject}&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.json();
}

export async function logout() {
  const token = localStorage.getItem("token");

  if (!token) return;

  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  localStorage.removeItem("token");
}

/* ---------- ADMIN FUNCTIONS ---------- */

export async function getUsers(token) {
  const res = await fetch(`${BASE_URL}/auth/students`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function deleteUser(userId, token) {
  const res = await fetch(`${BASE_URL}/auth/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function createUser(data, token) {
  // Route based on role
  let endpoint = `${BASE_URL}/auth/register`;

  if (data.role === "admin") {
    endpoint = `${BASE_URL}/auth/register/admin`;
  } else if (data.role === "student") {
    endpoint = `${BASE_URL}/auth/register/student`;
  } else if (data.role === "teacher") {
    endpoint = `${BASE_URL}/auth/register/teacher`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function getAdmins(token) {
  const res = await fetch(`${BASE_URL}/auth/admins`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

/* ---------- TEACHER FUNCTIONS ---------- */

export async function getStudents(token, filters = {}) {
  const { year, branch, subject } = filters;
  let url = `${BASE_URL}/auth/students`;
  const params = new URLSearchParams();
  if (year && year !== "all") params.append("year", year);
  if (branch && branch !== "all") params.append("branch", branch);
  if (subject && subject !== "all") params.append("subject", subject);

  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function createStudent(data, token) {
  const res = await fetch(`${BASE_URL}/auth/register/student`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateStudentStatus(studentId, status, token) {
  const res = await fetch(`${BASE_URL}/auth/students/${studentId}/status?status=${status}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getTeachers(token) {
  const res = await fetch(`${BASE_URL}/auth/teachers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function createTeacher(data, token) {
  const res = await fetch(`${BASE_URL}/auth/register/teacher`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getStudentState(token, subjectId, topic, studentId = null) {
  let url = `${BASE_URL}/chat/state?subject_id=${subjectId}&topic=${encodeURIComponent(topic)}`;
  if (studentId) {
    url += `&student_id=${studentId}`;
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

/* ---------- SUBJECT/NOTES FUNCTIONS ---------- */

export async function getNotes(subjectId, topic, refresh = false) {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams({
    subject_id: subjectId,
    topic,
  });
  if (refresh) {
    params.set("refresh", "true");
  }
  const res = await fetch(`${BASE_URL}/subjects/notes?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to fetch notes");
  }
  return res.json();
}
/* ---------- RESOURCE FUNCTIONS ---------- */

export async function uploadResource(data, token) {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("branch", data.branch);
  formData.append("subject", data.subject);
  formData.append("file", data.file);

  const res = await fetch(`${BASE_URL}/resources/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return res.json();
}

export async function getResources(token, filters = {}) {
  const { branch, subject } = filters;
  let url = `${BASE_URL}/resources/`;
  const params = new URLSearchParams();
  if (branch && branch !== "all") params.append("branch", branch);
  if (subject && subject !== "all") params.append("subject", subject);

  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function deleteResource(resourceId, token) {
  const res = await fetch(`${BASE_URL}/resources/${resourceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function downloadResource(resourceId, token) {
  const res = await fetch(`${BASE_URL}/resources/download/${resourceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Download failed");
  return res.blob();
}

export async function generateQuestions(chatId, token) {
  const subject = getSubject();
  const res = await fetch(`${BASE_URL}/chat/${chatId}/generate-questions?subject_id=${subject}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getQuestions(chatId, token) {
  const subject = getSubject();
  const res = await fetch(`${BASE_URL}/chat/${chatId}/questions?subject_id=${subject}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function submitQuiz(chatId, payload, token) {
  const subject = getSubject();
  const res = await fetch(`${BASE_URL}/chat/${chatId}/submit-quiz?subject_id=${subject}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}
