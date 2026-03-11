import {useState, useContext} from 'react';
import api from '../api';
import {useNavigate} from 'react-router-dom';
import { ACCESS_TOKEN, REFRESH_TOKEN,USER} from '../constants';
import '../styles/Form.css';
import { AuthContext } from "./AuthContext";

function Form({route, method}){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const {login} = useContext(AuthContext);

    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();
        try{
            const res = await api.post(route, {username, password});
            if (method === "login"){
                login(res.data);
                // console.log("data:", res.data)
                navigate("/");
            }else{
                navigate("/login");
            }
        }catch(error){
            console.log(error.response.data.username);
            alert(error.response.data.username);
        }finally{
            setLoading(false);
        }
    }
    return(
        <form onSubmit = {handleSubmit} className = "form-container">
            <h1>{name}</h1>
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
        </form>
    )
}
export default Form;