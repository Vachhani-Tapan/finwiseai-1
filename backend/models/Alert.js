import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['warning', 'success', 'destructive', 'info'], default: 'info' },
  title: { type: String, required: true },
  desc: { type: String, required: true },
  icon: { type: String }, // name of lucide icon
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Alert', alertSchema);
