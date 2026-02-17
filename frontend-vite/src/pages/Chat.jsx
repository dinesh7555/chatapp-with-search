

// import { useEffect, useRef, useState } from "react";
// import {
//   startChat,
//   sendMessage,
//   getHistory,
//   getChatSessions,
//   logout
// } from "../services/api";
// import "./Chat.css";
// import ChatSidebar from "./ChatSidebar";
// import ReactMarkdown from "react-markdown";
// import { searchChats } from "../services/api";
// import { sendMessageStream } from "../services/api";



// export default function Chat({ onLogout }) {
//   const token = localStorage.getItem("token");

//   const [sessions, setSessions] = useState([]);
//   const [chatId, setChatId] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const sendingRef = useRef(false);
//   const [loading, setLoading] = useState(false);
//   const messagesEndRef = useRef(null);


//   function scrollToBottom() {
//   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// }
// useEffect(() => {
//   scrollToBottom();
// }, [messages]);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [showLogoutModal, setShowLogoutModal] = useState(false);



//   /* ---------------- Load sidebar sessions ---------------- */

//   useEffect(() => {
//     async function loadSessions() {
//       try {
//         const res = await getChatSessions(token);
//         setSessions(res.sessions || []);
//       } catch (err) {
//         console.error("Failed to load sessions", err);
//       }
//     }
//     loadSessions();
//   }, [token]);

//   /* ---------------- Select chat & load history ---------------- */

//   async function handleSelectChat(id) {
//     try {
//       setChatId(id);
//       const history = await getHistory(id, token);
//       setMessages(Array.isArray(history.messages) ? history.messages : []);
//     } catch (err) {
//       console.error("Failed to load chat history", err);
//     }
//   }

//   /* ---------------- Start new chat ---------------- */

//   async function handleNewChat() {
//     try {
//       const res = await startChat(token);
//       setChatId(res.chat_id);
//       setMessages([]);
//       setInput("");

//       const updated = await getChatSessions(token);
//       setSessions(updated.sessions || []);
//     } catch (err) {
//       console.error("Failed to start new chat", err);
//     }
//   }


//   async function handleSend(e) {
//   e.preventDefault();
//   if (!input.trim() || !chatId || sendingRef.current) return;

//   sendingRef.current = true;
//   setLoading(true);

//   const userText = input;
//   setInput("");

//   setMessages((prev) => [
//     ...prev,
//     { sender: "user", text: userText },
//     { sender: "ai", text: "" } // placeholder
//   ]);

//   try {
//     const res = await sendMessageStream(chatId, userText, token);
//     const reader = res.body.getReader();
//     const decoder = new TextDecoder();

//     let aiText = "";

//     while (true) {
//       const { value, done } = await reader.read();
//       if (done) break;

//       const chunk = decoder.decode(value);
//       aiText += chunk;

//       setMessages((prev) => {
//         const updated = [...prev];
//         updated[updated.length - 1] = {
//           sender: "ai",
//           text: aiText
//         };
//         return updated;
//       });
//     }
//   } catch (err) {
//     console.error("Streaming failed", err);
//   } finally {
//     sendingRef.current = false;
//     setLoading(false);
//   }
// }


//   /* ---------------- Logout ---------------- */

//   // function handleLogout() {
//   //   localStorage.removeItem("token");
//   //   onLogout();
//   // }
//   // function handleLogoutConfirm() {
//   //   localStorage.removeItem("token");
//   //   onLogout();
//   // }
//   function handleLogoutConfirm() {
//     try {
//       logout();   // 🔥 calls backend & deletes Redis session
//     } catch (err) {
//       console.error("Logout failed", err);
//     } finally {
//       onLogout();       // navigate back to login
//     }
//   }

//   /* ---------------- Search Chats ---------------- */  
//   async function handleSearch(query) {
//   if (!query.trim()) {
//     setIsSearching(false);
//     setSearchResults([]);
//     return;
//   }

//   const res = await searchChats(query, token);
//   setSearchResults(res.results || []);
//   setIsSearching(true);
// }

//   /* ---------------- UI ---------------- */

//   return (
//     <div className="chat-layout">
//       <ChatSidebar
//         sessions={isSearching ? searchResults : sessions}
//         activeChatId={chatId}
//         onSelectChat={handleSelectChat}
//         onNewChat={handleNewChat}
//         onSearch={handleSearch}
//       />

//       <div className="chat-container">
//         <div className="chat-header">
//           <span>AI Chat Assistant</span>
//           <button
//             className="logout-btn"
//             onClick={() => setShowLogoutModal(true)}
//           >
//             Logout
//           </button>
//         </div>

//         {!chatId ? (
//           <div className="chat-placeholder">
//             <button className="start-chat-btn" onClick={handleNewChat}>Start Chat</button>
//           </div>
//         ) : (
//           <>
//             <div className="chat-messages">
//               {messages.map((m, i) => (
//                 <div
//                   key={i}
//                   className={`message ${m.sender}`}
//                 >
//               <ReactMarkdown>{m.text}</ReactMarkdown>
//                 </div>
//               ))}
//               {loading && (
//                 <div className="message ai typing">
//                   <span className="dot">.</span>
//                   <span className="dot">.</span>
//                   <span className="dot">.</span>
//                 </div>
//               )}
//               <div ref={messagesEndRef} />
//             </div>

//             <form className="chat-input" onSubmit={handleSend}>
//               <input
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 placeholder="Type your message..."
//               />
//               <button type="submit">Send</button>
//             </form>
//           </>
//         )}
//       </div>
//         {showLogoutModal && (
//           <div className="logout-modal-overlay">
//             <div className="logout-modal">
//               <h3>Confirm Logout</h3>
//               <p>Are you sure you want to logout?</p>
//               <div className="logout-actions">
//                 <button
//                   className="cancel-btn"
//                   onClick={() => setShowLogoutModal(false)}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   className="confirm-btn"
//                   onClick={handleLogoutConfirm}
//                 >
//                   Logout
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//     </div>
//   );
// }


import { useEffect, useRef, useState, useCallback } from "react";
import {
  startChat,
  sendMessage,
  getHistory,
  getChatSessions,
  logout,
  searchChats,
  sendMessageStream,
} from "../services/api";
import "./Chat.css";
import ChatSidebar from "./ChatSidebar";
import ReactMarkdown from "react-markdown";

export default function Chat({ onLogout }) {
  const token = localStorage.getItem("token");
  const [sessions, setSessions] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const sendingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [subject, setSubject] = useState(
    localStorage.getItem("subject") || "physics"
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const subjects = ["physics", "chemistry", "english", "social"];

  // Subject icons for visual flair
  const subjectIcons = {
    physics: "⚛️",
    chemistry: "🧪",
    english: "📖",
    social: "🌍",
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  function handleSubjectChange(newSubject) {
    localStorage.setItem("subject", newSubject);
    setSubject(newSubject);
    setChatId(null);
    setMessages([]);
    setDropdownOpen(false);
  }
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* ---------------- Load sidebar sessions ---------------- */

  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await getChatSessions(token);
        setSessions(res.sessions || []);
      } catch (err) {
        console.error("Failed to load sessions", err);
      }
    }
    loadSessions();
  }, [token, subject]);

  /* ---------------- Select chat & load history ---------------- */

  async function handleSelectChat(id) {
    try {
      setChatId(id);
      const history = await getHistory(id, token);
      setMessages(Array.isArray(history.messages) ? history.messages : []);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  }

  /* ---------------- Start new chat ---------------- */

  async function handleNewChat() {
    try {
      const res = await startChat(token);
      setChatId(res.chat_id);
      setMessages([]);
      setInput("");

      const updated = await getChatSessions(token);
      setSessions(updated.sessions || []);
    } catch (err) {
      console.error("Failed to start new chat", err);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !chatId || sendingRef.current) return;

    sendingRef.current = true;
    setLoading(true);

    const userText = input;
    setInput("");

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText },
      { sender: "ai", text: "" } // placeholder
    ]);

    try {
      const res = await sendMessageStream(chatId, userText, token);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let aiText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        aiText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            sender: "ai",
            text: aiText
          };
          return updated;
        });
      }
    } catch (err) {
      console.error("Streaming failed", err);
    } finally {
      sendingRef.current = false;
      setLoading(false);
    }
  }

  function handleLogoutConfirm() {
    try {
      logout();   // 🔥 calls backend & deletes Redis session
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      onLogout();       // navigate back to login
    }
  }

  /* ---------------- Search Chats ---------------- */
  async function handleSearch(query) {
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    const res = await searchChats(query, token);
    setSearchResults(res.results || []);
    setIsSearching(true);
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="chat-layout">
      <ChatSidebar
        sessions={isSearching ? searchResults : sessions}
        activeChatId={chatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onSearch={handleSearch}
      />

      <div className="chat-container">
        <div className="chat-header">
          <div className="subject-dropdown" ref={dropdownRef}>
            <button
              className="subject-btn"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <span>{subjectIcons[subject]}</span>
              {subject.charAt(0).toUpperCase() + subject.slice(1)}
              <span className={`chevron${dropdownOpen ? " open" : ""}`}>▼</span>
            </button>
            {dropdownOpen && (
              <div className="subject-menu">
                {subjects.map((s) => (
                  <div
                    key={s}
                    className={`subject-item ${s === subject ? "active" : ""}`}
                    onClick={() => handleSubjectChange(s)}
                  >
                    <span className="subject-dot" />
                    <span>{subjectIcons[s]}</span>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className="logout-btn"
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </button>
        </div>

        {!chatId ? (
          <div className="chat-placeholder">
            <button className="start-chat-btn" onClick={handleNewChat}>Start Chat</button>
          </div>
        ) : (
          <>
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`message ${m.sender}`}
                >
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              ))}
              {loading && (
                <div className="message ai typing">
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSend}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        )}
      </div>
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

    </div>
  );
}
