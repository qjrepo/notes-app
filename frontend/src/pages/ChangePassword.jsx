import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../api";
import "../styles/ChangePassword.css";

function ChangePassword(){
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();

    const changePassword = async (e) => {
        e.preventDefault();
        const data = {
            "current_password": currentPassword,
            "new_password": newPassword,
            "confirm_password": confirmPassword
        }
        try{
             const res = await api.post("/api/change-password/", data);
             
             alert("Password updated successfully!")
        }catch(error){
            console.log("Error updating password", error.response);
            alert(error.response.data.details.non_field_errors);
        }
    };
    const back = (e) => {
        e.preventDefault();
        navigate("/");
    };

    return (
        <div className = "cp-container">
            <form className = "cp-form" onSubmit = {changePassword}>
                <label htmlFor = "current-password">Current Password:</label>
                <input 
                    id = "current-password"
                    type = "password" 
                    onChange = {(e) => setCurrentPassword(e.target.value)}
                    value = {currentPassword}
                />
                <label htmlFor = "new-password"> New Password:</label>
                <input
                    id = "new-password"
                    type = "password"
                    onChange = {(e)=> setNewPassword(e.target.value)}
                    value = {newPassword}
                />
                <label htmlFor = "confirm-password"> Confirm Password:</label>
                <input
                    id = "confirm-password"
                    type = "password"
                    onChange = {(e)=> setConfirmPassword(e.target.value)}
                    value = {confirmPassword}
                />
                <input type = "submit" value = "Change Password"></input>
                
            </form>
            <button className="back-button" onClick = {back}>Back</button>
            
            
        </div>
    )
}

export default ChangePassword;