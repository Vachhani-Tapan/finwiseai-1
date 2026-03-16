import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true },   // e.g. RELIANCE.NS
  name: { type: String, required: true },       // e.g. Reliance Industries Limited
  exchange: { type: String, default: 'NSE' },
  addedAt: { type: Date, default: Date.now },
});

// Prevent duplicates per user
watchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export default mongoose.model('Watchlist', watchlistSchema);
