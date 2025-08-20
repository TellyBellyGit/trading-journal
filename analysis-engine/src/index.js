/**
 * Trade Analysis Engine
 * 
 * Intelligent trade quality assessment system that analyzes completed trade templates
 * and provides professional feedback based on industry best practices.
 */

import { SetupAnalyzer } from './analyzers/setup-analyzer.js';
import { RiskAnalyzer } from './analyzers/risk-analyzer.js';
import { ExecutionAnalyzer } from './analyzers/execution-analyzer.js';
import { PsychologyAnalyzer } from './analyzers/psychology-analyzer.js';
import { QualityScorer } from './utils/quality-scorer.js';
import { FeedbackGenerator } from './utils/feedback-generator.js';

/**
 * Main analysis function
 * @param {Object} tradeData - Template data from the modal
 * @returns {Object} Complete analysis with scores, flags, and recommendations
 */
export async function analyzeTradeQuality(tradeData) {
  try {
    // Run individual analyzers
    const setupAnalysis = await SetupAnalyzer.analyze(tradeData);
    const riskAnalysis = await RiskAnalyzer.analyze(tradeData);
    const executionAnalysis = await ExecutionAnalyzer.analyze(tradeData);
    const psychologyAnalysis = await PsychologyAnalyzer.analyze(tradeData);

    // Calculate overall quality score
    const overallScore = QualityScorer.calculateOverallScore({
      setup: setupAnalysis,
      risk: riskAnalysis,
      execution: executionAnalysis,
      psychology: psychologyAnalysis
    });

    // Generate structured feedback
    const feedback = FeedbackGenerator.generate({
      score: overallScore,
      analyses: {
        setup: setupAnalysis,
        risk: riskAnalysis,
        execution: executionAnalysis,
        psychology: psychologyAnalysis
      },
      tradeData
    });

    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      overallScore,
      sectionScores: {
        setup: setupAnalysis.score,
        risk: riskAnalysis.score,
        execution: executionAnalysis.score,
        psychology: psychologyAnalysis.score
      },
      feedback,
      recommendations: feedback.recommendations,
      redFlags: feedback.redFlags,
      greenFlags: feedback.greenFlags,
      rawAnalyses: {
        setup: setupAnalysis,
        risk: riskAnalysis,
        execution: executionAnalysis,
        psychology: psychologyAnalysis
      }
    };

  } catch (error) {
    console.error('Analysis engine error:', error);
    return {
      error: true,
      message: 'Failed to analyze trade',
      details: error.message
    };
  }
}

/**
 * Quick validation function to check if trade data is complete enough for analysis
 * @param {Object} tradeData 
 * @returns {Object} Validation result
 */
export function validateTradeData(tradeData) {
  const requiredFields = [
    'setupType',
    'entryReason',
    'riskPerTrade',
    'preTradeMindset'
  ];

  const missing = requiredFields.filter(field => !tradeData[field] || tradeData[field].trim() === '');
  
  return {
    isValid: missing.length === 0,
    missingFields: missing,
    completeness: ((requiredFields.length - missing.length) / requiredFields.length) * 100
  };
}

export default {
  analyzeTradeQuality,
  validateTradeData
};