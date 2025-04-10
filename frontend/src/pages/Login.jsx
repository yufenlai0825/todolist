import React, { useState } from "react";
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import GoogleIcon from '@mui/icons-material/Google';
import { Link, useNavigate } from "react-router-dom"; 
import { AuthClient } from "@dfinity/auth-client"; 
import "@/style.css";  

//pass user data to App.jsx via setUser
function Login({setUser}) {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");  
  const [err, setError] = useState(""); 
  const navigate = useNavigate(); 
  //Link is a React component can only be used as a JSX tag

  // for all backend API calls
  const backendUrl = import.meta.env.MODE === "production"  
  ? import.meta.env.VITE_BACKEND_URL 
  : "http://localhost:3000";  

  const handleSignIn = async (event) => {
    event.preventDefault(); 
    setError(""); 

    try {
      const response = await fetch(`${backendUrl}/login`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // important for session-based auth
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result?.user) {     // make sureserver returns "user" property 
          setUser(result.user);
          navigate("/main");
      } else {
        setError("Unexpected response from server.");
      }
      } else {
        setError(result?.message || result?.err || "Login failed");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    }
  }; 

    function handleGoogleSignIn (){
      try {
        fetch(
          `${backendUrl}/auth/session`, {
            method: "GET",
            credentials: "include"
          })
        .then(res => {
          if (!res.ok) throw new Error("Sign-in failed");
          return res.json();
        })
        .then(data => {
          if (data?.user) {
            setUser(data.user);
            navigate("/main"); 
          } else {
            setError("Authentication failed. Try other ways to login."); 
            navigate("login"); 
          }
          })
        .catch(err =>{
          console.error("Failed to verify authentication", err);
          setError(err.message); 
          navigate("login");
        }); 
      } catch (err) {
        console.error("Error initializing Google authentication", err);
        setError("Failed to initialize Google authentication");
        navigate("login");
      }
    }; 

    const handleInternetSignIn = async () => {

      try {
        const authClient = await AuthClient.create(); 
        await authClient.login({
          identityProvider: "https://identity.ic0.app", 

          onSuccess: async() => {
            const identity = authClient.getIdentity(); 
            const principalID= identity.getPrincipal().toText(); 
            console.log("Got Internet Identity principalID:", principalID); //debug

            // Instead of redirecting, use fetch and handle response manually
            try {
              const response = await fetch(`${backendUrl}/auth/internet-identity/${principalID}`, {
                method: "GET",
                credentials: "include"
              });
              if (!response.ok) {throw new Error("Authentication failed");}
              
              const data = await response.json();
              setUser(data.user);
              navigate("/main"); // Manual navigation after successful fetch

              } catch (err) {
                console.error("Authentication error:", err);
                setError("Failed to authenticate");
              }
              
          }, onError: (err)=> {
            console.error("Internet Identity login error:", err);
            setError("Internet Identity login failed");
          }
        });
      } catch (err) {
        console.error("Internet Identity initialization error:", err);
        setError("Failed to initialize Internet Identity");
      }
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
  