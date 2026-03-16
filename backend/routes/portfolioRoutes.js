import express from 'express';
import Watchlist from '../models/Watchlist.js';
import Portfolio from '../models/Portfolio.js';

const router = express.Router();

// ──── WATCHLIST ───────────────────────────────────────────────

// Get user's watchlist
router.get('/watchlist', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    const list = await Watchlist.find({ userId: uid }).sort({ addedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// Add to watchlist
router.post('/watchlist', async (req, res) => {
  try {
    const { uid, symbol, name, exchange } = req.body;
    if (!uid || !symbol || !name) return res.status(400).json({ error: 'uid, symbol, name are required' });
    const item = await Watchlist.findOneAndUpdate(
      { userId: uid, symbol },
      { userId: uid, symbol, name, exchange: exchange || 'NSE' },
      { upsert: true, new: true }
    );
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// Remove from watchlist
router.delete('/watchlist/:id', async (req, res) => {
  try {
    await Watchlist.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

// ──── PORTFOLIO ───────────────────────────────────────────────

// Get user's portfolio
router.get('/portfolio', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    const holdings = await Portfolio.find({ userId: uid }).sort({ addedAt: -1 });
    res.json(holdings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Add to portfolio
router.post('/portfolio', async (req, res) => {
  try {
    const { uid, symbol, name, exchange, entryPrice, quantity } = req.body;
    if (!uid || !symbol || !name || !entryPrice || !quantity) {
      return res.status(400).json({ error: 'uid, symbol, name, entryPrice, quantity are required' });
    }
    const holding = new Portfolio({
      userId: uid, symbol, name, exchange: exchange || 'NSE',
      entryPrice: Number(entryPrice), quantity: Number(quantity),
    });
    await holding.save();
    res.status(201).json(holding);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to portfolio' });
  }
});

// Delete a holding
router.delete('/portfolio/:id', async (req, res) => {
  try {
    await Portfolio.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove holding' });
  }
});

export default router;
