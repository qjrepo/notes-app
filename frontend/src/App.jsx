import React from 'react'
import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import AuthProvider from "./components/AuthContext";
import ChangePassword from "./pages/ChangePassword";
import UpdateUsername from "./pages/UpdateUsername";
import ForgetPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import Navbar from "./components/Navbar";
// import Navbar from 'react-bootstrap/Navbar';
import UserProfile from "./pages/UserProfile";
import ProtectedLayout from "./components/ProtectedLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/changepassword"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/updateusername"
            element={
              <ProtectedRoute>
                <UpdateUsername />
              </ProtectedRoute>
            }
          />
          <Route
            path="/userprofile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          /> */}

          <Route
            element={
                <ProtectedRoute>
                    <ProtectedLayout />
                </ProtectedRoute>
                  }
            >
                <Route path="/" element={<Home />} />
                <Route path="/changepassword" element={<ChangePassword />} />
                <Route path="/updateusername" element={<UpdateUsername />} />
                <Route path="/userprofile" element={<UserProfile />} />
            </Route>

          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
          <Route path = "/forgetpassword" element = {<ForgetPassword/>}/>
          <Route
            path="/reset-password/:uid/:token" element={<ResetPassword />}
          />
          <Route path="/login" element={<Login />} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;
