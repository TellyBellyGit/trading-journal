/**
 * Psychology Analyzer
 * 
 * Analyzes the psychological aspects of a trade including mindset, emotional state,
 * and behavioral patterns that impact trading performance.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const redFlags = JSON.parse(readFileSync(join(__dirname, '../rules/red-flags.json'), 'utf8'));
const scoringCriteria = JSON.parse(readFileSync(join(__dirname, '../rules/scoring-criteria.json'), 'utf8'));

export class PsychologyAnalyzer {
  static async analyze(tradeData) {
    const analysis = {
      score: 0,
      flags: [],
      factors: {},
      recommendations: []
    };

    // Analyze pre-trade mindset
    analysis.factors.preTradeMindset = this.analyzePreTradeMindset(tradeData.preTradeMindset);
    
    // Analyze emotional state during trade
    analysis.factors.emotionalControl = this.analyzeEmotionalState(tradeData.emotionalState);
    
    // Analyze learning orientation
    analysis.factors.learningOrientation = this.analyzeLearningOrientation(tradeData);
    
    // Analyze self-awareness
    analysis.factors.selfAwareness = this.analyzeSelfAwareness(tradeData);

    // Calculate weighted score
    analysis.score = this.calculateScore(analysis.factors);

    // Generate specific recommendations
    analysis.recommendations = this.generateRecommendations(analysis.factors, tradeData);

    return analysis;
  }

  static analyzePreTradeMindset(mindset) {
    if (!mindset) {
      return {
        score: 0,
        issues: ['No pre-trade mindset recorded'],
        message: 'Pre-trade mindset assessment is crucial for identifying psychological risk factors'
      };
    }

    const mindsetLower = mindset.toLowerCase();
    
    // Check for critical red flags
    const criticalFlags = redFlags.psychology.preTradeMindset.critical;
    const criticalFound = criticalFlags.some(flag => mindsetLower.includes(flag));
    
    if (criticalFound) {
      return {
        score: 10,
        issues: [`Critical psychological state: ${mindset}`],
        message: 'Trading in an emotional or impaired state significantly increases risk of poor decisions'
      };
    }

    // Check for warning flags
    const warningFlags = redFlags.psychology.preTradeMindset.warning;
    const warningFound = warningFlags.some(flag => mindsetLower.includes(flag));
    
    if (warningFound) {
      return {
        score: 50,
        issues: [`Suboptimal mindset: ${mindset}`],
        message: 'This mindset may lead to rushed or aggressive trading decisions'
      };
    }

    // Positive mindsets
    const positiveStates = ['calm', 'focused', 'confident', 'patient', 'disciplined'];
    const positiveFound = positiveStates.some(state => mindsetLower.includes(state));
    
    if (positiveFound) {
      return {
        score: 90,
        issues: [],
        message: `Excellent pre-trade mindset: ${mindset}`
      };
    }

    return {
      score: 70,
      issues: [],
      message: `Neutral mindset: ${mindset}`
    };
  }

  static analyzeEmotionalState(emotionalState) {
    if (!emotionalState) {
      return {
        score: 50,
        issues: ['No emotional state recorded'],
        message: 'Tracking emotional state helps identify patterns that impact performance'
      };
    }

    const stateLower = emotionalState.toLowerCase();
    
    // Check for critical emotional flags
    const criticalFlags = redFlags.psychology.emotionalState.critical;
    const criticalFound = criticalFlags.some(flag => stateLower.includes(flag));
    
    if (criticalFound) {
      return {
        score: 5,
        issues: [`Dangerous emotional state: ${emotionalState}`],
        message: 'Trading under strong emotions leads to irrational decisions and poor outcomes'
      };
    }

    // Check for warning flags
    const warningFlags = redFlags.psychology.emotionalState.warning;
    const warningFound = warningFlags.some(flag => stateLower.includes(flag));
    
    if (warningFound) {
      return {
        score: 40,
        issues: [`Risky emotional state: ${emotionalState}`],
        message: 'This emotional state may compromise objective decision-making'
      };
    }

    // Positive emotional states
    const positiveStates = ['calm', 'disciplined', 'focused', 'patient', 'neutral'];
    const positiveFound = positiveStates.some(state => stateLower.includes(state));
    
    if (positiveFound) {
      return {
        score: 95,
        issues: [],
        message: `Optimal emotional state: ${emotionalState}`
      };
    }

    return {
      score: 60,
      issues: [],
      message: `Acceptable emotional state: ${emotionalState}`
    };
  }

  static analyzeLearningOrientation(tradeData) {
    let score = 50;
    const issues = [];
    
    // Check if lessons learned are meaningful
    if (!tradeData.lessonsLearned || tradeData.lessonsLearned.trim().length < 10) {
      score -= 30;
      issues.push('No meaningful lessons documented');
    } else if (tradeData.lessonsLearned.toLowerCase().includes('none') || 
               tradeData.lessonsLearned.toLowerCase().includes('nothing')) {
      score -= 20;
      issues.push('Missed learning opportunity');
    } else {
      score += 20;
    }

    // Check improvement focus
    if (!tradeData.improvementFocus || tradeData.improvementFocus.trim().length < 10) {
      score -= 25;
      issues.push('No improvement plan specified');
    } else {
      score += 15;
    }

    // Check reflection quality (replay analysis)
    if (!tradeData.perfectReplay || tradeData.perfectReplay.trim().length < 10) {
      score -= 20;
      issues.push('No reflection on ideal execution');
    } else {
      score += 10;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      message: issues.length === 0 ? 'Strong learning orientation' : 'Learning mindset needs development'
    };
  }

  static analyzeSelfAwareness(tradeData) {
    let score = 60;
    const issues = [];

    // Check error acknowledgment
    const hasErrors = tradeData.technicalError || tradeData.psychologicalError || tradeData.mechanicalError;
    
    if (!hasErrors) {
      // This could be good (no errors) or bad (lack of self-awareness)
      // Look for other indicators
      const entryReasonLower = (tradeData.entryReason || '').toLowerCase();
      const isProblematicEntry = redFlags.entryReasons.critical.some(flag => 
        entryReasonLower.includes(flag)
      );
      
      if (isProblematicEntry) {
        score -= 40;
        issues.push('Failed to recognize obvious psychological errors');
      }
    } else {
      // Points for honesty in error recognition
      score += 20;
    }

    // Check honesty in following plan
    if (tradeData.followedPlan && tradeData.followedPlan.toLowerCase().includes('yes') && 
        (tradeData.mistakes && tradeData.mistakes.length > 10)) {
      score -= 20;
      issues.push('Contradiction: Claims to follow plan but lists mistakes');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      message: issues.length === 0 ? 'Good self-awareness' : 'Self-awareness needs improvement'
    };
  }

  static calculateScore(factors) {
    const weights = scoringCriteria.sectionCriteria.psychology.factors;
    let totalScore = 0;
    let totalWeight = 0;

    weights.forEach(factor => {
      const factorData = factors[this.mapFactorName(factor.name)];
      if (factorData) {
        totalScore += factorData.score * (factor.weight / 100);
        totalWeight += factor.weight;
      }
    });

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }

  static mapFactorName(name) {
    const mapping = {
      'pre_trade_state': 'preTradeMindset',
      'emotional_control': 'emotionalControl',
      'learning_orientation': 'learningOrientation',
      'self_awareness': 'selfAwareness'
    };
    return mapping[name] || name;
  }

  static generateRecommendations(factors, tradeData) {
    const recommendations = [];

    // Pre-trade mindset recommendations
    if (factors.preTradeMindset.score < 50) {
      recommendations.push({
        priority: 'high',
        category: 'mindset',
        message: 'Develop a pre-trade checklist to assess mental state before trading',
        action: 'Only trade when calm, focused, and well-rested'
      });
    }

    // Emotional control recommendations
    if (factors.emotionalControl.score < 40) {
      recommendations.push({
        priority: 'critical',
        category: 'emotion',
        message: 'Implement strict rules to prevent emotional trading',
        action: 'Take a break and return when emotional state is neutral'
      });
    }

    // Learning orientation recommendations
    if (factors.learningOrientation.score < 60) {
      recommendations.push({
        priority: 'medium',
        category: 'learning',
        message: 'Invest more time in post-trade analysis and reflection',
        action: 'Write detailed lessons learned for every trade, win or lose'
      });
    }

    return recommendations;
  }
}