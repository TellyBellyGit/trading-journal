import { Resend } from 'resend';
import { logger } from '../utils/logger';

// Configure Resend with fallback for missing API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

class EmailService {
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
    this.fromName = process.env.FROM_NAME || 'Trading Journal';
  }

  /**
   * Send a generic email using Resend
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    console.log('🔍 EMAIL DEBUG: Starting sendEmail function');
    console.log('🔍 EMAIL DEBUG: RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('🔍 EMAIL DEBUG: RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
    console.log('🔍 EMAIL DEBUG: RESEND_API_KEY starts with re_:', process.env.RESEND_API_KEY?.startsWith('re_') || false);
    console.log('🔍 EMAIL DEBUG: resend object exists:', !!resend);
    
    try {
      if (!resend || !process.env.RESEND_API_KEY) {
        console.log('❌ EMAIL DEBUG: Missing Resend API key or resend object');
        logger.warning('Resend API key not configured, skipping email send', undefined);
        console.log('📧 Email would be sent:', {
          to: emailData.to,
          subject: emailData.subject,
          from: `${this.fromName} <${this.fromEmail}>`
        });
        return true; // Return true in development so registration doesn't fail
      }

      console.log('✅ EMAIL DEBUG: Resend configured, preparing to send email');
      console.log('🔍 EMAIL DEBUG: Email recipient:', emailData.to);
      console.log('🔍 EMAIL DEBUG: Email subject:', emailData.subject);

      const emailOptions: any = {
        from: emailData.from || `${this.fromName} <${this.fromEmail}>`,
        to: [emailData.to],
        subject: emailData.subject,
      };

      if (emailData.html) {
        emailOptions.html = emailData.html;
        console.log('🔍 EMAIL DEBUG: HTML content length:', emailData.html.length);
      }
      if (emailData.text) {
        emailOptions.text = emailData.text;
        console.log('🔍 EMAIL DEBUG: Text content length:', emailData.text.length);
      }

      console.log('🔍 EMAIL DEBUG: Final email options:', {
        from: emailOptions.from,
        to: emailOptions.to,
        subject: emailOptions.subject,
        hasHtml: !!emailOptions.html,
        hasText: !!emailOptions.text
      });

      console.log('📤 EMAIL DEBUG: Calling resend.emails.send...');
      const result = await resend.emails.send(emailOptions);
      console.log('📥 EMAIL DEBUG: Resend API response:', result);
      
      if (result.error) {
        console.log('❌ EMAIL DEBUG: Resend returned error:', result.error);
        logger.error('Resend email error', result.error, undefined);
        return false;
      }

      console.log('✅ EMAIL DEBUG: Email sent successfully!');
      console.log('🔍 EMAIL DEBUG: Success result:', result);
      logger.info(`Email sent successfully to ${emailData.to}`, undefined);
      return true;
    } catch (error) {
      console.log('❌ EMAIL DEBUG: Exception occurred:', error);
      console.log('🔍 EMAIL DEBUG: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      logger.error('Failed to send email via Resend', error, undefined);
      return false;
    }
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(
    email: string, 
    firstName: string, 
    verificationToken: string
  ): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?verify=email&token=${verificationToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Trading Journal</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">📊 Trading Journal</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #1a202c; margin-bottom: 24px; font-size: 24px; font-weight: 600;">Welcome ${firstName}! 🎉</h2>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Thank you for registering with Trading Journal. To complete your registration and start tracking your trades, please verify your email address.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(66, 153, 225, 0.3); transition: all 0.2s;">
              ✅ Verify Email Address
            </a>
          </div>
          
          <div style="background: #f7fafc; border-left: 4px solid #4299e1; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="color: #2d3748; font-size: 14px; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #4299e1; word-break: break-all; font-family: monospace;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 24px;">
            <p style="color: #718096; font-size: 14px; margin: 0; line-height: 1.5;">
              This verification link will expire in <strong>24 hours</strong>. If you didn't create an account with Trading Journal, you can safely ignore this email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px; color: #a0aec0; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Trading Journal. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Welcome to Trading Journal, ${firstName}!

Thank you for registering. To complete your registration and start tracking your trades, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with Trading Journal, you can safely ignore this email.

© ${new Date().getFullYear()} Trading Journal. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: '📊 Welcome to Trading Journal - Verify Your Email',
      html: htmlContent,
      text: textContent
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    email: string, 
    firstName: string, 
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Trading Journal</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🔐 Trading Journal</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #1a202c; margin-bottom: 24px; font-size: 24px; font-weight: 600;">Password Reset Request</h2>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hello ${firstName},</p>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset your password for your Trading Journal account. If you made this request, click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(229, 62, 62, 0.3);">
              🔐 Reset Password
            </a>
          </div>
          
          <div style="background: #f7fafc; border-left: 4px solid #e53e3e; padding: 16px; border-radius: 4px; margin: 24px 0;">
            <p style="color: #2d3748; font-size: 14px; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #e53e3e; word-break: break-all; font-family: monospace;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background: #fff5f5; border: 1px solid #fed7d7; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; color: #c53030; font-size: 14px; line-height: 1.5;">
              ⚠️ <strong>Security Notice:</strong> This reset link will expire in <strong>15 minutes</strong>. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px; color: #a0aec0; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Trading Journal. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Password Reset Request - Trading Journal

Hello ${firstName},

We received a request to reset your password for your Trading Journal account. If you made this request, click the link below to reset your password:

${resetUrl}

This reset link will expire in 15 minutes.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

© ${new Date().getFullYear()} Trading Journal. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: '🔐 Trading Journal - Reset Your Password',
      html: htmlContent,
      text: textContent
    });
  }

  /**
   * Send account locked notification
   */
  async sendAccountLocked(
    email: string, 
    firstName: string, 
    lockoutMinutes: number = 15
  ): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Temporarily Locked - Trading Journal</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🔒 Trading Journal</h1>
        </div>
        
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #e53e3e; margin-bottom: 24px; font-size: 24px; font-weight: 600;">Account Temporarily Locked</h2>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hello ${firstName},</p>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Your Trading Journal account has been temporarily locked due to multiple failed login attempts.
          </p>
          
          <div style="background: #fed7d7; border: 1px solid #feb2b2; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 1.6;">
              🔒 <strong>Lockout Details:</strong><br>
              • Your account will be automatically unlocked in <strong>${lockoutMinutes} minutes</strong><br>
              • You can try logging in again after this time<br>
              • If you forgot your password, use the "Forgot Password" link
            </p>
          </div>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            If you believe this was unauthorized access to your account, please contact our support team immediately.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password" 
               style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(66, 153, 225, 0.3);">
              🔐 Reset Password
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px; color: #a0aec0; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Trading Journal. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Account Temporarily Locked - Trading Journal

Hello ${firstName},

Your Trading Journal account has been temporarily locked due to multiple failed login attempts.

Lockout Details:
• Your account will be automatically unlocked in ${lockoutMinutes} minutes
• You can try logging in again after this time
• If you forgot your password, use the "Forgot Password" link at ${process.env.FRONTEND_URL || 'http://localhost:5173'}/forgot-password

If you believe this was unauthorized access to your account, please contact our support team immediately.

© ${new Date().getFullYear()} Trading Journal. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: '🔒 Trading Journal - Account Temporarily Locked',
      html: htmlContent,
      text: textContent
    });
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        logger.warning('Resend API key not configured', undefined);
        return false;
      }
      
      // Test with a simple API check (doesn't send an email)
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey.startsWith('re_')) {
        logger.error('Invalid Resend API key format - should start with "re_"');
        return false;
      }
      
      logger.info('Resend configuration appears valid');
      return true;
    } catch (error) {
      logger.error('Resend configuration test failed', error);
      return false;
    }
  }
}

export const emailService = new EmailService();