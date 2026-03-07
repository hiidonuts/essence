import express from 'express';
import cors from 'cors';

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

export default (req, res) => {
  app(req, res);
};
