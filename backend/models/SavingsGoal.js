import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  monthlySavings: { type: Number, required: true, min: 0, default: 0 },
  monthlySalary: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

export default mongoose.model('SavingsGoal', savingsGoalSchema);
