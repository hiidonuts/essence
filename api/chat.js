const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://essence-silk.vercel.app' 
    : 'http://localhost:5173',
  credentials: true
}));

// In-memory storage (same as server/routes/chats.js)
const threads = {}; // { threadId: { id, title, messages: [{id, sender, content, timestamp}], createdAt, updatedAt } }
let nextThreadId = 1;
let nextMessageId = 1;

function getUserId(req) {
  return req.headers['x-user-id'] || 'anonymous';
}

// Chat endpoints (redirect to /api/chats)
app.get('/api/chat', (req, res) => {
  const userId = getUserId(req);
  const list = Object.values(threads).filter(t => t.user === userId);
  res.json(list);
});

app.post('/api/chat', (req, res) => {
  const userId = getUserId(req);
  const id = String(nextThreadId++);
  const thread = { id, user: userId, title: req.body.title || 'Untitled', messages: [], createdAt: new Date(), updatedAt: new Date() };
  threads[id] = thread;
  res.json(thread);
});

module.exports = (req, res) => {
  app(req, res);
};
