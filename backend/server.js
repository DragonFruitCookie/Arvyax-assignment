import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wellness';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema provided in assignment
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Session Schema from assignment 
const sessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  tags: [String],
  json_file_url: String,
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Add a test route
app.get('/', (req, res) => {
  res.json({ message: 'API is running successfully' });
});

// ROUTES:

// Register user
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password_hash });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 'Get' public sessions
app.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find({ status: 'published' })
      .populate('user_id', 'email')
      .sort({ created_at: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 'Get' user's own sessions
app.get('/my-sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find({ user_id: req.userId })
      .sort({ updated_at: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 'Get' single user session
app.get('/my-sessions/:id', authenticateToken, async (req, res) => {
  try {
    const session = await Session.findOne({ 
      _id: req.params.id, 
      user_id: req.userId 
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save draft
app.post('/my-sessions/save-draft', authenticateToken, async (req, res) => {
  try {
    const { id, title, tags, json_file_url } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    let session;
    if (id) {
      session = await Session.findOneAndUpdate(
        { _id: id, user_id: req.userId },
        { 
          title, 
          tags: tagsArray, 
          json_file_url, 
          updated_at: new Date() 
        },
        { new: true }
      );
    } else {
      session = new Session({
        user_id: req.userId,
        title,
        tags: tagsArray,
        json_file_url,
        status: 'draft'
      });
      await session.save();
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Publish session
app.post('/my-sessions/publish', authenticateToken, async (req, res) => {
  try {
    const { id, title, tags, json_file_url } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    
    let session;
    if (id) {
      session = await Session.findOneAndUpdate(
        { _id: id, user_id: req.userId },
        { 
          title, 
          tags: tagsArray, 
          json_file_url, 
          status: 'published',
          updated_at: new Date() 
        },
        { new: true }
      );
    } else {
      session = new Session({
        user_id: req.userId,
        title,
        tags: tagsArray,
        json_file_url,
        status: 'published'
      });
      await session.save();
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log(`CORS enabled for http://localhost:3000`);
});