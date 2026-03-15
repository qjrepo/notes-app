import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Form.css";

function ResetPassword() {
    const { uid, token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const res = await api.post("/api/reset-password-confirm/", {
                uid,
                token,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });

            setMessage(res.data.message);

            // Redirect to login after success
            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {
            console.log("error message", error.response?.data);
            setMessage( error.response?.data.error);
           
        } 
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>Reset Password</h1>
            <input
                className="form-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
            />
            <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                required
            />
            <button
                type="submit"
                className="form-button"
                value = "Reset Password"
            >
                Reset Password
            </button>
            {message && <p>{message}</p>}
        </form>
    );
}

export default ResetPassword;
