import {useState, useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import api from "../api";
import { AuthContext } from '../components/AuthContext';
import "../styles/UpdateUsername.css";

function UpdateUsername(){
    const {user} = useContext(AuthContext);
    const [newUsername, setNewUsername] = useState("")
    const navigate = useNavigate();

    const update_new_username = async (e) =>{
        e.preventDefault();
        const data = {
            "new_username": newUsername
        };
        try{
            const response = await api.post("/api/update-username/", data);
            alert("Username updated successfully")
        }catch(error){
            console.log("Error updating username", error.response);
            alert(error.response.data.details.username);
        }
    }
    const back = () => {
        navigate("/")
    }
    return(
        <div className = "uu-container">
            <form className = "uu-form" onSubmit={update_new_username}>
                <label htmlFor = "current-username"> Current username:</label>
                <input id = "current-username" value = {user.username} disabled/>
                <label htmlFor = "new-username">New username:</label>
                <input 
                    id = "new-username" 
                    type = "text" 
                    onChange = {e => setNewUsername(e.target.value)} 
                    value = {newUsername}
                />
                <input type = "submit" value = "Update"></input>
            </form>
            <button className="back-button" onClick = {back}>Back</button>
        </div>
    )
}

export default UpdateUsername;