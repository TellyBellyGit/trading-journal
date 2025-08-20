/**
 * Quality Scorer
 * 
 * Calculates overall trade quality score and provides scoring utilities
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scoringCriteria = JSON.parse(readFileSync(join(__dirname, '../rules/scoring-criteria.json'), 'utf8'));

export class QualityScorer {
  /**
   * Calculate overall trade quality score from section analyses
   * @param {Object} analyses - Results from all analyzer modules
   * @returns {Object} Score breakdown and overall quality assessment
   */
  static calculateOverallScore(analyses) {
    const sectionWeights = scoringCriteria.weights;
    
    const sectionScores = {
      setup: analyses.setup?.score || 0,
      risk: analyses.risk?.score || 0,
      execution: analyses.execution?.score || 0,
      psychology: analyses.psychology?.score || 0
    };

    // Calculate weighted overall score
    let weightedScore = 0;
    let totalWeight = 0;

    Object.entries(sectionWeights).forEach(([section, weight]) => {
      const score = sectionScores[section];
      if (score !== undefined) {
        weightedScore += score * (weight / 100);
        totalWeight += weight;
      }
    });

    const overallScore = totalWeight > 0 ? Math.round(weightedScore) : 0;

    return {
      overall: overallScore,
      setup: sectionScores.setup,
      risk: sectionScores.risk,
      execution: sectionScores.execution,
      psychology: sectionScores.psychology,
      breakdown: this.generateScoreBreakdown(sectionScores, overallScore),
      interpretation: this.interpretScore(overallScore, sectionScores)
    };
  }

  /**
   * Generate detailed score breakdown with weights
   * @param {Object} sectionScores - Individual section scores
   * @param {number} overallScore - Overall weighted score
   * @returns {Object} Detailed breakdown
   */
  static generateScoreBreakdown(sectionScores, overallScore) {
    const weights = scoringCriteria.weights;
    
    return {
      overall: {
        score: overallScore,
        grade: this.getGrade(overallScore),
        quality: this.getQualityLevel(overallScore)
      },
      sections: Object.entries(sectionScores).map(([section, score]) => ({
        name: section,
        score: score,
        weight: weights[section] || 0,
        contribution: Math.round((score * (weights[section] || 0)) / 100),
        grade: this.getGrade(score),
        status: this.getScoreStatus(score)
      }))
    };
  }

  /**
   * Interpret the overall score and provide insights
   * @param {number} overallScore - Overall trade quality score
   * @param {Object} sectionScores - Individual section scores
   * @returns {Object} Interpretation and insights
   */
  static interpretScore(overallScore, sectionScores) {
    const qualityLevel = this.getQualityLevel(overallScore);
    const weakestSection = this.findWeakestSection(sectionScores);
    const strongestSection = this.findStrongestSection(sectionScores);
    
    return {
      qualityLevel,
      primaryWeakness: weakestSection,
      primaryStrength: strongestSection,
      tradeable: overallScore >= 60,
      systematic: this.isSystematic(sectionScores),
      riskLevel: this.assessRiskLevel(sectionScores),
      recommendations: this.generateScoreRecommendations(sectionScores, overallScore)
    };
  }

  /**
   * Get quality level based on score
   * @param {number} score - Numeric score (0-100)
   * @returns {Object} Quality level details
   */
  static getQualityLevel(score) {
    const levels = scoringCriteria.qualityLevels;
    
    if (score >= levels.excellent.threshold) return levels.excellent;
    if (score >= levels.good.threshold) return levels.good;
    if (score >= levels.average.threshold) return levels.average;
    if (score >= levels.poor.threshold) return levels.poor;
    return levels.terrible;
  }

  /**
   * Convert numeric score to letter grade
   * @param {number} score - Numeric score (0-100)
   * @returns {string} Letter grade
   */
  static getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get score status indicator
   * @param {number} score - Numeric score (0-100)
   * @returns {string} Status indicator
   */
  static getScoreStatus(score) {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'acceptable';
    if (score >= 40) return 'needs-improvement';
    return 'critical';
  }

  /**
   * Find the weakest performing section
   * @param {Object} sectionScores - Individual section scores
   * @returns {Object} Weakest section details
   */
  static findWeakestSection(sectionScores) {
    let weakestScore = 100;
    let weakestSection = null;

    Object.entries(sectionScores).forEach(([section, score]) => {
      if (score < weakestScore) {
        weakestScore = score;
        weakestSection = section;
      }
    });

    return {
      section: weakestSection,
      score: weakestScore,
      status: this.getScoreStatus(weakestScore)
    };
  }

  /**
   * Find the strongest performing section
   * @param {Object} sectionScores - Individual section scores
   * @returns {Object} Strongest section details
   */
  static findStrongestSection(sectionScores) {
    let strongestScore = 0;
    let strongestSection = null;

    Object.entries(sectionScores).forEach(([section, score]) => {
      if (score > strongestScore) {
        strongestScore = score;
        strongestSection = section;
      }
    });

    return {
      section: strongestSection,
      score: strongestScore,
      status: this.getScoreStatus(strongestScore)
    };
  }

  /**
   * Determine if the trade approach is systematic
   * @param {Object} sectionScores - Individual section scores
   * @returns {boolean} Whether approach is systematic
   */
  static isSystematic(sectionScores) {
    // A systematic approach requires all sections to be at least 60
    return Object.values(sectionScores).every(score => score >= 60);
  }

  /**
   * Assess overall risk level of the trade
   * @param {Object} sectionScores - Individual section scores
   * @returns {string} Risk level assessment
   */
  static assessRiskLevel(sectionScores) {
    const riskScore = sectionScores.risk || 0;
    const psychologyScore = sectionScores.psychology || 0;
    
    // Risk is compounded by poor psychology
    const combinedRisk = (riskScore + psychologyScore) / 2;
    
    if (combinedRisk >= 80) return 'low';
    if (combinedRisk >= 60) return 'moderate';
    if (combinedRisk >= 40) return 'high';
    return 'extreme';
  }

  /**
   * Generate score-based recommendations
   * @param {Object} sectionScores - Individual section scores
   * @param {number} overallScore - Overall score
   * @returns {Array} Array of recommendations
   */
  static generateScoreRecommendations(sectionScores, overallScore) {
    const recommendations = [];

    // Overall score recommendations
    if (overallScore < 50) {
      recommendations.push({
        priority: 'critical',
        type: 'overall',
        message: 'This trade quality is unacceptable. Fundamental changes needed.',
        action: 'Stop trading and review all processes before continuing'
      });
    }

    // Section-specific recommendations
    Object.entries(sectionScores).forEach(([section, score]) => {
      if (score < 50) {
        recommendations.push({
          priority: 'high',
          type: section,
          message: `${section.charAt(0).toUpperCase() + section.slice(1)} section needs immediate attention`,
          action: this.getSectionRecommendation(section, score)
        });
      }
    });

    // Balance recommendations
    const scoreRange = Math.max(...Object.values(sectionScores)) - Math.min(...Object.values(sectionScores));
    if (scoreRange > 40) {
      recommendations.push({
        priority: 'medium',
        type: 'balance',
        message: 'Large variation between section scores indicates inconsistent approach',
        action: 'Focus on bringing all areas up to similar performance levels'
      });
    }

    return recommendations.slice(0, 3); // Top 3 recommendations
  }

  /**
   * Get section-specific recommendation
   * @param {string} section - Section name
   * @param {number} score - Section score
   * @returns {string} Specific recommendation
   */
  static getSectionRecommendation(section, score) {
    const recommendations = {
      setup: score < 30 ? 'Define clear entry criteria and strategy rules' : 'Improve market analysis and setup identification',
      risk: score < 30 ? 'Implement strict position sizing rules immediately' : 'Review and tighten risk management parameters',
      execution: score < 30 ? 'Develop systematic order management process' : 'Focus on plan adherence and mechanical precision',
      psychology: score < 30 ? 'Only trade when mental state is optimal' : 'Develop pre-trade psychological checklist'
    };

    return recommendations[section] || 'Review and improve this area';
  }

  /**
   * Compare trade score to historical averages
   * @param {number} currentScore - Current trade score
   * @param {Array} historicalScores - Array of historical scores
   * @returns {Object} Comparison analysis
   */
  static compareToHistory(currentScore, historicalScores = []) {
    if (historicalScores.length === 0) {
      return {
        isImprovement: null,
        percentile: null,
        average: null,
        message: 'No historical data available for comparison'
      };
    }

    const average = historicalScores.reduce((sum, score) => sum + score, 0) / historicalScores.length;
    const sortedScores = [...historicalScores].sort((a, b) => a - b);
    const rank = sortedScores.filter(score => score <= currentScore).length;
    const percentile = Math.round((rank / historicalScores.length) * 100);

    return {
      isImprovement: currentScore > average,
      percentile,
      average: Math.round(average),
      difference: Math.round(currentScore - average),
      message: currentScore > average ? 
        `Above average performance (+${Math.round(currentScore - average)} points)` :
        `Below average performance (${Math.round(currentScore - average)} points)`
    };
  }
}