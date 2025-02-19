import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

const PrivateRoute = ({ children, role }) => {
  const { user, loading, hospitalStatus } = useContext(UserContext);
  const location = useLocation(); // Get current route

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Restrict access if the user's role doesn't match the required role
  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }

  // If the user is a doctor with "Pending" hospital status, allow only "/doctor/applications"
  if (user.role === "doctor" && hospitalStatus === "Pending" && location.pathname !== "/doctor/applications") {
    return <Navigate to="/doctor/applications" />;
  }

  return children;
};

export default PrivateRoute;
