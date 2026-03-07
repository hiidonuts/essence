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

console.log('Server starting up...');
console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'set' : 'not set');
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'set' : 'not set');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'set' : 'not set');

// Initialize Passport with error handling
try {
  console.log('Loading passport configuration...');
  require('./passportConfig.js')(passport);
  console.log('Passport configuration loaded successfully');
  console.log('Registered strategies after config:', Object.keys(passport._strategies || {}));
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

app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/chats', require('./routes/chats.js'));

// Debug: Check registered strategies
console.log('Registered strategies:', Object.keys(passport._strategies || {}));

// For Vercel serverless functions, we need to export the handler
module.exports = (req, res) => {
  app(req, res);
};
