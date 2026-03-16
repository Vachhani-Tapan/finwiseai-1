import mongoose from 'mongoose';

const debtSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },                // e.g. "Credit Card", "Education Loan"
  category: { 
    type: String, 
    enum: ['credit_card', 'personal_loan', 'education_loan', 'home_loan', 'car_loan', 'business_loan', 'other'],
    default: 'other' 
  },
  principalAmount: { type: Number, required: true, min: 0 },   // Original borrowed amount
  remainingAmount: { type: Number, required: true, min: 0 },   // Current outstanding
  interestRate: { type: Number, required: true, min: 0 },       // Annual interest rate %
  interestType: { 
    type: String, 
    enum: ['simple', 'compound_monthly', 'compound_daily', 'reducing_balance'],
    default: 'reducing_balance' 
  },
  emiAmount: { type: Number, default: 0, min: 0 },             // Monthly EMI/payment
  reason: { type: String, default: '' },                         // Purpose/reason for the debt
  startDate: { type: Date, default: Date.now },
  dueDate: { type: Date },                                      // Expected payoff date
  addedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Debt', debtSchema);
