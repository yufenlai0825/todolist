import express from "express"; 
import session from "express-session"; 
import cors from "cors"; 
import pg from "pg"; 
import pgSession from "connect-pg-simple"; 
import bcrypt from "bcrypt"; 
import passport from "passport"; 
import { Strategy } from "passport-local"; 
import GoogleStrategy from "passport-google-oauth2"; 
import env from "dotenv"; 

const app = express(); 
const port = 3000; 
const saltRounds = 10; 
const PgSession = pgSession(session); 
const db = new pg.Pool({  
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false },  
});
const isProduction = process.env.NODE_ENV === "production"; //for dev testing, add secure and httpOnly inside cookie
const corsOptions = {
  origin: ["http://localhost:5173", "https://todolist-nonb.onrender.com"], // allow both local and deployed frontend
  credentials: true // allow cookies & authentication headers
};
env.config();

app.use(cors(corsOptions)); // during dev allow web pages making requests across different origins
app.use(session({
    store: new PgSession({
        pool: db,
        tableName: "session", //store in session table
    }), 
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge : 24 * 60 * 60 * 1000,
        secure: isProduction, // false in dev and true in production
        httpOnly: true,
    }
})); 

app.use(passport.initialize()); 
app.use(passport.session()); 
app.use(express.json()); // enable JSON parsing

// check if user is logged in
app.get("/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    } else {
        res.json({ user: null });
    }
});

// Google OAuth 
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/main",
  passport.authenticate("google", {failureRedirect: "/login",}), 
  (req, res) => res.json({ message: "Login successful", user: req.user }) //a user object is returned when login/register is successful
);

// local 
app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return res.status(500).json({ error: "Login error" });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: "Login failed" });
            res.json({ message: "Login successful", user });
        });
    })(req, res, next);
});


app.post("/register", async (req, res) => {
        const email = req.body.email;
        const password = req.body.password;
      
        try {
          const checkResult = await db.query("SELECT * FROM listusers WHERE email = $1", [
            email,
          ]);
      
          if (checkResult.rows.length > 0) {
            //React handles redirect by navigate
            // res.redirect("/login");
            return res.status(400).json({ error: "Already registered. Please log-in" });
          } else {
            const hashedPassword = await bcrypt.hash(password, saltRounds); 
            const result = await db.query("INSERT INTO listusers (email, password) VALUES ($1, $2) RETURNING *", [email, hashedPassword]); 
            const user = result.rows[0]; 
            req.login(user, (err) => {
                if (err) {
                return res.status(500).json({ error: "Login failed after registration" });
              }
              res.json({message: "Successfully registered!", user});
            }); 
          }
        } catch (err) {
          console.log(err);
          res.status(500).json({ error: "Internal server error" });
        }
      });
    
passport.use("local", new Strategy(async function verify(username, password, cb){
    try {
    const result = await db.query("SELECT * FROM listusers WHERE email = $1", [username]);    
    if (result.rows.length > 0) {
    const user = result.rows[0]; 
    const storedHashedPassword = user.password; 

    bcrypt.compare(password, storedHashedPassword, (err, valid) => {
        if (err) return cb(err); 
            if (valid) {
                return cb(null, user); 
            } else {
                return cb(null, false, { message: "Incorrect password" }); 
            } 
    });     
    } else {
        return cb(null, false, { message: "User not found" })
    }
    } catch (err) {
    console.log(err); 
    }
})); 

passport.use("google", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === "production"
    ? "https://todolist-nonb.onrender.com/auth/google/main"
    : "http://localhost:3000/auth/google/main",  // Local testing, 

}, async(profile, cb) => {
    const googleEmail = profile._json.email;
    try {
    const result = await db.query("SELECT * FROM listusers WHERE email = $1", [googleEmail]); 
    if (result.rows.length === 0) {
    const newUser = await db.query("INSERT INTO listusers (email, password) VALUES ($1, $2) RETURNING *", [googleEmail, "Google"]);
    return cb(null, newUser.rows[0]);   
    } else {
    return cb(null, result.rows[0]);  
    } 
    } catch (err) {
    console.log(err); 
    }

})); 

passport.serializeUser(function (user, cb){
    return cb(null, {user_id: user.id}); 
}); 
passport.deserializeUser(function(user, cb){
    return cb(null, user);
}); 

// CRUD of notes inside /main
// Fetch notes for a specific user
app.get("/main", async (req, res) => {
    console.log(req.user); // { user_id: user.id } from serializeUser

    if (req.isAuthenticated()) {
        try {
            const result = await db.query("SELECT * FROM notes WHERE user_id = $1", [req.user.user_id]);
            res.json(result.rows); //send back JSON to frontend 
            } catch (err) {
            console.error("Error fetching task:", err); 
            res.status(500).json({ error: "Internal Server Error" });       
            } 
    } else {
    return res.status(401).json({ error: "Unauthorized" });   
    }
  });
  
// Add a new note 
app.post("/main", async (req, res) => {
    console.log(req.user); // { user_id: user.id } from serializeUser

    if (req.isAuthenticated()) {
        const { title, content } = req.body;
        const user_id = req.user.user_id; 
        try {
        const newNote = await db.query("INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3)", [user_id, title, content]);
        res.json({ message: "Task added!" , note: newNote.rows[0]});
        } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ error: "Failed to add task" });
        }    
    } else {
    return res.status(401).json({ error : "Unauthorized" });
    }
  });
  
// Edit a note 
app.put("/main", async(req, res) => { 
    if (req.isAuthenticated()) {
        const { id, title, content } = req.body; 
        try {
          const result = await db.query("UPDATE notes SET title = $1, content = $2 WHERE id = $3 RETURNING *", [title, content, id]);
          if (result.rows.length === 0) return res.status(404).json({ error: "Task not found" }); 
          // else
          res.json({ message: "Task updated!", note: result.rows[0] });
          console.log(result); 
        } catch (err) {
          console.error("Error editing task:", err);
          res.status(500).json({ error: "Failed to update task" });
        }     
    } else {
        return res.status(401).json({ error: "Unauthorized" });
    }
  });   

// Delete a note 
app.delete("/main", async (req, res) => {
    if (req.isAuthenticated()) {
        const { id } = req.query;
        try {
        const result = await db.query("DELETE FROM notes WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error : "Task not found!" });

        res.json({message: "Task removed!"}); 

        } catch (error) {
        console.error("Error removing task:", err);   
        res.status(500).json({ error: "Failed to remove task" }); 
        }    
    } else {
        return res.status(401).json({ error: "Unauthorized" });  
    }
}); 

// Logout route
app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) return res.status(500).json({ error: "Logout failed" });
      // else
      res.json({ message: "Logout successful" });
    });
  });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });