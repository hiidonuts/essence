import express from 'express';
import cors from 'cors';
import { getThreads } from '../shared/data.js';

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://essence-silk.vercel.app' 
    : 'http://localhost:5173',
  credentials: true
}));

// Get specific chat thread
app.get('/api/chats/:id', (req, res) => {
  const threads = getThreads();
  const thread = threads[req.params.id];
  if (!thread) return res.sendStatus(404);
  res.json(thread);
});

export default (req, res) => {
  app(req, res);
};
