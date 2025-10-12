// services/mail.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = (process.env.SMTP_SECURE === 'true'); // true for 465, false for 587
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASSWORD;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn('Mail config missing. Please check SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  // optional for dev environments where certificate issues occur:
  // tls: { rejectUnauthorized: false }
});

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('SMTP transporter verified');
  } catch (err) {
    console.error('SMTP transporter verification failed:', err);
  }
};
verifyTransporter();

const sendMail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: SMTP_USER,
    to,
    subject,
    text,
    html,
  };
  return transporter.sendMail(mailOptions);
};

export default { sendMail };
