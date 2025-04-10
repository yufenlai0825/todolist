import React, { useState } from "react";
import GoogleIcon from '@mui/icons-material/Google';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { Link, useNavigate } from "react-router-dom"; 
// import { GoogleLogin } from "@react-oauth/google"; //renders a button that handles authentication with Google's OAuth API
import { AuthClient } from "@dfinity/auth-client";
import "@/style.css";  

function Register({setUser}) {

    const navigate = useNavigate(); 
    const [greeting, setGreeting] = useState("Create Your Account"); 
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState(""); 
    const [err, setError] = useState(""); 
    const backendUrl = import.meta.env.MODE === "production"  
  ? import.meta.env.VITE_BACKEND_URL 
  : "http://localhost:3000"; 

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
        const result = await response.json(); 
         
        if (response.ok) {
        console.log(result); 
        setUser(result.user);   
        navigate("/main");   
        } else {
        setError(result.err || "Register failed.");     
        }    
        console.log("Server Response:", result); //
        } catch (err) {
        console.error(err); 
        setError("An error occured. Please check the console for details.")    
        }
    }; 

    function handleGoogleSignUp (){
      
   
    }; 

    const handleInternetSignUp = async () => {

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
  