const nodemailer = require('nodemailer');

// Setup Ethereal Email for safe testing.
// In production, you would replace these with real Outlook SMTP credentials.
let transporter;

async function initTransporter() {
  if (transporter) return transporter;

  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      // Use real SMTP configuration from .env
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('✅ Email service initialized (Production SMTP Mode)');
    } else {
      // Fallback to Ethereal Testing Mode
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log('✅ Email service initialized (Ethereal Testing Mode)');
    }
    
    return transporter;
  } catch (err) {
    console.error('Failed to initialize email transporter:', err);
    throw err;
  }
}

/**
 * Sends an automated reminder email.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} htmlContent - HTML formatted email body.
 */
async function sendReminderEmail(to, subject, htmlContent) {
  try {
    const t = await initTransporter();
    
    const info = await t.sendMail({
      from: '"LabPortal System" <noreply@labportal.local>',
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log(`✉️ Email sent successfully to ${to}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendReminderEmail
};
