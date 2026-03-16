import express from 'express';
import Budget from '../models/Budget.js';

const router = express.Router();

// Default budgets used when user hasn't set any
const DEFAULT_BUDGETS = {
  'Food & Dining': 10000,
  'Transport': 5000,
  'Utilities': 4000,
  'Shopping': 8000,
  'Others': 8000,
};

/**
 * @route GET /api/budgets?uid=...
 * @desc Get all budgets for a user (fills defaults for missing categories)
 */
router.get('/', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) {
      return res.status(400).json({ error: 'User UID is required' });
    }

    const userBudgets = await Budget.find({ userId: uid });

    // Build a complete budget map, filling in defaults for missing categories
    const budgetMap = { ...DEFAULT_BUDGETS };
    userBudgets.forEach(b => {
      budgetMap[b.category] = b.amount;
    });

    // Return as an array
    const result = Object.keys(budgetMap).map(category => ({
      category,
      amount: budgetMap[category],
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route PUT /api/budgets
 * @desc Update (upsert) all budgets for a user
 * @body { userId, budgets: [{ category, amount }] }
 */
router.put('/', async (req, res) => {
  try {
    const { userId, budgets } = req.body;

    if (!userId || !budgets || !Array.isArray(budgets)) {
      return res.status(400).json({ error: 'userId and budgets array are required' });
    }

    const operations = budgets.map(b => ({
      updateOne: {
        filter: { userId, category: b.category },
        update: { $set: { amount: Number(b.amount) } },
        upsert: true,
      }
    }));

    await Budget.bulkWrite(operations);

    // Return the updated budgets
    const updated = await Budget.find({ userId });
    const budgetMap = { ...DEFAULT_BUDGETS };
    updated.forEach(b => { budgetMap[b.category] = b.amount; });
    const result = Object.keys(budgetMap).map(category => ({
      category,
      amount: budgetMap[category],
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating budgets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
