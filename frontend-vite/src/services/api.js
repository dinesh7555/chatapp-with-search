const BASE_URL = "http://172.168.12.101:8000";

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

// export async function startChat(token) {
//   const res = await fetch(`${BASE_URL}/chat/start`, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   return res.json();
// }

// // export async function sendMessage(chatId, message, token) {
// //   const res = await fetch(`${BASE_URL}/chat/${chatId}/message`, {
// //     method: "POST",
// //     headers: {
// //       "Content-Type": "application/json",
// //       Authorization: `Bearer ${token}`,
// //     },
// //     body: JSON.stringify({message}),
// //   });
// //   return res.json();
// // }

// export async function sendMessageStream(chatId, message, token) {
//   const res = await fetch(`${BASE_URL}/chat/${chatId}/message/stream`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({ message }),
//   });

//   return res;
// }


// export async function getHistory(chatId, token) {
//   const res = await fetch(`${BASE_URL}/chat/${chatId}/history`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   return res.json();
// }

// export async function getChatSessions(token) {
//   const res = await fetch(`${BASE_URL}/chat/sessions`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   return res.json();
// }

// export async function searchChats(query, token) {
//   const res = await fetch(
//     `${BASE_URL}/search?q=${encodeURIComponent(query)}`,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );
//   return res.json();
// }


// export async function logout() {
//   const token = localStorage.getItem("token");

//   if (!token) return;

//   await fetch(`${BASE_URL}/auth/logout`, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   localStorage.removeItem("token");
// }

// export async function getUsers(token) {
//   const res = await fetch(`${BASE_URL}/auth/users`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   return res.json();
// }
// export async function deleteUser(userId, token) {
//   const res = await fetch(`${BASE_URL}/auth/users/${userId}`, {
//     method: "DELETE",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   return res.json();
// }

// export async function createUser(data, token) {
//   const res = await fetch(`${BASE_URL}/auth/register`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify(data),
//   });

//   return res.json();
// }

// export async function getAdmins(token) {
//   const res = await fetch(`${BASE_URL}/auth/admins`, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   return res.json();
// }
// function getSubject() {
//   return localStorage.getItem("subject") || "physics";
// }


export async function startChat(token) {
  const subject = getSubject();
  const res = await fetch(`${BASE_URL}/chat/start?subject_id=${subject}`, {
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

export async function getUsers(token) {
  const res = await fetch(`${BASE_URL}/auth/users`, {
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
  const res = await fetch(`${BASE_URL}/auth/register`, {
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

function getSubject() {
  return localStorage.getItem("subject") || "physics";
}