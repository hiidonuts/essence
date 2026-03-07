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

// Get all chats for user
app.get('/api/chats', (req, res) => {
  const userId = getUserId(req);
  const threads = getThreads();
  const list = Object.values(threads).filter(t => t.user === userId);
  res.json(list);
});

// Create new chat
app.post('/api/chats', (req, res) => {
  const userId = getUserId(req);
  const id = String(getNextThreadId());
  const threads = getThreads();
  const thread = { id, user: userId, title: req.body.title || 'Untitled', messages: [], createdAt: new Date(), updatedAt: new Date() };
  threads[id] = thread;
  res.json(thread);
});

// Add message to chat
app.post('/api/chats/:threadId/messages', (req, res) => {
  const userId = getUserId(req);
  const threads = getThreads();
  const thread = threads[req.params.threadId];
  if (!thread) return res.sendStatus(404);
  if (thread.user !== userId) return res.sendStatus(403);
  const msg = { id: String(getNextMessageId()), sender: userId, content: req.body.content, timestamp: new Date() };
  thread.messages.push(msg);
  thread.updatedAt = new Date();
  res.json(msg);
});

// Get specific chat
app.get('/api/chats/:threadId', (req, res) => {
  const threads = getThreads();
  const thread = threads[req.params.threadId];
  if (!thread) return res.sendStatus(404);
  res.json(thread);
});

// Migrate legacy endpoint (placeholder)
app.post('/api/chats/migrate-legacy', (req, res) => {
  // Placeholder for migration logic
  res.json({ message: 'Migration completed', migrated: 0 });
});

export default (req, res) => {
  app(req, res);
};
