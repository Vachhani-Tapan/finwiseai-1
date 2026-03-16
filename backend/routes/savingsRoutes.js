import express from 'express';
import SavingsGoal from '../models/SavingsGoal.js';

const router = express.Router();

// GET user's savings goal
router.get('/', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });

    const goal = await SavingsGoal.findOne({ userId: uid });
    res.json(goal || { monthlySavings: 0 });
  } catch (err) {
    console.error('Savings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch savings goal' });
  }
});

// PUT (create or update) savings goal
router.put('/', async (req, res) => {
  try {
    const { uid, monthlySavings, monthlySalary } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'uid is required' });
    }

    const updateData = {};
    if (monthlySavings !== undefined) updateData.monthlySavings = Number(monthlySavings);
    if (monthlySalary !== undefined) updateData.monthlySalary = Number(monthlySalary);

    const goal = await SavingsGoal.findOneAndUpdate(
      { userId: uid },
      { userId: uid, ...updateData },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(goal);
  } catch (err) {
    console.error('Savings update error:', err);
    res.status(500).json({ error: 'Failed to update savings goal' });
  }
});

export default router;
