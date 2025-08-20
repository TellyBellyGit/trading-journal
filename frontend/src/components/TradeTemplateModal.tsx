import React, { useState, useEffect } from 'react';

interface TradeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
}

interface TemplateData {
  // Setup & Context
  setupType: string;
  marketSentiment: string;
  sectorStrength: string;
  marketCap: string;
  volumeConditions: string;
  entryTimeframe: string;
  exitTimeframe: string;
  entryReason: string;
  newsEvents: string;
  
  // Risk & Money Management
  accountSize: string;
  riskPerTrade: string;
  plannedRRRatio: string;
  leverage: string;
  
  // Execution & Trade Management
  orderType: string;
  slippageFillQuality: string;
  partialExits: string;
  exitReason: string;
  mistakes: string;
  
  // Results & Statistics
  profitLoss: string;
  maxFavorableExcursion: string;
  maxAdverseExcursion: string;
  followedPlan: string;
  
  // Psychology & Review
  preTradeMindset: string;
  emotionalState: string;
  technicalError: string;
  psychologicalError: string;
  mechanicalError: string;
  lessonsLearned: string;
  improvementFocus: string;
  perfectReplay: string;
}

interface AnalysisResult {
  analysis: string; // Raw HTML/markdown analysis from AI
}

const STORAGE_KEY = 'trade-template-draft';

const TradeTemplateModal: React.FC<TradeTemplateModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [templateData, setTemplateData] = useState<TemplateData>({
    setupType: '',
    marketSentiment: '',
    sectorStrength: '',
    marketCap: '',
    volumeConditions: '',
    entryTimeframe: '',
    exitTimeframe: '',
    entryReason: '',
    newsEvents: '',
    accountSize: '',
    riskPerTrade: '',
    plannedRRRatio: '',
    leverage: '',
    orderType: '',
    slippageFillQuality: '',
    partialExits: '',
    exitReason: '',
    mistakes: '',
    profitLoss: '',
    maxFavorableExcursion: '',
    maxAdverseExcursion: '',
    followedPlan: '',
    preTradeMindset: '',
    emotionalState: '',
    technicalError: '',
    psychologicalError: '',
    mechanicalError: '',
    lessonsLearned: '',
    improvementFocus: '',
    perfectReplay: '',
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setTemplateData(parsedDraft);
      } catch (error) {
        console.error('Error loading saved draft:', error);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templateData));
    }, 1000); // Save after 1 second of no changes

    return () => clearTimeout(saveTimer);
  }, [templateData]);

  const handleInputChange = (field: keyof TemplateData, value: string) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAnalysisHTML = (): string => {
    if (!analysisResult) {
      return `
<h1><strong>⚠️ TRADE ANALYSIS REQUIRED</strong></h1>
<p><strong>Please click "Get Analysis" first to generate the assessment before inserting.</strong></p>
<hr>
<p><em>Analysis not yet performed - ${new Date().toLocaleString()}</em></p>
      `.trim();
    }

    // AI returns pre-formatted analysis, just add timestamp
    return `${analysisResult.analysis}
<hr>
<p><em>Analysis generated: ${new Date().toLocaleString()}</em></p>`;
  };

  const handleInsert = () => {
    const htmlContent = generateAnalysisHTML();
    onInsert(htmlContent);
    onClose();
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear the saved draft?')) {
      localStorage.removeItem(STORAGE_KEY);
      setTemplateData({
        setupType: '',
        marketSentiment: '',
        sectorStrength: '',
        marketCap: '',
        volumeConditions: '',
        entryTimeframe: '',
        exitTimeframe: '',
        entryReason: '',
        newsEvents: '',
        accountSize: '',
        riskPerTrade: '',
        plannedRRRatio: '',
        leverage: '',
        orderType: '',
        slippageFillQuality: '',
        partialExits: '',
        exitReason: '',
        mistakes: '',
        profitLoss: '',
        maxFavorableExcursion: '',
        maxAdverseExcursion: '',
        followedPlan: '',
        preTradeMindset: '',
        emotionalState: '',
        technicalError: '',
        psychologicalError: '',
        mechanicalError: '',
        lessonsLearned: '',
        improvementFocus: '',
        perfectReplay: '',
      });
      setAnalysisResult(null);
      setAnalysisError(null);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Get auth token
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call the AI analysis API
      const response = await fetch('/api/analyze-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(templateData)
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult({ analysis: result.analysis });
      
    } catch (error) {
      setAnalysisError('Failed to analyze trade. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Trade Review Template</h2>
              <p className="text-blue-100 text-sm mt-1">Auto-saved as you type</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Section I: Setup & Context */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-green-400 mb-4 border-b border-gray-600 pb-2">
              I. SETUP & CONTEXT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Setup Type / Strategy
                </label>
                <input
                  type="text"
                  value={templateData.setupType}
                  onChange={(e) => handleInputChange('setupType', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Breakout, Mean Reversion"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Market Sentiment
                </label>
                <select
                  value={templateData.marketSentiment}
                  onChange={(e) => handleInputChange('marketSentiment', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Bullish">Bullish</option>
                  <option value="Bearish">Bearish</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Sector Strength
                </label>
                <select
                  value={templateData.sectorStrength}
                  onChange={(e) => handleInputChange('sectorStrength', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Strong">Strong</option>
                  <option value="Weak">Weak</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Market Cap
                </label>
                <select
                  value={templateData.marketCap}
                  onChange={(e) => handleInputChange('marketCap', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Large">Large Cap</option>
                  <option value="Mid">Mid Cap</option>
                  <option value="Small">Small Cap</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Volume Conditions
                </label>
                <select
                  value={templateData.volumeConditions}
                  onChange={(e) => handleInputChange('volumeConditions', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="High">High</option>
                  <option value="Average">Average</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Entry Timeframe
                </label>
                <input
                  type="text"
                  value={templateData.entryTimeframe}
                  onChange={(e) => handleInputChange('entryTimeframe', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 5m, 1H, Daily"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Exit Timeframe
                </label>
                <input
                  type="text"
                  value={templateData.exitTimeframe}
                  onChange={(e) => handleInputChange('exitTimeframe', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 5m, 1H, Daily"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Entry Reason
              </label>
              <textarea
                value={templateData.entryReason}
                onChange={(e) => handleInputChange('entryReason', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Why this trade, why now?"
              />
            </div>
            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                News / Events
              </label>
              <textarea
                value={templateData.newsEvents}
                onChange={(e) => handleInputChange('newsEvents', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Earnings, FOMC, geopolitical events, etc."
              />
            </div>
          </div>

          {/* Section II: Risk & Money Management */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-orange-400 mb-4 border-b border-gray-600 pb-2">
              II. RISK & MONEY MANAGEMENT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Account Size
                </label>
                <input
                  type="text"
                  value={templateData.accountSize}
                  onChange={(e) => handleInputChange('accountSize', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., $50,000"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Risk per Trade
                </label>
                <input
                  type="text"
                  value={templateData.riskPerTrade}
                  onChange={(e) => handleInputChange('riskPerTrade', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., $500 or 1%"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Planned R:R Ratio
                </label>
                <input
                  type="text"
                  value={templateData.plannedRRRatio}
                  onChange={(e) => handleInputChange('plannedRRRatio', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 1:2, 1:3"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Leverage
                </label>
                <input
                  type="text"
                  value={templateData.leverage}
                  onChange={(e) => handleInputChange('leverage', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., None, 2x, 5x"
                />
              </div>
            </div>
          </div>

          {/* Section III: Execution & Trade Management */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-purple-400 mb-4 border-b border-gray-600 pb-2">
              III. EXECUTION & TRADE MANAGEMENT
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Order Type
                </label>
                <select
                  value={templateData.orderType}
                  onChange={(e) => handleInputChange('orderType', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Market">Market</option>
                  <option value="Limit">Limit</option>
                  <option value="Stop">Stop</option>
                  <option value="Stop-Limit">Stop-Limit</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Slippage / Fill Quality
                </label>
                <select
                  value={templateData.slippageFillQuality}
                  onChange={(e) => handleInputChange('slippageFillQuality', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Partial Exits
                </label>
                <input
                  type="text"
                  value={templateData.partialExits}
                  onChange={(e) => handleInputChange('partialExits', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., 50% at target 1"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Exit Reason
              </label>
              <textarea
                value={templateData.exitReason}
                onChange={(e) => handleInputChange('exitReason', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Target hit, Stop loss, Emotional exit, etc."
              />
            </div>
            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Mistakes
              </label>
              <textarea
                value={templateData.mistakes}
                onChange={(e) => handleInputChange('mistakes', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Late entry, didn't follow stop, etc."
              />
            </div>
          </div>

          {/* Section IV: Results & Statistics */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-teal-400 mb-4 border-b border-gray-600 pb-2">
              IV. RESULTS & STATISTICS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Profit / Loss (P&L)
                </label>
                <input
                  type="text"
                  value={templateData.profitLoss}
                  onChange={(e) => handleInputChange('profitLoss', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., +$250 (+2.5%)"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Max Favorable Excursion (MFE)
                </label>
                <input
                  type="text"
                  value={templateData.maxFavorableExcursion}
                  onChange={(e) => handleInputChange('maxFavorableExcursion', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., +3.2%"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Max Adverse Excursion (MAE)
                </label>
                <input
                  type="text"
                  value={templateData.maxAdverseExcursion}
                  onChange={(e) => handleInputChange('maxAdverseExcursion', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., -1.8%"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Did you follow your plan?
              </label>
              <textarea
                value={templateData.followedPlan}
                onChange={(e) => handleInputChange('followedPlan', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Yes/No - Explain any deviations"
              />
            </div>
          </div>

          {/* Section V: Psychology & Review */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-pink-400 mb-4 border-b border-gray-600 pb-2">
              V. PSYCHOLOGY & REVIEW
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Pre-Trade Mindset
                </label>
                <select
                  value={templateData.preTradeMindset}
                  onChange={(e) => handleInputChange('preTradeMindset', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Confident">Confident</option>
                  <option value="Anxious">Anxious</option>
                  <option value="Rushed">Rushed</option>
                  <option value="Calm">Calm</option>
                  <option value="Tired">Tired</option>
                  <option value="Overconfident">Overconfident</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Emotional State
                </label>
                <select
                  value={templateData.emotionalState}
                  onChange={(e) => handleInputChange('emotionalState', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Fear">Fear</option>
                  <option value="Greed">Greed</option>
                  <option value="FOMO">FOMO</option>
                  <option value="Calm">Calm</option>
                  <option value="Impatient">Impatient</option>
                  <option value="Disciplined">Disciplined</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Technical Error
                </label>
                <input
                  type="text"
                  value={templateData.technicalError}
                  onChange={(e) => handleInputChange('technicalError', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Misread chart, wrong level, etc."
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Psychological Error
                </label>
                <input
                  type="text"
                  value={templateData.psychologicalError}
                  onChange={(e) => handleInputChange('psychologicalError', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Revenge trading, overtrading, etc."
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Mechanical Error
                </label>
                <input
                  type="text"
                  value={templateData.mechanicalError}
                  onChange={(e) => handleInputChange('mechanicalError', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Wrong order type, incorrect size, etc."
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Lessons Learned
              </label>
              <textarea
                value={templateData.lessonsLearned}
                onChange={(e) => handleInputChange('lessonsLearned', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Key takeaways from this trade"
              />
            </div>
            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                What to Improve Next Time
              </label>
              <textarea
                value={templateData.improvementFocus}
                onChange={(e) => handleInputChange('improvementFocus', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Specific actions for improvement"
              />
            </div>
            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                "If I could replay the trade..."
              </label>
              <textarea
                value={templateData.perfectReplay}
                onChange={(e) => handleInputChange('perfectReplay', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Ideal execution in hindsight"
              />
            </div>
          </div>

          {/* Analysis Section */}
          <div className="mb-8 border-t border-gray-600 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-yellow-400">
                🧠 AI TRADE ANALYSIS
              </h3>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? 'Analyzing...' : 'Get Analysis'}
              </button>
            </div>

            {isAnalyzing && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                <span className="ml-3 text-gray-300">Analyzing your trade...</span>
              </div>
            )}

            {analysisError && (
              <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-4">
                <p className="text-red-200">{analysisError}</p>
              </div>
            )}

            {analysisResult && (
              <div className="bg-gray-750 border border-gray-600 rounded-lg p-6">
                <div 
                  className="text-gray-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: analysisResult.analysis }}
                />
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-700 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleClearDraft}
            className="px-4 py-2 text-red-400 hover:text-red-300 text-sm"
          >
            Clear Draft
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              className={`px-6 py-2 rounded-lg transition-colors ${
                analysisResult 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
              title={analysisResult ? 'Insert AI analysis into notes' : 'Will prompt to run analysis first'}
            >
              {analysisResult ? 'Insert Analysis' : 'Insert into Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeTemplateModal;