import express from 'express';
import Expense from '../models/Expense.js';

const router = express.Router();

// Get all expenses for a specific user
router.get('/', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) {
      return res.status(400).json({ error: 'User UID is required' });
    }

    // Return newest expenses first
    const expenses = await Expense.find({ userId: uid }).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new expense
router.post('/', async (req, res) => {
  try {
    const { userId, amount, category, date, description } = req.body;

    if (!userId || amount === undefined || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newExpense = new Expense({
      userId,
      amount: Number(amount),
      category,
      date: date ? new Date(date) : new Date(),
      description,
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, date, description } = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      {
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(category && { category }),
        ...(date && { date: new Date(date) }),
        ...(description !== undefined && { description }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(200).json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.status(200).json({ message: 'Expense deleted successfully', id });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
