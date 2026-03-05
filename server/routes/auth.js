const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Auth server is running',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'set' : 'not set',
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'set' : 'not set',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'not set'
    }
  });
});

// Current user endpoint
router.get('/current-user', (req, res) => {
  console.log('Current user check - isAuthenticated:', req.isAuthenticated());
  console.log('Current user check - session:', req.session);
  console.log('Current user check - user:', req.user);
  
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

// Test OAuth strategies
router.get('/test-strategies', (req, res) => {
  const strategies = passport._strategies;
  const strategyNames = Object.keys(strategies);
  res.json({
    message: 'OAuth strategies test',
    strategies: strategyNames,
    google: strategyNames.includes('google'),
    github: strategyNames.includes('github')
  });
});

// Simple OAuth test
router.get('/google-test', (req, res) => {
  console.log('Google test route hit');
  res.json({ message: 'Google test route works', redirecting: true });
});

router.get('/github-test', (req, res) => {
  console.log('GitHub test route hit');
  res.json({ message: 'GitHub test route works', redirecting: true });
});

const users = {}; // email -> { id, email, name, passwordHash }
let nextUserId = 1;

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (users[email]) return res.status(409).json({ error: 'User exists' });
  const hashed = await bcrypt.hash(password, 10);
  const id = String(nextUserId++);
  users[email] = { id, email, name, passwordHash: hashed };
  res.json({ id, email, name });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const u = users[email];
  if (!u) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ id: u.id, email: u.email, name: u.name });
});

router.post('/logout', (req, res) => {
  res.sendStatus(200);
});

// Google OAuth routes
router.get('/google', (req, res, next) => {
  console.log('Google OAuth route hit');
  try {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Google OAuth failed' });
  }
});

router.get('/google/callback', (req, res, next) => {
  console.log('Google OAuth callback hit');
  passport.authenticate('google', { failureRedirect: '/login' }, (err, user) => {
    if (err) {
      console.error('Google callback error:', err);
      return res.redirect('/login?error=auth_failed');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Google login error:', err);
        return res.redirect('/login?error=login_failed');
      }
      console.log('Google login successful for user:', user.email);
      res.redirect('/');
    });
  })(req, res, next);
});

// GitHub OAuth routes
router.get('/github', (req, res, next) => {
  console.log('GitHub OAuth route hit');
  try {
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'GitHub OAuth failed' });
  }
});

router.get('/github/callback', (req, res, next) => {
  console.log('GitHub OAuth callback hit');
  passport.authenticate('github', { failureRedirect: '/login' }, (err, user) => {
    if (err) {
      console.error('GitHub callback error:', err);
      return res.redirect('/login?error=auth_failed');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('GitHub login error:', err);
        return res.redirect('/login?error=login_failed');
      }
      console.log('GitHub login successful for user:', user.email);
      res.redirect('/');
    });
  })(req, res, next);
});

module.exports = router;
