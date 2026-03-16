import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  target: { type: Number, required: true, min: 0 },
  current: { type: Number, required: true, min: 0, default: 0 },
  deadline: { type: String, required: true }, // Format: "Jun 2026" or similar
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  sipNeeded: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);
