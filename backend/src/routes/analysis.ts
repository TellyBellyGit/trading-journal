import express from 'express';
import { authenticateToken } from '../middleware/auth';
import OpenAI from 'openai';

const router = express.Router();

// Initialize DeepSeek client (compatible with OpenAI SDK)
const deepseek = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Using OPENAI_API_KEY env var for DeepSeek key
  baseURL: 'https://api.deepseek.com',
});

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

router.post('/analyze-trade', authenticateToken, async (req, res) => {
  console.log('🎯 analyze-trade endpoint hit by user', req.user?.userId);
  
  try {
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
    
    // Return the formatted analysis
    res.json({ 
      analysis: analysis.trim(),
      timestamp: new Date().toISOString(),
      model: "deepseek-chat"
    });

  } catch (error: any) {
    console.error('❌ AI analysis error:', error);
    
    // Provide helpful error messages
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ 
        error: 'AI service configuration error' 
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Analysis service temporarily busy. Please try again in a moment.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to analyze trade. Please try again.' 
    });
  }
});

export default router;