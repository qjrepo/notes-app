import {Navigate} from 'react-router-dom';
import {jwtDecode} from "jwt-decode";
import api from '../api';
import { ACCESS_TOKEN, REFRESH_TOKEN, USER, USER_ID} from  '../constants';
import {useState, useEffect, createContext } from 'react';

export const AuthContext = createContext();

function AuthProvider({children}){
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [user, setUser] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    
    useEffect(() => {
        auth().catch((error) => {
            console.log(error);
            setIsAuthorized(false);
        })
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        try{
            const res = await api.post('/api/token/refresh/',
                {refresh :refreshToken,}
            );
            if (res.status === 200){
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);
            }else{
                setIsAuthorized(false);
            }
        }catch (error){
            console.log(error);
            setIsAuthorized(false);
        }
    };

    const auth = async () => {
        const accessToken = localStorage.getItem(ACCESS_TOKEN);
        const storedUsername = localStorage.getItem(USER);

        if (!accessToken){
            setIsAuthorized (false);
            return;
        }
        const decode = jwtDecode(accessToken);
        const tokenExpiration  = decode.exp;
        const now = Date.now()/1000;
        if (tokenExpiration < now){
            await refreshToken();
        }else {
            setIsAuthorized(true);
        }
        if (storedUsername) {
            try {
                setUser(JSON.parse(storedUsername));
            } catch {
                setUser(storedUsername);
            }
        }
    };

    const login = (data) => {
        const userData = {
            username: data.username,
            email: data.email,
            user_id: data.user_id,
        };



        localStorage.setItem(ACCESS_TOKEN, data.access);
        localStorage.setItem(REFRESH_TOKEN, data.refresh);
        // localStorage.setItem(USER, data.username);
        localStorage.setItem(USER, JSON.stringify(userData));
        // localStorage.setItem(USER_ID, data.user_id);

        // setUser(data.username);
        setUser(userData);
        // setUserEmail(data.email);
        setIsAuthorized(true);
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem(USER);
    // localStorage.removeItem(USER_ID)

    setUser(null);
    setIsAuthorized(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, userEmail, isAuthorized, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;