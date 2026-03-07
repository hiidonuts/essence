import express from 'express';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import 'dotenv/config';

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

// Initialize Passport with error handling
try {
  console.log('Loading passport configuration...');
  import('../../server/passportConfig.js').then(passportConfig => {
    passportConfig.default(passport);
    console.log('Passport configuration loaded successfully');
  }).catch(error => {
    console.error('Passport configuration error:', error);
  });
} catch (error) {
  console.error('Passport configuration error:', error);
}

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

export default (req, res) => {
  app(req, res);
};
