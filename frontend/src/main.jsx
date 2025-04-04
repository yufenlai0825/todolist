import React from "react";
import ReactDOM from "react-dom/client"; 
import { GoogleOAuthProvider } from "@react-oauth/google"; //user-side Google OAuth
import App from "@/App";
import "@/style.css";

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
        //ensures that any component using Google Login (e.g., Login.jsx) can access the OAuth API
        // Vite exposes environment variables through import.meta.env for the frontend code
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <App />
        </GoogleOAuthProvider>  
);


