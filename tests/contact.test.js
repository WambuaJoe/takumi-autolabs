'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const clientSource = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'site.js'), 'utf8');

const validFields = {
  access_key: 'test-public-access-key',
  subject: 'New website enquiry — Takumi AutoLabs',
  name: 'Alex Example',
  email: 'alex@example.test',
  business: 'Example Wholesale',
  area_of_interest: 'Systems Integration',
  message: 'We want to understand the handoff between online orders and our stock records.',
  consent: 'yes',
  website: ''
};

function makeHarness({ fields = validFields, valid = true, fetchImpl = async () => { throw new Error('unexpected fetch'); } } = {}) {
  const listeners = new Map();
  const attributes = new Map();
  const status = { textContent: '', dataset: {} };
  const submit = { disabled: false, innerHTML: 'Send enquiry <span aria-hidden="true">→</span>', textContent: 'Send enquiry' };
  const controls = Object.keys(fields).map((name) => ({ name, disabled: false }));
  let resetCount = 0;

  const form = {
    addEventListener(type, callback) { listeners.set(type, callback); },
    querySelector(selector) {
      if (selector === '[data-form-status]') return status;
      if (selector === '[type="submit"]') return submit;
      return null;
    },
    querySelectorAll() { return controls; },
    getAttribute(name) { return name === 'action' ? 'https://api.web3forms.com/submit' : null; },
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
    reportValidity() { return valid; },
    checkValidity() { return valid; },
    reset() { resetCount += 1; }
  };

  class MockFormData {
    constructor() { this.values = new Map(Object.entries(fields)); }
    get(name) { return this.values.has(name) ? this.values.get(name) : null; }
    set(name, value) { this.values.set(name, String(value)); }
    delete(name) { this.values.delete(name); }
    entries() { return this.values.entries(); }
  }

  const document = {
    querySelector(selector) { return selector === '[data-contact-form]' ? form : null; },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  const window = { addEventListener() {}, matchMedia: () => ({ matches: false }) };
  const context = {
    document,
    window,
    FormData: MockFormData,
    fetch: fetchImpl,
    HTMLAnchorElement: class HTMLAnchorElement {},
    Error,
    Date,
    Math,
    console
  };

  vm.runInNewContext(clientSource, context, { filename: 'assets/js/site.js' });

  async function submitForm() {
    const handler = listeners.get('submit');
    assert.ok(handler, 'the contact form submit handler is registered');
    let prevented = false;
    await handler({ preventDefault() { prevented = true; } });
    return prevented;
  }

  return {
    form,
    status,
    submit,
    controls,
    attributes,
    submitForm,
    get resetCount() { return resetCount; }
  };
}

function jsonResponse({ ok = true, status = 200, payload = { success: true, body: { message: 'Email sent successfully!' } } } = {}) {
  return { ok, status, json: async () => payload };
}

test('native required-field and email validation block submission before Web3Forms is called', async () => {
  let fetchCalls = 0;
  const harness = makeHarness({ valid: false, fetchImpl: async () => { fetchCalls += 1; return jsonResponse(); } });
  const prevented = await harness.submitForm();
  assert.equal(prevented, true);
  assert.equal(fetchCalls, 0);
  assert.equal(harness.status.dataset.state, undefined);
});

test('maps all form fields to Web3Forms and shows success only after confirmed acceptance', async () => {
  let request;
  let resolveFetch;
  const pendingResponse = new Promise((resolve) => { resolveFetch = resolve; });
  const harness = makeHarness({ fetchImpl: async (url, options) => { request = { url, options }; return pendingResponse; } });

  const submission = harness.submitForm();
  assert.equal(harness.status.dataset.state, 'loading');
  assert.match(harness.status.textContent, /sending/i);
  assert.equal(harness.submit.disabled, true);
  assert.equal(harness.controls.every((control) => control.disabled), true);
  assert.ok(request, 'the browser sends a request while displaying the loading state');
  assert.equal(request.url, 'https://api.web3forms.com/submit');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Accept, 'application/json');
  assert.equal(request.options.body.get('access_key'), validFields.access_key);
  assert.equal(request.options.body.get('subject'), 'New website enquiry — Takumi AutoLabs');
  assert.equal(request.options.body.get('name'), 'Alex Example');
  assert.equal(request.options.body.get('email'), 'alex@example.test');
  assert.equal(request.options.body.get('replyto'), 'alex@example.test');
  assert.equal(request.options.body.get('business'), 'Example Wholesale');
  assert.equal(request.options.body.get('area_of_interest'), 'Systems Integration');
  assert.match(request.options.body.get('message'), /online orders and our stock records/);
  assert.equal(request.options.body.get('consent'), 'yes');
  assert.equal(request.options.body.get('website'), null);
  assert.equal(harness.resetCount, 0);

  resolveFetch(jsonResponse());
  await submission;
  assert.equal(harness.status.dataset.state, 'success');
  assert.match(harness.status.textContent, /sent to Takumi AutoLabs/i);
  assert.equal(harness.resetCount, 1);
  assert.equal(harness.submit.disabled, false);
  assert.equal(harness.controls.every((control) => control.disabled), false);
});

test('does not show success when Web3Forms returns a non-success body with HTTP 200', async () => {
  const harness = makeHarness({
    fetchImpl: async () => jsonResponse({ payload: { success: false, message: 'Submission was not accepted.' } })
  });
  await harness.submitForm();
  assert.equal(harness.status.dataset.state, 'error');
  assert.match(harness.status.textContent, /did not confirm/i);
  assert.match(harness.status.textContent, /takumiautolabs@gmail\.com/);
  assert.equal(harness.resetCount, 0);
});

test('does not show success for an HTTP error even if the response body claims success', async () => {
  const harness = makeHarness({
    fetchImpl: async () => jsonResponse({ ok: false, status: 500, payload: { success: true } })
  });
  await harness.submitForm();
  assert.equal(harness.status.dataset.state, 'error');
  assert.equal(harness.resetCount, 0);
});

test('reports network failures with the direct email fallback', async () => {
  const harness = makeHarness({ fetchImpl: async () => { throw new Error('offline'); } });
  await harness.submitForm();
  assert.equal(harness.status.dataset.state, 'error');
  assert.match(harness.status.textContent, /could not reach/i);
  assert.match(harness.status.textContent, /takumiautolabs@gmail\.com/);
  assert.equal(harness.resetCount, 0);
});

test('uses a useful retry message when Web3Forms rate-limits submissions', async () => {
  const harness = makeHarness({
    fetchImpl: async () => jsonResponse({ ok: false, status: 429, payload: { success: false, message: 'Too many requests.' } })
  });
  await harness.submitForm();
  assert.equal(harness.status.dataset.state, 'error');
  assert.match(harness.status.textContent, /try again shortly/i);
  assert.match(harness.status.textContent, /takumiautolabs@gmail\.com/);
});

test('rejects the existing filled honeypot before sending data', async () => {
  let fetchCalls = 0;
  const harness = makeHarness({ fields: { ...validFields, website: 'filled by a bot' }, fetchImpl: async () => { fetchCalls += 1; return jsonResponse(); } });
  await harness.submitForm();
  assert.equal(fetchCalls, 0);
  assert.equal(harness.status.dataset.state, 'error');
  assert.match(harness.status.textContent, /takumiautolabs@gmail\.com/);
});

test('shows an honest direct-email error if the public access-key field is empty', async () => {
  let fetchCalls = 0;
  const harness = makeHarness({ fields: { ...validFields, access_key: '' }, fetchImpl: async () => { fetchCalls += 1; return jsonResponse(); } });
  await harness.submitForm();
  assert.equal(fetchCalls, 0);
  assert.equal(harness.status.dataset.state, 'error');
  assert.match(harness.status.textContent, /temporarily unavailable/i);
  assert.match(harness.status.textContent, /takumiautolabs@gmail\.com/);
});

test('locks the form against duplicate in-flight submissions', async () => {
  let fetchCalls = 0;
  let resolveFetch;
  const pendingResponse = new Promise((resolve) => { resolveFetch = resolve; });
  const harness = makeHarness({ fetchImpl: async () => { fetchCalls += 1; return pendingResponse; } });

  const first = harness.submitForm();
  await harness.submitForm();
  assert.equal(fetchCalls, 1);
  assert.equal(harness.status.dataset.state, 'loading');
  resolveFetch(jsonResponse());
  await first;
  assert.equal(harness.status.dataset.state, 'success');
});
