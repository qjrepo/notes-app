import {useState} from 'react';
import api from "../api";
import "../styles/Form.css"


function ForgetPassword(){
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = {
            "email_address": email
        }
        try {
            const res = await api.post("/api/forgot-password/", data)
            console.log(res.data);
            alert(res.data.message)
        }catch(error){
            console.log(error.response?.data);
            alert("something went wrong")
        }
    }

    return(

        <form className = "form-container" onSubmit = {handleSubmit}>
            <label htmlFor = "email">Plase enter your email address</label>
            <input
                className = "form-input"
                id = "email"
                value = {email}
                onChange = {(e) => setEmail(e.target.value)}
                required
            ></input>
            <input className = "form-button" type = "submit" value = "Send Link"></input>
        </form>
    )

}

export default ForgetPassword;