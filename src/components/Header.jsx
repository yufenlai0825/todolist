import React, { useState } from "react";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useNavigate } from "react-router-dom";

function Header() {
  const [user ,setUser] = useState(""); 
  const navigate = useNavigate(); 
  const backendUrl = process.env.NODE_ENV === "production"
  ? "https://todolist-kbuf.onrender.com"
  : "http://localhost:3000";  //local testing

  const handleLogout = async () => {
    await fetch(`${backendUrl}/logout`, { credentials: "include" });
    setUser(null);
    navigate("/");
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
