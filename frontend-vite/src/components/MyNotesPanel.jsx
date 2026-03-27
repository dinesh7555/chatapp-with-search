import React, { useState, useEffect } from 'react';
import { 
  getMyNotes, 
  createMyNote, 
  deleteMyNote,
  createMiniNote, 
  updateMiniNote, 
  deleteMiniNote 
} from '../services/api';
import './MyNotesPanel.css';

const MyNotesPanel = ({ isOpen, onClose, subjectId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newMiniNote, setNewMiniNote] = useState('');
  const [editingMiniNote, setEditingMiniNote] = useState(null);
  const [editContent, setEditContent] = useState('');

  const token = localStorage.getItem('token');

  // Fetch all notes for the subject when subject changes or panel opens
  useEffect(() => {
    if (isOpen && subjectId) {
      fetchNotes();
      setSelectedNote(null);
    }
  }, [isOpen, subjectId]);

  const fetchNotes = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getMyNotes(subjectId, token);
      setNotes(data || []);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    try {
      const note = await createMyNote(newNoteTitle, subjectId, token);
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

  const handleCreateMiniNote = async (e) => {
    e.preventDefault();
    if (!newMiniNote.trim() || !selectedNote) return;
    try {
      const mini = await createMiniNote(selectedNote.id, newMiniNote, token);
      const updatedNote = {
        ...selectedNote,
        mini_notes: [...(selectedNote.mini_notes || []), mini]
      };
      setSelectedNote(updatedNote);
      setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
      setNewMiniNote('');
    } catch (err) {
      console.error("Failed to add note snippet", err);
    }
  };

  const startEditMiniNote = (mini) => {
    setEditingMiniNote(mini.id);
    setEditContent(mini.content);
  };

  const saveEditMiniNote = async (miniId) => {
    try {
        const updated = await updateMiniNote(miniId, editContent, token);
        const updatedMiniNotes = selectedNote.mini_notes.map(m => 
            m.id === miniId ? updated : m
        );
        const updatedNote = { ...selectedNote, mini_notes: updatedMiniNotes };
        setSelectedNote(updatedNote);
        setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
        setEditingMiniNote(null);
    } catch (err) {
        console.error("Failed to update mini note", err);
    }
  };

  const handleDeleteMiniNote = async (miniId) => {
    try {
      await deleteMiniNote(miniId, token);
      const updatedMiniNotes = selectedNote.mini_notes.filter(m => m.id !== miniId);
      const updatedNote = { ...selectedNote, mini_notes: updatedMiniNotes };
      setSelectedNote(updatedNote);
      setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
    } catch (err) {
      console.error("Failed to delete mini note", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mynotes-overlay" onClick={onClose}>
      <div className="mynotes-panel" onClick={e => e.stopPropagation()}>
        
        <div className="mynotes-header">
          <h2>📝 My Notes {subjectId && `- ${subjectId.charAt(0).toUpperCase() + subjectId.slice(1)}`}</h2>
          <button className="mynotes-close" onClick={onClose}>&times;</button>
        </div>

        <div className="mynotes-content">
          {!selectedNote ? (
            // VIEW 1: List of Notes
            <div className="mynotes-view1">
              <form onSubmit={handleCreateNote} className="mynotes-create-form">
                <input 
                  type="text" 
                  placeholder="Create new note document..." 
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
                <button type="submit">+</button>
              </form>
              
              {loading ? (
                <div className="mynotes-loading">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="mynotes-empty">No notes yet for this subject.</div>
              ) : (
                <div className="mynotes-list">
                  {notes.map(note => (
                    <div 
                      key={note.id} 
                      className="mynote-card"
                      onClick={() => setSelectedNote(note)}
                    >
                      <div className="mynote-card-info">
                        <h3>{note.title}</h3>
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      <button 
                        className="mynote-delete-btn" 
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
          ) : (
            // VIEW 2: Inside a Note (MiniNotes)
            <div className="mynotes-view2">
              <div className="mynotes-view2-header">
                <button className="mynotes-back-btn" onClick={() => setSelectedNote(null)}>
                  ← Back
                </button>
                <h3>{selectedNote.title}</h3>
              </div>

              <div className="mininotes-list">
                {(!selectedNote.mini_notes || selectedNote.mini_notes.length === 0) ? (
                  <div className="mynotes-empty">Empty notebook. Add some snippets below!</div>
                ) : (
                  selectedNote.mini_notes.map(mini => (
                    <div key={mini.id} className="mininote-item">
                      {editingMiniNote === mini.id ? (
                        <div className="mininote-edit-mode">
                            <textarea 
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                                autoFocus
                            />
                            <div className="mininote-edit-actions">
                                <button onClick={() => saveEditMiniNote(mini.id)}>Save</button>
                                <button onClick={() => setEditingMiniNote(null)}>Cancel</button>
                            </div>
                        </div>
                      ) : (
                        <div className="mininote-read-mode">
                          <p>{mini.content}</p>
                          <div className="mininote-actions">
                            <button onClick={() => startEditMiniNote(mini)}>✏️</button>
                            <button onClick={() => handleDeleteMiniNote(mini.id)}>🗑️</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleCreateMiniNote} className="mininotes-create-form">
                <textarea 
                  placeholder="Take down a snippet while learning..." 
                  value={newMiniNote}
                  onChange={(e) => setNewMiniNote(e.target.value)}
                  rows={2}
                />
                <button type="submit">Add Note</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyNotesPanel;
