const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3003; // Use different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Import auth routes (compiled)
try {
  const authRouter = require('./dist/routes/auth.js').default;
  app.use('/api/auth', authRouter);
} catch (error) {
  console.error('Auth routes not compiled yet. Run npm run build first.');
  process.exit(1);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test Authentication Server' });
});

app.listen(PORT, () => {
  console.log(`🔍 Test server running on http://localhost:${PORT}`);
  console.log(`🔐 Authentication endpoints available`);
});