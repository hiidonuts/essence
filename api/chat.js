import express from 'express';
import cors from 'cors';
import { getThreads, getNextThreadId, getNextMessageId } from '../shared/data.js';

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://essence-silk.vercel.app' 
    : 'http://localhost:5173',
  credentials: true
}));

function getUserId(req) {
  return req.headers['x-user-id'] || 'anonymous';
}

// Chat endpoints (redirect to /api/chats)
app.get('/api/chat', (req, res) => {
  const userId = getUserId(req);
  const threads = getThreads();
  const list = Object.values(threads).filter(t => t.user === userId);
  res.json(list);
});

app.post('/api/chat', (req, res) => {
  const userId = getUserId(req);
  const id = String(getNextThreadId());
  const threads = getThreads();
  const thread = { id, user: userId, title: req.body.title || 'Untitled', messages: [], createdAt: new Date(), updatedAt: new Date() };
  threads[id] = thread;
  res.json(thread);
});

export default (req, res) => {
  app(req, res);
};
