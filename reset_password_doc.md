# Password Reset Flow Documentation

This document outlines the complete password reset flow implementation in the Trading Journal application.

## 1. Reset Link Creation (`POST /api/auth/forgot-password`)

When a user requests password reset:
- **Token Generation**: `generateSecureToken()` creates a 32-byte random hex token
- **Token Hashing**: Token is hashed with SHA-256 before storing in database
- **Database Storage**: `passwordResetToken` (hashed) and `passwordResetExpires` (15 minutes) saved to user record
- **Email Sent**: Reset link containing the **original unhashed token** is emailed via `emailService.sendPasswordReset()`

## 2. After User Clicks Reset Link

### Frontend (`ResetPassword.tsx`)
1. Extracts token from URL query parameter
2. **Token Validation**: Calls `GET /api/auth/validate-reset-token/:token` to verify token is valid
3. If valid, shows password reset form with user info
4. On form submit, calls `POST /api/auth/reset-password` with token and new password

### Backend Token Validation (`GET /api/auth/validate-reset-token/:token`)
1. Hashes the incoming token with SHA-256 
2. Searches database for user with matching hashed token and unexpired `passwordResetExpires`
3. Returns user info if valid, error if invalid/expired

### Backend Password Reset (`POST /api/auth/reset-password`)
1. Hashes incoming token and finds matching user
2. Validates new password meets security requirements
3. Ensures new password differs from current password
4. Updates user record:
   - Sets new hashed password
   - Clears `passwordResetToken` and `passwordResetExpires`
   - Resets `loginAttempts` to 0 and clears `lockedUntil` (unlocks account)

## Security Features

- **15-minute expiration** for reset tokens
- **Token hashing** prevents database compromise from revealing reset tokens
- **Account unlocking** on successful password reset
- **Email notifications** with branded HTML templates
- **Rate limiting** on reset requests

## Key Files

- `backend/src/routes/auth.ts` - Authentication endpoints
- `frontend/src/components/auth/ResetPassword.tsx` - Reset password UI
- `frontend/src/components/auth/ForgotPassword.tsx` - Forgot password UI
- `backend/src/services/emailService.ts` - Email service for notifications
- `backend/src/utils/tokenUtils.ts` - Token generation utilities