'use strict';

// Sends a summary email to the project mailbox for every new waitlist entry.
// Configured only through environment variables (see .env.example). Without
// SMTP_HOST and WAITLIST_NOTIFY_TO the notifier is disabled and the waitlist
// keeps working as before. Sending never blocks or fails the form: errors are
// logged without personal data.

function mailConfigFromEnv(env) {
  const host = (env.SMTP_HOST || '').trim();
  const to = (env.WAITLIST_NOTIFY_TO || '').trim();
  const user = (env.SMTP_USER || '').trim();
  const pass = env.SMTP_PASS || '';
  const port = Number(env.SMTP_PORT || 587);
  if (!host && !to) return null;
  if (!host || !to) throw new Error('Configure both SMTP_HOST and WAITLIST_NOTIFY_TO');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SMTP_PORT');
  if (Boolean(user) !== Boolean(pass)) throw new Error('Configure both SMTP_USER and SMTP_PASS');
  const emailRe = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/;
  if (!emailRe.test(to)) throw new Error('Invalid WAITLIST_NOTIFY_TO');
  const from = (env.MAIL_FROM || '').trim() || to;
  if (/[\r\n]/.test(from)) throw new Error('Invalid MAIL_FROM');
  // SMTP_SECURE=true: implicit TLS (usually port 465). Otherwise STARTTLS is required.
  return { host, port, secure: env.SMTP_SECURE === 'true', user, pass, from, to };
}

function summary(entry) {
  return [
    'Nuova iscrizione alla lista d\'attesa di Nutrà.',
    '',
    `Nome: ${entry.name}`,
    `Email: ${entry.email}`,
    `Ruolo: ${entry.role}`,
    `Pazienti: ${entry.patients ?? 'non indicato'}`,
    `Data: ${entry.at}`
  ].join('\n');
}

// `transport` can be injected by tests; production builds an SMTP transport lazily.
function createWaitlistMailer(config, { transport, log } = {}) {
  if (!config) return { enabled: false, async notify() {} };
  let mailer = transport;
  function getTransport() {
    if (mailer) return mailer;
    const nodemailer = require('nodemailer');
    mailer = nodemailer.createTransport({
      host: config.host, port: config.port, secure: config.secure, requireTLS: !config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
    });
    return mailer;
  }
  return {
    enabled: true,
    async notify(entry) {
      try {
        await getTransport().sendMail({
          from: config.from,
          to: config.to,
          // Applicant data is only in the body and Reply-To, never in the subject.
          replyTo: entry.email,
          subject: 'Nuova iscrizione lista d\'attesa Nutrà',
          text: summary(entry)
        });
        if (log) log.info('waitlist_mail_sent');
      } catch (error) {
        if (log) log.error('waitlist_mail_error', { code: error.code || error.name });
      }
    }
  };
}

module.exports = { mailConfigFromEnv, createWaitlistMailer };
