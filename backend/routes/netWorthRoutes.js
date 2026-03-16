import express from 'express';
import NetWorthItem from '../models/NetWorthItem.js';
import Portfolio from '../models/Portfolio.js';

const router = express.Router();

/**
 * @route GET /api/networth?uid=...
 * @desc Get all assets and liabilities for a user (including Portfolio value)
 */
router.get('/', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'User ID is required' });

    // Fetch static net worth items
    const items = await NetWorthItem.find({ userId: uid });
    let assets = items.filter(item => item.type === 'asset');
    const liabilities = items.filter(item => item.type === 'liability');

    // Fetch Portfolio holdings and calculate total value
    const holdings = await Portfolio.find({ userId: uid });
    const totalPortfolioValue = holdings.reduce((sum, h) => sum + (h.entryPrice * h.quantity), 0);

    // If user has investments, add them as a dynamic asset
    if (totalPortfolioValue > 0) {
      assets.push({
        _id: 'portfolio-aggregate-id', // Virtual ID for the UI
        name: 'Equity Portfolio (Investments)',
        value: totalPortfolioValue,
        type: 'asset',
        category: 'Stocks/MF'
      });
    }

    res.status(200).json({ assets, liabilities });
  } catch (error) {
    console.error('Error fetching net worth items:', error);
    res.status(500).json({ error: 'Failed to fetch net worth items' });
  }
});

/**
 * @route POST /api/networth
 * @desc Add a new asset or liability
 */
router.post('/', async (req, res) => {
  try {
    const { uid, name, value, type, category } = req.body;
    if (!uid || !name || value === undefined || !type || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newItem = new NetWorthItem({
      userId: uid,
      name,
      value,
      type,
      category
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating net worth item:', error);
    res.status(500).json({ error: 'Failed to create net worth item' });
  }
});

/**
 * @route DELETE /api/networth/:id
 * @desc Delete a net worth item
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await NetWorthItem.findByIdAndDelete(id);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting net worth item:', error);
    res.status(500).json({ error: 'Failed to delete net worth item' });
  }
});

export default router;
