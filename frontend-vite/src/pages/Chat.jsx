

import { useEffect, useRef, useState } from "react";
import {
  startChat,
  sendMessage,
  getHistory,
  getChatSessions
} from "../services/api";
import "./Chat.css";
import ChatSidebar from "./ChatSidebar";
import ReactMarkdown from "react-markdown";
import { searchChats } from "../services/api";
import { sendMessageStream } from "../services/api";



export default function Chat({ onLogout }) {
  const token = localStorage.getItem("token");

  const [sessions, setSessions] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const sendingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);


  function scrollToBottom() {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}
useEffect(() => {
  scrollToBottom();
}, [messages]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);


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
  }, [token]);

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

  /* ---------------- Send message ---------------- */

  // async function handleSend(e) {
  //   e.preventDefault();
  //   if (!input.trim() || !chatId || sendingRef.current) return;

  //   sendingRef.current = true;
  //   setLoading(true);

  //   const userText = input;
  //   setInput("");

  //   setMessages((prev) => [
  //     ...prev,
  //     { sender: "user", text: userText }
  //   ]);

  //   try {
  //     const res = await sendMessage(chatId, userText, token);
  //     if (res?.reply) {
  //       setMessages((prev) => [
  //         ...prev,
  //         { sender: "ai", text: res.reply }
  //       ]);
  //     }

      
  //   } catch (err) {
  //     console.error("Send failed", err);
  //   } finally {
  //     sendingRef.current = false;
  //     setLoading(false);
  //   }
  // }

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


  /* ---------------- Logout ---------------- */

  function handleLogout() {
    localStorage.removeItem("token");
    onLogout();
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
          <span>AI Chat Assistant</span>
          <button className="logout-btn" onClick={handleLogout}>
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
    </div>
  );
}
