import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';
import multer from 'multer';
import { Chat, User } from './models.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5175;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-chat';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
app.use(session({
  secret: process.env.SESSION_SECRET || 'essence-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.SERVER_URL || `http://localhost:${PORT}`}/api/auth/google/callback`,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('🔐 Google OAuth Callback Received');
    console.log('Profile Email:', profile.emails?.[0]?.value);
    let user = await User.findOne({ email: profile.emails[0].value });

    const profilePictureUrl = profile.photos?.[0]?.value || null;

    const displayName = profile.displayName || profile.emails?.[0]?.value?.split('@')[0] || null;

    if (user) {
      user.lastLogin = new Date();
      if (!user.oauthProvider) {
        user.oauthProvider = 'google';
        user.oauthId = profile.id;
      }
      if (profilePictureUrl) {
        user.profilePicture = profilePictureUrl;
      }
      if (displayName) user.displayName = displayName;
      await user.save();
    } else {
      user = new User({
        email: profile.emails[0].value,
        oauthProvider: 'google',
        oauthId: profile.id,
        profilePicture: profilePictureUrl,
        displayName: displayName,
        lastLogin: new Date()
      });
      await user.save();
    }

    done(null, user);
  } catch (err) {
    done(err);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.SERVER_URL || `http://localhost:${PORT}`}/api/auth/github/callback`,
  userProfileURL: 'https://api.github.com/user'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || `${profile.username}@github.placeholder`;
    const displayName = profile.displayName || profile.username || null;
    
    const profilePictureUrl = profile.photos?.[0]?.value || null;
    
    let user = await User.findOne({ email });

    if (user) {
      user.lastLogin = new Date();
      if (!user.oauthProvider) {
        user.oauthProvider = 'github';
        user.oauthId = profile.id;
      }
      if (profilePictureUrl) {
        user.profilePicture = profilePictureUrl;
      }
      if (displayName) user.displayName = displayName;
      await user.save();
    } else {
      user = new User({
        email,
        oauthProvider: 'github',
        oauthId: profile.id,
        profilePicture: profilePictureUrl,
        displayName: displayName,
        lastLogin: new Date()
      });
      await user.save();
    }

    done(null, user);
  } catch (err) {
    done(err);
  }
}));

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('💡 Make sure MongoDB is running locally or update MONGODB_URI in .env');
    process.exit(1);
  });

console.log('=== OAuth Configuration ===');
console.log('Google Callback URL:', `${process.env.SERVER_URL || `http://localhost:${PORT}`}/api/auth/google/callback`);
console.log('GitHub Callback URL:', `${process.env.SERVER_URL || `http://localhost:${PORT}`}/api/auth/github/callback`);
console.log('Client URL:', CLIENT_URL);
console.log('Server running on port:', PORT);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const confirmationCodes = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, chatId } = req.body;

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    let messagesToSend = messages;
    const preferences = req.user?.personalPreferences?.trim();
    if (preferences) {
      const systemContent = `You are Essence, a helpful AI assistant. The user has specified the following preferences for your responses. Consider these when responding, within your guidelines:\n\n${preferences}`;
      messagesToSend = [
        { role: 'system', content: systemContent },
        ...messages
      ];
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://localhost.com'
      },
      body: JSON.stringify({
        model: 'liquid/lfm-2.5-1.2b-thinking:free',
        messages: messagesToSend,
        temperature: 0.7
      })
    });
    
    console.log('OpenRouter response status:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', data);
      return res.status(response.status).json({ 
        error: data.error?.message || 'Error calling AI API'
      });
    }

    if (chatId) {
      const lastMessage = messages[messages.length - 1];
      const aiResponse = data.choices?.[0]?.message?.content;

      if (aiResponse && req.user) {
        const userId = req.user._id ? req.user._id.toString() : req.user.id;
        const chat = await Chat.findById(chatId);
        if (chat && chat.userId === userId) {
          const userMsg = {
            id: Date.now().toString(),
            content: lastMessage?.content || '',
            sender: lastMessage?.role === 'user' ? 'user' : 'ai',
            timestamp: new Date()
          };

          const updatePayload = {
            $push: {
              messages: [
                userMsg,
                {
                  id: (Date.now() + 1).toString(),
                  content: aiResponse,
                  sender: 'ai',
                  timestamp: new Date()
                }
              ]
            },
            $set: { updatedAt: new Date() }
          };

          if (chat.title === 'New Chat' && chat.messages.length === 0) {
            const titleFromMessage = userMsg.content.substring(0, 50).trim();
            updatePayload.$set.title = titleFromMessage || 'Chat';
          }

          await Chat.findByIdAndUpdate(chatId, updatePayload, { new: true });
        }
      }
    }

    res.json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'AI server error', details: err.message });
  }
});

app.post('/api/chats', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const chatId = Date.now().toString();
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const newChat = new Chat({
      _id: chatId,
      userId: userId,
      title: 'New Chat',
      messages: []
    });
    
    newChat.save()
      .then(chat => res.json({ id: chat._id, title: chat.title, messages: chat.messages }))
      .catch(err => {
        console.error('Error creating chat:', err);
        res.status(500).json({ error: 'Failed to create chat' });
      });
  } catch (err) {
    console.error('Error creating chat:', err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

app.get('/api/chats', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const userId = req.user._id ? req.user._id.toString() : req.user.id;
  Chat.find({ userId: userId })
    .select('_id title createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(20)
    .then(chats => res.json(chats))
    .catch(err => {
      console.error('Error fetching chats:', err);
      res.status(500).json({ error: 'Failed to fetch chats' });
    });
});

app.get('/api/chats/:chatId', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.user._id ? req.user._id.toString() : req.user.id;
  Chat.findById(req.params.chatId)
    .then(chat => {
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      if (chat.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      if (chat.messages && Array.isArray(chat.messages)) {
        chat.messages = chat.messages.map(msg => ({
          ...msg,
          sender: msg.sender || 'ai'
        }));
      }
      res.json(chat);
    })
    .catch(err => {
      console.error('Error fetching chat:', err);
      res.status(500).json({ error: 'Failed to fetch chat' });
    });
});

app.put('/api/chats/:chatId', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { title } = req.body;
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    if (chat.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      { title, updatedAt: new Date() },
      { new: true }
    );
    res.json(updatedChat);
  } catch (err) {
    console.error('Error updating chat:', err);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

app.delete('/api/chats/:chatId', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    if (chat.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await Chat.findByIdAndDelete(req.params.chatId);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

app.post('/api/chats/:chatId/truncate-messages', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { afterMessageIndex } = req.body;

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    if (chat.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const newMessages = chat.messages.slice(0, afterMessageIndex);
    
    await Chat.findByIdAndUpdate(
      req.params.chatId,
      { messages: newMessages, updatedAt: new Date() },
      { new: true }
    );

    res.json({ success: true, messages: newMessages });
  } catch (err) {
    console.error('Error truncating messages:', err);
    res.status(500).json({ error: 'Failed to truncate messages' });
  }
});

app.post('/api/chats/migrate-legacy', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const result = await Chat.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: null }, { userId: '' }] },
      { $set: { userId: userId, updatedAt: new Date() } }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error migrating legacy chats:', err);
    res.status(500).json({ error: 'Failed to migrate chats' });
  }
});

app.post('/api/auth/send-confirmation', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    confirmationCodes.set(email, {
      code,
      password,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@essence.ai',
        to: email,
        subject: 'Your Essence Login Confirmation Code',
        html: `
          <div style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; border-radius: 12px;">
            <h2 style="color: #f1f5f9; margin-bottom: 20px;">Welcome to Essence</h2>
            <p>Your confirmation code is:</p>
            <div style="background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="font-size: 32px; letter-spacing: 4px; margin: 0; color: #cbd5e1;">${code}</h3>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">This code expires in 10 minutes.</p>
            <p style="color: #64748b; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `
      });

      res.json({ success: true, message: 'Confirmation code sent to email' });
    } catch (emailErr) {
      console.error('Email sending error:', emailErr);
      console.log(`[DEV MODE] Confirmation code for ${email}: ${code}`);
      res.json({ success: true, message: 'Confirmation code sent (dev mode)', code });
    }
  } catch (err) {
    console.error('Error sending confirmation:', err);
    res.status(500).json({ error: 'Failed to send confirmation email' });
  }
});

app.post('/api/auth/verify-confirmation', async (req, res) => {
  try {
    const { email, confirmationCode } = req.body;

    if (!email || !confirmationCode) {
      return res.status(400).json({ error: 'Email and code required' });
    }

    const stored = confirmationCodes.get(email);

    if (!stored) {
      return res.status(400).json({ error: 'No confirmation code for this email' });
    }

    if (stored.expiresAt < Date.now()) {
      confirmationCodes.delete(email);
      return res.status(400).json({ error: 'Confirmation code expired' });
    }

    if (stored.code !== confirmationCode) {
      return res.status(400).json({ error: 'Invalid confirmation code' });
    }

    confirmationCodes.delete(email);

    try {
      const hashedPassword = await bcrypt.hash(stored.password, 10);

      let user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        user.password = hashedPassword;
        user.lastLogin = new Date();
        await user.save();
      } else {
        user = new User({
          email: email.toLowerCase(),
          password: hashedPassword,
          createdAt: new Date(),
          lastLogin: new Date()
        });
        await user.save();
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Session login error:', loginErr);
          return res.status(500).json({ error: 'Failed to establish session' });
        }
        res.json({
          success: true,
          message: 'Email verified and user saved',
          user: {
            id: user._id.toString(),
            email: user.email
          }
        });
      });
    } catch (dbErr) {
      console.error('Database error:', dbErr);
      res.status(500).json({ error: 'Failed to save user to database' });
    }
  } catch (err) {
    console.error('Error verifying confirmation:', err);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

app.get('/api/auth/google',
  (req, res, next) => {
    console.log('📍 Google OAuth Route Hit');
    console.log('Callback URL being used:', `${process.env.SERVER_URL || `http://localhost:${PORT}`}/api/auth/google/callback`);
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  (req, res, next) => {
    console.log('📍 Google Callback Route Hit');
    console.log('Query params:', req.query);
    next();
  },
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/?error=auth_failed` }),
  (req, res) => {
    console.log('✅ Google OAuth Success!');
    const user = req.user;
    console.log('User profile picture:', user.profilePicture);
    res.redirect(`${CLIENT_URL}/?userId=${user._id}&email=${encodeURIComponent(user.email)}&provider=google`);
  }
);

app.get('/api/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/api/auth/github/callback',
  passport.authenticate('github', { failureRedirect: `${CLIENT_URL}/?error=auth_failed` }),
  (req, res) => {
    const user = req.user;
    console.log('User profile picture:', user.profilePicture);
    res.redirect(`${CLIENT_URL}/?userId=${user._id}&email=${encodeURIComponent(user.email)}&provider=github`);
  }
);

app.get('/api/time', (req, res) => {
  try {
    const tz = req.query.timezone && typeof req.query.timezone === 'string' ? req.query.timezone : undefined;
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || undefined,
      hour: 'numeric',
      hour12: false,
      minute: 'numeric',
      second: 'numeric'
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
    res.json({
      hour,
      minute,
      iso: now.toISOString(),
      timezone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (err) {
    console.error('Error getting time:', err);
    res.status(400).json({ error: 'Invalid timezone' });
  }
});

app.get('/api/auth/user', (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName || null,
        nickname: req.user.nickname || null,
        provider: req.user.oauthProvider || 'email',
        profilePicture: req.user.profilePicture || null,
        personalPreferences: req.user.personalPreferences || null,
        preferredLanguage: req.user.preferredLanguage || null
      }
    });
  } else {
    res.json({ success: false, user: null });
  }
});

app.put('/api/auth/profile', upload.single('profilePicture'), async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { displayName, nickname, personalPreferences } = req.body;

  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (displayName !== undefined) user.displayName = displayName;
    if (nickname !== undefined) user.nickname = nickname;
    if (personalPreferences !== undefined) user.personalPreferences = personalPreferences;
    
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      user.profilePicture = `data:${mimeType};base64,${base64Image}`;
    }

    await user.save();

    req.user.displayName = user.displayName;
    req.user.nickname = user.nickname;
    req.user.personalPreferences = user.personalPreferences;
    req.user.profilePicture = user.profilePicture;

    res.json({
      displayName: user.displayName,
      nickname: user.nickname,
      personalPreferences: user.personalPreferences,
      profilePicture: user.profilePicture,
      email: user.email
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

app.patch('/api/auth/preferences', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { preferredLanguage } = req.body;
  if (preferredLanguage === undefined) {
    return res.status(400).json({ error: 'preferredLanguage required' });
  }
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.preferredLanguage = preferredLanguage || null;
    await user.save();
    req.user.preferredLanguage = user.preferredLanguage;
    res.json({ success: true, preferredLanguage: user.preferredLanguage });
  } catch (err) {
    console.error('Preferences update error:', err);
    res.status(500).json({ error: 'Failed to update preferences', details: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`AI proxy server running on http://localhost:${PORT}`);
});
