// components/analytics/TradingAssessment.tsx
import React from 'react';

interface TradingAssessmentProps {
  assessment: string;
  profitFactor: number;
  className?: string;
}

const TradingAssessment: React.FC<TradingAssessmentProps> = ({ 
  assessment, 
  profitFactor,
  className = '' 
}) => {
  // Get assessment level based on content
  const getAssessmentLevel = (text: string): 'excellent' | 'good' | 'warning' | 'critical' => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('excellent') || lowerText.includes('strong edge')) {
      return 'excellent';
    }
    if (lowerText.includes('good') || lowerText.includes('solid')) {
      return 'good';
    }
    if (lowerText.includes('critical') || lowerText.includes('back to school')) {
      return 'critical';
    }
    return 'warning';
  };

  // Get icon based on assessment level
  const getAssessmentIcon = (level: string): string => {
    switch (level) {
      case 'excellent': return '🎯';
      case 'good': return '👍';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '📊';
    }
  };

  // Get color classes based on assessment level
  const getColorClasses = (level: string) => {
    switch (level) {
      case 'excellent':
        return {
          border: 'border-green-500',
          title: 'text-green-400',
          text: 'text-green-100',
          bg: 'bg-green-900/20'
        };
      case 'good':
        return {
          border: 'border-blue-500',
          title: 'text-blue-400',
          text: 'text-blue-100',
          bg: 'bg-blue-900/20'
        };
      case 'warning':
        return {
          border: 'border-orange-500',
          title: 'text-orange-400',
          text: 'text-orange-100',
          bg: 'bg-orange-900/20'
        };
      case 'critical':
        return {
          border: 'border-red-500',
          title: 'text-red-400',
          text: 'text-red-100',
          bg: 'bg-red-900/20'
        };
      default:
        return {
          border: 'border-gray-500',
          title: 'text-gray-400',
          text: 'text-gray-100',
          bg: 'bg-gray-900/20'
        };
    }
  };

  const assessmentLevel = getAssessmentLevel(assessment);
  const colors = getColorClasses(assessmentLevel);
  const icon = getAssessmentIcon(assessmentLevel);

  // Split assessment into sentences for better formatting
  const sentences = assessment.split('. ').filter(sentence => sentence.trim());

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 ${className}`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-orange-400">Trading Assessment</h3>
        </div>
        
        {/* Assessment Card */}
        <div className={`flex-1 ${colors.bg} ${colors.border} border rounded-lg p-4`}>
          <div className="space-y-3">
            {/* Assessment Level Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.title} bg-gray-700`}>
                {assessmentLevel.charAt(0).toUpperCase() + assessmentLevel.slice(1)} Performance
              </span>
              <span className="text-sm text-gray-400">
                PF: {profitFactor >= 5 ? '>5.00x' : `${profitFactor.toFixed(2)}x`}
              </span>
            </div>
            
            {/* Assessment Text */}
            <div className="space-y-2">
              {sentences.map((sentence, index) => (
                <p key={index} className={`text-sm leading-relaxed ${colors.text}`}>
                  {sentence.trim()}{index < sentences.length - 1 ? '.' : ''}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 pt-7 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700 rounded p-6 text-center">
              <p className="text-xs text-gray-400">Performance</p>
              <p className={`text-sm font-semibold ${colors.title}`}>
                {assessmentLevel.charAt(0).toUpperCase() + assessmentLevel.slice(1)}
              </p>
            </div>
            <div className="bg-gray-700 rounded p-6 text-center">
              <p className="text-xs text-gray-400">Profit Factor</p>
              <p className={`text-sm font-semibold ${
                profitFactor >= 2.0 ? 'text-green-400' :
                profitFactor >= 1.0 ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {profitFactor >= 5 ? '>5.00x' : `${profitFactor.toFixed(2)}x`}
              </p>
            </div>
          </div>
        </div>

        {/* Action Items (based on assessment level) */}
        <div className="mt-8">
          <div className="bg-gray-700 rounded-lg p-6">
            <p className="text-xs text-gray-400 mb-2">Recommendation:</p>
            <p className="text-xs text-gray-300">
              {assessmentLevel === 'excellent' && 'Maintain your strategy and position sizing. Consider scaling up gradually.'}
              {assessmentLevel === 'good' && 'Focus on letting winners run longer to improve profit factor.'}
              {assessmentLevel === 'warning' && 'Review your risk management and trade selection criteria.'}
              {assessmentLevel === 'critical' && 'Stop trading immediately. Review and revise your strategy completely.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingAssessment;