import { Router } from 'express';
import db from '../db.js';
import { createToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * Body: { pin: "123456" }
 */
router.post('/login', (req, res) => {
  const { pin } = req.body;

  if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 8) {
    return res.status(400).json({ error: 'Please enter your family code' });
  }

  const user = db.prepare('SELECT * FROM users WHERE pin = ?').get(pin);
  if (!user) {
    return res.status(401).json({ error: 'Code not recognized. Please try again.' });
  }

  const family = db.prepare('SELECT * FROM families WHERE id = ?').get(user.family_id);
  const token = createToken(user);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      familyId: user.family_id,
      familyName: family?.name || '',
    },
    token,
  });
});

export default router;
