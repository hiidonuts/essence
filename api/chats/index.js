import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { getThreads, getNextThreadId, getNextMessageId } from '../shared/data.js';

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://essence-silk.vercel.app' 
    : 'http://localhost:5173',
  credentials: true
}));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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

// Add message to chat with AI response
app.post('/api/chats/:threadId/messages', async (req, res) => {
  try {
    const userId = getUserId(req);
    const threads = getThreads();
    const thread = threads[req.params.threadId];
    
    if (!thread) return res.sendStatus(404);
    if (thread.user !== userId) return res.sendStatus(403);
    
    const userMsg = { id: String(getNextMessageId()), sender: userId, content: req.body.content, timestamp: new Date() };
    thread.messages.push(userMsg);
    
    // Prepare messages for AI API
    const messagesForAI = thread.messages.map(msg => ({
      role: msg.sender === userId ? 'user' : 'assistant',
      content: msg.content
    }));
    
    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://essence-silk.vercel.app'
      },
      body: JSON.stringify({
        model: 'liquid/lfm-2.5-1.2b-thinking:free',
        messages: messagesForAI,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenRouter API Error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'Error calling AI API'
      });
    }
    
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (aiResponse) {
      const aiMsg = { id: String(getNextMessageId()), sender: 'ai', content: aiResponse, timestamp: new Date() };
      thread.messages.push(aiMsg);
    }
    
    thread.updatedAt = new Date();
    res.json({ userMessage: userMsg, aiResponse: data });
    
  } catch (error) {
    console.error('Message API error:', error);
    res.status(500).json({ error: 'Message API error', details: error.message });
  }
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
