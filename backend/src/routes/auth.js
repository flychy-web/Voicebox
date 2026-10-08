import { Router } from 'express';
import db from '../db.js';
import { createToken, hashPin, isValidPin } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// 10 tries per IP and 200 overall per 15 minutes bounds PIN guessing.
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, globalMax: 200 });

/**
 * POST /api/auth/login
 * Body: { pin: "123456" }
 */
router.post('/login', loginLimiter.middleware, (req, res) => {
  const { pin } = req.body;

  if (!isValidPin(pin)) {
    return res.status(400).json({ error: 'Please enter your family code' });
  }

  const user = db.prepare('SELECT * FROM users WHERE pin = ?').get(hashPin(pin));
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
