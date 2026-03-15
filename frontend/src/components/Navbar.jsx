
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
                Hello{" "}
                <div className="username-wrapper">
                    <span
                    className="username"
                    onClick={() => setOpen(!open)}
                >
                    {user.username}
                </span>

                {open && (
                    <div className="dropdown">
                        <div onClick={() => navigate("/userprofile")}>
                            Profile
                        </div>
                        <div onClick={() => navigate("/updateusername")}>
                            Change Username
                        </div>
                        <div onClick={() => navigate("/changepassword")}>
                            Change Password
                        </div>
                        <div onClick={handleLogout}>
                            Logout
                        </div>
                    </div>
                )}
                </div>
                
            </div>
        </nav>
    )
}
export default Navbar;