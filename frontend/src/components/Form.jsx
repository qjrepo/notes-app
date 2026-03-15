import {useState, useContext} from 'react';
import api from '../api';
import {useNavigate} from 'react-router-dom';
import '../styles/Form.css';
import { AuthContext } from "./AuthContext";

function Form({route, method}){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const {login} = useContext(AuthContext);
    const [email, setEmail] = useState("")

    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register";
    const isRegister = method !== "login";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try{
            
            if (method === "login"){
                const res = await api.post(route, {username, password});
                login(res.data);
                // console.log("data:", res.data)
                navigate("/");
            }else{
                await api.post(route, {email, username, password});
                navigate("/login");
            }
        }catch(error){
            console.log(error.response?.data);
        }finally{
            setLoading(false);
        }
    }

    const handleForgetPassword = (e) =>{
        e.preventDefault();
        navigate("/forgetpassword")

    }
    return(
        <>
           <form onSubmit = {handleSubmit} className = "form-container">
                <h1>{name}</h1>
                {isRegister && (
                <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />
                )}
                <input
                    className="form-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                />
                <input
                    className="form-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />

                <button type = "submit" className = "form-button">
                    {name}
                </button>

                {!isRegister && (
                    <button className = "form-button" onClick = {handleForgetPassword}>
                    Forgot Password?
                 </button>
                )}
            </form>
        </>
    )
}
export default Form;