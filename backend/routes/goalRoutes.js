import express from 'express';
import Goal from '../models/Goal.js';

const router = express.Router();

// GET all goals for a user
router.get('/', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    const goals = await Goal.find({ userId: uid });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST a new goal
router.post('/', async (req, res) => {
  console.log('POST /api/goals hit with body:', req.body);
  try {
    const { uid, name, target, current, deadline, priority, sipNeeded } = req.body;
    const newGoal = new Goal({ userId: uid, name, target, current, deadline, priority, sipNeeded });
    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (err) {
    console.error('Goal creation error:', err);
    res.status(400).json({ error: 'Failed to create goal', details: err.message });
  }
});

// PUT (update) a goal
router.put('/:id', async (req, res) => {
  try {
    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedGoal);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update goal' });
  }
});

// DELETE a goal
router.delete('/:id', async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete goal' });
  }
});

export default router;
