import mongoose from 'mongoose';

const netWorthItemSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  value: { type: Number, required: true },
  type: { type: String, enum: ['asset', 'liability'], required: true },
  category: { type: String, required: true }, // e.g., 'Gold', 'Home Loan', etc.
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('NetWorthItem', netWorthItemSchema);
