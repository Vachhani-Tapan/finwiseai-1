import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    default: '',
  },
  photoURL: {
    type: String,
    default: '',
  },
  // We can track last login or signup
  lastLoginAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
