import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../api';
import '../styles/JobTracker.css';

// ─── Column config ────────────────────────────────────────────────────────────

const COLUMNS = [
    { id: 'Saved',      label: 'Saved',      statuses: ['Saved'] },
    { id: 'Applied',    label: 'Applied',    statuses: ['Applied'] },
    { id: 'Interview',  label: 'Interview',  statuses: ['Interview'] },
    { id: 'Offer',      label: 'Offer',      statuses: ['Offer'] },
    { id: 'Rejected',   label: 'Rejected',   statuses: ['Rejected'] },
];

const DROP_STATUS = {
    'Saved':     'Saved',
    'Applied':   'Applied',
    'Interview': 'Interview',
    'Offer':     'Offer',
    'Rejected':  'Rejected',
};

const CARDS_PER_PAGE = 5;

const EMPTY_FORM = {
    title: '', company: '', url: '', notes: '',
    required_skills: '', nice_to_have_skills: '',
    job_summary: '', status: 'Saved',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function skillsToArr(str) {
    return str.split(',').map(s => s.trim()).filter(Boolean);
}

function arrToSkills(arr) {
    return Array.isArray(arr) ? arr.join(', ') : '';
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
    return (
        <div className="jt-overlay" onClick={onClose}>
            <div className="jt-modal" onClick={e => e.stopPropagation()}>
                <div className="jt-modal-header">
                    <h3>{title}</h3>
                    <button className="jt-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="jt-modal-body">{children}</div>
            </div>
        </div>
    );
}

// ─── Job Form (shared by Add + Edit) ─────────────────────────────────────────

function JobForm({ form, onChange, onSubmit, submitLabel, loading }) {
    return (
        <form onSubmit={onSubmit} className="jt-form">
            <label>Title *</label>
            <input required value={form.title} onChange={e => onChange('title', e.target.value)} />

            <label>Company *</label>
            <input required value={form.company} onChange={e => onChange('company', e.target.value)} />

            <label>URL</label>
            <input type="url" value={form.url} onChange={e => onChange('url', e.target.value)} />

            <label>Status</label>
            <select value={form.status} onChange={e => onChange('status', e.target.value)}>
                {['Saved','Applied','Interview','Offer','Rejected'].map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            <label>Required Skills (comma-separated)</label>
            <input value={form.required_skills} onChange={e => onChange('required_skills', e.target.value)} />

            <label>Nice-to-Have Skills (comma-separated)</label>
            <input value={form.nice_to_have_skills} onChange={e => onChange('nice_to_have_skills', e.target.value)} />

            <label>Job Summary</label>
            <textarea rows={3} value={form.job_summary} onChange={e => onChange('job_summary', e.target.value)} />

            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => onChange('notes', e.target.value)} />

            <button type="submit" className="jt-btn jt-btn-primary" disabled={loading}>
                {loading ? 'Saving…' : submitLabel}
            </button>
        </form>
    );
}

// ─── Add Job Modal ────────────────────────────────────────────────────────────

function AddJobModal({ onClose, onCreated }) {
    const [step, setStep]           = useState('input'); // 'input' | 'form'
    const [description, setDesc]    = useState('');
    const [extracting, setExtracting] = useState(false);
    const [extractErr, setExtractErr] = useState('');
    const [form, setForm]           = useState(EMPTY_FORM);
    const [saving, setSaving]       = useState(false);

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleExtract = async () => {
        if (!description.trim()) return;
        setExtracting(true);
        setExtractErr('');
        try {
            const res = await api.post('/api/jobs/extract/', { job_description: description });
            const d = res.data;
            setForm({
                title:               d.title            || '',
                company:             d.company          || '',
                url:                 '',
                notes:               '',
                required_skills:     arrToSkills(d.required_skills),
                nice_to_have_skills: arrToSkills(d.nice_to_have_skills),
                job_summary:         d.job_summary       || '',
                status:              'Saved',
            });
            setStep('form');
        } catch (e) {
            setExtractErr(e.response?.data?.error || 'Extraction failed. Try again.');
        } finally {
            setExtracting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/api/jobs/', {
                ...form,
                url:                 form.url.trim() || null,
                required_skills:     skillsToArr(form.required_skills),
                nice_to_have_skills: skillsToArr(form.nice_to_have_skills),
            });
            onCreated();
            onClose();
        } catch {
            alert('Failed to create job.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Add Job" onClose={onClose}>
            {step === 'input' && (
                <div className="jt-extract-step">
                    <label>Paste a job description</label>
                    <textarea
                        rows={8}
                        value={description}
                        onChange={e => setDesc(e.target.value)}
                        placeholder="Paste the full job posting here…"
                    />
                    {extractErr && <p className="jt-error">{extractErr}</p>}
                    <div className="jt-extract-actions">
                        <button
                            className="jt-btn jt-btn-primary"
                            onClick={handleExtract}
                            disabled={extracting || !description.trim()}
                        >
                            {extracting ? 'Extracting…' : '✨ Extract with AI'}
                        </button>
                        <button
                            className="jt-btn jt-btn-ghost"
                            onClick={() => setStep('form')}
                        >
                            Fill in manually
                        </button>
                    </div>
                </div>
            )}
            {step === 'form' && (
                <JobForm
                    form={form}
                    onChange={setField}
                    onSubmit={handleSave}
                    submitLabel="Create Job"
                    loading={saving}
                />
            )}
        </Modal>
    );
}

// ─── Edit Job Modal ───────────────────────────────────────────────────────────

function EditJobModal({ job, onClose, onUpdated }) {
    const [form, setForm] = useState({
        title:               job.title,
        company:             job.company,
        url:                 job.url || '',
        notes:               job.notes || '',
        required_skills:     arrToSkills(job.required_skills),
        nice_to_have_skills: arrToSkills(job.nice_to_have_skills),
        job_summary:         job.job_summary || '',
        status:              job.status,
    });
    const [saving, setSaving] = useState(false);
    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            ...form,
            url:                 form.url.trim() || null,
            required_skills:     skillsToArr(form.required_skills),
            nice_to_have_skills: skillsToArr(form.nice_to_have_skills),
        };
        try {
            await api.patch(`/api/jobs/update/${job.id}/`, payload);
            onUpdated({
                ...job,
                ...payload,
                created_at: form.status !== job.status ? new Date().toISOString() : job.created_at,
            });
            onClose();
        } catch {
            alert('Failed to update job.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Edit Job" onClose={onClose}>
            <JobForm form={form} onChange={setField} onSubmit={handleSave} submitLabel="Save Changes" loading={saving} />
        </Modal>
    );
}

// ─── Sheet Setup Modal ────────────────────────────────────────────────────────

function SheetSetupModal({ config, onClose, onSaved }) {
    const [spreadsheetId, setSpreadsheetId]         = useState(config?.spreadsheet_id || '');
    const [serviceAccountJson, setServiceAccountJson] = useState('');
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        // Validate JSON before sending
        if (serviceAccountJson.trim()) {
            try { JSON.parse(serviceAccountJson); }
            catch { setError('Service account JSON is not valid JSON.'); return; }
        } else if (!config) {
            setError('Service account JSON is required for first-time setup.');
            return;
        }

        setSaving(true);
        try {
            const payload = { spreadsheet_id: spreadsheetId };
            if (serviceAccountJson.trim()) payload.service_account_json = serviceAccountJson;
            const res = await api.put('/api/jobs/sheet-config/', payload);
            onSaved(res.data);
            onClose();
        } catch (e) {
            setError(e.response?.data?.error || JSON.stringify(e.response?.data) || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title="Google Sheets Setup" onClose={onClose}>
            <form onSubmit={handleSave} className="jt-form">
                <p style={{ fontSize: '0.82rem', color: '#666', margin: '0 0 4px' }}>
                    Connect your Google Sheet to sync job applications automatically.
                </p>

                <label>Spreadsheet ID *</label>
                <input
                    required
                    value={spreadsheetId}
                    onChange={e => setSpreadsheetId(e.target.value)}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                />
                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '-4px' }}>
                    Found in the URL: docs.google.com/spreadsheets/d/<strong>YOUR_ID</strong>/edit
                </p>

                <label>Service Account JSON {config ? '(leave blank to keep existing)' : '*'}</label>
                <textarea
                    rows={8}
                    value={serviceAccountJson}
                    onChange={e => setServiceAccountJson(e.target.value)}
                    placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'}
                    style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '-4px' }}>
                    Create a service account in Google Cloud Console, download the JSON key, and paste it here.
                    Share your sheet with the service account email.
                </p>

                {error && <p className="jt-error">{error}</p>}

                <button type="submit" className="jt-btn jt-btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </form>
        </Modal>
    );
}

// ─── Interview Prep Modal ─────────────────────────────────────────────────────

function PrepModal({ job, onClose }) {
    const [loading, setLoading] = useState(true);
    const [text, setText]       = useState('');
    const [error, setError]     = useState('');

    useEffect(() => {
        api.post(`/api/jobs/${job.id}/interview-prep/`)
            .then(res => setText(res.data.prep))
            .catch(e => setError(e.response?.data?.error || 'Failed to generate prep.'))
            .finally(() => setLoading(false));
    }, [job.id]);

    return (
        <Modal title={`Interview Prep — ${job.title}`} onClose={onClose}>
            {loading && <p className="jt-loading">Generating questions…</p>}
            {error   && <p className="jt-error">{error}</p>}
            {text    && <pre className="jt-prep-text">{text}</pre>}
        </Modal>
    );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, index, onEdit, onDelete, onPrep }) {
    return (
        <Draggable draggableId={job.id} index={index}>
            {(provided, snapshot) => (
                <div
                    className={`jt-card ${snapshot.isDragging ? 'jt-card-dragging' : ''}`}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <div className="jt-card-header">
                        <p className="jt-card-title">{job.title}</p>
                        <span className={`jt-badge jt-badge-${job.status.toLowerCase()}`}>{job.status}</span>
                    </div>
                    <p className="jt-card-company">{job.company}</p>
                    {job.url && (
                        <a className="jt-card-url" href={job.url} target="_blank" rel="noopener noreferrer">
                            View posting ↗
                        </a>
                    )}
                    {job.notes && <p className="jt-card-notes">{job.notes}</p>}
                    <div className="jt-card-actions">
                        <button className="jt-btn jt-btn-sm jt-btn-ghost" onClick={() => onEdit(job)}>Edit</button>
                        <button className="jt-btn jt-btn-sm jt-btn-danger" onClick={() => onDelete(job)}>Delete</button>
                        <button className="jt-btn jt-btn-sm jt-btn-purple" onClick={() => onPrep(job)}>
                            🎯 Interview Prep
                        </button>
                    </div>
                </div>
            )}
        </Draggable>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function JobTracker() {
    const [jobs, setJobs]               = useState([]);
    const [syncLog, setSyncLog]         = useState(null);
    const [sheetConfig, setSheetConfig] = useState(undefined); // undefined = loading, null = not set
    const [showAdd, setShowAdd]         = useState(false);
    const [editJob, setEditJob]         = useState(null);
    const [prepJob, setPrepJob]         = useState(null);
    const [showSheetSetup, setShowSheetSetup] = useState(false);
    const [syncing, setSyncing]         = useState(false);
    const [syncMsg, setSyncMsg]         = useState('');
    const [page, setPage]               = useState(0);
    const [search, setSearch]           = useState('');

    const fetchJobs = useCallback((resetPage = false) => {
        api.get('/api/jobs/').then(res => {
            setJobs(res.data);
            if (resetPage) setPage(0);
        }).catch(() => {});
    }, []);

    const fetchSyncLog = useCallback(() => {
        api.get('/api/jobs/sync-status/').then(res => setSyncLog(res.data.sync_log)).catch(() => {});
    }, []);

    const fetchSheetConfig = useCallback(() => {
        api.get('/api/jobs/sheet-config/')
            .then(res => setSheetConfig(res.data))   // null if not configured
            .catch(() => setSheetConfig(null));
    }, []);

    useEffect(() => {
        fetchJobs();
        fetchSyncLog();
        fetchSheetConfig();
    }, [fetchJobs, fetchSyncLog, fetchSheetConfig]);

    // Drag and drop
    const onDragEnd = async (result) => {
        const { draggableId, destination, source } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId) return;

        const newStatus = DROP_STATUS[destination.droppableId];
        const job = jobs.find(j => j.id === draggableId);
        if (!job) return;

        // Optimistic update: bump created_at to now so it sorts to top of destination column
        const updatedJob = { ...job, status: newStatus, created_at: new Date().toISOString() };
        setJobs(prev => [updatedJob, ...prev.filter(j => j.id !== draggableId)]);
        setPage(0);

        try {
            await api.patch(`/api/jobs/update/${draggableId}/status/`, { status: newStatus });
        } catch {
            // Roll back
            setJobs(prev => prev.map(j => j.id === draggableId ? { ...j, status: job.status } : j));
        }
    };

    // Delete
    const handleDelete = async (job) => {
        if (!confirm(`Delete "${job.title}" at ${job.company}?`)) return;
        try {
            await api.delete(`/api/jobs/delete/${job.id}/`);
            setJobs(prev => prev.filter(j => j.id !== job.id));
        } catch {
            alert('Failed to delete job.');
        }
    };

    // Sync
    const handleSync = async () => {
        setSyncing(true);
        setSyncMsg('');
        try {
            const res = await api.post('/api/jobs/import-sheet/');
            const { created, updated, skipped } = res.data;
            setSyncMsg(`Synced! ${created} created, ${updated} updated, ${skipped} skipped.`);
            fetchJobs(true);
            fetchSyncLog();
        } catch (e) {
            setSyncMsg(e.response?.data?.error || 'Sync failed.');
        } finally {
            setSyncing(false);
        }
    };

    const q = search.trim().toLowerCase();
    const getColumnJobs = (col) =>
        jobs
            .filter(j => col.statuses.includes(j.status))
            .filter(j => !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const getPageJobs = (col) => {
        const all = getColumnJobs(col);
        return all.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);
    };

    const totalPages = Math.ceil(
        Math.max(...COLUMNS.map(col => getColumnJobs(col).length), 1) / CARDS_PER_PAGE
    );

    return (
        <div className="jt-page">
          <div className="jt-inner">
            {/* Header */}
            <div className="jt-header">
                <div className="jt-header-actions">
                    <div className="jt-sync-info">
                        {syncLog && (
                            <span className="jt-last-synced">
                                Last synced: {formatRelativeTime(syncLog.synced_at)}
                            </span>
                        )}
                        {syncMsg && <span className="jt-sync-msg">{syncMsg}</span>}
                        <button
                            className="jt-btn jt-btn-ghost"
                            onClick={() => setShowSheetSetup(true)}
                            title={sheetConfig ? `Connected: ${sheetConfig.spreadsheet_id}` : 'Set up Google Sheets'}
                        >
                            ⚙ Sheet Settings
                        </button>
                        <button
                            className="jt-btn jt-btn-ghost"
                            onClick={handleSync}
                            disabled={syncing || !sheetConfig}
                            title={!sheetConfig ? 'Configure Google Sheets first' : ''}
                        >
                            {syncing ? 'Syncing…' : '↻ Sync from Sheets'}
                        </button>
                    </div>
                    <label className="jt-search-label">
                        Search
                        <input
                            className="jt-search"
                            type="search"
                            placeholder="Title or company…"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                        />
                    </label>
                    <button className="jt-btn jt-btn-primary" onClick={() => setShowAdd(true)}>
                        + Add Job
                    </button>
                </div>
            </div>

            {/* No-config banner */}
            {sheetConfig === null && (
                <div className="jt-sheet-banner">
                    <span>Connect your Google Sheet to sync job applications automatically.</span>
                    <button className="jt-btn jt-btn-sm jt-btn-primary" onClick={() => setShowSheetSetup(true)}>
                        Set Up Google Sheets
                    </button>
                </div>
            )}

            {/* Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="jt-board">
                    {COLUMNS.map(col => {
                        const allColJobs  = getColumnJobs(col);
                        const pageJobs    = getPageJobs(col);
                        return (
                            <div className="jt-column" key={col.id}>
                                <div className="jt-column-header">
                                    <span className="jt-column-label">
                                        {col.label} ({allColJobs.length})
                                    </span>
                                </div>
                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            className={`jt-column-body ${snapshot.isDraggingOver ? 'jt-column-over' : ''}`}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {pageJobs.map((job, index) => (
                                                <JobCard
                                                    key={job.id}
                                                    job={job}
                                                    index={index}
                                                    onEdit={setEditJob}
                                                    onDelete={handleDelete}
                                                    onPrep={setPrepJob}
                                                />
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="jt-pagination">
                    <button
                        className="jt-btn jt-btn-ghost"
                        onClick={() => setPage(p => p - 1)}
                        disabled={page === 0}
                    >
                        ← Prev
                    </button>
                    <span className="jt-page-info">Page {page + 1} of {totalPages}</span>
                    <button
                        className="jt-btn jt-btn-ghost"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages - 1}
                    >
                        Next →
                    </button>
                </div>
            )}

          </div>{/* /jt-inner */}

            {/* Modals */}
            {showAdd        && <AddJobModal    onClose={() => setShowAdd(false)} onCreated={fetchJobs} />}
            {editJob        && <EditJobModal   job={editJob}  onClose={() => setEditJob(null)}       onUpdated={updated => setJobs(prev => prev.map(j => j.id === updated.id ? updated : j))} />}
            {prepJob        && <PrepModal      job={prepJob}  onClose={() => setPrepJob(null)} />}
            {showSheetSetup && <SheetSetupModal config={sheetConfig} onClose={() => setShowSheetSetup(false)} onSaved={setSheetConfig} />}
        </div>
    );
}

export default JobTracker;
