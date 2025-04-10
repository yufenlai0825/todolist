📝 To Do List App


This is a full-stack To Do List application that enables users to register, log in, and manage their personal tasks securely.

Live Demo on Render: https://todolist-frontend-vlgb.onrender.com

Give it a try! 


📌 Features

User Authentication

- Local username/password login (with Passport.js)
- Internet Identity login (powered by Dfinity)

Personal Task Management
- Add, delete, and view your own to-do cards after login

Session Management
- Secure sessions via PostgreSQL-backed session store
- Cookie-based session handling, works in both development and production environments


🛠️ Tech Stack
- Frontend: React
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Security: The app uses sameSite and secure cookie options based on environment mode
- Authentication: Passport.js (Local & Internet Identity)
- Version control:  Git & GitHub
- Deployment: Render


🧪 In Development
Google OAuth Integration
- Support for logging in with Google is actively being developed and will be added in the next version.


Install dependencies by npm install. Users can run the app locally by npm start (backend from /backend folder) and npm run dev (frontend from /frontend folder). 
The app will then run on http://localhost:5173 and use http://localhost:3000 as the API server. 


📜 Acknowledgment + License
- This project is open-source and available under the MIT License.
