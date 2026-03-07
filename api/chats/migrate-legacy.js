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

// Migrate legacy endpoint
app.post('/api/chats/migrate-legacy', (req, res) => {
  // Placeholder for migration logic
  res.json({ message: 'Migration completed', migrated: 0 });
});

module.exports = (req, res) => {
  app(req, res);
};
