import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaUserCircle } from "react-icons/fa"; // Import an icon

function Navbar() {
  const { user } = useContext(UserContext);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid); // Adjust the collection name if different
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.name || "User");
          setUserRole(userData.role || "donor"); // Default to 'donor' if role isn't set
        } else {
          console.warn("No user profile found.");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="bg-blue-600 p-4 px-2">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white font-bold text-xl">
          Donor System
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {userRole === "donor" && (
                <>
                  <Link to="/donor/dashboard" className="text-white">
                    Dashboard
                  </Link>
                  <Link to="/donor/profile" className="text-white">
                    Profile
                  </Link>
                </>
              )}
              {userRole === "doctor" && (
                <Link to="/doctor/dashboard" className="text-white">
                  Dashboard
                </Link>
              )}
              {userRole === "admin" && (
                <>
                  <Link to="/admin/dashboard" className="text-white">
                    Dashboard
                  </Link>
                  <Link to="/admin/donor-management" className="text-white">
                    Donor Management
                  </Link>
                  <Link to="/admin/doctor-management" className="text-white">
                    Doctor Management
                  </Link>
                  <Link to="/admin/reports" className="text-white">
                    Reports
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="text-white">
                Logout
              </button>
              <div className="flex items-center space-x-2 text-white">
                <FaUserCircle size={24} />
                <span className="font-medium">
                  {userName} ({userRole})
                </span>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white">
                Login
              </Link>
              <Link to="/register" className="text-white">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
