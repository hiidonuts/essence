import mongoose from 'mongoose';
import { Chat } from '../models.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB at', MONGODB_URI);

    const total = await Chat.countDocuments();
    console.log('Total chats:', total);

    const chats = await Chat.find({}).lean();
    chats.forEach((c) => {
      console.log('--- Chat ---');
      console.log('id:', c._id);
      console.log('userId:', c.userId);
      console.log('title:', c.title);
      console.log('messages:', (c.messages || []).length);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
