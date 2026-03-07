import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  googleId: String,
  githubId: String,
  password: String,
  name: { type: String, required: true },
  profilePicture: String,
  provider: String,
  preferredLanguage: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
export default mongoose.model('User', UserSchema);