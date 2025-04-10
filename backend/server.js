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
env.config();

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
  origin: function(origin, callback) {
    const allowedOrigins = [frontendURL, "http://localhost:5173"];
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
};

app.set("trust proxy", 1); // required to support secure cookies over HTTPS
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
        sameSite: isProduction? "none" : "lax",  //cross-site cookies for prod/ default for dev
        secure: isProduction // false in dev and true in production
    }
})); 

app.use(passport.initialize()); 
app.use(passport.session()); 

// Passport local strategy
passport.use("local", new Strategy({
  usernameField: "email",
  passwordField: "password"
}, async function verify(email, password, cb){
  try {
    console.log(`logging in ....${email}`)
  const result = await db.query("SELECT * FROM listusers WHERE email = $1", [email]);    
  const user = result.rows[0];
  if (!user) return cb(null, false, { message: "User not found" });

    const storedHashedPassword = user.password;
    bcrypt.compare(password, storedHashedPassword, (err, valid) => {
      if (err) return cb(err); 
      if (valid) {
        return cb(null, user); 
      } else {
        return cb(null, false, { message: "Incorrect password" })
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
  callbackURL: process.env.NODE_ENV === 'production' 
    ? process.env.GOOGLE_CALLBACK_URL 
    : process.env.GOOGLE_CALLBACK_URL_LOCAL   
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
passport.deserializeUser(async (serializedUser, cb) => { //re-fetch full user from db 
  try {
    const id = serializedUser.user_id; 
    const result = await db.query("SELECT * FROM listusers WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return cb(null, false);
    }; 
    cb(null, result.rows[0]); 
  } catch (err) {
    console.error("Deserialization error:", err);
    cb(err); 
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
      // console.log(`called ...${req.body.email}`);
        if (err) return res.status(500).json({ error: "Login error", message: err.message });
        if (!user) return res.status(401).json({ message: info.message });

        req.login(user, (err) => {
            if (err) return res.status(500).json({ error: "Login failed", message: info.message });
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
              if(err) return(res.status(500).json({ error: "Login failed after registration", message: err.message })); 
              res.json({ message : "Successfully registered!", user})
            }); 
          } else {
            return res.status(400).json({ error: "Already registered. Please log-in" });
          }

        } catch (err) {
          console.log(err);
          res.status(500).json({ error: "Internal server error", message: err.message });
        }
      });

// update of notes inside /main
// fetch notes for a specific user
app.get("/main", async (req, res) => {
    console.log(req.user); // log-in full user for debugging

    if (req.isAuthenticated()) {
        try {
            const result = await db.query("SELECT * FROM notes WHERE user_id = $1", [req.user.id]);
            res.json(result.rows); //send back JSON to frontend 
            } catch (err) {
            console.error("Error fetching task:", err); 
            res.status(500).json({ error: "Internal Server Error", message: err.message });       
            } 
    } else {
    return res.status(401).json({ error: "Unauthorized" });   
    }
  });
  
// add a new note 
app.post("/main", async (req, res) => {
    console.log(req.user); 

    if (req.isAuthenticated()) {
        const { title, content } = req.body;
        const user_id = req.user.id; 
        try {
        const newNote = await db.query("INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *", [user_id, title, content]);
        res.json({ message: "Task added!" , note: newNote.rows[0]});
        } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ error: "Failed to add task", message: error.message });
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
        const result = await db.query("DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *", [id, req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error : "Task not found!" });

        res.json({message: "Task removed!"}); 

        } catch (error) {
        console.error("Error removing task:", error);   
        res.status(500).json({ error: "Failed to remove task", message: error.message }); 
        }    
    } else {
        return res.status(401).json({ error: "Unauthorized" });  
    }
}); 

// logout route
app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) return res.status(500).json({ error: "Logout failed", message: err.message });
      // else
      req.session.destroy((err) => {
        if(err) return res.status(500).json({ error: "Session destruction failed", message: err.message });

        res.clearCookie("connect.sid"); //clear cookie in browser too
        res.json({ message: "Logout successful" });
      }); 
    });
  });

// global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Server error", 
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});  


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});