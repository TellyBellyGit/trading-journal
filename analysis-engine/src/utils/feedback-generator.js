/**
 * Feedback Generator
 * 
 * Generates comprehensive, actionable feedback based on analysis results.
 * Creates the final assessment that gets displayed to the user.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scoringCriteria = JSON.parse(readFileSync(join(__dirname, '../rules/scoring-criteria.json'), 'utf8'));

export class FeedbackGenerator {
  static generate({ score, analyses, tradeData }) {
    const qualityLevel = this.getQualityLevel(score.overall);
    
    return {
      header: this.generateHeader(qualityLevel, score.overall),
      keyIssue: this.identifyKeyIssue(analyses, tradeData),
      criticalFlaws: this.identifyCriticalFlaws(analyses, tradeData),
      positiveAspects: this.identifyPositiveAspects(analyses, tradeData),
      verdict: this.generateVerdict(qualityLevel, analyses, tradeData),
      primaryLesson: this.generatePrimaryLesson(analyses, tradeData),
      actionItem: this.generateActionItem(analyses, tradeData),
      recommendations: this.aggregateRecommendations(analyses),
      redFlags: this.aggregateRedFlags(analyses),
      greenFlags: this.aggregateGreenFlags(analyses),
      scoreBreakdown: this.generateScoreBreakdown(score, analyses)
    };
  }

  static getQualityLevel(overallScore) {
    const levels = scoringCriteria.qualityLevels;
    
    if (overallScore >= levels.excellent.threshold) return levels.excellent;
    if (overallScore >= levels.good.threshold) return levels.good;
    if (overallScore >= levels.average.threshold) return levels.average;
    if (overallScore >= levels.poor.threshold) return levels.poor;
    return levels.terrible;
  }

  static generateHeader(qualityLevel, score) {
    return `Trade Quality: ${qualityLevel.emoji} ${qualityLevel.label} (${score}/100) - ${qualityLevel.description}`;
  }

  static identifyKeyIssue(analyses, tradeData) {
    // Find the most critical issue across all analyses
    const allIssues = [];
    
    Object.values(analyses).forEach(analysis => {
      if (analysis.factors) {
        Object.values(analysis.factors).forEach(factor => {
          if (factor.issues && factor.issues.length > 0) {
            factor.issues.forEach(issue => {
              allIssues.push({
                issue,
                score: factor.score,
                severity: factor.score < 30 ? 'critical' : factor.score < 60 ? 'high' : 'medium'
              });
            });
          }
        });
      }
    });

    // Sort by severity and score
    allIssues.sort((a, b) => a.score - b.score);
    
    if (allIssues.length > 0) {
      const topIssue = allIssues[0];
      
      // Specific analysis for common issues
      if (tradeData.entryReason && tradeData.entryReason.toLowerCase().includes('bored')) {
        return "Boredom-driven trade overrides any market analysis";
      }
      
      return topIssue.issue;
    }

    return "No critical issues identified";
  }

  static identifyCriticalFlaws(analyses, tradeData) {
    const flaws = [];
    
    // Psychology flaws
    if (analyses.psychology.factors.preTradeMindset.score < 30) {
      flaws.push(`Poor Mental State: ${analyses.psychology.factors.preTradeMindset.message}`);
    }
    
    if (analyses.psychology.factors.emotionalControl.score < 30) {
      flaws.push(`Emotional Trading: ${analyses.psychology.factors.emotionalControl.message}`);
    }

    // Setup flaws
    if (analyses.setup && analyses.setup.factors) {
      if (analyses.setup.factors.entryRationale && analyses.setup.factors.entryRationale.score < 30) {
        flaws.push(`No Valid Edge: Entry reason lacks systematic rationale`);
      }
      
      if (analyses.setup.factors.timeframeAppropriate && analyses.setup.factors.timeframeAppropriate.score < 30) {
        flaws.push(`Timeframe Mismatch: ${analyses.setup.factors.timeframeAppropriate.message}`);
      }
    }

    // Risk flaws
    if (analyses.risk && analyses.risk.factors) {
      if (analyses.risk.factors.positionSizing && analyses.risk.factors.positionSizing.score < 30) {
        flaws.push(`Excessive Risk: Position size violates risk management principles`);
      }
    }

    return flaws;
  }

  static identifyPositiveAspects(analyses, tradeData) {
    const positives = [];
    
    // Check for high-scoring factors
    Object.entries(analyses).forEach(([section, analysis]) => {
      if (analysis.factors) {
        Object.entries(analysis.factors).forEach(([factorName, factor]) => {
          if (factor.score >= 80) {
            positives.push(`${this.capitalize(section)}: ${factor.message || 'Strong performance'}`);
          }
        });
      }
    });

    // Specific positive patterns
    if (tradeData.marketSentiment && tradeData.sectorStrength && 
        tradeData.marketSentiment !== '' && tradeData.sectorStrength !== '') {
      positives.push('Market Analysis: Comprehensive context assessment completed');
    }

    if (tradeData.lessonsLearned && tradeData.lessonsLearned.length > 20) {
      positives.push('Learning Focus: Detailed lessons documented for improvement');
    }

    return positives;
  }

  static generateVerdict(qualityLevel, analyses, tradeData) {
    if (qualityLevel.label === 'Terrible' || qualityLevel.label === 'Poor') {
      return "This trade represents gambling behavior rather than systematic trading. Even if profitable, the process is fundamentally unsound and unrepeatable.";
    }
    
    if (qualityLevel.label === 'Average') {
      return "Mixed execution with both strengths and significant weaknesses. Focus on addressing the identified flaws before taking similar trades.";
    }
    
    if (qualityLevel.label === 'Good') {
      return "Solid trading process with minor areas for improvement. This approach is generally repeatable and systematic.";
    }
    
    return "Excellent trading process that demonstrates professional-level discipline and analysis. This is a model for future trades.";
  }

  static generatePrimaryLesson(analyses, tradeData) {
    // Generate lesson based on the most critical issue
    if (tradeData.entryReason && tradeData.entryReason.toLowerCase().includes('bored')) {
      return "Trading requires patience and discipline. Boredom is not a valid trading signal.";
    }

    if (analyses.psychology.factors.preTradeMindset.score < 30) {
      return "Mental state directly impacts trading performance. Only trade when psychology is optimal.";
    }

    if (analyses.psychology.factors.emotionalControl.score < 30) {
      return "Emotional trading leads to poor decisions. Develop strict rules to prevent emotion-driven trades.";
    }

    // Default lesson based on overall score
    if (analyses.psychology.score < 50) {
      return "Psychology is the foundation of successful trading. Focus on mental game development.";
    }

    return "Consistency in process leads to consistent results. Maintain systematic approach.";
  }

  static generateActionItem(analyses, tradeData) {
    // Generate specific, actionable next step
    if (tradeData.entryReason && tradeData.entryReason.toLowerCase().includes('bored')) {
      return "Next time you feel bored, close the trading platform and take a break. Only return when you have a valid setup that meets all your criteria.";
    }

    if (analyses.psychology.factors.preTradeMindset.score < 50) {
      return "Create a pre-trade checklist that includes mental state assessment. Only trade when you can honestly check 'calm and focused'.";
    }

    if (analyses.setup && analyses.setup.score < 50) {
      return "Define your trading strategy more clearly. Write down specific entry criteria and only trade when all conditions are met.";
    }

    return "Review this analysis before your next trade and ensure you address the identified weaknesses.";
  }

  static aggregateRecommendations(analyses) {
    const allRecommendations = [];
    
    Object.values(analyses).forEach(analysis => {
      if (analysis.recommendations) {
        allRecommendations.push(...analysis.recommendations);
      }
    });

    // Sort by priority
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    allRecommendations.sort((a, b) => 
      (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
    );

    return allRecommendations.slice(0, 5); // Top 5 recommendations
  }

  static aggregateRedFlags(analyses) {
    const redFlags = [];
    
    Object.values(analyses).forEach(analysis => {
      if (analysis.flags) {
        redFlags.push(...analysis.flags);
      }
      
      if (analysis.factors) {
        Object.values(analysis.factors).forEach(factor => {
          if (factor.score < 40 && factor.issues) {
            redFlags.push(...factor.issues);
          }
        });
      }
    });

    return [...new Set(redFlags)]; // Remove duplicates
  }

  static aggregateGreenFlags(analyses) {
    const greenFlags = [];
    
    Object.values(analyses).forEach(analysis => {
      if (analysis.factors) {
        Object.values(analysis.factors).forEach(factor => {
          if (factor.score >= 80 && factor.message && !factor.message.includes('need')) {
            greenFlags.push(factor.message);
          }
        });
      }
    });

    return [...new Set(greenFlags)]; // Remove duplicates
  }

  static generateScoreBreakdown(score, analyses) {
    return {
      overall: score.overall,
      sections: {
        setup: { score: score.setup, weight: '25%' },
        risk: { score: score.risk, weight: '30%' },
        execution: { score: score.execution, weight: '20%' },
        psychology: { score: score.psychology, weight: '25%' }
      },
      interpretation: this.interpretScoreBreakdown(score)
    };
  }

  static interpretScoreBreakdown(score) {
    const interpretations = [];
    
    if (score.psychology < 50) {
      interpretations.push("Psychology is the primary weakness - focus on mental game");
    }
    
    if (score.risk < 50) {
      interpretations.push("Risk management needs immediate attention");
    }
    
    if (score.setup < 50) {
      interpretations.push("Strategy definition and setup analysis requires improvement");
    }
    
    if (score.execution < 50) {
      interpretations.push("Trade execution mechanics need refinement");
    }

    return interpretations.length > 0 ? interpretations : ["Well-balanced trading approach across all areas"];
  }

  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}