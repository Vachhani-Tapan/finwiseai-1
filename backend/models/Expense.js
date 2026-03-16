import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true, // Speeds up queries per user
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: ['Food & Dining', 'Transport', 'Utilities', 'Shopping', 'Others'],
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200,
  }
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
