const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/essence', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Initialize Passport with error handling
try {
  console.log('Loading passport configuration...');
  require('../../server/passportConfig')(passport);
  console.log('Passport configuration loaded successfully');
} catch (error) {
  console.error('Passport configuration error:', error);
}

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://essence-silk.vercel.app' 
    : 'http://localhost:5173',
  credentials: true
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// User endpoint
app.get('/api/auth/user', (req, res) => {
  console.log('User endpoint check - isAuthenticated:', req.isAuthenticated());
  console.log('User endpoint check - session:', req.session);
  console.log('User endpoint check - user:', req.user);
  
  if (req.isAuthenticated()) {
    res.json({ 
      user: req.user,
      authenticated: true 
    });
  } else {
    res.json({ 
      user: null,
      authenticated: false 
    });
  }
});

module.exports = (req, res) => {
  app(req, res);
};
