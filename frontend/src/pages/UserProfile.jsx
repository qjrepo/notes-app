import { AuthContext } from '../components/AuthContext';
import {useContext} from 'react';
import { useNavigate } from 'react-router-dom';

function UserProfile(){
    const {user} = useContext(AuthContext);
    const navigate = useNavigate();
    const back = (e) => {
        e.preventDefault();
        navigate("/");
    };

    return(
        <div>
            <h3>User email:</h3>
            <p>{user.email}</p>
            <button className="back-button" onClick = {back}>Back</button>

        </div>
    )

}

export default UserProfile;