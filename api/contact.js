'use strict';

const RECIPIENT = 'takumiautolabs@gmail.com';
const MAX_BODY_BYTES = 12_000;
const MAX_MESSAGE_CHARS = 5_000;
const ALLOWED_TOPICS = new Set([
  '',
  'ERP & Business Systems Implementation',
  'Business Process Optimization',
  'Systems Integration',
  'Intelligent Workflow Automation',
  'Not sure yet'
]);

function setJsonHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function send(res, statusCode, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }
  res.statusCode = statusCode;
  return res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
  if (typeof raw === 'string') return JSON.parse(raw);
  return {};
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function respondError(res, statusCode, message) {
  setJsonHeaders(res);
  return send(res, statusCode, { error: message });
}

module.exports = async function contactHandler(req, res) {
  setJsonHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respondError(res, 405, 'Please send this form using the contact page.');
  }

  const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return respondError(res, 415, 'The form request could not be read. Please try again or email us.');
  }

  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return respondError(res, 413, 'The message is too large. Please shorten it and try again.');
  }

  let submitted;
  try {
    submitted = readBody(req);
  } catch (_error) {
    return respondError(res, 400, 'The form details could not be read. Please try again.');
  }

  if (Buffer.byteLength(JSON.stringify(submitted), 'utf8') > MAX_BODY_BYTES) {
    return respondError(res, 413, 'The message is too large. Please shorten it and try again.');
  }

  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) {
    return respondError(res, 400, 'Please check the form details and try again.');
  }

  // Quietly accept automated honeypot submissions without forwarding them.
  if (cleanText(submitted.website, 200)) return send(res, 202, { ok: true });

  const name = cleanText(submitted.name, 100);
  const email = cleanText(submitted.email, 254);
  const business = cleanText(submitted.business, 120);
  const topic = cleanText(submitted.topic, 120);
  const message = cleanText(submitted.message, MAX_MESSAGE_CHARS);
  const consent = submitted.consent === 'yes' || submitted.consent === true;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (name.length < 2 || !emailPattern.test(email) || message.length < 20 || !consent || !ALLOWED_TOPICS.has(topic)) {
    return respondError(res, 400, 'Please check your name, email, message, and consent before submitting.');
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    return respondError(res, 503, 'Email delivery is not configured yet. Please email takumiautolabs@gmail.com directly.');
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeBusiness = escapeHtml(business || 'Not provided');
  const safeTopic = escapeHtml(topic || 'Not specified');
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br>');
  const subjectTopic = topic ? ` · ${topic}` : '';
  const text = [
    'New website enquiry for Takumi AutoLabs',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Business: ${business || 'Not provided'}`,
    `Area of interest: ${topic || 'Not specified'}`,
    '',
    'Message:',
    message
  ].join('\n');

  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from,
        to: [RECIPIENT],
        reply_to: email,
        subject: `Website enquiry${subjectTopic}`,
        text,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>New website enquiry</h2><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Business:</strong> ${safeBusiness}</p><p><strong>Area of interest:</strong> ${safeTopic}</p><p><strong>Message:</strong><br>${safeMessage}</p></div>`
      })
    });

    if (!result.ok) return respondError(res, 502, 'The email service could not deliver your enquiry. Please email us directly.');
    return send(res, 200, { ok: true, message: 'Your enquiry has been submitted.' });
  } catch (_error) {
    return respondError(res, 502, 'The email service is temporarily unavailable. Please email us directly.');
  }
};
