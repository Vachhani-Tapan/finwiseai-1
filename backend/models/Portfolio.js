import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true },     // e.g. TATAMOTORS.NS
  name: { type: String, required: true },         // e.g. Tata Motors Limited
  exchange: { type: String, default: 'NSE' },
  entryPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  stopLoss: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Portfolio', portfolioSchema);
