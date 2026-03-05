import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: String,
  content: String,
  sender: {
    type: String,
    enum: ['user', 'ai']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => Date.now().toString()
  },
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    default: null
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'github', null],
    default: null
  },
  oauthId: {
    type: String,
    default: null
  },
  displayName: {
    type: String,
    default: null
  },
  nickname: {
    type: String,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  personalPreferences: {
    type: String,
    default: null
  },
  preferredLanguage: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

export const Chat = mongoose.model('Chat', chatSchema);
export const User = mongoose.model('User', userSchema);
