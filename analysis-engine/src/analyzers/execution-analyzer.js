/**
 * Execution Analyzer
 * Analyzes trade execution quality including order management, exits, and mechanical execution
 */

export class ExecutionAnalyzer {
  static async analyze(tradeData) {
    const analysis = {
      score: 0,
      flags: [],
      factors: {},
      recommendations: []
    };

    analysis.factors.orderExecution = this.analyzeOrderExecution(tradeData);
    analysis.factors.exitExecution = this.analyzeExitExecution(tradeData);
    analysis.factors.planAdherence = this.analyzePlanAdherence(tradeData);
    analysis.factors.mechanicalErrors = this.analyzeMechanicalErrors(tradeData);

    analysis.score = this.calculateScore(analysis.factors);

    return analysis;
  }

  static analyzeOrderExecution(tradeData) {
    if (!tradeData.orderType) {
      return {
        score: 40,
        issues: ['Order type not specified'],
        message: 'Order type affects execution quality and should be documented'
      };
    }

    const orderType = tradeData.orderType.toLowerCase();
    const slippage = (tradeData.slippageFillQuality || '').toLowerCase();

    // Market orders in volatile conditions are risky
    if (orderType.includes('market')) {
      if (tradeData.entryTimeframe && ['1m', '2m'].includes(tradeData.entryTimeframe.toLowerCase())) {
        return {
          score: 30,
          issues: ['Market order on short timeframe creates excessive slippage risk'],
          message: 'Market orders on 1-2 minute charts often result in poor fills'
        };
      }

      if (slippage.includes('poor') || slippage.includes('bad')) {
        return {
          score: 25,
          issues: ['Poor fill quality with market order'],
          message: 'Market orders resulted in unfavorable execution'
        };
      }

      return {
        score: 65,
        issues: [],
        message: 'Market order execution - acceptable for liquid markets'
      };
    }

    // Limit orders generally better
    if (orderType.includes('limit')) {
      if (slippage.includes('excellent') || slippage.includes('good')) {
        return {
          score: 90,
          issues: [],
          message: 'Excellent execution with limit orders'
        };
      }

      return {
        score: 80,
        issues: [],
        message: 'Limit order execution - good price control'
      };
    }

    return {
      score: 60,
      issues: [],
      message: `${tradeData.orderType} order execution`
    };
  }

  static analyzeExitExecution(tradeData) {
    if (!tradeData.exitReason) {
      return {
        score: 20,
        issues: ['No exit reason documented'],
        message: 'Exit rationale must be documented for systematic improvement'
      };
    }

    const exitReason = tradeData.exitReason.toLowerCase();

    // Planned exits are good
    if (exitReason.includes('target') || exitReason.includes('profit target')) {
      return {
        score: 95,
        issues: [],
        message: 'Systematic exit at planned target'
      };
    }

    // Stop loss hits can be acceptable
    if (exitReason.includes('stop loss') || exitReason.includes('stop hit')) {
      return {
        score: 75,
        issues: [],
        message: 'Risk management exit - stop loss executed'
      };
    }

    // Time-based exits
    if (exitReason.includes('time') || exitReason.includes('close')) {
      return {
        score: 70,
        issues: [],
        message: 'Time-based exit - acceptable for day trading'
      };
    }

    // Emotional exits are problematic
    const emotionalExits = ['panic', 'fear', 'greed', 'impatient', 'worried'];
    const hasEmotionalExit = emotionalExits.some(emotion => exitReason.includes(emotion));

    if (hasEmotionalExit) {
      return {
        score: 15,
        issues: ['Emotional exit override systematic plan'],
        message: 'Exit driven by emotion rather than predetermined criteria'
      };
    }

    return {
      score: 50,
      issues: [],
      message: 'Exit reason documented but could be more systematic'
    };
  }

  static analyzePlanAdherence(tradeData) {
    if (!tradeData.followedPlan) {
      return {
        score: 30,
        issues: ['Plan adherence not assessed'],
        message: 'Must track whether original plan was followed'
      };
    }

    const followedPlan = tradeData.followedPlan.toLowerCase();

    if (followedPlan.includes('yes') || followedPlan.includes('completely')) {
      // Check for contradictions
      const hasMistakes = tradeData.mistakes && tradeData.mistakes.length > 10;
      const hasErrors = tradeData.mechanicalError && tradeData.mechanicalError.length > 10;

      if (hasMistakes || hasErrors) {
        return {
          score: 40,
          issues: ['Claims plan adherence but lists significant mistakes'],
          message: 'Contradictory assessment - review plan execution honestly'
        };
      }

      return {
        score: 95,
        issues: [],
        message: 'Excellent plan adherence'
      };
    }

    if (followedPlan.includes('mostly') || followedPlan.includes('partial')) {
      return {
        score: 70,
        issues: ['Partial plan deviation'],
        message: 'Some deviation from plan - identify specific areas'
      };
    }

    if (followedPlan.includes('no') || followedPlan.includes('poorly')) {
      return {
        score: 20,
        issues: ['Failed to follow trading plan'],
        message: 'Poor plan execution undermines systematic approach'
      };
    }

    return {
      score: 50,
      issues: [],
      message: 'Plan adherence assessment unclear'
    };
  }

  static analyzeMechanicalErrors(tradeData) {
    let score = 80;
    const issues = [];

    // Check for documented mechanical errors
    if (tradeData.mechanicalError && tradeData.mechanicalError.length > 5) {
      const errorLower = tradeData.mechanicalError.toLowerCase();

      if (errorLower.includes('none') || errorLower.includes('no error')) {
        // No mechanical errors is good
        score = 95;
      } else {
        // Has mechanical errors
        score -= 30;
        issues.push('Mechanical execution errors occurred');

        // Common mechanical errors
        if (errorLower.includes('wrong size') || errorLower.includes('position size')) {
          score -= 20;
          issues.push('Position sizing error');
        }

        if (errorLower.includes('market order') && 
            (tradeData.entryTimeframe && ['1m', '2m'].includes(tradeData.entryTimeframe))) {
          score -= 15;
          issues.push('Inappropriate order type for timeframe');
        }

        if (errorLower.includes('stop') || errorLower.includes('exit')) {
          score -= 15;
          issues.push('Stop loss or exit execution error');
        }
      }
    } else {
      score = 60;
      issues.push('Mechanical errors not assessed');
    }

    return {
      score: Math.max(0, score),
      issues,
      message: issues.length === 0 ? 'Clean mechanical execution' : 'Mechanical execution needs improvement'
    };
  }

  static calculateScore(factors) {
    const weights = { 
      orderExecution: 25, 
      exitExecution: 35, 
      planAdherence: 25, 
      mechanicalErrors: 15 
    };
    
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