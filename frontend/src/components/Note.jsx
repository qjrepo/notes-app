import {useState, React} from 'react';
import "../styles/Note.css";

function Note({note, deleteNote, updateNote, pinNote}){

    const [isEditing, setIsEditing] = useState(false)
    const [editedTitle, setEditedTitle] = useState(note.title);
    const [editedContent, setEditedContent] = useState(note.content);

    const renderContent = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, i) =>
            urlRegex.test(part)
                ? <a key={i} href={part.startsWith("www.") ? `https://${part}` : part} target="_blank" rel="noopener noreferrer">{part}</a>
                : part
        );
    };

    const formattedDate = new Date(note.created_at).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    })

    const formattedUpdateDate = note.updated_at ? new Date(note.updated_at).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }) : null

    const handleDoubleclick = () => {
        setIsEditing(true);
    };

    const handleUpdate= async(e) => {
        e.preventDefault();
        const update_data = {
            "title" : editedTitle,
            "content" : editedContent
        }
        try{
            await updateNote(note.id, update_data)
            setIsEditing(false)
        }catch(error){
            alert("Update failed")
        }
    }
    const handleCancel = () => {
        setIsEditing(false)
    }
    return (
        <div className="note-container" onDoubleClick={handleDoubleclick}>
            {note.is_pinned && <span className="pin-indicator">📌</span>}
            {isEditing ? (
                <form className="note-edit-form" onSubmit={handleUpdate}>
                    <input 
                        type = "text"
                        id = "editedTitle"
                        onChange = {(e) => {setEditedTitle(e.target.value)}}
                        value = {editedTitle}
                        />
                    <textarea
                        type = "text"
                        id = "editedContent"
                        rows={6}
                        onChange = {(e) => setEditedContent(e.target.value)}
                        value = {editedContent}
                    />
                    <div className="note-actions">
                        <button className="update-button" type="submit">Update</button>
                        <button className="cancel-button" type="button" onClick={handleCancel}>Cancel</button>
                    </div>
               </form>
            ) : (
                <article>
                    <h3 className="note-title">{note.title}</h3>
                    <p className="note-content">{renderContent(note.content)}</p>
                    <p className="note-date">
                        Created at:{" "}
                        <time dateTime={note.created_at}>
                        {formattedDate}
                        </time>
                    </p>

                    {formattedUpdateDate && (
                        <p className="note-date">
                        Updated at:{" "}
                        <time dateTime={note.updated_at}>
                            {formattedUpdateDate}
                        </time>
                        </p>
                    )}

                    <div className="note-actions">
                        <button className="pin-button" onClick={() => pinNote(note.id, note.is_pinned)}>
                            {note.is_pinned ? "Unpin" : "Pin"}
                        </button>
                        <button className="delete-button" onClick={() => deleteNote(note.id)}>Delete</button>
                    </div>
                </article>
            )
        }
         </div>
    )
}

export default Note;