const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

console.log('Server starting up...');
console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'set' : 'not set');
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'set' : 'not set');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'set' : 'not set');

// Initialize Passport with error handling
try {
  console.log('Loading passport configuration...');
  require('./passportConfig')(passport);
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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chats', require('./routes/chats'));

// Debug: Check registered strategies
console.log('Registered strategies:', Object.keys(passport._strategies || {}));

// Export for Vercel serverless function
module.exports = app;
