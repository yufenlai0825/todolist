import React, { useState, useEffect } from "react";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useNavigate, useLocation } from "react-router-dom";

function Header({ user, setUser }) {
  const [user ,setUser] = useState(null); 
  const [err, setError] = useState(null); 
  const navigate = useNavigate(); 
  const location = useLocation(); 

  // direct all API operations (login, logout, data fetching) to backend server
  const backendUrl = import.meta.env.MODE === "production"  
  ? import.meta.env.VITE_BACKEND_URL 
  : "http://localhost:3000"; 

  // fetch current session user on mount
  useEffect(() => {
    fetch(`${backendUrl}/auth/session`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user);
        else setUser(null);
      })
      .catch(err => {
        console.error("Session check failed:", err);
      });
  }, [backendUrl]);

  function handleLogout() {
   fetch(`${backendUrl}/logout`, { 
      method: "GET",
      credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized or delete failed"); 
        return res.json(); //{ message: "Logout successful"}
      }
      ).then((data)=>{
        console.log(data.message); // "Logout successful"
        setUser(null); 
        navigate("/login");
      } 
      ).catch(err => {
        console.error("Error logging out:", err);
        setError(err.message); 
      });
  };

  // display logout button based on routes
  const hideLogoutRoutes = ["/", "/login", "/register"];
  const shouldShowLogout = user && !hideLogoutRoutes.includes(location.pathname);

  return (
    <header>
      <h1>
        <EditNoteIcon fontSize="large" />
        To Do List
      </h1>
            { shouldShowLogout && (
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      )}
    </header>
  );
}

export default Header;
