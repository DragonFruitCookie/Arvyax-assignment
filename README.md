# 🌿 Wellness Session Platform
!!!THIS README IS GENERATED WITH THE HELP OF CHATGPT!!!

A simple full-stack application for managing wellness sessions with authentication, drafts, and auto-save functionality.

## 🛠 Tech Stack
- **Frontend:** React.js with Vite
- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT + bcrypt
- **Styling and css:** ChatGPT

## 📁 Project Structure
```
wellness-platform/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .env.example
└── README.md
```

## 🚀 Setup Instructions

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd wellness-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```bash
PORT=5001
JWT_SECRET=your-super-secret-jwt-key-here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wellness-platform
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` and backend on `http://localhost:5001`.

## 📡 API Routes

### Authentication
- `POST /register` - User registration
- `POST /login` - User login

### Sessions
- `GET /sessions` - Get all published sessions (public)
- `GET /my-sessions` - Get user's own sessions (protected)
- `GET /my-sessions/:id` - Get single user session (protected)
- `POST /my-sessions/save-draft` - Save or update draft session (protected)
- `POST /my-sessions/publish` - Publish a session (protected)

## ✨ Features

### Core Features ✅
- **Authentication:** Secure registration and login with JWT
- **Session Management:** View published wellness sessions
- **Draft System:** Create and save draft sessions
- **Publishing:** Publish sessions for public viewing
- **Auto-save:** Drafts auto-save after 5 seconds of inactivity
- **Protected Routes:** JWT middleware protects user-specific endpoints

### Database Schema

**User:**
```javascript
{
  _id: ObjectId,
  email: String,
  password_hash: String,
  created_at: Date
}
```

**Session:**
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  title: String,
  tags: [String],
  json_file_url: String,
  status: "draft" | "published",
  created_at: Date,
  updated_at: Date
}
```

## 🎯 How to Use

1. **Register/Login:** Create an account or login with existing credentials
2. **Dashboard:** View all published wellness sessions
3. **My Sessions:** View and manage your own sessions (drafts + published)
4. **Session Editor:** Create new sessions or edit existing ones
5. **Auto-save:** Your drafts are automatically saved while typing
6. **Publish:** Make your sessions available to all users

## 🔧 Development Notes

- All code is in single files as requested for simplicity
- Uses ES modules throughout
- JWT tokens stored in localStorage
- Auto-save implemented with 5-second debounce
- Simple inline styling for basic UI
- MongoDB Atlas connection ready

## 🌐 Environment Variables

Required environment variables (see `.env.example`):
- `PORT` - Server port (default: 5001)
- `JWT_SECRET` - Secret key for JWT signing
- `MONGODB_URI` - MongoDB Atlas connection string

