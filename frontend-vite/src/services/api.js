const BASE_URL = "http://127.0.0.1:8000";

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

/* ---------- CHAT ---------- */

export async function startChat(token) {
  const res = await fetch(`${BASE_URL}/chat/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function sendMessage(chatId, message, token) {
  const res = await fetch(`${BASE_URL}/chat/${chatId}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({message}),
  });
  return res.json();
}

export async function getHistory(chatId, token) {
  const res = await fetch(`${BASE_URL}/chat/${chatId}/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getChatSessions(token) {
  const res = await fetch(`${BASE_URL}/chat/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function searchChats(query, token) {
  const res = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.json();
}
