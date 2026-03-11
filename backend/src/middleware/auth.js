import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret';

export function createToken(user) {
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    familyId: user.family_id,
    role: user.role,
    name: user.name,
  })).toString('base64url');

  const sig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url');

  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;

  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const expected = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payload)
    .digest('base64url');

  if (sig !== expected) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const user = verifyToken(header.slice(7));
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}
