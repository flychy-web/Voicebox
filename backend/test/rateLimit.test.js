import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../src/middleware/rateLimit.js';

function clock(start = 0) {
  let time = start;
  return { now: () => time, advance: ms => { time += ms; } };
}

test('allows up to max per key, then blocks with a retry hint', () => {
  const c = clock();
  const limiter = createRateLimiter({ windowMs: 60000, max: 3, now: c.now });
  for (let i = 0; i < 3; i++) assert.ok(limiter.check('ip-a').allowed);
  const blocked = limiter.check('ip-a');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 60);
  assert.ok(limiter.check('ip-b').allowed, 'other keys are unaffected');
});

test('the window resets after it elapses', () => {
  const c = clock();
  const limiter = createRateLimiter({ windowMs: 1000, max: 1, now: c.now });
  assert.ok(limiter.check('k').allowed);
  assert.equal(limiter.check('k').allowed, false);
  c.advance(1000);
  assert.ok(limiter.check('k').allowed);
});

test('the global ceiling applies across keys', () => {
  const c = clock();
  const limiter = createRateLimiter({ windowMs: 60000, max: 10, globalMax: 2, now: c.now });
  assert.ok(limiter.check('a').allowed);
  assert.ok(limiter.check('b').allowed);
  assert.equal(limiter.check('c').allowed, false);
});

test('middleware responds 429 with Retry-After when blocked', () => {
  const c = clock();
  const limiter = createRateLimiter({ windowMs: 30000, max: 1, now: c.now });
  const req = { ip: '203.0.113.7' };
  let nextCalls = 0;
  limiter.middleware(req, fakeRes(), () => { nextCalls++; });
  const res = fakeRes();
  limiter.middleware(req, res, () => { nextCalls++; });
  assert.equal(nextCalls, 1);
  assert.equal(res.statusCode, 429);
  assert.equal(res.headers['Retry-After'], '30');
  assert.match(res.body.error, /Too many attempts/);
});

function fakeRes() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    set(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
