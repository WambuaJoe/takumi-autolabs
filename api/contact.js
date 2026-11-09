'use strict';

const FALLBACK_EMAIL = 'takumiautolabs@gmail.com';
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

function cleanSingleLine(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanMessage(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, '')
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function isValidEmail(value) {
  if (typeof value !== 'string' || value.length > 254) return false;
  const pieces = value.split('@');
  if (pieces.length !== 2) return false;
  const [local, domain] = pieces;
  if (!local || local.length > 64 || !domain || /[\s<>]/u.test(value)) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  const labels = domain.split('.');
  return labels.length >= 2 && labels.every((label) => (
    label.length >= 1 && label.length <= 63 && /^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i.test(label)
  ));
}

function respondError(res, statusCode, message) {
  setJsonHeaders(res);
  return send(res, statusCode, { ok: false, error: message });
}

module.exports = async function contactHandler(req, res) {
  setJsonHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respondError(res, 405, 'Please send this form using the contact page.');
  }

  const contentType = String(req.headers?.['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return respondError(res, 415, 'The form request could not be read. Please try again or email us directly.');
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

  let serialized;
  try {
    serialized = JSON.stringify(submitted);
  } catch (_error) {
    return respondError(res, 400, 'The form details could not be read. Please try again.');
  }
  if (Buffer.byteLength(serialized || '', 'utf8') > MAX_BODY_BYTES) {
    return respondError(res, 413, 'The message is too large. Please shorten it and try again.');
  }

  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) {
    return respondError(res, 400, 'Please check the form details and try again.');
  }

  // Do not send a success response for a trapped bot submission.
  if (cleanSingleLine(submitted.website, 200)) {
    return respondError(res, 400, `Your enquiry could not be sent. Please email ${FALLBACK_EMAIL} directly.`);
  }

  const idempotencyKey = cleanSingleLine(req.headers?.['idempotency-key'], 128);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(idempotencyKey)) {
    return respondError(res, 400, 'Your submission could not be verified. Please refresh the page and try again.');
  }

  const name = cleanSingleLine(submitted.name, 100);
  const email = cleanSingleLine(submitted.email, 254);
  const business = cleanSingleLine(submitted.business, 120);
  const topic = cleanSingleLine(submitted.topic, 120);
  const message = cleanMessage(submitted.message, MAX_MESSAGE_CHARS);
  const consent = submitted.consent === 'yes' || submitted.consent === true;

  if (name.length < 2 || !isValidEmail(email) || message.length < 20 || !consent || !ALLOWED_TOPICS.has(topic)) {
    return respondError(res, 400, 'Please check your name, work email, message, and consent before submitting.');
  }

  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const recipient = String(process.env.CONTACT_EMAIL || '').trim();
  const from = String(process.env.CONTACT_FROM_EMAIL || '').trim();
  if (!apiKey || !isValidEmail(recipient) || !isValidEmail(from)) {
    return respondError(res, 503, `Email delivery is not configured yet. Please email ${FALLBACK_EMAIL} directly.`);
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeBusiness = escapeHtml(business || 'Not provided');
  const safeTopic = escapeHtml(topic || 'Not specified');
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
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
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: email,
        subject: `Website enquiry${subjectTopic}`,
        text,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>New website enquiry</h2><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Business:</strong> ${safeBusiness}</p><p><strong>Area of interest:</strong> ${safeTopic}</p><p><strong>Message:</strong><br>${safeMessage}</p></div>`
      })
    });

    if (!result.ok) {
      return respondError(res, 502, `We could not send your enquiry right now. Please email ${FALLBACK_EMAIL} directly.`);
    }

    let providerResult;
    try {
      providerResult = await result.json();
    } catch (_error) {
      return respondError(res, 502, `We could not confirm delivery. Please email ${FALLBACK_EMAIL} directly.`);
    }
    if (!providerResult || typeof providerResult.id !== 'string' || !providerResult.id) {
      return respondError(res, 502, `We could not confirm delivery. Please email ${FALLBACK_EMAIL} directly.`);
    }

    return send(res, 200, {
      ok: true,
      message: 'Your enquiry has been sent successfully. Takumi AutoLabs will follow up by email.'
    });
  } catch (_error) {
    return respondError(res, 502, `The email service is temporarily unavailable. Please email ${FALLBACK_EMAIL} directly.`);
  }
};
