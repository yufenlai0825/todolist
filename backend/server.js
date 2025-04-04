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
const port = process.env.PORT || 3000; //alternatively use Render's assigned port
const saltRounds = 10; 
const PgSession = pgSession(session); 
const db = new pg.Pool({  
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false },  
});
const frontendURL = process.env.FRONTEND_URL; 
const isProduction = process.env.NODE_ENV === "production"; //for dev testing, add secure and httpOnly inside cookie
const corsOptions = {
  origin: ["http://localhost:5173", frontendURL], // allow both frontend localhost and URL
  credentials: true // allow cookies & authentication headers
};
env.config();

app.use(cors(corsOptions)); // during dev allow web pages making requests across different origins
app.use(express.json()); // enable JSON parsing e.g. req.body
app.use(session({
    store: new PgSession({
        pool: db,
        tableName: "session", //store in session table
        pruneSessionInterval: 60, // clean expired sessions every 60s
    }), 
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge : 24 * 60 * 60 * 1000,
        sameSite: "none", //cross-site cookies
        secure: isProduction // false in dev and true in production
    }
})); 

app.use(passport.initialize()); 
app.use(passport.session()); 

// Passport local strategy
passport.use("local", new Strategy(async function verify(username, password, cb){
  try {
  const result = await db.query("SELECT * FROM listusers WHERE email = $1", [username]);    
  const user = result.rows[0];
  if (!user) return cb(null, false, { message: "User not found" });
    const storedHashedPassword = user.password;
    bcrypt.compare(password, storedHashedPassword, (err, valid) => {
      if (err) return cb(err); 
      if (valid) {
        return cb(null, user); 
      } else {
        return cb(null, { message: "Incorrect password" })
      } 
    }); 
  } catch (err) {
  console.log(err); 
  return cb(err); 
  }
})); 

// Passport Google OAuth strategy
passport.use("google", new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/main",   //both call back URLs registered on Google thus use relative route
}, async(accessToken, refreshToken, profile, cb) => {

  const googleEmail = profile._json.email;
  try {
  const result = await db.query("SELECT * FROM listusers WHERE email = $1", [googleEmail]);
  let user = result.rows[0]; 

  if (!user) {
  const newUser = await db.query("INSERT INTO listusers (email, password) VALUES ($1, $2) RETURNING *", [googleEmail, "Google"]);
  return cb(null, newUser.rows[0]);   
  } else {
  return cb(null, user);  
  } 
  } catch (err) {
  console.log(err); 
  return cb(err); 
  }

})); 

passport.serializeUser(function (user, cb){
  return cb(null, {user_id: user.id}); 
}); 
passport.deserializeUser(function(user, cb){
  return cb(null, user);
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


// check if user is logged in
app.get("/auth/session", (req, res) => {
  if (req.isAuthenticated()) {
      res.json({ user: req.user });
  } else {
      res.json({ user: null });
  }
});

app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return res.status(500).json({ error: "Login error" });
        if (!user) return res.status(401).json({ message: info.message });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: "Login failed" });
            return res.json({ message: "Login successful", user });
        });
    })(req, res, next);
});

app.post("/register", async (req, res) => {
        const { email, password } = req.body; 
      
        try {
          const checkResult = await db.query("SELECT * FROM listusers WHERE email = $1", [
            email,
          ]);

          if (checkResult.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(password, saltRounds); 
            const result = await db.query("INSERT INTO listusers (email, password) VALUES ($1, $2) RETURNING *", [email, hashedPassword]);
            const user = result.rows[0]; 
            req.login(user, (err) => {
              if(err) return(res.status(500).json({ error: "Login failed after registration" })); 
              res.json({ message : "Successfully registered!", user})
            }); 
          } else {
            return res.status(400).json({ error: "Already registered. Please log-in" });
          }

        } catch (err) {
          console.log(err);
          res.status(500).json({ error: "Internal server error" });
        }
      });

// update of notes inside /main
// fetch notes for a specific user
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
  
// add a new note 
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

// delete a note 
app.delete("/main", async (req, res) => {
    if (req.isAuthenticated()) {
        const { id } = req.query;
        try {
        const result = await db.query("DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *", [id, req.user.user_id]);
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

// logout route
app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) return res.status(500).json({ error: "Logout failed" });
      // else
      req.session.destroy((err) => {
        if(err) return res.status(500).json({ error: "Session destruction failed" });

        res.clearCookie("connect.sid"); //clear cookie in browser too
        res.json({ message: "Logout successful" });
      }); 
    });
  });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });