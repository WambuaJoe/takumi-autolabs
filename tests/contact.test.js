'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const contactHandler = require('../api/contact');

const TEST_IDEMPOTENCY_KEY = '550e8400-e29b-41d4-a716-446655440000';
const CONFIG_KEYS = ['RESEND_API_KEY', 'CONTACT_EMAIL', 'CONTACT_FROM_EMAIL'];

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

function validRequest(payload = {}, headerOverrides = {}) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': '500',
      'idempotency-key': TEST_IDEMPOTENCY_KEY,
      ...headerOverrides
    },
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

function withConfig(run, {
  key = 'test-resend-key',
  recipient = 'takumiautolabs@gmail.com',
  from = 'sender@example.invalid',
  fetchImpl
} = {}) {
  const previous = Object.fromEntries(CONFIG_KEYS.map((name) => [name, process.env[name]]));
  const values = {
    RESEND_API_KEY: key,
    CONTACT_EMAIL: recipient,
    CONTACT_FROM_EMAIL: from
  };
  for (const [name, value] of Object.entries(values)) {
    if (value === null) delete process.env[name];
    else process.env[name] = value;
  }
  const previousFetch = global.fetch;
  if (fetchImpl) global.fetch = fetchImpl;
  return Promise.resolve().then(run).finally(() => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    global.fetch = previousFetch;
  });
}

const acceptedResponse = (id = 'test-only-email-id') => ({
  ok: true,
  status: 200,
  json: async () => ({ id })
});

test('rejects non-POST requests and advertises the allowed method', async () => {
  const { res, json } = await invoke({ method: 'GET', headers: {}, body: {} });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
  assert.match(json.error, /contact page/i);
  assert.equal(json.ok, false);
});

test('rejects requests that are not JSON', async () => {
  const { res, json } = await invoke(validRequest({}, { 'content-type': 'text/plain' }));
  assert.equal(res.statusCode, 415);
  assert.equal(json.ok, false);
});

test('rejects empty submissions', async () => {
  const { res, json } = await invoke(validRequest({ name: '', email: '', message: '', consent: '' }));
  assert.equal(res.statusCode, 400);
  assert.equal(json.ok, false);
});

test('validates each required field before contacting Resend', async () => {
  const invalidSubmissions = [
    { name: ' ' },
    { email: '' },
    { message: '' },
    { consent: '' }
  ];
  for (const fields of invalidSubmissions) {
    await withConfig(async () => {
      const { res, json } = await invoke(validRequest(fields));
      assert.equal(res.statusCode, 400);
      assert.match(json.error, /check your name/i);
      assert.equal(json.ok, false);
    }, { fetchImpl: async () => { throw new Error('Resend must not be called for invalid fields'); } });
  }
});

test('rejects malformed email addresses', async () => {
  for (const email of ['not-an-email', 'name@', 'name@@example.com', 'name..dot@example.com', 'name@example..com']) {
    await withConfig(async () => {
      const { res } = await invoke(validRequest({ email }));
      assert.equal(res.statusCode, 400, email);
    }, { fetchImpl: async () => { throw new Error('Resend must not be called for invalid email'); } });
  }
});

test('rejects oversized pre-parsed JSON bodies even without content-length', async () => {
  await withConfig(async () => {
    const req = validRequest({ message: 'x'.repeat(12_000) });
    delete req.headers['content-length'];
    const { res, json } = await invoke(req);
    assert.equal(res.statusCode, 413);
    assert.match(json.error, /too large/i);
  }, { fetchImpl: async () => { throw new Error('Resend must not be called for oversized input'); } });
});

test('does not send or report success for a filled honeypot', async () => {
  await withConfig(async () => {
    const { res, json } = await invoke(validRequest({ website: 'bot-filled-value' }));
    assert.equal(res.statusCode, 400);
    assert.equal(json.ok, false);
    assert.doesNotMatch(json.error, /honeypot/i);
  }, { fetchImpl: async () => { throw new Error('Honeypot submissions must not reach Resend'); } });
});

test('returns the direct-email configuration error when any required variable is missing', async () => {
  for (const key of CONFIG_KEYS) {
    const options = { key: 'test-resend-key', recipient: 'takumiautolabs@gmail.com', from: 'sender@example.invalid' };
    if (key === 'RESEND_API_KEY') options.key = null;
    if (key === 'CONTACT_EMAIL') options.recipient = null;
    if (key === 'CONTACT_FROM_EMAIL') options.from = null;
    await withConfig(async () => {
      const { res, json } = await invoke(validRequest());
      assert.equal(res.statusCode, 503, key);
      assert.equal(json.ok, false);
      assert.match(json.error, /not configured/i);
      assert.match(json.error, /takumiautolabs@gmail\.com/);
    }, { ...options, fetchImpl: async () => { throw new Error('Resend must not be called without full configuration'); } });
  }
});

test('rejects invalid recipient or sender environment addresses before calling Resend', async () => {
  for (const options of [{ recipient: 'not-an-email' }, { from: 'not-a-verified-address' }]) {
    await withConfig(async () => {
      const { res, json } = await invoke(validRequest());
      assert.equal(res.statusCode, 503);
      assert.equal(json.ok, false);
    }, { ...options, fetchImpl: async () => { throw new Error('Resend must not be called with invalid environment values'); } });
  }
});

test('sends a sanitized enquiry to the configured recipient and reports success only after Resend acceptance', async () => {
  let request;
  await withConfig(async () => {
    const { res, json } = await invoke(validRequest({
      name: '<Alex>\r\nBcc: attacker@example.invalid',
      message: 'Please review the order and stock handoff flow.\u0000\n<script>alert(1)</script>'
    }));
    assert.equal(res.statusCode, 200);
    assert.equal(json.ok, true);
    assert.match(json.message, /sent successfully/i);
  }, { fetchImpl: async (url, options) => {
    request = { url, options, payload: JSON.parse(options.body) };
    return acceptedResponse();
  } });
  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.method, 'POST');
  assert.match(request.options.headers.Authorization, /^Bearer test-resend-key$/);
  assert.equal(request.options.headers['Idempotency-Key'], TEST_IDEMPOTENCY_KEY);
  assert.equal(request.payload.from, 'sender@example.invalid');
  assert.deepEqual(request.payload.to, ['takumiautolabs@gmail.com']);
  assert.equal(request.payload.reply_to, 'alex@example.invalid');
  assert.match(request.payload.text, /<Alex> Bcc: attacker@example\.invalid/);
  assert.doesNotMatch(request.payload.text, /\u0000/);
  assert.match(request.payload.html, /&lt;Alex&gt; Bcc: attacker@example\.invalid/);
  assert.match(request.payload.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(request.payload.html, /<script>/);
});

test('does not report success when Resend provides no accepted email id', async () => {
  await withConfig(async () => {
    const { res, json } = await invoke(validRequest());
    assert.equal(res.statusCode, 502);
    assert.equal(json.ok, false);
    assert.match(json.error, /could not confirm/i);
  }, { fetchImpl: async () => acceptedResponse('') });
});

test('reports Resend rejection and network errors instead of a false success', async () => {
  const failures = [
    async () => ({ ok: false, status: 429 }),
    async () => { throw new Error('network failure'); }
  ];
  for (const fetchImpl of failures) {
    await withConfig(async () => {
      const { res, json } = await invoke(validRequest());
      assert.equal(res.statusCode, 502);
      assert.equal(json.ok, false);
      assert.match(json.error, /email/i);
      assert.match(json.error, /takumiautolabs@gmail\.com/);
    }, { fetchImpl });
  }
});

test('passes the same retry key through to Resend for duplicate suppression', async () => {
  const receivedKeys = [];
  await withConfig(async () => {
    const first = await invoke(validRequest());
    const retry = await invoke(validRequest());
    assert.equal(first.res.statusCode, 200);
    assert.equal(retry.res.statusCode, 200);
  }, { fetchImpl: async (_url, options) => {
    receivedKeys.push(options.headers['Idempotency-Key']);
    return acceptedResponse();
  } });
  assert.deepEqual(receivedKeys, [TEST_IDEMPOTENCY_KEY, TEST_IDEMPOTENCY_KEY]);
});

test('rejects missing or malformed idempotency keys', async () => {
  for (const value of ['', 'short']) {
    await withConfig(async () => {
      const { res, json } = await invoke(validRequest({}, { 'idempotency-key': value }));
      assert.equal(res.statusCode, 400);
      assert.equal(json.ok, false);
    }, { fetchImpl: async () => { throw new Error('Resend must not be called without a valid key'); } });
  }
});
