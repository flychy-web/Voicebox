import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Values that must never be used as a signing secret.
const PLACEHOLDER_SECRETS = new Set([
  'dev-secret',
  'change-me-to-a-random-string',
  'changeme',
  'change-me',
  'secret',
]);
const MIN_SECRET_LENGTH = 32;
const DEFAULT_TOKEN_TTL_DAYS = 30;
const PIN_HASH_PREFIX = 'h1:';
const PIN_PATTERN = /^\d{4,8}$/;

let cachedSecret;

function isWeakSecret(secret) {
  return !secret || PLACEHOLDER_SECRETS.has(secret) || secret.length < MIN_SECRET_LENGTH;
}

/**
 * Resolve the server secret used to sign tokens and key PIN hashes.
 *
 * Production refuses to start without a strong AUTH_SECRET. Development falls
 * back to a random secret stored in DATA_DIR so PIN hashes survive restarts.
 */
export function resolveAuthSecret(env = process.env) {
  const secret = env.AUTH_SECRET || '';
  if (!isWeakSecret(secret)) return secret;

  if (env.NODE_ENV === 'production') {
    throw new Error(
      `AUTH_SECRET must be a random string of at least ${MIN_SECRET_LENGTH} characters in production (try: openssl rand -hex 32)`
    );
  }

  const dataDir = env.DATA_DIR || './data';
  const devSecretPath = path.join(dataDir, '.dev-auth-secret');
  try {
    const stored = fs.readFileSync(devSecretPath, 'utf8').trim();
    if (!isWeakSecret(stored)) {
      console.warn(`[Auth] AUTH_SECRET is missing or weak; using the development secret in ${devSecretPath}`);
      return stored;
    }
  } catch {
    // No stored development secret yet.
  }

  const generated = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(devSecretPath, generated, { mode: 0o600 });
  console.warn(`[Auth] AUTH_SECRET is missing or weak; generated a development secret in ${devSecretPath}`);
  return generated;
}

function authSecret() {
  if (!cachedSecret) cachedSecret = resolveAuthSecret();
  return cachedSecret;
}

// Resolve the secret at startup so a misconfigured production server fails fast.
export function initAuth() {
  authSecret();
}

function tokenTtlSeconds() {
  const days = Number(process.env.TOKEN_TTL_DAYS);
  return Math.round((Number.isFinite(days) && days > 0 ? days : DEFAULT_TOKEN_TTL_DAYS) * 86400);
}

function sign(payload) {
  return crypto.createHmac('sha256', authSecret()).update(payload).digest('base64url');
}

export function isValidPin(pin) {
  return typeof pin === 'string' && PIN_PATTERN.test(pin);
}

/**
 * Keyed hash of a PIN. PINs double as the login lookup key, so the hash must be
 * deterministic; keying it with the server secret means a copy of the database
 * alone does not reveal the PINs.
 */
export function hashPin(pin) {
  const digest = crypto
    .createHmac('sha256', authSecret())
    .update(`voicebox-pin:${pin}`)
    .digest('hex');
  return `${PIN_HASH_PREFIX}${digest}`;
}

export function isHashedPin(value) {
  return typeof value === 'string' && value.startsWith(PIN_HASH_PREFIX);
}

export function createToken(user, { now = Date.now() } = {}) {
  const iat = Math.floor(now / 1000);
  const payload = Buffer.from(JSON.stringify({
    id: user.id,
    familyId: user.family_id,
    role: user.role,
    name: user.name,
    iat,
    exp: iat + tokenTtlSeconds(),
  })).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token, { now = Date.now() } = {}) {
  if (!token || typeof token !== 'string') return null;

  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const given = Buffer.from(sig);
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return null;
  }

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }

  if (!Number.isFinite(claims.exp) || claims.exp <= Math.floor(now / 1000)) {
    return null;
  }

  return claims;
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
