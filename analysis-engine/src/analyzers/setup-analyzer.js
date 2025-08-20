/**
 * Setup Analyzer
 * Analyzes trade setup quality including strategy clarity, market analysis, and entry rationale
 */

export class SetupAnalyzer {
  static async analyze(tradeData) {
    const analysis = {
      score: 0,
      flags: [],
      factors: {},
      recommendations: []
    };

    // Analyze each factor
    analysis.factors.strategyClarity = this.analyzeStrategyClarity(tradeData.setupType);
    analysis.factors.marketAnalysis = this.analyzeMarketAnalysis(tradeData);
    analysis.factors.timeframeAppropriate = this.analyzeTimeframe(tradeData);
    analysis.factors.entryRationale = this.analyzeEntryRationale(tradeData.entryReason);

    // Calculate score
    analysis.score = this.calculateScore(analysis.factors);

    return analysis;
  }

  static analyzeStrategyClarity(setupType) {
    if (!setupType || setupType.trim() === '') {
      return {
        score: 0,
        issues: ['No strategy specified'],
        message: 'Strategy must be clearly defined before entering any trade'
      };
    }

    const commonStrategies = ['breakout', 'pullback', 'reversal', 'momentum', 'mean reversion', 'scalp'];
    const isRecognized = commonStrategies.some(strategy => 
      setupType.toLowerCase().includes(strategy)
    );

    return {
      score: isRecognized ? 85 : 70,
      issues: isRecognized ? [] : ['Strategy could be more specific'],
      message: `Strategy identified: ${setupType}`
    };
  }

  static analyzeMarketAnalysis(tradeData) {
    let score = 0;
    const issues = [];

    // Check if market conditions are assessed
    if (tradeData.marketSentiment) score += 25;
    else issues.push('Market sentiment not assessed');

    if (tradeData.sectorStrength) score += 25;
    else issues.push('Sector strength not analyzed');

    if (tradeData.marketCap) score += 25;
    else issues.push('Market cap consideration missing');

    if (tradeData.volumeConditions) score += 25;
    else issues.push('Volume analysis not performed');

    return {
      score,
      issues,
      message: issues.length === 0 ? 'Comprehensive market analysis' : 'Market analysis incomplete'
    };
  }

  static analyzeTimeframe(tradeData) {
    if (!tradeData.entryTimeframe || !tradeData.marketCap) {
      return {
        score: 50,
        issues: ['Insufficient data for timeframe analysis'],
        message: 'Timeframe appropriateness cannot be determined'
      };
    }

    // Risk assessment for timeframe/market cap combinations
    if (tradeData.marketCap.toLowerCase() === 'small' && 
        ['1m', '2m'].includes(tradeData.entryTimeframe.toLowerCase())) {
      return {
        score: 20,
        issues: ['High-risk timeframe for small-cap stocks'],
        message: 'Small-cap stocks on 1-2 minute charts are extremely volatile and noisy'
      };
    }

    return {
      score: 80,
      issues: [],
      message: 'Appropriate timeframe selection'
    };
  }

  static analyzeEntryRationale(entryReason) {
    if (!entryReason || entryReason.trim() === '') {
      return {
        score: 0,
        issues: ['No entry rationale provided'],
        message: 'Entry reason is mandatory for systematic trading'
      };
    }

    const entryLower = entryReason.toLowerCase();
    
    // Critical red flags
    const redFlags = ['bored', 'boring', 'gut feeling', 'hunch', 'fomo', 'revenge'];
    const hasRedFlag = redFlags.some(flag => entryLower.includes(flag));

    if (hasRedFlag) {
      return {
        score: 5,
        issues: ['Emotional/non-systematic entry reason'],
        message: 'Entry based on emotion rather than analysis'
      };
    }

    // Look for systematic indicators
    const systematicTerms = ['support', 'resistance', 'breakout', 'pattern', 'indicator', 'signal', 'confluence'];
    const isSystematic = systematicTerms.some(term => entryLower.includes(term));

    return {
      score: isSystematic ? 90 : 60,
      issues: isSystematic ? [] : ['Entry reason could be more systematic'],
      message: isSystematic ? 'Systematic entry rationale' : 'Basic entry reason provided'
    };
  }

  static calculateScore(factors) {
    const weights = { strategyClarity: 30, marketAnalysis: 25, timeframeAppropriate: 20, entryRationale: 25 };
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([factorName, weight]) => {
      const factor = factors[factorName];
      if (factor) {
        totalScore += factor.score * (weight / 100);
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }
}