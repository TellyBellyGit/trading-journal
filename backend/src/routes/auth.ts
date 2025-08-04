import express from 'express';
import { PasswordUtils, JWTUtils, PasswordValidator, EmailValidator } from '../utils/auth';
import { authenticateToken } from '../middleware/auth';
import { loginRateLimit, emailVerificationRateLimit, passwordResetRateLimit } from '../middleware/rateLimiting';
import AuthSecurity from '../utils/authSecurity';
import SubscriptionService from '../services/subscriptionService';
import { emailService } from '../services/emailService';
import { generateSecureToken } from '../utils/tokenUtils';
import { prisma } from '../lib/prisma';

const router = express.Router();

// POST /api/auth/check-email
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        available: false
      });
    }

    if (!EmailValidator.validate(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        available: false
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    res.json({
      available: !existingUser,
      email: email.toLowerCase()
    });

  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      available: false
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, timezone } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, firstName, lastName'
      });
    }

    // Validate email format
    if (!EmailValidator.validate(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    const passwordValidation = PasswordValidator.validate(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password validation failed',
        details: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = generateSecureToken();
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24); // 24 hours

    // Create user with email verification fields
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        timezone: timezone || 'UTC',
        emailVerified: false, // New users need to verify email
        emailVerificationToken,
        emailVerificationExpires
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        timezone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Send email verification
    console.log('🔍 REGISTRATION DEBUG: About to send email verification');
    console.log('🔍 REGISTRATION DEBUG: User email:', user.email);
    console.log('🔍 REGISTRATION DEBUG: User firstName:', user.firstName);
    console.log('🔍 REGISTRATION DEBUG: Verification token length:', emailVerificationToken?.length || 0);
    
    try {
      console.log('📤 REGISTRATION DEBUG: Calling emailService.sendEmailVerification...');
      const emailResult = await emailService.sendEmailVerification(
        user.email,
        user.firstName,
        emailVerificationToken
      );
      console.log('📥 REGISTRATION DEBUG: Email service returned:', emailResult);
      
      if (emailResult) {
        console.log('✅ REGISTRATION DEBUG: Email verification sent successfully');
      } else {
        console.log('❌ REGISTRATION DEBUG: Email service returned false');
      }
    } catch (emailError) {
      console.error('❌ REGISTRATION DEBUG: Exception sending verification email:', emailError);
      console.error('🔍 REGISTRATION DEBUG: Error details:', {
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : 'No stack trace'
      });
      // Continue with registration even if email fails
    }

    // Create free subscription for new user
    try {
      await SubscriptionService.createFreeSubscription(user.id, user.email);
    } catch (subscriptionError) {
      console.error('Error creating free subscription:', subscriptionError);
      // Don't fail the registration if subscription creation fails
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account before logging in.',
      user,
      requiresEmailVerification: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});

// POST /api/auth/login - Enhanced with security features
router.post('/login', loginRateLimit, async (req, res) => {
  const loginStartTime = Date.now();
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  console.log(`🔐 [LOGIN-TIMING] Login started at ${new Date().toISOString()}`);

  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        type: 'validation_error'
      });
    }

    // Validate email format
    if (!EmailValidator.validate(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address',
        type: 'validation_error'
      });
    }

    const validationEndTime = Date.now();
    console.log(`🔐 [LOGIN-TIMING] Validation completed in ${validationEndTime - loginStartTime}ms`);

    // Find user
    const dbQueryStartTime = Date.now();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isAdmin: true,
        emailVerified: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        loginAttempts: true,
        lockedUntil: true,
        lastLogin: true
      }
    });
    const dbQueryEndTime = Date.now();
    console.log(`🔐 [LOGIN-TIMING] Database user lookup completed in ${dbQueryEndTime - dbQueryStartTime}ms`);

    // Always check password even if user doesn't exist (timing attack prevention)
    const passwordStartTime = Date.now();
    const dummyPassword = '$2a$12$dummy.hash.to.prevent.timing.attacks.and.user.enumeration';
    const isValidPassword = user 
      ? await PasswordUtils.comparePassword(password, user.password)
      : await PasswordUtils.comparePassword(password, dummyPassword);
    const passwordEndTime = Date.now();
    console.log(`🔐 [LOGIN-TIMING] Password verification completed in ${passwordEndTime - passwordStartTime}ms`);

    if (!user) {
      // Record failed attempt for non-existent user (async - don't wait)
      prisma.loginHistory.create({
        data: {
          userId: 0, // Special ID for non-existent users
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'user_not_found'
        }
      }).catch(() => {}); // Don't fail login if logging fails

      return res.status(401).json({
        error: 'Invalid email or password',
        type: 'authentication_error'
      });
    }

    // Check if account is locked (inline check instead of separate query)
    const isLocked = user.lockedUntil && new Date() <= user.lockedUntil;
    if (isLocked) {
      // Record attempt async - don't wait
      prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'account_locked'
        }
      }).catch(() => {});

      return res.status(423).json({
        error: 'Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.',
        type: 'account_locked',
        retryAfter: 15 * 60 // 15 minutes in seconds
      });
    }

    // Check if user is active
    if (!user.isActive) {
      await AuthSecurity.recordFailedAttempt(user.id, ipAddress, userAgent, 'account_inactive');
      return res.status(401).json({
        error: 'Account is deactivated. Please contact support.',
        type: 'account_inactive'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      await AuthSecurity.recordFailedAttempt(user.id, ipAddress, userAgent, 'email_unverified');
      return res.status(401).json({
        error: 'Please verify your email address before logging in. Check your inbox for a verification link.',
        type: 'email_unverified',
        canResendVerification: true
      });
    }

    // Verify password
    if (!isValidPassword) {
      const failureResult = await AuthSecurity.recordFailedAttempt(user.id, ipAddress, userAgent, 'invalid_password');
      return res.status(401).json({
        error: failureResult.error || 'Invalid email or password',
        type: failureResult.isLocked ? 'account_locked' : 'authentication_error',
        attemptsRemaining: failureResult.attemptsRemaining,
        retryAfter: failureResult.lockoutMinutes ? failureResult.lockoutMinutes * 60 : undefined
      });
    }

    // Successful login - record it and reset attempts
    const securityLoggingStartTime = Date.now();
    await AuthSecurity.recordSuccessfulLogin(user.id, ipAddress, userAgent);
    const securityLoggingEndTime = Date.now();
    console.log(`🔐 [LOGIN-TIMING] Security logging completed in ${securityLoggingEndTime - securityLoggingStartTime}ms`);

    // Generate tokens
    const tokenStartTime = Date.now();
    const token = JWTUtils.generateToken({
      userId: user.id,
      email: user.email
    });

    const refreshToken = JWTUtils.generateRefreshToken({
      userId: user.id,
      email: user.email
    });
    const tokenEndTime = Date.now();
    console.log(`🔐 [LOGIN-TIMING] Token generation completed in ${tokenEndTime - tokenStartTime}ms`);

    // Return user data (excluding password)
    const { password: _, loginAttempts, lockedUntil, ...userWithoutPassword } = user;

    const totalTime = Date.now() - loginStartTime;
    console.log(`🔐 [LOGIN-TIMING] ✅ LOGIN COMPLETED - Total time: ${totalTime}ms`);

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // Try to log the error attempt if we have user info
    if (req.body?.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: req.body.email.toLowerCase() },
          select: { id: true }
        });
        if (user) {
          await AuthSecurity.recordFailedAttempt(user.id, ipAddress, userAgent, 'server_error');
        }
      } catch (logError) {
        // Ignore logging errors
      }
    }

    res.status(500).json({
      error: 'Authentication service temporarily unavailable. Please try again.',
      type: 'server_error'
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        timezone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /api/auth/initial-data - Get combined user data, subscription, and basic stats for fast loading
router.get('/initial-data', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.userId;

    // Execute all queries in parallel for maximum performance
    const [user, subscription, basicStats] = await Promise.all([
      // User data
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          timezone: true,
          isActive: true,
          isAdmin: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      
      // Subscription data
      prisma.subscription.findUnique({
        where: { userId },
        select: {
          plan: true,
          status: true,
          tradeCount: true,
          maxTrades: true,
          currentPeriodEnd: true,
          periodStartDate: true
        }
      }),
      
      // Basic stats (minimal dashboard data)
      prisma.trade.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { pnl: true }
      })
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate basic subscription info
    let subscriptionData = null;
    if (subscription) {
      const usagePercentage = subscription.maxTrades > 0 
        ? Math.round((subscription.tradeCount / subscription.maxTrades) * 100)
        : 0;
        
      subscriptionData = {
        ...subscription,
        usagePercentage,
        isOverLimit: subscription.tradeCount > subscription.maxTrades
      };
    }

    // Basic stats
    const statsData = {
      totalTrades: basicStats._count.id || 0,
      totalPnL: basicStats._sum.pnl || 0
    };

    res.json({
      user,
      subscription: subscriptionData,
      stats: statsData
    });

  } catch (error) {
    console.error('Get initial data error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = JWTUtils.verifyToken(refreshToken);

    // Generate new access token
    const newToken = JWTUtils.generateToken({
      userId: decoded.userId,
      email: decoded.email
    });

    res.json({
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid refresh token'
    });
  }
});

// POST /api/auth/verify-email - Verify email address
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required',
        type: 'validation_error'
      });
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date() // Token must not be expired
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token. Please request a new verification email.',
        type: 'invalid_token'
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        message: 'Email address is already verified',
        type: 'already_verified'
      });
    }

    // Verify the email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    res.json({
      message: 'Email address verified successfully! You can now log in.',
      type: 'verification_success'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Email verification service temporarily unavailable. Please try again.',
      type: 'server_error'
    });
  }
});

// POST /api/auth/resend-verification - Resend email verification
router.post('/resend-verification', emailVerificationRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email address is required',
        type: 'validation_error'
      });
    }

    if (!EmailValidator.validate(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address',
        type: 'validation_error'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
        isActive: true
      }
    });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        message: 'If an account with this email exists and requires verification, a new verification email has been sent.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Email address is already verified',
        type: 'already_verified'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        error: 'Account is deactivated. Please contact support.',
        type: 'account_inactive'
      });
    }

    // Generate new verification token
    const emailVerificationToken = generateSecureToken();
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires
      }
    });

    // Send verification email
    try {
      await emailService.sendEmailVerification(
        user.email,
        user.firstName,
        emailVerificationToken
      );
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res.status(500).json({
        error: 'Failed to send verification email. Please try again later.',
        type: 'email_service_error'
      });
    }

    res.json({
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Email verification service temporarily unavailable. Please try again.',
      type: 'server_error'
    });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', passwordResetRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email address is required',
        type: 'validation_error'
      });
    }

    if (!EmailValidator.validate(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address',
        type: 'validation_error'
      });
    }

    // Find user (but don't reveal if user exists)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
        isActive: true
      }
    });

    // Always return success message to prevent user enumeration
    const standardResponse = {
      message: 'If an account with this email exists, a password reset link has been sent.'
    };

    if (!user) {
      // Log attempted reset for non-existent user
      console.log(`Password reset attempted for non-existent user: ${email}`);
      return res.json(standardResponse);
    }

    if (!user.emailVerified) {
      // Log attempted reset for unverified user but don't reveal this
      console.log(`Password reset attempted for unverified user: ${email}`);
      return res.json(standardResponse);
    }

    if (!user.isActive) {
      // Log attempted reset for inactive user but don't reveal this
      console.log(`Password reset attempted for inactive user: ${email}`);
      return res.json(standardResponse);
    }

    // Generate secure reset token
    const resetToken = generateSecureToken();
    const resetExpires = new Date();
    resetExpires.setMinutes(resetExpires.getMinutes() + 15); // 15 minutes

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // Send password reset email
    try {
      await emailService.sendPasswordReset(
        user.email,
        user.firstName,
        resetToken
      );
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails
    }

    res.json(standardResponse);

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Password reset service temporarily unavailable. Please try again.',
      type: 'server_error'
    });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Reset token and new password are required',
        type: 'validation_error'
      });
    }

    // Validate password strength
    const passwordValidation = PasswordValidator.validate(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'New password does not meet security requirements',
        type: 'validation_error',
        details: passwordValidation.errors
      });
    }

    // Hash the token to match stored format (admin-generated tokens are hashed)
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date() // Token must not be expired
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        password: true,
        emailVerified: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token. Please request a new password reset.',
        type: 'invalid_token'
      });
    }

    if (!user.emailVerified) {
      return res.status(400).json({
        error: 'Email address must be verified before resetting password.',
        type: 'email_unverified'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        error: 'Account is deactivated. Please contact support.',
        type: 'account_inactive'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await PasswordUtils.comparePassword(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'New password must be different from your current password',
        type: 'validation_error'
      });
    }

    // Hash new password
    const hashedNewPassword = await PasswordUtils.hashPassword(newPassword);

    // Update password and clear reset token, also unlock account if locked
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        loginAttempts: 0, // Reset failed login attempts
        lockedUntil: null, // Unlock account
        updatedAt: new Date()
      }
    });

    // Log successful password reset
    console.log(`Password reset successful for user: ${user.email}`);

    res.json({
      message: 'Password reset successful! You can now log in with your new password.',
      type: 'reset_success'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Password reset service temporarily unavailable. Please try again.',
      type: 'server_error'
    });
  }
});

// GET /api/auth/validate-reset-token - Validate password reset token
router.get('/validate-reset-token/:token', async (req, res) => {
  console.log('🔍 TOKEN VALIDATION - Token:', req.params.token?.substring(0, 8) + '... [v1.1]');
  
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Reset token is required',
        type: 'validation_error',
        debug: { version: 'v1.1', timestamp: new Date().toISOString() }
      });
    }

    // Hash the token to match stored format (admin-generated tokens are hashed)
    const crypto = await import('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    console.log('🔍 TOKEN LOOKUP - Hashed token:', hashedToken.substring(0, 8) + '... [v1.1]');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
        isActive: true,
        passwordResetExpires: true,
        passwordResetToken: true
      }
    });

    if (!user) {
      console.log('🔍 TOKEN NOT FOUND - No matching user [v1.1]');
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        type: 'invalid_token',
        valid: false,
        debug: {
          version: 'v1.1',
          rawToken: token.substring(0, 8) + '...',
          hashedToken: hashedToken.substring(0, 8) + '...',
          currentTime: new Date().toISOString(),
          userFound: false,
          message: 'No user record found with matching passwordResetToken'
        }
      });
    }

    if (!user.emailVerified || !user.isActive) {
      console.log('🔍 ACCOUNT ISSUES - User found but account invalid [v1.1]');
      return res.status(400).json({
        error: 'Account cannot reset password at this time',
        type: 'account_error',
        valid: false,
        debug: { version: 'v1.1', emailVerified: user.emailVerified, isActive: user.isActive }
      });
    }

    // Calculate remaining time
    const now = new Date();
    const expiresAt = new Date(user.passwordResetExpires!);
    const remainingMinutes = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60));

    console.log('🔍 TOKEN VALID - User found, sending success response [v1.1]');

    res.json({
      valid: true,
      email: user.email,
      firstName: user.firstName,
      expiresInMinutes: remainingMinutes,
      type: 'token_valid',
      debug: { version: 'v1.1', userId: user.id, remainingMinutes }
    });

  } catch (error) {
    console.error('🔍 TOKEN VALIDATION ERROR [v1.1]:', error);
    res.status(500).json({
      error: 'Token validation service temporarily unavailable',
      type: 'server_error',
      valid: false,
      debug: { version: 'v1.1', error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  // For JWT, logout is primarily handled client-side by removing the token
  // In a production app, you might maintain a blacklist of revoked tokens
  res.json({
    message: 'Logout successful'
  });
});

// PATCH /api/auth/profile - Update user profile (name)
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName } = req.body;

    // Validate input
    if (!firstName || !lastName) {
      return res.status(400).json({
        error: 'Both firstName and lastName are required'
      });
    }

    // Validate name format (basic validation)
    if (firstName.trim().length < 1 || lastName.trim().length < 1) {
      return res.status(400).json({
        error: 'Names cannot be empty'
      });
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({
        error: 'Names cannot exceed 50 characters'
      });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        updatedAt: true
      }
    });

    console.log(`User ${updatedUser.email} updated their profile name to: ${updatedUser.firstName} ${updatedUser.lastName}`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;