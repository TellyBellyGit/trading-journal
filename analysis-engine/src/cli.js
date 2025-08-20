#!/usr/bin/env node

/**
 * CLI tool for testing the trade analysis engine
 */

import { analyzeTradeQuality } from './index.js';

// Sample trade data for testing (your "bored" example)
const sampleTradeData = {
  // Setup & Context
  setupType: "Breakout",
  marketSentiment: "Bullish", 
  sectorStrength: "Strong",
  marketCap: "Small",
  volumeConditions: "High",
  entryTimeframe: "1m",
  exitTimeframe: "1m", 
  entryReason: "Because I was bored",
  newsEvents: "No News",
  
  // Risk & Money Management
  accountSize: "$10,000",
  riskPerTrade: "$500",
  plannedRRRatio: "1:2",
  leverage: "None",
  
  // Execution & Trade Management
  orderType: "Market",
  slippageFillQuality: "Average",
  partialExits: "None",
  exitReason: "Stop loss hit",
  mistakes: "Entered without proper analysis",
  
  // Results & Statistics
  profitLoss: "-$300",
  maxFavorableExcursion: "+$50",
  maxAdverseExcursion: "-$320",
  followedPlan: "No - emotional entry",
  
  // Psychology & Review
  preTradeMindset: "Bored",
  emotionalState: "FOMO",
  technicalError: "None identified",
  psychologicalError: "Traded out of boredom",
  mechanicalError: "Used market order in volatile conditions",
  lessonsLearned: "Don't trade when bored",
  improvementFocus: "Wait for proper setups",
  perfectReplay: "Should have walked away from the computer"
};

async function runAnalysis() {
  console.log('🔍 Trade Analysis Engine - CLI Test\n');
  console.log('Analyzing sample trade data...\n');
  
  try {
    const result = await analyzeTradeQuality(sampleTradeData);
    
    if (result.error) {
      console.error('❌ Analysis failed:', result.message);
      return;
    }

    // Display results
    console.log('📊 ANALYSIS RESULTS');
    console.log('='.repeat(50));
    console.log(`${result.feedback.header}\n`);
    
    console.log('🎯 KEY ISSUE:');
    console.log(`${result.feedback.keyIssue}\n`);
    
    if (result.feedback.criticalFlaws.length > 0) {
      console.log('🚨 CRITICAL FLAWS:');
      result.feedback.criticalFlaws.forEach(flaw => {
        console.log(`• ${flaw}`);
      });
      console.log('');
    }
    
    if (result.feedback.positiveAspects.length > 0) {
      console.log('✅ POSITIVE ASPECTS:');
      result.feedback.positiveAspects.forEach(positive => {
        console.log(`• ${positive}`);
      });
      console.log('');
    }
    
    console.log('⚖️ VERDICT:');
    console.log(`${result.feedback.verdict}\n`);
    
    console.log('📚 PRIMARY LESSON:');
    console.log(`${result.feedback.primaryLesson}\n`);
    
    console.log('🎯 ACTION ITEM:');
    console.log(`${result.feedback.actionItem}\n`);
    
    console.log('📈 SCORE BREAKDOWN:');
    console.log(`Overall: ${result.overallScore.overall}/100`);
    Object.entries(result.sectionScores).forEach(([section, score]) => {
      console.log(`${section.charAt(0).toUpperCase() + section.slice(1)}: ${score}/100`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('Analysis complete! 🎉');
    
  } catch (error) {
    console.error('❌ Error running analysis:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAnalysis();
}