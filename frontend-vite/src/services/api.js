const BASE_URL = "http://172.168.11.81:8000";

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

export async function getStudents(token) {
  const res = await fetch(`${BASE_URL}/auth/students`, {
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