import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link} from "react-router-dom"; 
//use React Router to handle switching between pages
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
const backendUrl = import.meta.env.MODE === "production"  // "development" or "production"
? import.meta.env.VITE_BACKEND_URL //Render URL
: "http://localhost:3000";  //local testing 

//fetch user session on mount
useEffect(() => {
    fetch(`${backendUrl}/auth/session`, { credentials: "include" }) 
       .then(res => {
         if (!res.ok) {
          //Handle error here
          console.error("Failed to fetch session:", res.status);
         return null;
       }
         return res.json();
       })
       .then(data => {
         if (data.user) setUser(data.user);
        })
        .catch(err => console.error("Session fetch error:", err));
    }, []);

//fetch only the logged-in users
useEffect(() => {
  if (user) {
    fetch(`${backendUrl}/main`, { credentials: "include" })
      .then(res => {
        if (!res.ok) {
          console.error("Failed to fetch notes:", res.status);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setNotes(data);
        } else if (data?.notes && Array.isArray(data.notes)) {
          setNotes(data.notes);
        } else {
          console.warn("Unexpected response format:", data);
          setNotes([]); // fallback: don't crash the app
        }
      })
      .catch(err => console.error("Error fetching notes:", err));
  }
}, [user]);
  
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
     .then(res => res.json()) //backend converts HTTP res JSON objects to JS array 
     .then(() => { //now React receives and can use it
       setNotes(prevNotes => {
         return [...prevNotes, newNote];
       });
     }); 
   }

   function deleteNote(id) {
    fetch(`${backendUrl}/main?id=${id}`, { 
       method: "DELETE",
      credentials: "include", 
     })
     .then(res => res.json())
    .then(()=> {
      setNotes(prevNotes => {
        return (prevNotes.filter(note => note.id !== id))})
     }); 
   }

  return (
    <Router>
       <Header />

       <Routes>
         {/* Portal Page */ }
         <Route path="/" element={<Portal />} /> 

         {/* Authentication Pages */}
         <Route path="/login" element={<Login setUser={setUser} />} />
         <Route path="/register" element={<Register setUser={setUser} />} />
         {/* Main To-Do List Page */}
         <Route path="/main" element={user? ( 
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
          </>) : (<Link to="/register"/>)
          } /> 

       </Routes>

       <Footer />
      </Router>
   );
   }; 

export default App;

