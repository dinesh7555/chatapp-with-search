import { useState } from "react";
import { searchChats } from "../services/api";


export default function ChatSidebar({
  sessions,
  activeChatId,
  onSelectChat,
  onNewChat,
  onSearch
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await searchChats(query);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  }

  const list = searchResults.length > 0 ? searchResults : sessions;

  return (
    <div className="chat-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h3>Your Chats</h3>
        <button className="new-chat-btn" onClick={onNewChat}>
          + New
        </button>
      </div>

      {/* SEARCH */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search chats..."
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
        />
        <button onClick={handleSearch}>
          {searching ? "..." : "Search"}
        </button>
        
      </div>

      {/* LIST */}
      <div className="chat-list">
        {list.length === 0 && (
          <p className="empty-sidebar">
            {query ? "No search results" : "No chats yet"}
          </p>
        )}

        {list.map((chat) => (
          <div
            key={chat.chat_id}
            className={`chat-item ${
              chat.chat_id === activeChatId ? "active" : ""
            }`}
            onClick={() => {
              setSearchResults([]);
              setQuery("");
              onSelectChat(chat.chat_id);
            }}
          >
            <div className="chat-title">
              {chat.title || "New Chat"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
