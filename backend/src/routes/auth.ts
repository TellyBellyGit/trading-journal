import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PasswordUtils, JWTUtils, PasswordValidator, EmailValidator } from '../utils/auth';
import { authenticateToken } from '../middleware/auth';
import SubscriptionService from '../services/subscriptionService';

const router = express.Router();
const prisma = new PrismaClient();

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

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        timezone: timezone || 'UTC'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        timezone: true,
        isActive: true,
        createdAt: true
      }
    });

    // Generate tokens
    const token = JWTUtils.generateToken({
      userId: user.id,
      email: user.email
    });

    const refreshToken = JWTUtils.generateRefreshToken({
      userId: user.id,
      email: user.email
    });

    // Create free subscription for new user
    try {
      await SubscriptionService.createFreeSubscription(user.id, user.email);
    } catch (subscriptionError) {
      console.error('Error creating free subscription:', subscriptionError);
      // Don't fail the registration if subscription creation fails
    }

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await PasswordUtils.comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const token = JWTUtils.generateToken({
      userId: user.id,
      email: user.email
    });

    const refreshToken = JWTUtils.generateRefreshToken({
      userId: user.id,
      email: user.email
    });

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
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

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  // For JWT, logout is primarily handled client-side by removing the token
  // In a production app, you might maintain a blacklist of revoked tokens
  res.json({
    message: 'Logout successful'
  });
});

export default router;