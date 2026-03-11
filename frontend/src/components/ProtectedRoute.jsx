import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthorized } = useContext(AuthContext);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;



