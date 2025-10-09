import express from 'express';
import { authenticateToken } from '../middleware/auth';
import OpenAI from 'openai';

const router = express.Router();

// Lazy DeepSeek client creation (avoids startup crash before envs load)
const getDeepseekClient = (): OpenAI => {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return new OpenAI({
    apiKey: key,
    baseURL: 'https://api.deepseek.com',
  });
};

// Helper: Verify AI configuration before attempting requests
const isAIConfigured = (): boolean => {
  const key = process.env.OPENAI_API_KEY?.trim();
  // Treat missing/placeholder keys as not configured
  if (!key || key.length === 0) return false;
  if (key.toLowerCase() === 'fake_dev_key') return false;
  return true;
};

// Professional trading analysis prompt
const ANALYSIS_PROMPT = `You are a professional trading mentor with 20+ years of experience. Analyze this trade with the depth, honesty, and expertise of a seasoned professional who has mentored hundreds of traders.

**CRITICAL REQUIREMENTS:**
- Be brutally honest about process vs outcomes
- A profitable trade with poor process is a "BAD TRADE" 
- Identify subtle psychological patterns and their cascading effects
- Connect setup quality to execution and risk management
- Explain why profitable trades can reinforce bad habits
- Provide specific, actionable advice with concrete examples
- Use professional trading terminology
- Address each section systematically
- Call out contradictions (e.g., claims of following plan but lists mistakes)

**ANALYSIS STRUCTURE:**
Format your response as clean HTML with proper headers and structure:

<h1>Trade Analysis &amp; Assessment</h1>
<p><strong>Overall Trade Quality:</strong> [Quality Rating] - [Brief assessment]</p>

<h2>Section-by-Section Breakdown</h2>

<h3>I. SETUP &amp; CONTEXT</h3>
<p><strong>Strengths:</strong></p>
<ul>[List specific strengths with context]</ul>
<p><strong>Weaknesses:</strong></p>
<ul>[List specific weaknesses with detailed explanations]</ul>
<p><strong>Verdict:</strong> [Section assessment]</p>

<h3>II. RISK &amp; MONEY MANAGEMENT</h3>
<p><strong>Strengths:</strong></p>
<ul>[Analyze position sizing, R:R ratios, leverage]</ul>
<p><strong>Weaknesses:</strong></p>
<ul>[Risk management flaws]</ul>
<p><strong>Verdict:</strong> [Section assessment]</p>

<h3>III. EXECUTION &amp; TRADE MANAGEMENT</h3>
<p><strong>Strengths:</strong></p>
<ul>[Order types, fills, exits, plan adherence]</ul>
<p><strong>Weaknesses:</strong></p>
<ul>[Execution problems]</ul>
<p><strong>Verdict:</strong> [Section assessment]</p>

<h3>IV. RESULTS &amp; STATISTICS</h3>
<p><strong>Analysis:</strong></p>
<p>[Analyze P&L, MFE/MAE, plan adherence. Explain why profitable ≠ good if applicable]</p>
<p><strong>Verdict:</strong> [What the numbers really tell us]</p>

<h3>V. PSYCHOLOGY &amp; REVIEW</h3>
<p><strong>Analysis:</strong></p>
<p>[Connect mindset → emotions → decisions → outcomes. Praise honest self-assessment]</p>
<p><strong>Verdict:</strong> [Psychological assessment]</p>

<h2>Final Summary: Good Trade or Bad Trade?</h2>
<p>[Definitive verdict with reasoning]</p>
<p><strong>Why?</strong> [Detailed explanation]</p>
<p><strong>The Key Lesson:</strong> [Primary takeaway]</p>
<p><strong>Your Next Step:</strong> [Specific actionable advice]</p>

**TONE:** Professional, direct, educational. Like a mentor who cares about the trader's long-term success more than their feelings.

**TRADE DATA:**`;

// Bulk trading analysis prompt for portfolio insights
const BULK_ANALYSIS_PROMPT = `You are a professional trading mentor with 20+ years of experience. Analyze this collection of trades to provide insights into the trader's overall performance as an intraday trader.

**CRITICAL REQUIREMENTS:**
- Focus on patterns, strengths, and weaknesses across all trades
- Identify recurring mistakes and successful strategies
- Provide specific, actionable advice for improvement
- Use professional trading terminology
- Be honest about areas needing improvement

**ANALYSIS STRUCTURE:**
Format your response as clean HTML with proper headers and structure:

<h1>Portfolio Trading Analysis</h1>
<p><strong>Analysis Period:</strong> [Date Range]</p>
<p><strong>Total Trades Analyzed:</strong> [Number]</p>

<h2>Overall Performance Summary</h2>
<p>[High-level assessment of trading performance]</p>

<h3>Key Strengths</h3>
<ul>[List specific strengths with examples]</ul>

<h3>Areas for Improvement</h3>
<ul>[List specific weaknesses with detailed explanations]</ul>

<h2>Pattern Analysis</h2>

<h3>Winning Trades Characteristics</h3>
<p>[Analyze what makes their winning trades successful]</p>

<h3>Losing Trades Patterns</h3>
<p>[Identify common mistakes in losing trades]</p>

<h3>Risk Management Assessment</h3>
<p>[Evaluate position sizing, stop losses, risk-reward ratios]</p>

<h2>Trading Psychology Insights</h2>
<p>[Analyze emotional patterns, discipline, consistency]</p>

<h2>Actionable Recommendations</h2>
<ol>[Prioritized list of specific improvements]</ol>

<h2>Next Steps</h2>
<p><strong>Immediate Focus:</strong> [Top priority improvement]</p>
<p><strong>Long-term Goal:</strong> [Strategic development area]</p>

**TONE:** Professional, constructive, focused on growth and improvement.

**TRADES DATA:**`;

router.post('/analyze-trade', authenticateToken, async (req, res) => {
  console.log('🎯 analyze-trade endpoint hit by user', req.user?.userId);
  
  try {
    // Fail fast if AI service is not configured
    if (!isAIConfigured()) {
      console.error('🔧 AI service not configured: missing or placeholder OPENAI_API_KEY');
      return res.status(500).json({
        error: 'AI service configuration error',
        details: 'Set a valid DeepSeek API key in OPENAI_API_KEY and restart the server.'
      });
    }

    const tradeData = req.body;
    console.log('📊 Trade data received:', Object.keys(tradeData).length, 'fields');
    
    // Validate required fields
    if (!tradeData || Object.keys(tradeData).length === 0) {
      console.log('❌ No trade data provided');
      return res.status(400).json({ 
        error: 'Trade data is required' 
      });
    }

    // Create the full prompt with trade data
    const fullPrompt = ANALYSIS_PROMPT + '\n\n' + JSON.stringify(tradeData, null, 2);

    console.log('🧠 Starting AI trade analysis for user', req.user?.userId);
    
    // Call DeepSeek API
    const deepseek = getDeepseekClient();
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat", // DeepSeek's chat model
      messages: [
        {
          role: "system", 
          content: "You are a professional trading mentor. Analyze trades with brutal honesty and deep expertise."
        },
        {
          role: "user", 
          content: fullPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7, // Some creativity for varied analysis
    });

    const analysis = completion.choices[0]?.message?.content;
    
    if (!analysis) {
      throw new Error('No analysis generated');
    }

    console.log('✅ AI analysis completed successfully');
    console.log('📤 Response length:', analysis.length, 'characters');
    
    const responseData = { 
      analysis: analysis.trim(),
      timestamp: new Date().toISOString(),
      model: "deepseek-chat"
    };
    
    console.log('📤 Sending response:', JSON.stringify(responseData).substring(0, 200) + '...');
    res.json(responseData);

  } catch (error: any) {
    console.error('❌ AI analysis error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack?.substring(0, 500)
    });
    
    // Provide helpful error messages
    if (error.code === 'invalid_api_key') {
      console.error('🔑 Invalid API key error');
      return res.status(500).json({ 
        error: 'AI service configuration error' 
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      console.error('⏰ Rate limit exceeded');
      return res.status(429).json({ 
        error: 'Analysis service temporarily busy. Please try again in a moment.' 
      });
    }

    console.error('💥 Generic error, sending 500 response');
    res.status(500).json({ 
      error: 'Failed to analyze trade. Please try again.' 
    });
  }
});

// Bulk trades analysis endpoint
router.post('/analyze-trades', authenticateToken, async (req, res) => {
  console.log('🎯 analyze-trades endpoint hit by user', req.user?.userId);
  
  try {
    // Fail fast if AI service is not configured
    if (!isAIConfigured()) {
      console.error('🔧 AI service not configured: missing or placeholder OPENAI_API_KEY');
      return res.status(500).json({
        error: 'AI service configuration error',
        details: 'Set a valid DeepSeek API key in OPENAI_API_KEY and restart the server.'
      });
    }

    const { trades } = req.body;
    console.log('📊 Trades data received:', trades?.length || 0, 'trades');
    
    // Validate required fields
    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      console.log('❌ No trades data provided');
      return res.status(400).json({ 
        error: 'Trades array is required and cannot be empty' 
      });
    }

    // Create summary for the prompt
    const tradeSummary = trades.map((trade, index) => ({
      tradeNumber: index + 1,
      symbol: trade.symbol,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      pnl: trade.pnl,
      percentChange: trade.percentChange,
      entryDate: trade.entryDate,
      exitDate: trade.exitDate,
      duration: trade.duration,
      assessment: trade.assessment || 'No assessment provided'
    }));

    // Create the full prompt with trades data
    const fullPrompt = BULK_ANALYSIS_PROMPT + '\n\n' + JSON.stringify(tradeSummary, null, 2);

    console.log('🧠 Starting AI bulk trades analysis for user', req.user?.userId);
    
    // Call DeepSeek API
    const deepseek = getDeepseekClient();
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system", 
          content: "You are a professional trading mentor. Analyze trading portfolios with deep expertise and provide actionable insights."
        },
        {
          role: "user", 
          content: fullPrompt
        }
      ],
      max_tokens: 3000, // More tokens for bulk analysis
      temperature: 0.7,
    });

    const analysis = completion.choices[0]?.message?.content;
    
    if (!analysis) {
      throw new Error('No analysis generated');
    }

    console.log('✅ AI bulk analysis completed successfully');
    console.log('📤 Response length:', analysis.length, 'characters');
    
    const responseData = { 
      analysis: analysis.trim(),
      timestamp: new Date().toISOString(),
      model: "deepseek-chat",
      tradesAnalyzed: trades.length
    };
    
    res.json(responseData);

  } catch (error: any) {
    console.error('❌ AI bulk analysis error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack?.substring(0, 500)
    });
    
    // Provide helpful error messages
    if (error.code === 'invalid_api_key') {
      console.error('🔑 Invalid API key error');
      return res.status(500).json({ 
        error: 'AI service configuration error' 
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      console.error('⏰ Rate limit exceeded');
      return res.status(429).json({ 
        error: 'Analysis service temporarily busy. Please try again in a moment.' 
      });
    }

    console.error('💥 Generic error, sending 500 response');
    res.status(500).json({ 
      error: 'Failed to analyze trades. Please try again.' 
    });
  }
});

export default router;