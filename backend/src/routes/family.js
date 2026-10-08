import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { requireAuth, hashPin, isValidPin } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Onboarding is unauthenticated, and a rejected code reveals that it exists,
// so keep the rate low: 5 per IP and 50 overall per hour.
const onboardingLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, globalMax: 50 });

/**
 * POST /api/family — onboard a new family
 */
router.post('/', onboardingLimiter.middleware, (req, res) => {
  const { familyName, seniorName, seniorPin, memberName, memberPin } = req.body;

  if (!familyName || !seniorName || !seniorPin || !memberName || !memberPin) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!isValidPin(seniorPin) || !isValidPin(memberPin)) {
    return res.status(400).json({ error: 'PINs must be 4 to 8 digits' });
  }

  if (seniorPin === memberPin) {
    return res.status(400).json({ error: 'PINs must be different for each person' });
  }

  const seniorPinHash = hashPin(seniorPin);
  const memberPinHash = hashPin(memberPin);

  const existing = db.prepare('SELECT id FROM users WHERE pin = ? OR pin = ?').get(seniorPinHash, memberPinHash);
  if (existing) {
    return res.status(409).json({ error: 'These codes cannot be used. Please choose different codes.' });
  }

  const familyId = uuid();
  const seniorId = uuid();
  const memberId = uuid();

  const insertFamily = db.prepare('INSERT INTO families (id, name) VALUES (?, ?)');
  const insertUser = db.prepare(
    'INSERT INTO users (id, family_id, name, role, pin) VALUES (?, ?, ?, ?, ?)'
  );

  const setup = db.transaction(() => {
    insertFamily.run(familyId, familyName);
    insertUser.run(seniorId, familyId, seniorName, 'senior', seniorPinHash);
    insertUser.run(memberId, familyId, memberName, 'family', memberPinHash);
  });

  setup();

  res.status(201).json({
    familyId,
    familyName,
    senior: { id: seniorId, name: seniorName, pin: seniorPin },
    member: { id: memberId, name: memberName, pin: memberPin },
    message: `Family "${familyName}" created! Share the codes with your family.`,
  });
});

/**
 * GET /api/family/:id — family info + members
 */
router.get('/:id', requireAuth, (req, res) => {
  if (req.params.id !== req.user.familyId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const family = db.prepare('SELECT * FROM families WHERE id = ?').get(req.params.id);
  if (!family) {
    return res.status(404).json({ error: 'Family not found' });
  }

  const members = db.prepare(
    'SELECT id, name, role, created_at FROM users WHERE family_id = ?'
  ).all(req.params.id);

  res.json({ family, members });
});

export default router;
