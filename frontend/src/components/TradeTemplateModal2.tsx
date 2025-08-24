import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

interface TradeTemplateModal2Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (content: string) => void;
  trade?: any; // Trade data to display at top
}

interface Template2Data {
  // Setup & Context (only 2 fields)
  setupType: string;
  entryReason: string;
  
  // Execution & Trade Management
  exitReason: string;
  followedPlan: boolean | null;
  planDeviationReason: string;
  
  // Psychology & Review (keeping most fields)
  preTradeMindset: string;
  emotionalState: string;
  technicalError: string;
  psychologicalError: string;
  mechanicalError: string;
  lessonsLearned: string;
}

interface AnalysisResult {
  analysis: string; // Formatted HTML for display in modal
  cleanAnalysis?: string; // Clean HTML for TipTap editor insertion
}

const STORAGE_KEY = 'trade-template2-draft';

const TradeTemplateModal2: React.FC<TradeTemplateModal2Props> = ({
  isOpen,
  onClose,
  onInsert,
  trade,
}) => {
  // Position state for dragging
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, modalX: 0, modalY: 0 });

  const [templateData, setTemplateData] = useState<Template2Data>({
    setupType: '',
    entryReason: '',
    exitReason: '',
    followedPlan: null,
    planDeviationReason: '',
    preTradeMindset: '',
    emotionalState: '',
    technicalError: '',
    psychologicalError: '',
    mechanicalError: '',
    lessonsLearned: '',
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      modalX: position.x,
      modalY: position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const newX = dragStart.modalX + deltaX;
    const newY = dragStart.modalY + deltaY;
    
    // Prevent header from going off the top of the screen
    const minY = 0; // Don't allow modal to go above the top of viewport
    
    setPosition({
      x: newX,
      y: Math.max(minY, newY)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, dragStart, position]);

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

  const handleInputChange = (field: keyof Template2Data, value: string | boolean | null) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Convert AI response to TipTap JSON format for proper formatting with colors
  const convertToTipTapJSON = (rawAnalysis: string): any => {
    const content: any[] = [];
    
    // Parse the HTML and convert to TipTap JSON nodes
    const lines = rawAnalysis.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Main headings (h1) - Blue color
      if (trimmed.match(/<h1>.*<\/h1>/)) {
        const text = trimmed.replace(/<\/?h1>/g, '').replace(/<\/?strong>/g, '');
        content.push({
          type: 'heading',
          attrs: { level: 1 },
          content: [{ 
            type: 'text', 
            text, 
            marks: [
              { type: 'bold' },
              { type: 'textStyle', attrs: { color: '#60a5fa' } }
            ] 
          }]
        });
      }
      // Section headings (h2) - Green color  
      else if (trimmed.match(/<h2>.*<\/h2>/)) {
        const text = trimmed.replace(/<\/?h2>/g, '').replace(/<\/?strong>/g, '');
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ 
            type: 'text', 
            text, 
            marks: [
              { type: 'bold' },
              { type: 'textStyle', attrs: { color: '#34d399' } }
            ] 
          }]
        });
      }
      // Subsection headings (h3) - Yellow/Gold color
      else if (trimmed.match(/<h3>.*<\/h3>/)) {
        const text = trimmed.replace(/<\/?h3>/g, '').replace(/<\/?strong>/g, '');
        content.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [{ 
            type: 'text', 
            text, 
            marks: [
              { type: 'bold' },
              { type: 'textStyle', attrs: { color: '#fbbf24' } }
            ] 
          }]
        });
      }
      // Special colored paragraphs
      else if (trimmed.match(/<p><strong>.*<\/strong>.*<\/p>/)) {
        const matches = trimmed.match(/<p><strong>(.*?)<\/strong>(.*)<\/p>/);
        if (matches) {
          const boldText = matches[1];
          const normalText = matches[2];
          
          // Determine color based on content
          let color = '#f3f4f6'; // Default light gray
          if (boldText.includes('STRENGTHS')) color = '#10b981'; // Green
          else if (boldText.includes('WEAKNESSES')) color = '#ef4444'; // Red
          else if (boldText.includes('VERDICT')) color = '#f97316'; // Orange
          else if (boldText.includes('ANALYSIS')) color = '#3b82f6'; // Blue
          else if (boldText.includes('OVERALL TRADE QUALITY')) color = '#a855f7'; // Purple
          else if (boldText.includes('WHY')) color = '#06b6d4'; // Cyan
          else if (boldText.includes('KEY LESSON')) color = '#8b5cf6'; // Purple
          else if (boldText.includes('YOUR NEXT STEP')) color = '#059669'; // Green
          
          const contentArray = [{ 
            type: 'text', 
            text: boldText, 
            marks: [
              { type: 'bold' },
              { type: 'textStyle', attrs: { color } }
            ] 
          }];
          
          if (normalText) {
            contentArray.push({ 
              type: 'text', 
              text: normalText,
              marks: [{ type: 'textStyle', attrs: { color: '#f3f4f6' } }]
            });
          }
          
          content.push({
            type: 'paragraph',
            content: contentArray
          });
        }
      }
      // Final Summary special handling - Red with background highlight effect
      else if (trimmed.includes('Final Summary: Good Trade or Bad Trade')) {
        const text = trimmed.replace(/<\/?h2>/g, '');
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ 
            type: 'text', 
            text, 
            marks: [
              { type: 'bold' },
              { type: 'textStyle', attrs: { color: '#dc2626' } }
            ] 
          }]
        });
      }
      // Regular paragraphs - Light gray
      else if (trimmed.match(/<p>.*<\/p>/)) {
        const text = trimmed.replace(/<\/?p>/g, '').replace(/<\/?strong>/g, '');
        if (text.trim()) {
          content.push({
            type: 'paragraph',
            content: [{ 
              type: 'text', 
              text,
              marks: [{ type: 'textStyle', attrs: { color: '#f3f4f6' } }]
            }]
          });
        }
      }
      // List items - Light gray
      else if (trimmed.match(/<li>.*<\/li>/)) {
        const text = trimmed.replace(/<\/?li>/g, '');
        content.push({
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ 
              type: 'text', 
              text,
              marks: [{ type: 'textStyle', attrs: { color: '#e5e7eb' } }]
            }]
          }]
        });
      }
    }
    
    // Wrap list items in bulletList
    const processedContent: any[] = [];
    let currentList: any[] = [];
    
    for (const node of content) {
      if (node.type === 'listItem') {
        currentList.push(node);
      } else {
        if (currentList.length > 0) {
          processedContent.push({
            type: 'bulletList',
            content: currentList
          });
          currentList = [];
        }
        processedContent.push(node);
      }
    }
    
    // Handle any remaining list items
    if (currentList.length > 0) {
      processedContent.push({
        type: 'bulletList',
        content: currentList
      });
    }
    
    return {
      type: 'doc',
      content: processedContent
    };
  };

  // Convert AI response to TipTap-compatible format (no inline styles, proper structure)
  const convertToTipTapFormat = (rawAnalysis: string): string => {
    let clean = rawAnalysis;
    
    // Keep basic HTML structure but remove complex styling
    // TipTap will handle the formatting through its own system
    
    // Convert to proper TipTap headings (h1, h2, h3 are supported)
    clean = clean.replace(/<h1>([^<]*)<\/h1>/gi, '<h1>$1</h1>');
    clean = clean.replace(/<h2>([^<]*)<\/h2>/gi, '<h2>$1</h2>');
    clean = clean.replace(/<h3>([^<]*)<\/h3>/gi, '<h3>$1</h3>');
    
    // Convert strong tags for bolding
    clean = clean.replace(/<strong>([^<]*)<\/strong>/gi, '<strong>$1</strong>');
    
    // Keep paragraph structure
    clean = clean.replace(/<p><strong>([^<]*)<\/strong><\/p>/gi, '<p><strong>$1</strong></p>');
    clean = clean.replace(/<p>([^<]*)<\/p>/gi, '<p>$1</p>');
    
    // Keep list structure
    clean = clean.replace(/<ul>/gi, '<ul>');
    clean = clean.replace(/<\/ul>/gi, '</ul>');
    clean = clean.replace(/<li>([^<]*)<\/li>/gi, '<li>$1</li>');
    
    // Add minimal spacing with line breaks
    clean = clean.replace(/<\/h1>/gi, '</h1>');
    clean = clean.replace(/<\/h2>/gi, '</h2>');
    clean = clean.replace(/<\/h3>/gi, '</h3>');
    clean = clean.replace(/<\/ul>/gi, '</ul>');
    
    return clean;
  };

  const reorderAnalysisContent = (content: string): string => {
    // Extract Final Summary section
    const finalSummaryMatch = content.match(/<h2>Final Summary:[^<]*<\/h2>(.*?)(?=<h2>|$)/s);
    const finalSummaryContent = finalSummaryMatch ? finalSummaryMatch[0] : '';
    
    // Remove Final Summary from original content
    const contentWithoutFinalSummary = content.replace(/<h2>Final Summary:[^<]*<\/h2>(.*?)(?=<h2>|$)/s, '').trim();
    
    // If we found a Final Summary, just move it to the top without any modifications
    if (finalSummaryContent) {
      return `${finalSummaryContent}\n\n${contentWithoutFinalSummary}`;
    }
    
    return content;
  };

  const generateAnalysisHTML = (): string => {
    if (!analysisResult) {
      return `
<h1><strong>TRADE ANALYSIS REQUIRED</strong></h1>
<p><strong>Please click "Get Analysis" first to generate the assessment before inserting.</strong></p>
<hr>
<p><em>Analysis not yet performed - ${new Date().toLocaleString()}</em></p>
      `.trim();
    }

    // Use clean analysis for insertion, not the debug version
    const contentToInsert = analysisResult.cleanAnalysis || analysisResult.analysis;
    
    // Reorder content to move Final Summary to the top
    const reorderedContent = reorderAnalysisContent(contentToInsert);
    
    return `${reorderedContent}
<hr>
<p><em>Analysis generated: ${new Date().toLocaleString()}</em></p>`;
  };

  const handleInsert = () => {
    if (!analysisResult?.cleanAnalysis) {
      const htmlContent = generateAnalysisHTML();
      onInsert(htmlContent);
      onClose();
      return;
    }

    // Reorder the analysis content to move Final Summary to the top
    const reorderedContent = reorderAnalysisContent(analysisResult.cleanAnalysis);
    
    // Convert AI analysis to TipTap JSON structure instead of HTML
    const jsonContent = convertToTipTapJSON(reorderedContent);
    onInsert(jsonContent);
    onClose();
  };

  const handleClearDraft = () => {
    if (confirm('Are you sure you want to clear the saved draft?')) {
      localStorage.removeItem(STORAGE_KEY);
      setTemplateData({
        setupType: '',
        entryReason: '',
        exitReason: '',
        followedPlan: null,
        planDeviationReason: '',
        preTradeMindset: '',
        emotionalState: '',
        technicalError: '',
        psychologicalError: '',
        mechanicalError: '',
        lessonsLearned: '',
      });
      setAnalysisResult(null);
      setAnalysisError(null);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    // Create combined data object for debugging
    const performanceData = getPerformanceData();
    const debugData = {
      ...templateData,
      tradeData: trade ? {
        symbol: trade.symbol,
        direction: trade.direction,
        quantity: trade.quantity,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        pnl: trade.pnl,
        percentChange: trade.percentChange,
        status: trade.status,
        entryDate: trade.entryDate,
        entryTime: trade.entryTime,
        exitDate: trade.exitDate,
        exitTime: trade.exitTime,
        capital: trade.capital,
      } : null,
      calculatedPerformance: performanceData
    };

    // Show debug information immediately
    const debugHtml = `
      <h3><strong>SENDING DATA TO AI:</strong></h3>
      <div style="background-color: #374151; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; margin: 8px 0;">
        <strong>Trade Details:</strong><br/>
        Symbol: ${trade?.symbol || 'N/A'}<br/>
        Direction: ${trade?.direction || 'N/A'}<br/>
        Entry Price: $${trade?.entryPrice?.toFixed(2) || 'N/A'}<br/>
        Exit Price: $${trade?.exitPrice?.toFixed(2) || 'N/A'}<br/>
        P&L: $${trade?.pnl?.toFixed(2) || 'N/A'}<br/>
        Percent Change: ${trade?.percentChange?.toFixed(2) || 'N/A'}%<br/>
        Status: ${trade?.status || 'N/A'}<br/>
        Capital: $${trade?.capital || 'N/A'}<br/><br/>
        
        <strong>Template Data:</strong><br/>
        Setup Type: ${templateData.setupType || 'Empty'}<br/>
        Entry Reason: ${templateData.entryReason || 'Empty'}<br/>
        Exit Reason: ${templateData.exitReason || 'Empty'}<br/>
        Followed Plan: ${templateData.followedPlan === null ? 'Not answered' : templateData.followedPlan ? 'Yes' : 'No'}<br/>
        Plan Deviation Reason: ${templateData.planDeviationReason || 'Empty'}<br/>
        Pre-Trade Mindset: ${templateData.preTradeMindset || 'Empty'}<br/>
        Emotional State: ${templateData.emotionalState || 'Empty'}<br/>
        Technical Error: ${templateData.technicalError || 'Empty'}<br/>
        Psychological Error: ${templateData.psychologicalError || 'Empty'}<br/>
        Mechanical Error: ${templateData.mechanicalError || 'Empty'}<br/>
        Lessons Learned: ${templateData.lessonsLearned || 'Empty'}<br/><br/>
        
        <strong>Calculated Performance:</strong><br/>
        Capital Efficiency: ${performanceData?.capitalEfficiency || 'N/A'}<br/>
        Return on Risk: ${performanceData?.returnOnRisk || 'N/A'}<br/>
        Actual Exit: ${performanceData?.actualExit || 'N/A'}<br/>
      </div>
      <p><strong>Sending to AI for analysis...</strong></p>
    `;
    
    setAnalysisResult({ analysis: debugHtml });
    
    try {
      // Get auth token
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call the AI analysis API with combined data
      const response = await fetch(`${API_BASE_URL}/analysis/analyze-trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(debugData)
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Show debug data in modal, but prepare clean analysis for insertion
      const formattedAnalysis = formatAIResponse(result.analysis);
      
      // For display in modal (with debug info)
      const displayAnalysis = `
        ${debugHtml}
        <hr style="margin: 20px 0; border-color: #6b7280;"/>
        <h3><strong>AI ANALYSIS RESULT:</strong></h3>
        ${formattedAnalysis}
      `;
      
      setAnalysisResult({ 
        analysis: displayAnalysis,
        cleanAnalysis: convertToTipTapFormat(result.analysis) // Clean version for editor insertion
      });
      
    } catch (error: any) {
      setAnalysisError(error.message || error.toString() || 'Unknown error occurred');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate performance data from trade
  // Format AI response with rich TipTap styling
  const formatAIResponse = (rawAnalysis: string): string => {
    let formatted = rawAnalysis;
    
    // Main title styling
    formatted = formatted.replace(
      /<h1>([^<]*)<\/h1>/gi,
      '<h1 style="color: #60a5fa; font-size: 28px; font-weight: bold; margin: 20px 0 16px 0; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">$1</h1>'
    );
    
    // Section headers with colors
    formatted = formatted.replace(
      /<h2>([^<]*)<\/h2>/gi,
      '<h2 style="color: #34d399; font-size: 22px; font-weight: bold; margin: 20px 0 12px 0;">$1</h2>'
    );
    
    // Subsection headers
    formatted = formatted.replace(
      /<h3>([^<]*)<\/h3>/gi,
      '<h3 style="color: #fbbf24; font-size: 18px; font-weight: bold; margin: 16px 0 8px 0;">$1</h3>'
    );
    
    // Strengths sections - green styling
    formatted = formatted.replace(
      /<p><strong>Strengths:<\/strong><\/p>/gi,
      '<p style="color: #10b981; font-weight: bold; font-size: 16px; margin: 12px 0 6px 0;">STRENGTHS:</p>'
    );
    
    // Weaknesses sections - red styling
    formatted = formatted.replace(
      /<p><strong>Weaknesses:<\/strong><\/p>/gi,
      '<p style="color: #ef4444; font-weight: bold; font-size: 16px; margin: 12px 0 6px 0;">WEAKNESSES:</p>'
    );
    
    // Verdict sections - orange styling
    formatted = formatted.replace(
      /<p><strong>Verdict:<\/strong>/gi,
      '<p style="color: #f97316; font-weight: bold; font-size: 16px; margin: 12px 0 6px 0;"><strong>VERDICT:</strong>'
    );
    
    // Analysis sections - blue styling
    formatted = formatted.replace(
      /<p><strong>Analysis:<\/strong><\/p>/gi,
      '<p style="color: #3b82f6; font-weight: bold; font-size: 16px; margin: 12px 0 6px 0;">ANALYSIS:</p>'
    );
    
    // Overall Trade Quality - purple styling
    formatted = formatted.replace(
      /<p><strong>Overall Trade Quality:<\/strong>/gi,
      '<p style="color: #a855f7; font-weight: bold; font-size: 18px; margin: 12px 0 8px 0; padding: 8px 12px; background-color: rgba(168, 85, 247, 0.1); border-left: 4px solid #a855f7;"><strong>OVERALL TRADE QUALITY:</strong>'
    );
    
    // Key labels styling
    formatted = formatted.replace(
      /<p><strong>Why\?<\/strong>/gi,
      '<p style="color: #06b6d4; font-weight: bold; font-size: 16px; margin: 12px 0 6px 0;"><strong>WHY:</strong>'
    );
    
    formatted = formatted.replace(
      /<p><strong>The Key Lesson:<\/strong>/gi,
      '<p style="color: #8b5cf6; font-weight: bold; font-size: 16px; margin: 12px 0 6px 0;"><strong>KEY LESSON:</strong>'
    );
    
    formatted = formatted.replace(
      /<p><strong>Your Next Step:<\/strong>/gi,
      '<p style="color: #059669; font-weight: bold; font-size: 16px; margin: 12px 0 6px 0; padding: 8px 12px; background-color: rgba(5, 150, 105, 0.1); border-left: 4px solid #059669;"><strong>YOUR NEXT STEP:</strong>'
    );
    
    // Final Summary section
    formatted = formatted.replace(
      /<h2>Final Summary: Good Trade or Bad Trade\?<\/h2>/gi,
      '<h2 style="color: #dc2626; font-size: 24px; font-weight: bold; margin: 24px 0 16px 0; padding: 12px; background-color: rgba(220, 38, 38, 0.1); border: 2px solid #dc2626; border-radius: 8px; text-align: center;">FINAL SUMMARY: GOOD TRADE OR BAD TRADE?</h2>'
    );
    
    // Style bullet points in lists
    formatted = formatted.replace(
      /<ul>/gi,
      '<ul style="margin: 8px 0 16px 20px; padding-left: 16px;">'
    );
    
    formatted = formatted.replace(
      /<li>/gi,
      '<li style="margin: 4px 0; color: #e5e7eb; line-height: 1.5;">'
    );
    
    // Regular paragraphs
    formatted = formatted.replace(
      /<p>(?!.*style=)([^<]*)<\/p>/gi,
      '<p style="margin: 8px 0; line-height: 1.6; color: #f3f4f6;">$1</p>'
    );
    
    return formatted;
  };

  const getPerformanceData = () => {
    if (!trade) return null;
    
    const capital = trade.capital || 0;
    const pnl = trade.pnl || 0;
    const entryPrice = trade.entryPrice || 0;
    const exitPrice = trade.exitPrice || 0;
    const quantity = trade.quantity || 0;
    
    // Calculate R/R ratios and other metrics
    const capitalEfficiency = capital > 0 ? `${pnl > 0 ? '+' : ''}$${pnl} / $${capital}` : 'N/A';
    const returnOnRisk = entryPrice > 0 && exitPrice > 0 ? ((exitPrice - entryPrice) / entryPrice).toFixed(2) + ':1' : 'N/A';
    
    return {
      capitalEfficiency,
      returnOnRisk,
      actualExit: exitPrice ? `Exit at $${exitPrice.toFixed(2)}` : 'Still Open'
    };
  };

  const performanceData = getPerformanceData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="draggable-modal bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden relative"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Header - Draggable */}
        <div 
          className="drag-handle bg-gradient-to-r from-blue-600 to-purple-600 p-6 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Trade Review Template 2</h2>
              <p className="text-blue-100 text-sm mt-1">Simplified Template • Auto-saved as you type • Drag to reposition</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl hover:bg-white hover:bg-opacity-20 rounded w-8 h-8 flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Trade Details Section */}
          {trade && (
            <div className="mb-8 bg-gray-750 border border-gray-600 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-4 border-b border-gray-600 pb-2">
                TRADE DETAILS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Symbol:</span>
                  <span className="ml-2 font-semibold text-white">{trade.symbol}</span>
                </div>
                <div>
                  <span className="text-gray-400">Direction:</span>
                  <span className={`ml-2 font-semibold ${trade.direction === 'Long' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.direction}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Quantity:</span>
                  <span className="ml-2 font-semibold text-white">{trade.quantity}</span>
                </div>
                <div>
                  <span className="text-gray-400">Entry Price:</span>
                  <span className="ml-2 font-semibold text-white">${trade.entryPrice?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Exit Price:</span>
                  <span className="ml-2 font-semibold text-white">
                    {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : 'Open'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">P&L:</span>
                  <span className={`ml-2 font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl !== null ? `$${trade.pnl.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Entry Date:</span>
                  <span className="ml-2 font-semibold text-white">{trade.entryDate} {trade.entryTime}</span>
                </div>
                <div>
                  <span className="text-gray-400">Exit Date:</span>
                  <span className="ml-2 font-semibold text-white">
                    {trade.exitDate ? `${trade.exitDate} ${trade.exitTime}` : 'Open'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className={`ml-2 font-semibold ${trade.status === 'Closed' ? 'text-blue-400' : 'text-yellow-400'}`}>
                    {trade.status}
                  </span>
                </div>
              </div>
              
              {/* Performance Data */}
              {performanceData && (
                <div className="mt-6 border-t border-gray-600 pt-4">
                  <h4 className="text-lg font-medium text-orange-400 mb-3">PERFORMANCE</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Capital Efficiency:</span>
                      <span className="ml-2 font-semibold text-white">{performanceData.capitalEfficiency}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Return on Risk:</span>
                      <span className="ml-2 font-semibold text-white">{performanceData.returnOnRisk}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-400">Actual Exit:</span>
                      <span className="ml-2 font-semibold text-white">{performanceData.actualExit}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section I: Setup & Context (Simplified) */}
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
            </div>
            <div className="mt-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Reason for Entry
              </label>
              <textarea
                value={templateData.entryReason}
                onChange={(e) => handleInputChange('entryReason', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Why this trade, why now?"
              />
            </div>
          </div>

          {/* Section II: Execution & Trade Management (Simplified) */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-purple-400 mb-4 border-b border-gray-600 pb-2">
              II. EXECUTION & TRADE MANAGEMENT
            </h3>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Exit Reason/Any Mistakes
              </label>
              <textarea
                value={templateData.exitReason}
                onChange={(e) => handleInputChange('exitReason', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Target hit, Stop loss, Emotional exit, mistakes made, etc."
              />
            </div>
            
            {/* Follow Plan Toggle */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-3">
                Did you follow your plan?
              </label>
              <div className="flex gap-4 mb-3">
                <button
                  onClick={() => handleInputChange('followedPlan', true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    templateData.followedPlan === true
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleInputChange('followedPlan', false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    templateData.followedPlan === false
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  No
                </button>
              </div>
              
              {/* Show reason field if "No" is selected */}
              {templateData.followedPlan === false && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Why didn't you follow your plan?
                  </label>
                  <input
                    type="text"
                    value={templateData.planDeviationReason}
                    onChange={(e) => handleInputChange('planDeviationReason', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Explain why you deviated from your plan"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section III: Psychology & Review (Modified) */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-pink-400 mb-4 border-b border-gray-600 pb-2">
              III. PSYCHOLOGY & REVIEW
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
          </div>

          {/* Analysis Section */}
          <div className="mb-8 border-t border-gray-600 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-yellow-400">
                AI TRADE ANALYSIS
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

export default TradeTemplateModal2;