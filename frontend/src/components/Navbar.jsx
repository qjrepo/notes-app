
import {useContext, useState, useRef, useEffect} from "react"
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import "../styles/Navbar.css"

function Navbar(){
    const {user, logout} = useContext(AuthContext);
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()
    const dropdownRef = useRef(null);
    // console.log("USER FROM CONTEXT:", user);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const handleLogout = () => {
        // navigate("/logout");
        logout();
        navigate("/login");
    };
    return(
        <nav className="navbar">
            <div className="user-section" ref={dropdownRef}>
                <button className="avatar-btn" onClick={() => setOpen(!open)}>
                    <span className="avatar-circle">{user.username?.[0]?.toUpperCase()}</span>
                    <span className="avatar-name">Hello, {user.username}</span>
                    <span className="avatar-caret">{open ? '▴' : '▾'}</span>
                </button>

                {open && (
                    <div className="dropdown">
                        <div className="dropdown-header">
                            <span className="dropdown-avatar">{user.username?.[0]?.toUpperCase()}</span>
                            <div>
                                <p className="dropdown-username">{user.username}</p>
                                <p className="dropdown-email">{user.email}</p>
                            </div>
                        </div>
                        <div className="dropdown-divider" />
                        <div className="dropdown-item" onClick={() => { navigate("/userprofile"); setOpen(false); }}>
                            <span className="dropdown-icon">👤</span> Profile
                        </div>
                        <div className="dropdown-item" onClick={() => { navigate("/updateusername"); setOpen(false); }}>
                            <span className="dropdown-icon">✏️</span> Change Username
                        </div>
                        <div className="dropdown-item" onClick={() => { navigate("/changepassword"); setOpen(false); }}>
                            <span className="dropdown-icon">🔒</span> Change Password
                        </div>
                        <div className="dropdown-divider" />
                        <div className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                            <span className="dropdown-icon">🚪</span> Logout
                        </div>
                    </div>
                )}
            </div>

            <div className="nav-links">
                <span className="nav-link" onClick={() => navigate("/")}>Notes</span>
                <span className="nav-link" onClick={() => navigate("/jobs")}>Job Tracker</span>
            </div>
        </nav>
    )
}
export default Navbar;