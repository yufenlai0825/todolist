import React, { useState } from "react";
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import GoogleIcon from '@mui/icons-material/Google';
import { Link, useNavigate } from "react-router-dom"; 
import { AuthClient } from "@dfinity/auth-client"; 
import "../style.css";  

//pass user data to App.jsx via setUser
function Login({setUser}) {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");  
  const [error, setError] = useState(""); 
  const navigate = useNavigate(); 
  //Link is a React component can only be used as a JSX tag

  // for all backend API calls
  const backendUrl = process.env.NODE_ENV === "production"
  ? "https://todolist-kbuf.onrender.com"
  : "http://localhost:3000";  //local testing

  const handleSignIn = async (event) => {
    event.preventDefault(); 
    setError(""); 

    try {
      const response = await fetch(`${backendUrl}/login`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // important for session-based auth
      });

      const result = await response.json();
      if (response.ok) {
        setUser(result.user); // store logged-in user
        navigate("/main");
      } else {
        const result = await response.json();
        setError(result.error || "Login failed");
      }

    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred. Please try again.");
    }
  }; 

    function handleGoogleSignIn (){
      const backendUrl = process.env.NODE_ENV === "production"
      ? "hhttps://todolist-kbuf.onrender.com/auth/google"
      : "http://localhost:3000/auth/google";
      
      window.location.href = backendUrl;
    }; //redirect to backend GoogleOAuth

    const handleInternetSignIn = async () => {
      const authClient = await AuthClient.create(); 
      await authClient.login({
        identityProvider: "https://identity.ic0.app", 
        onSuccess: async() => {
          const identity = authClient.getIdentity(); 
          setUser({name: "Internet Identity User", id: identity.getPrincipal().toText() }); 
          navigate("/main"); 
        }
      })
    }; 

    return (
    <div className="login-container">
    <div className="login-box">
      <h2>Welcome to Your List! </h2>
      <form className="login-form" onSubmit={handleSignIn}>
        <input type="email" placeholder="Email" value = {email} onChange={(event)=> {setEmail(event.target.value)}} required />
        <input type="password" placeholder="Password" value = {password} onChange={(event)=> {setPassword(event.target.value)}} required />
        <button type="submit" className="login-button">Sign In</button>
      </form>

      <div className="oauth-options">
        <button className="ii-button" onClick={handleInternetSignIn}><AllInclusiveIcon fontSize="small" /> Internet Identity</button>
        <button className="google-button" onClick={handleGoogleSignIn}><GoogleIcon fontSize="small"/> Google Account</button>
      </div>

      <p>New here? <Link to="/register">Register</Link></p>
    </div>
  </div>
    );
  }; 
  
  export default Login;
  