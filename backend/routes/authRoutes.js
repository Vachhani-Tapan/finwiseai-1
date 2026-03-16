import express from 'express';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route POST /api/auth/google
 * @desc Sync Firebase user with MongoDB (upsert)
 */
router.post('/google', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and Email are required.' });
    }

    // Find the user by Firebase UID, or create them if they don't exist yet
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        email,
        displayName,
        photoURL,
        lastLoginAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: 'User synced successfully',
      user
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal server error while syncing user' });
  }
});

export default router;
