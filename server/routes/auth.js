const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();

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
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to the app
    res.redirect('/');
  }
);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to the app
    res.redirect('/');
  }
);

module.exports = router;
