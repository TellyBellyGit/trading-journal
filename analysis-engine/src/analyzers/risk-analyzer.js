/**
 * Risk Analyzer
 * Analyzes risk management aspects of the trade
 */

export class RiskAnalyzer {
  static async analyze(tradeData) {
    const analysis = {
      score: 0,
      flags: [],
      factors: {},
      recommendations: []
    };

    analysis.factors.positionSizing = this.analyzePositionSizing(tradeData);
    analysis.factors.riskRewardRatio = this.analyzeRiskReward(tradeData.plannedRRRatio);
    analysis.factors.leverageUsage = this.analyzeLeverage(tradeData.leverage);

    analysis.score = this.calculateScore(analysis.factors);

    return analysis;
  }

  static analyzePositionSizing(tradeData) {
    if (!tradeData.riskPerTrade || !tradeData.accountSize) {
      return {
        score: 30,
        issues: ['Insufficient risk data provided'],
        message: 'Cannot assess position sizing without account size and risk amount'
      };
    }

    // Extract numerical values
    const riskAmount = this.extractNumber(tradeData.riskPerTrade);
    const accountSize = this.extractNumber(tradeData.accountSize);

    if (riskAmount <= 0 || accountSize <= 0) {
      return {
        score: 20,
        issues: ['Invalid risk or account size values'],
        message: 'Risk and account size must be positive numbers'
      };
    }

    const riskPercentage = (riskAmount / accountSize) * 100;

    if (riskPercentage > 5) {
      return {
        score: 10,
        issues: [`Excessive risk: ${riskPercentage.toFixed(1)}% per trade`],
        message: 'Risking more than 5% per trade is gambling, not trading'
      };
    }

    if (riskPercentage > 3) {
      return {
        score: 40,
        issues: [`Aggressive risk: ${riskPercentage.toFixed(1)}% per trade`],
        message: 'Risk above 3% is aggressive for most strategies'
      };
    }

    if (riskPercentage <= 1) {
      return {
        score: 95,
        issues: [],
        message: `Conservative risk: ${riskPercentage.toFixed(1)}% per trade - excellent risk management`
      };
    }

    return {
      score: 80,
      issues: [],
      message: `Reasonable risk: ${riskPercentage.toFixed(1)}% per trade`
    };
  }

  static analyzeRiskReward(rrRatio) {
    if (!rrRatio || rrRatio.trim() === '') {
      return {
        score: 20,
        issues: ['No risk/reward ratio specified'],
        message: 'R:R ratio must be planned before entering trades'
      };
    }

    // Parse R:R ratio (format like "1:2" or "1:1.5")
    const ratio = this.parseRiskReward(rrRatio);
    
    if (!ratio) {
      return {
        score: 30,
        issues: ['Invalid R:R ratio format'],
        message: 'R:R ratio should be in format like "1:2" or "1:1.5"'
      };
    }

    if (ratio < 1) {
      return {
        score: 10,
        issues: [`Poor R:R ratio: ${rrRatio}`],
        message: 'Risk/reward ratio below 1:1 is unacceptable for systematic trading'
      };
    }

    if (ratio >= 2) {
      return {
        score: 90,
        issues: [],
        message: `Excellent R:R ratio: ${rrRatio}`
      };
    }

    if (ratio >= 1.5) {
      return {
        score: 75,
        issues: [],
        message: `Good R:R ratio: ${rrRatio}`
      };
    }

    return {
      score: 60,
      issues: [],
      message: `Minimum acceptable R:R ratio: ${rrRatio}`
    };
  }

  static analyzeLeverage(leverage) {
    if (!leverage || leverage.trim() === '') {
      return {
        score: 70,
        issues: [],
        message: 'Leverage not specified - assuming none'
      };
    }

    const leverageLower = leverage.toLowerCase();

    if (leverageLower.includes('none') || leverageLower.includes('1x') || leverageLower === '1') {
      return {
        score: 95,
        issues: [],
        message: 'No leverage - conservative approach'
      };
    }

    const leverageAmount = this.extractNumber(leverage);

    if (leverageAmount >= 10) {
      return {
        score: 5,
        issues: [`Extreme leverage: ${leverage}`],
        message: '10x+ leverage is extremely dangerous for retail traders'
      };
    }

    if (leverageAmount >= 5) {
      return {
        score: 25,
        issues: [`High leverage: ${leverage}`],
        message: '5x+ leverage requires exceptional risk management skills'
      };
    }

    if (leverageAmount >= 3) {
      return {
        score: 50,
        issues: [`Moderate leverage: ${leverage}`],
        message: '3x+ leverage increases risk significantly'
      };
    }

    return {
      score: 75,
      issues: [],
      message: `Low leverage: ${leverage} - manageable risk`
    };
  }

  static calculateScore(factors) {
    const weights = { positionSizing: 40, riskRewardRatio: 35, leverageUsage: 25 };
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

  static extractNumber(str) {
    if (!str) return 0;
    // Remove currency symbols, commas, and extract first number
    const match = str.replace(/[$,\s]/g, '').match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  static parseRiskReward(rrString) {
    if (!rrString) return null;
    
    // Handle formats like "1:2", "1:1.5", "2:1", etc.
    const match = rrString.match(/(\d*\.?\d+)\s*:\s*(\d*\.?\d+)/);
    if (!match) return null;
    
    const risk = parseFloat(match[1]);
    const reward = parseFloat(match[2]);
    
    return risk > 0 ? reward / risk : null;
  }
}