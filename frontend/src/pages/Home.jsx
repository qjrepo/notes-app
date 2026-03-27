import { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';
import Note from '../components/Note';
import "../styles/Home.css";
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';

const NOTES_PER_PAGE = 5;

function Toast({ toasts, dismiss }) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    <span>{t.message}</span>
                    <button className="toast-close" onClick={() => dismiss(t.id)}>✕</button>
                </div>
            ))}
        </div>
    );
}

function Home(){
    const [notes, setNotes]     = useState([]);
    const [content, setContent] = useState("");
    const [title, setTitle]     = useState("");
    const [page, setPage]       = useState(0);
    const [toasts, setToasts]   = useState([]);
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const toast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    const getNotes = useCallback(() => {
        api.get("/api/notes/")
            .then(res => setNotes(res.data))
            .catch(() => toast('Failed to load notes.', 'error'));
    }, [toast]);

    useEffect(() => { getNotes(); }, [getNotes]);

    const deleteNote = (id) => {
        api.delete(`/api/notes/delete/${id}/`)
            .then(res => {
                if (res.status === 204) {
                    toast('Note deleted.');
                    setNotes(prev => {
                        const updated = prev.filter(n => n.id !== id);
                        const maxPage = Math.max(0, Math.ceil(updated.length / NOTES_PER_PAGE) - 1);
                        setPage(p => Math.min(p, maxPage));
                        return updated;
                    });
                } else {
                    toast('Failed to delete note.', 'error');
                }
            })
            .catch(() => toast('Failed to delete note.', 'error'));
    };

    const updateNote = async (id, updateData) => {
        try {
            await api.patch(`/api/notes/update/${id}/`, updateData);
            setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updateData, updated_at: new Date().toISOString() } : n));
            toast('Note updated.');
        } catch {
            toast('Update failed.', 'error');
        }
    };

    const pinNote = async (id, currentlyPinned) => {
        try {
            await api.patch(`/api/notes/update/${id}/`, { is_pinned: !currentlyPinned });
            getNotes();
        } catch {
            toast('Failed to pin note.', 'error');
        }
    };

    const createNote = (e) => {
        e.preventDefault();
        api.post("/api/notes/", { content, title })
            .then(res => {
                if (res.status === 201) {
                    toast('Note created!');
                    setTitle("");
                    setContent("");
                    setPage(0);
                    getNotes();
                } else {
                    toast('Failed to create note.', 'error');
                }
            })
            .catch(() => toast('Failed to create note.', 'error'));
    };

    const totalPages = Math.ceil(notes.length / NOTES_PER_PAGE);
    const pageNotes  = notes.slice(page * NOTES_PER_PAGE, (page + 1) * NOTES_PER_PAGE);

    return (
        <div className="notes-page">
            <Toast toasts={toasts} dismiss={dismiss} />
            <div className="notes-inner">
                <div className="notes-section">
                    <p className="notes-section-title">My Notes <span className="notes-count">({notes.length})</span></p>
                    {pageNotes.length === 0 && <p className="notes-empty">No notes yet. Create one!</p>}
                    {pageNotes.map(note => (
                        <Note note={note} deleteNote={deleteNote} updateNote={updateNote} pinNote={pinNote} key={note.id} />
                    ))}
                    {totalPages > 1 && (
                        <div className="notes-pagination">
                            <button className="notes-pg-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Prev</button>
                            <span className="notes-pg-info">Page {page + 1} of {totalPages}</span>
                            <button className="notes-pg-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next →</button>
                        </div>
                    )}
                </div>

                <div className="create-note-section">
                    <h2>New Note</h2>
                    <form className="create-note-form" onSubmit={createNote}>
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            required
                            onChange={e => setTitle(e.target.value)}
                            value={title}
                        />
                        <label htmlFor="content">Content</label>
                        <textarea
                            id="content"
                            name="content"
                            required
                            rows={6}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                        <input type="submit" value="Create Note" />
                    </form>
                </div>
            </div>
        </div>
    );
}
export default Home;