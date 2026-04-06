import React, { useState, useEffect } from 'react';
import { 
  getMyNotes, 
  createMyNote, 
  updateMyNote,
  deleteMyNote
} from '../services/api';
import './MyNotesPanel.css';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SUBJECT_ICONS = {
  operating_systems: "💻",
  database_management: "🗄️",
  computer_networks: "🌐",
  data_structures: "🌲",
  artificial_intelligence: "🤖",
  javascript: "📜",
  java: "☕"
};

const getSubjectIcon = (subj) => {
  if (!subj) return "📚";
  const name = typeof subj === 'string' ? subj : subj.name;
  return name && SUBJECT_ICONS[name.toLowerCase()] ? SUBJECT_ICONS[name.toLowerCase()] : "📚";
};

const MyNotesPanel = ({ isOpen, onClose, subjectId }) => {
  const [selectedSubject, setSelectedSubject] = useState(subjectId || null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Create state
  const [newNoteTitle, setNewNoteTitle] = useState('');
  
  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const token = localStorage.getItem('token');

  // Reset or initialize state when panel opens or subjectId prop changes
  useEffect(() => {
    if (isOpen) {
      const normalizedPropId = subjectId ? subjectId.replace(/\s+/g, '_').toLowerCase() : null;
      setSelectedSubject(normalizedPropId);
      setSelectedNote(null);
    }
  }, [isOpen, subjectId]);

  // Fetch notes when subject is selected
  useEffect(() => {
    if (isOpen && selectedSubject) {
      fetchNotes();
      setSelectedNote(null);
    }
  }, [isOpen, selectedSubject]);

  // Fetch subjects if we need to show the selection view
  useEffect(() => {
    if (isOpen && !selectedSubject && availableSubjects.length === 0) {
      const fetchSubjects = async () => {
        try {
            const res = await fetch(`${BASE_URL}/subjects/`);
            const data = await res.json();
            setAvailableSubjects(data.subjects || []);
        } catch (err) {
            console.error(err);
        }
      };
      fetchSubjects();
    }
  }, [isOpen, selectedSubject, availableSubjects]);

  const fetchNotes = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getMyNotes(selectedSubject, token);
      setNotes(data || []);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !selectedSubject) return;
    try {
      const note = await createMyNote(newNoteTitle, selectedSubject, token);
      setNotes([note, ...notes]);
      setNewNoteTitle('');
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    try {
      await deleteMyNote(noteId, token);
      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  const openNoteEditor = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || "");
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setSavingNote(true);
    try {
        const updated = await updateMyNote(selectedNote.id, editTitle, editContent, token);
        setNotes(notes.map(n => n.id === updated.id ? updated : n));
        setSelectedNote(updated);
    } catch (err) {
        console.error("Failed to save note", err);
    } finally {
        setSavingNote(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mynotes-overlay" onClick={onClose}>
      <div className="mynotes-panel" onClick={e => e.stopPropagation()}>
        
        <div className="mynotes-header">
          {!selectedSubject ? (
            <h2>📚 Select a Subject</h2>
          ) : !selectedNote ? (
            <div className="mynotes-header-nav">
              {!subjectId && (
                <button className="mynotes-back-icon" onClick={() => setSelectedSubject(null)}>
                  ←
                </button>
              )}
              <h2>📝 {selectedSubject.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Notes</h2>
            </div>
          ) : (
            <div className="mynotes-header-nav">
              <button className="mynotes-back-icon" onClick={() => setSelectedNote(null)}>
                ←
              </button>
              <h2>Editing Note</h2>
            </div>
          )}
          <button className="mynotes-close" onClick={onClose}>&times;</button>
        </div>

        <div className="mynotes-content">
          
          {/* VIEW 0: Select Subject */}
          {!selectedSubject && (
            <div className="mynotes-subject-grid">
              <p className="mynotes-prompt">Which subject's notes do you want to access?</p>
              {availableSubjects.map((subj, idx) => {
                const name = typeof subj === 'string' ? subj : subj.name;
                const key = subj.id || name || idx;
                if (!name) return null;
                return (
                <button 
                  key={key} 
                  className="mynotes-subject-btn"
                  onClick={() => setSelectedSubject(subj.id || name)}
                >
                  <span className="subject-icon">{getSubjectIcon(subj)}</span>
                  <span>{name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                </button>
                );
              })}
              {availableSubjects.length === 0 && (
                <div className="mynotes-empty">Loading subjects catalog...</div>
              )}
            </div>
          )}

          {/* VIEW 1: List Notes strictly for the Selected Subject */}
          {selectedSubject && !selectedNote && (
            <div className="mynotes-view-list">
              <form onSubmit={handleCreateNote} className="mynotes-create-inline">
                <input 
                  type="text" 
                  placeholder="Enter new note title..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
                <button type="submit" disabled={!newNoteTitle.trim()}>Create</button>
              </form>
              
              {loading ? (
                <div className="mynotes-loading">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="mynotes-empty">No notes found for {selectedSubject}. Start by creating one!</div>
              ) : (
                <div className="mynotes-list">
                  {notes.map(note => (
                    <div 
                      key={note.id} 
                      className="mynote-card-clickable"
                      onClick={() => openNoteEditor(note)}
                    >
                      <div className="mynote-card-info">
                        <h3>{note.title}</h3>
                        <span className="mynote-date">{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <button 
                        className="mynote-icon-btn" 
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        title="Delete Note"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: Edit a specific Note */}
          {selectedSubject && selectedNote && (
            <div className="mynotes-view-edit">
              <input 
                className="mynote-edit-title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Note Title"
              />
              <textarea 
                className="mynote-edit-text"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                placeholder="Start typing your notes here..."
              />
              <div className="mynote-edit-footer">
                <span className="mynote-saved-status">
                  {savingNote ? "Saving..." : "All changes stored locally."}
                </span>
                <button 
                  className="mynote-save-btn" 
                  onClick={handleSaveNote}
                  disabled={savingNote}
                >
                  {savingNote ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MyNotesPanel;
