import React from "react";
import { Link } from "react-router-dom"; 

function Portal() {
    return (
      <div className="portal-container">
      <div className="portal-box">
        <h1>✨ Get Things Done! ✨ </h1>
        <div className="portal-buttons">
        <Link to="/login">🔑 Login</Link>
        <Link to="/register">🗝️ Register</Link>
        </div>
      </div>
      </div>
    );
  }; 
  
  export default Portal;
  