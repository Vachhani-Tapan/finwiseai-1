import express from 'express';
import Alert from '../models/Alert.js';

const router = express.Router();

// Get user alerts
router.get('/', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: 'uid is required' });
    const alerts = await Alert.find({ userId: uid }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create alert
router.post('/', async (req, res) => {
  try {
    const { uid, type, title, desc, icon } = req.body;
    // Simple deduplication: don't add if same description exists unread
    const exists = await Alert.findOne({ userId: uid, desc, read: false });
    if (exists) return res.json(exists);

    const alert = new Alert({ userId: uid, type, title, desc, icon });
    await alert.save();
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Mark alert as read
router.patch('/:id/read', async (req, res) => {
  try {
    await Alert.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete an alert
router.delete('/:id', async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;
