import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { getThreads, getNextThreadId, getNextMessageId } from '../../api/shared/data.js';

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

// Chat endpoints with AI integration
app.get('/api/chat', (req, res) => {
  const userId = getUserId(req);
  const threads = getThreads();
  const list = Object.values(threads).filter(t => t.user === userId);
  res.json(list);
});

app.post('/api/chat', async (req, res) => {
  try {
    console.log('Chat API called with body:', req.body);
    const { messages, title } = req.body;
    const userId = getUserId(req);
    const id = String(getNextThreadId());
    const threads = getThreads();
    
    console.log('OPENROUTER_API_KEY:', OPENROUTER_API_KEY ? 'set' : 'not set');
    
    // If messages are provided, get AI response
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log('Last message:', lastMessage);
      
      // Call OpenRouter API
      console.log('Calling OpenRouter API...');
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://essence-silk.vercel.app'
        },
        body: JSON.stringify({
          model: 'liquid/lfm-2.5-1.2b-thinking:free',
          messages: messages,
          temperature: 0.7
        })
      });
      
      console.log('OpenRouter response status:', response.status);
      
      const data = await response.json();
      console.log('OpenRouter response data:', data);
      
      if (!response.ok) {
        console.error('OpenRouter API Error:', data);
        return res.status(response.status).json({ 
          error: data.error?.message || 'Error calling AI API'
        });
      }
      
      const aiResponse = data.choices?.[0]?.message?.content;
      console.log('AI Response:', aiResponse);
      
      if (aiResponse) {
        // Create thread with user message and AI response
        const thread = {
          id,
          user: userId,
          title: title || lastMessage?.content?.substring(0, 50) + '...' || 'New Chat',
          messages: [
            {
              id: String(getNextMessageId()),
              content: lastMessage.content,
              sender: 'user',
              timestamp: new Date()
            },
            {
              id: String(getNextMessageId()),
              content: aiResponse,
              sender: 'ai',
              timestamp: new Date()
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        threads[id] = thread;
        
        return res.json({
          ...thread,
          aiResponse: data // Return the full OpenRouter response
        });
      }
    }
    
    // Create empty thread if no messages
    const thread = { 
      id, 
      user: userId, 
      title: title || 'New Chat', 
      messages: [], 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    threads[id] = thread;
    res.json(thread);
    
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Chat API error', details: error.message });
  }
});

export default (req, res) => {
  app(req, res);
};
