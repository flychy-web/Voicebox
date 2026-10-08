import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createToken,
  verifyToken,
  hashPin,
  isHashedPin,
  isValidPin,
  resolveAuthSecret,
} from '../src/middleware/auth.js';

process.env.AUTH_SECRET = 'a'.repeat(64);
delete process.env.TOKEN_TTL_DAYS;

const user = { id: 'u1', family_id: 'f1', role: 'senior', name: 'Mom' };

test('a fresh token verifies and carries the user claims', () => {
  const claims = verifyToken(createToken(user));
  assert.equal(claims.id, 'u1');
  assert.equal(claims.familyId, 'f1');
  assert.equal(claims.role, 'senior');
  assert.ok(claims.exp > claims.iat);
});

test('an expired token is rejected', () => {
  const issued = Date.parse('2026-01-01T00:00:00Z');
  const token = createToken(user, { now: issued });
  assert.ok(verifyToken(token, { now: issued + 29 * 86400 * 1000 }));
  assert.equal(verifyToken(token, { now: issued + 31 * 86400 * 1000 }), null);
});

test('a tampered payload or signature is rejected', () => {
  const token = createToken(user);
  const [payload, sig] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url')), role: 'family' })).toString('base64url');
  assert.equal(verifyToken(`${forged}.${sig}`), null);
  assert.equal(verifyToken(`${payload}.${sig.slice(0, -2)}xx`), null);
  assert.equal(verifyToken(`${payload}.short`), null);
  assert.equal(verifyToken('not-a-token'), null);
  assert.equal(verifyToken(undefined), null);
});

test('a token without an expiry claim is rejected', () => {
  const payload = Buffer.from(JSON.stringify({ id: 'u1' })).toString('base64url');
  assert.equal(verifyToken(`${payload}.whatever`), null);
});

test('PIN hashes are deterministic, distinct, and never contain the PIN', () => {
  const a = hashPin('1234');
  assert.equal(a, hashPin('1234'));
  assert.notEqual(a, hashPin('1235'));
  assert.ok(isHashedPin(a));
  assert.ok(!a.includes('1234'));
  assert.ok(!isHashedPin('1234'));
});

test('PIN format is 4 to 8 digits', () => {
  assert.ok(isValidPin('1234'));
  assert.ok(isValidPin('12345678'));
  assert.ok(!isValidPin('123'));
  assert.ok(!isValidPin('123456789'));
  assert.ok(!isValidPin('12a4'));
  assert.ok(!isValidPin(1234));
});

test('production refuses a missing or placeholder AUTH_SECRET', () => {
  assert.throws(() => resolveAuthSecret({ NODE_ENV: 'production' }), /AUTH_SECRET/);
  assert.throws(() => resolveAuthSecret({ NODE_ENV: 'production', AUTH_SECRET: 'dev-secret' }), /AUTH_SECRET/);
  assert.throws(() => resolveAuthSecret({ NODE_ENV: 'production', AUTH_SECRET: 'change-me-to-a-random-string' }), /AUTH_SECRET/);
  assert.equal(resolveAuthSecret({ NODE_ENV: 'production', AUTH_SECRET: 'b'.repeat(40) }), 'b'.repeat(40));
});

test('development without a secret generates one and reuses it', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voicebox-auth-'));
  try {
    const first = resolveAuthSecret({ NODE_ENV: 'development', DATA_DIR: dataDir });
    const second = resolveAuthSecret({ NODE_ENV: 'development', DATA_DIR: dataDir });
    assert.equal(first.length, 64);
    assert.equal(first, second);
    assert.notEqual(first, 'dev-secret');
  } finally {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
});
