'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const contactHandler = require('../api/contact');

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = JSON.stringify(payload); return this; },
    end(payload = '') { this.body = String(payload); return this; }
  };
}

function validRequest(payload = {}) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': '500' },
    body: {
      name: 'Alex Example',
      email: 'alex@example.invalid',
      business: 'Example Wholesale',
      topic: 'Systems Integration',
      message: 'We want to understand the handoff between online orders and our stock records.',
      consent: 'yes',
      ...payload
    }
  };
}

async function invoke(req) {
  const res = makeResponse();
  await contactHandler(req, res);
  return { res, json: JSON.parse(res.body || '{}') };
}

function withConfig(run, { key = 'test-resend-key', from = 'Takumi AutoLabs <website@example.invalid>', fetchImpl } = {}) {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RESEND_FROM;
  const previousFetch = global.fetch;
  if (key === null) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = key;
  if (from === null) delete process.env.RESEND_FROM;
  else process.env.RESEND_FROM = from;
  if (fetchImpl) global.fetch = fetchImpl;
  return Promise.resolve().then(run).finally(() => {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = previousFrom;
    global.fetch = previousFetch;
  });
}

test('rejects non-POST requests and advertises the allowed method', async () => {
  const { res, json } = await invoke({ method: 'GET', headers: {}, body: {} });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
  assert.match(json.error, /contact page/i);
});

test('rejects invalid fields before any email request', async () => {
  await withConfig(async () => {
    const { res, json } = await invoke(validRequest({ email: 'not-an-email' }));
    assert.equal(res.statusCode, 400);
    assert.match(json.error, /check your name/i);
  }, { fetchImpl: async () => { throw new Error('fetch should not run'); } });
});

test('rejects an oversized pre-parsed JSON body even without content-length', async () => {
  await withConfig(async () => {
    const req = validRequest({ message: 'x'.repeat(12_000) });
    delete req.headers['content-length'];
    const { res, json } = await invoke(req);
    assert.equal(res.statusCode, 413);
    assert.match(json.error, /too large/i);
  }, { fetchImpl: async () => { throw new Error('fetch should not run'); } });
});

test('quietly accepts a filled honeypot without delivering mail', async () => {
  await withConfig(async () => {
    const { res, json } = await invoke(validRequest({ website: 'bot-filled-value' }));
    assert.equal(res.statusCode, 202);
    assert.deepEqual(json, { ok: true });
  }, { fetchImpl: async () => { throw new Error('honeypot must not send'); } });
});

test('returns a clear setup error when email credentials are absent', async () => {
  await withConfig(async () => {
    const { res, json } = await invoke(validRequest());
    assert.equal(res.statusCode, 503);
    assert.match(json.error, /not configured/i);
  }, { key: null, from: null, fetchImpl: async () => { throw new Error('fetch should not run'); } });
});

test('sends a validated enquiry through the server-side provider and returns success only on delivery', async () => {
  let request;
  await withConfig(async () => {
    const { res, json } = await invoke(validRequest({ name: '<Alex>', message: 'Please review the order and stock handoff flow for our team.' }));
    assert.equal(res.statusCode, 200);
    assert.equal(json.ok, true);
    assert.match(json.message, /submitted/i);
  }, { fetchImpl: async (url, options) => {
    request = { url, options, payload: JSON.parse(options.body) };
    return { ok: true, status: 200, json: async () => ({ id: 'test-only' }) };
  } });
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.match(request.options.headers.Authorization, /^Bearer test-resend-key$/);
  assert.deepEqual(request.payload.to, ['takumiautolabs@gmail.com']);
  assert.equal(request.payload.reply_to, 'alex@example.invalid');
  assert.match(request.payload.html, /&lt;Alex&gt;/);
  assert.doesNotMatch(request.payload.html, /<Alex>/);
});

test('reports a provider error rather than a false success', async () => {
  await withConfig(async () => {
    const { res, json } = await invoke(validRequest());
    assert.equal(res.statusCode, 502);
    assert.match(json.error, /email service/i);
  }, { fetchImpl: async () => ({ ok: false, status: 429 }) });
});
