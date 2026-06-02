import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  let transporter;

  // Check if SMTP configs exist in environment
  const isSMTPConfigured = 
    process.env.SMTP_HOST && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS;

  if (isSMTPConfigured) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback using Ethereal Test Account
    console.warn('SMTP settings not fully configured in .env. Creating temporary Ethereal test mailbox...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (etherealErr) {
      console.error('Failed to create Ethereal test account:', etherealErr.message);
      // Create a dummy mock transport that just prints success
      transporter = {
        sendMail: async (mailOpts) => {
          console.log(`[MOCK EMAIL SERVICE] Sending mail to: ${mailOpts.to}`);
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }

  const fromAddress = process.env.SMTP_FROM || 
    (process.env.SMTP_USER && process.env.SMTP_USER.includes('@') 
      ? `"CloudVault" <${process.env.SMTP_USER}>` 
      : '"CloudVault" <onboarding@resend.dev>');

  const mailOptions = {
    from: fromAddress,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  
  if (!isSMTPConfigured && typeof nodemailer.getTestMessageUrl === 'function') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Ethereal Verification Link] Preview email at: ${previewUrl}`);
    }
  }
  
  return info;
};
