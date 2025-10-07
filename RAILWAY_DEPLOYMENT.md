# Railway Deployment Guide for Trading Journal

This guide will help you deploy your Trading Journal backend to Railway.

## Prerequisites

1. Railway account (sign up at https://railway.app)
2. GitHub repository with your code
3. PostgreSQL database (Railway provides this)

## Step 1: Prepare Your Repository

Ensure these files are in your repository root:
- ✅ `railway.json` (created)
- ✅ `Dockerfile` (created)
- ✅ `.dockerignore` (created)

## Step 2: Create a New Railway Project

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your trading-journal repository
5. Railway will automatically detect the Dockerfile

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard
2. Click "+ New Service"
3. Select "Database" → "PostgreSQL"
4. Railway will provision a PostgreSQL database

## Step 4: Configure Environment Variables

In your Railway project settings, add these environment variables:

### Required Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
PORT=3002
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_secure_refresh_secret_here
FRONTEND_URL=https://your-frontend-domain.com
```

### Optional Variables (if using these features):
```
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Trading Journal
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID_PRO_MONTHLY=your_stripe_price_id
STRIPE_PRICE_ID_PRO_YEARLY=your_stripe_price_id
```

### Getting DATABASE_URL:
1. Go to your PostgreSQL service in Railway
2. Click on "Variables" tab
3. Copy the `DATABASE_URL` value
4. Add it to your main service environment variables

## Step 5: Deploy

1. Railway will automatically deploy when you push to your main branch
2. Monitor the build logs in Railway dashboard
3. Once deployed, you'll get a public URL like: `https://your-app-name.railway.app`

## Step 6: Test Your Deployment

1. Visit `https://your-app-name.railway.app/api/health`
2. You should see a health check response
3. Test other endpoints as needed

## Common Issues and Solutions

### Issue 1: Database Connection Errors
**Solution:** Ensure DATABASE_URL is correctly set and the PostgreSQL service is running.

### Issue 2: Build Failures
**Solution:** Check the build logs in Railway dashboard. Common issues:
- Missing dependencies in package.json
- TypeScript compilation errors
- Prisma schema issues

### Issue 3: Port Issues
**Solution:** Railway automatically assigns a port. Your app should listen on `process.env.PORT` (already configured in your code).

### Issue 4: CORS Issues
**Solution:** Update your CORS configuration in `backend/src/index.ts` to include your Railway URL:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.com',
    'https://your-app-name.railway.app', // Add this
    process.env.FRONTEND_URL
  ].filter(Boolean),
  // ... rest of config
};
```

## Monitoring and Logs

1. **Logs:** View real-time logs in Railway dashboard
2. **Metrics:** Monitor CPU, memory, and network usage
3. **Health Checks:** Railway automatically monitors `/api/health`

## Scaling and Performance

1. **Vertical Scaling:** Upgrade your Railway plan for more resources
2. **Database:** Consider upgrading PostgreSQL plan for better performance
3. **Caching:** Implement Redis if needed (available as Railway service)

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use strong JWT secrets
3. ✅ Keep dependencies updated
4. ✅ Monitor for security vulnerabilities
5. ✅ Use HTTPS only (Railway provides this automatically)

## Next Steps

1. Set up custom domain (optional)
2. Configure CI/CD for automatic deployments
3. Set up monitoring and alerting
4. Deploy frontend separately (Vercel, Netlify, or Railway)

## Support

If you encounter issues:
1. Check Railway documentation: https://docs.railway.app
2. Railway Discord community
3. GitHub issues in your repository

---

**Note:** This deployment only covers the backend API. You'll need to deploy your frontend separately and update the CORS configuration accordingly.