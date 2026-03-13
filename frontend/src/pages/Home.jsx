import {useState, useEffect, useContext} from 'react';
import api from '../api';
import Note from '../components/Note';
import "../styles/Home.css";
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';

function Home(){
    const [notes, setNotes] = useState([]);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const {logout, user} = useContext(AuthContext);

    // const username = localStorage.getItem(USER)

    useEffect(()=>{
        getNotes();
    }, [])

    const navigate = useNavigate();

    const getNotes = () => {
        api.get("/api/notes/")
        .then((res) => res.data)
        .then((data) => {setNotes(data); console.log(data)})
        .catch((err) => alert(err));
    };
    const deleteNote = (id) => {
        api
            .delete(`/api/notes/delete/${id}/`)
            .then((res) => {
                if (res.status === 204) alert("Note deleted!");
                else alert("Failed to delete note.");
                getNotes();
            })
            .catch((error) => alert(error));
    };

    const updateNote = async (id, updateData) => {
        try{
            const res = await api.patch(`/api/notes/update/${id}/`, updateData);
            console.log("''fsffsdfdsfsd")
            getNotes();
            // return res.data;
        }
        catch(error){
            console.log("error when updating", error);
        }
    }

    const createNote = (e) => {
        e.preventDefault();
        api
            .post("/api/notes/", { content, title })
            .then((res) => {
                if (res.status === 201) alert("Note created!");
                else alert("Failed to make note.");
                getNotes();
            })
            .catch((err) => alert(err));
    };

    const handleLogout = () => {
        // navigate("/logout");
        logout();
        navigate("/login");
    };

    const changePassword = () => {
        navigate("/changepassword");
    }
    const updateUsername = () => {
        navigate("/updateusername");
    }

    return(
        <div>
            <h2>Hello {user}</h2>
            <div className = "notes-section">
                <h1>Notes</h1>
                {notes.map((note) => <Note note = {note} deleteNote = {deleteNote} updateNote = {updateNote} key = {note.id}></Note>)}
            </div>
            <div className = "create-note-section">
                <h2 >Create a Note</h2>
                <form onSubmit = {createNote}>
                    <label htmlFor = "title">Title:</label>
                    <br />
                    <input
                        type = "text"
                        id = "title"
                        name = "title"
                        required
                        onChange = {(e) => setTitle(e.target.value)}
                        value = {title}
                    />
                    <label htmlFor = "content">Content:</label>
                    <br />
                    <textarea
                        id = "content"
                        name = "content"
                        required
                        value = {content}
                        onChange = {(e) => setContent(e.target.value)}
                    ></textarea>
                    <br />
                    <input type = "submit" value = "Submit"></input>
                </form>
                <button onClick={handleLogout}>Logout</button>
                <button onClick = {changePassword}>Change Password</button>
                <button onClick = {updateUsername}> Update Username</button>
            </div>
        </div>
    )
}
export default Home;