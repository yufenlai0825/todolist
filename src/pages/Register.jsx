import React, { useState } from "react";
import GoogleIcon from '@mui/icons-material/Google';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { Link, useNavigate } from "react-router-dom"; 
// import { GoogleLogin } from "@react-oauth/google"; //renders a button that handles authentication with Google's OAuth API
import { AuthClient } from "@dfinity/auth-client";
import "../style.css";  

function Register({setUser}) {

    const navigate = useNavigate(); 
    const [greeting, setGreeting] = useState("Create Your Account"); 
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState(""); 
    const [error, setError] = useState(""); 
    const backendUrl = process.env.NODE_ENV === "production"
    ? "https://todolist-nonb.onrender.com"
    : "http://localhost:3000";  //local testing 

    function changeGreeting (event){
        const input = event.target.value; 
        input.length > 0 ? setGreeting("Hello " + input + "!") : setGreeting("Create Your Account");
    };

    const handleSignUp = async(event) => {
        event.preventDefault(); 
        setError(""); 

        try {
        const response = await fetch(`${backendUrl}/register`, { //"/register"
            method: "POST",
            headers:{"Content-Type": "application/json"}, 
            body: JSON.stringify({email, password}),
            credentials: "include"
        });     
        if (response.ok) {
        const result = await response.json(); 
        console.log(result); 
        setUser(result.user);   
        navigate("/main");   
        } else {
        setError(result.error || "Register failed.");     
        }    
        console.log("Server Response:", result); //
        } catch (error) {
        console.error(error); 
        setError("An error occured. Please check the console for details.")    
        }
    }; 

    function handleGoogleSignUp (){
    const backendUrl = process.env.NODE_ENV === "production"
      ? "https://todolist-nonb.onrender.com/auth/google"
      : "http://localhost:3000/auth/google";
      
      window.location.href = backendUrl; 
    }; 

    const handleInternetSignUp = async () => {
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
    <div className="register-container">
    <div className="register-box">
      <h2>{greeting}</h2>

      <form className="register-form" onSubmit={handleSignUp}>
        <input type="text" placeholder="Full Name" onChange={changeGreeting} required />
        <input type="email" placeholder="Email" value={email} onChange={(event)=>{setEmail(event.target.value)}}required />
        <input type="password" placeholder="Password" value={password} onChange={(event)=>{setPassword(event.target.value)}} required />
        <button type="submit" className="register-button">Sign Up</button>
      </form>

      <div className="oauth-options">
        <button className="ii-button" onClick={handleInternetSignUp}><AllInclusiveIcon fontSize="small" /> Internet Identity</button>
        <button className="google-button" onClick={handleGoogleSignUp}><GoogleIcon fontSize="small"/> Google Account</button>
        {/* <GoogleLogin onSuccess={handleGoogleSignUp} /> */}
      </div>

      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  </div>
    );
  }; 
  
  export default Register;
  