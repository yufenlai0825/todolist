import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom"; 
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Note from "@/components/Note";
import CreateArea from "@/components/CreateArea";
import Portal from "@/pages/Portal"; 
import Login from "@/pages/Login";
import Register from "@/pages/Register"; 


function App() {
const [notes, setNotes] = useState([]);
const [user, setUser] = useState(null); //store logged-in users
const [error, setError] = useState(null); 
const [loading, setLoading] = useState(true);

const backendUrl = import.meta.env.MODE === "production"  // "development" or "production"
? import.meta.env.VITE_BACKEND_URL 
: "http://localhost:3000";  

//fetch user session on mount
useEffect(() => {

  setLoading(true); // start loading

  setTimeout(() => {
    fetch(`${backendUrl}/auth/session`, { method: "GET", credentials: "include" }) 
    .then(res => { return res.ok ? res.json() : null})
    .then(data => 
     {
      if (data?.user) {
       setUser(data.user);  // make sure data is not null so it does not crash
      } else {
       console.log("No user found in session");
      }
      setLoading(false); // end loading regardless of result  
     })
     .catch(err => {
       console.error("Session fetch error:", err); 
       setLoading(false); // end loading on error
     }); 
  }, 500) // 500ms delay to ensure session is ready

    }, [backendUrl]); //fetching from the new URL to adapt e.g. switching between dev and prod

//fetch only the logged-in users
useEffect(() => {
  if (user) {
    fetch(`${backendUrl}/main`, { method: "GET", credentials: "include" }) //include cookies like sid
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setNotes(data);
        } else {
          console.warn("Unexpected response format:", data);
          setNotes([]); // fallback: don't crash the app
        }
        setError(null); 
      })
      .catch(err => {
        console.error("Error fetching notes:", err); //"Error fetching notes: Error: `Failed to fetch notes: ${res.status}`"
        setError(err.message)}); // `Failed to fetch notes: ${res.status}`
      }}, [user, backendUrl]); 
  
   function addNote(newNote) {

   fetch(`${backendUrl}/main`, {
      method: "POST", 
      headers: {"Content-Type": "application/json"}, 
      credentials: "include", //thus backend can identify the logged-in user via req.user.id
      body:JSON.stringify({
       title: newNote.title,
        content: newNote.content
      }),
    })
     .then(res => {
      if (!res.ok) throw new Error("Unauthorized or add note failed");
      return res.json();
    })  
     .then(data => { 
      if (data && data.note) {
        setNotes(prevNotes => [...prevNotes, data.note]);
      } else {
        // fallback to client-generated note if server doesn't return the created note
        console.warn("Server didn't return note data, using client data");
        const tempNote = {...newNote, id: Date.now()};  // assign a random and unique id by using Date.now()
        setNotes(prevNotes => [...prevNotes, tempNote]);
      }; 
     }).catch(err => {
      console.error("Add note error:", err);
      setError(err.message);
    });
   }

   function deleteNote(id) {
    fetch(`${backendUrl}/main?id=${id}`, { 
       method: "DELETE",      
      credentials: "include", 
     })
     .then(res => {
      if (!res.ok) throw new Error("Unauthorized or delete failed"); //skips the second .then() and looks for a .catch() to handle the error
      return res.json(); // { message: "Task removed!"} from server
    })
    .then((data)=> {   // parsed { message: "Task removed!"} 
      setNotes(prevNotes => {
        console.log(data.message); // "Task removed!"
        return (prevNotes.filter(note => note.id !== id))});
        setError(null); 
     }).catch(err => {
      console.error("Delete note error:", err); // "Delete note error: Error: Unauthorized or delete failed"
      setError(err.message); // Unauthorized or delete failed
   }) 
   }

  return (
    <Router>
       <Header user={user} setUser={setUser} />

       {error && (
        <div style={{ 
          backgroundColor: "#ffdddd", 
          color: "#ff0000", 
          padding: "10px", 
          margin: "10px 0", 
          borderRadius: "5px" 
        }}>
          Error: {error}
        </div>
      )}

       <Routes>
         {/* Portal Page */ }
         <Route path="/" element={<Portal />} /> 

         {/* Authentication Pages */}
         <Route path="/login" element={<Login setUser={setUser} />} />
         <Route path="/register" element={<Register setUser={setUser} />} />
         {/* Main To-Do List Page */}
         <Route path="/main" element={
          loading ? (
            <div>Loading...</div> // Show loading indicator while checking session
          ) : user? ( 
          <> 
          <CreateArea onAdd={addNote} />
          {Array.isArray(notes) && notes.map((note) => ( 
            <Note
            key={note.id} 
            id={note.id}
            title={note.title}
            content={note.content}
            onDelete={deleteNote}
           /> 
          ))}
          </>) : (<Navigate to="/register" replace />
          )
          } /> 

       </Routes>

       <Footer />
      </Router>
   );
   }; 

export default App;

