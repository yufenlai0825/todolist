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
- Authentication: Passport.js (Local, Google OAuh 2.0, Internet Identity), bcrypt
- Version control: Git & GitHub
- Deployment: Render

📦 Installation

- Set up environment variables: 

inside frontend folder, create .env file with: 
VITE_BACKEND_URL=your_backend_url
VITE_GOOGLE_CLIENT_ID=your_client_id

inside backend folder, create .env file with:
DATABASE_URL=your_db_url
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_google_cb_url
GOOGLE_CALLBACK_URL_LOCAL=your_google_cb_url_localhost
SESSION_SECRET=your_session_secret
FRONTEND_URL=your_frontend_url

- Install dependencies by npm install. Users can run the app locally by npm start (backend from /backend folder) and npm run build (frontend from /frontend folder). 

- The app will then run on http://localhost:5173 and use http://localhost:3000 as the API server. 


📜 Acknowledgment + License
- This project is open-source and available under the MIT License.
