import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Food & Dining', 'Transport', 'Utilities', 'Shopping', 'Others'],
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
}, { timestamps: true });

// One budget entry per user per category
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
