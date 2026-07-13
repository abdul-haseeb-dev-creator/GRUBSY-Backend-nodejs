// services/emailService.js
// Email service for sending transactional emails (password resets, etc.)

import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
let transporter = null;

/**
 * Initialize email transporter with SMTP configuration
 * @returns {Object} Nodemailer transporter instance
 */
function createTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailServiceEnabled = process.env.EMAIL_SERVICE_ENABLED === 'true';
  
  if (!emailServiceEnabled) {
    return null;
  }

  // SMTP configuration from environment variables
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    // Optional: Add TLS options for better security
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
  };

  // Validate required SMTP configuration
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.warn('⚠️ SMTP_USER and SMTP_PASSWORD must be set to send emails');
    return null;
  }

  transporter = nodemailer.createTransport(smtpConfig);
  
  return transporter;
}

/**
 * Send password reset email to merchant
 * @param {string} email - Recipient email address
 * @param {string} resetCode - 6-digit reset code
 * @returns {Promise<boolean>} - Returns true if email sent successfully
 */
async function sendPasswordResetEmail(email, resetCode) {
  try {
    // Check if email service is configured
    const emailServiceEnabled = process.env.EMAIL_SERVICE_ENABLED === 'true';
    
    if (!emailServiceEnabled) {
      // In development/testing, just log the code
      console.log('📧 [EMAIL SERVICE DISABLED] Password reset code for', email, ':', resetCode);
      console.log('💡 To enable email sending, set EMAIL_SERVICE_ENABLED=true and configure SMTP settings');
      return true; // Return true so flow continues in dev
    }

    // Initialize transporter
    const mailTransporter = createTransporter();
    
    if (!mailTransporter) {
      console.warn('⚠️ Email transporter not configured. Logging code instead.');
      console.log('📧 Password reset code for', email, ':', resetCode);
      return true; // Still return true to not break the flow
    }

    // Email configuration
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.FROM_NAME || 'Grubsy Platform';

    // Send email
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Grubsy Password Reset Code',
      html: generateResetEmailHTML(resetCode),
      // Plain text fallback
      text: `You requested to reset your password for your Grubsy merchant account.\n\nYour reset code is: ${resetCode}\n\nThis code will expire in 30 minutes.\n\nIf you didn't request this, please ignore this email.`,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log('✅ Password reset email sent successfully:', {
      to: email,
      messageId: info.messageId,
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    
    // Log the code as fallback so the flow can continue
    console.log('📧 [FALLBACK] Password reset code for', email, ':', resetCode);
    
    // Don't throw - we still want to return success to user for security
    // The code is logged so admin can manually provide it if needed
    return false;
  }
}

/**
 * Generate HTML email template for password reset
 * @param {string} resetCode - 6-digit reset code
 * @returns {string} - HTML email content
 */
function generateResetEmailHTML(resetCode) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .code-box { 
          background: #f4f4f4; 
          border: 2px dashed #333; 
          padding: 20px; 
          text-align: center; 
          font-size: 32px; 
          font-weight: bold; 
          letter-spacing: 5px;
          margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password for your Grubsy merchant account.</p>
        <p>Use the following code to reset your password:</p>
        <div class="code-box">${resetCode}</div>
        <p><strong>This code will expire in 30 minutes.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
        <div class="footer">
          <p>© Grubsy - Food Delivery Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export {
  sendPasswordResetEmail,
  generateResetEmailHTML,
};
