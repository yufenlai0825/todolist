import React, { useState } from "react";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useNavigate } from "react-router-dom";

function Header() {
  const [user ,setUser] = useState(null); 
  const [error, setError] = useState(null); 
  const navigate = useNavigate(); 

  // direct all API operations (login, logout, data fetching) to backend server
  const backendUrl = import.meta.env.MODE === "production"  
  ? import.meta.env.VITE_BACKEND_URL 
  : "http://localhost:3000"; 

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

  return (
    <header>
      <h1>
        <EditNoteIcon fontSize="large" />
        To Do List
      </h1>
      <button className="logout-button" onClick={handleLogout}>Logout</button>
    </header>
  );
}

export default Header;
