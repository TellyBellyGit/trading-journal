import { emailService } from '../src/services/emailService';
import { logger } from '../src/utils/logger';

async function testEmailService() {
  logger.info('Testing email service configuration...');
  
  // Test configuration
  const configValid = await emailService.testConfiguration();
  
  if (!configValid) {
    logger.error('❌ Email service configuration failed');
    logger.info('Please ensure SENDGRID_API_KEY is set in your .env file');
    return;
  }
  
  logger.info('✅ Email service configuration appears valid');
  
  // Test sending a simple email (optional - comment out if you don't want to send)
  /*
  try {
    const sent = await emailService.sendEmailVerification(
      'test@example.com',
      'Test User',
      'test-token-123'
    );
    
    if (sent) {
      logger.info('✅ Test email sent successfully');
    } else {
      logger.error('❌ Test email failed to send');
    }
  } catch (error) {
    logger.error('❌ Test email error:', error);
  }
  */
}

testEmailService().then(() => {
  process.exit(0);
}).catch((error) => {
  logger.error('Test script failed:', error);
  process.exit(1);
});