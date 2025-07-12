import React, { useState, useCallback, useRef } from 'react';
import { tradesApi } from '../api/trades'; // Add this import
import { subscriptionsApi } from '../api/subscriptions';

// Types for import process
interface ImportSummary {
  totalImported: number;
  duplicatesRejected: number;
  longTrades: number;
  shortTrades: number;
  openLongs: number;
  openShorts: number;
  saved?: number;
  partialImport?: {
    imported: number;
    remaining: number;
    message: string;
  };
}

interface ParsedTrade {
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: number;
  entryDate: string;
  entryTime: string;
  exitDate: string;
  exitTime: string;
  duration: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  percentChange: number;
  orderType: string;
  status: 'Open' | 'Closed';
}

interface ImportError {
  type: 'file' | 'processing' | 'validation' | 'database' | 'subscription';
  message: string;
  details?: string[];
  canImportPartial?: number;
  maxBatchSize?: number;
  gracePeriod?: number;
}

interface ImportSuccess {
  type: 'success';
  message: string;
  details: string[];
}

type ImportStep = 'upload' | 'processing' | 'preview' | 'complete';

const ImportTrades: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<ImportError | null>(null);
  const [success, setSuccess] = useState<ImportSuccess | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // NEW: State for duplicate details and expandable sections
  const [duplicateDetails, setDuplicateDetails] = useState<any[]>([]);
  const [showUniqueTrades, setShowUniqueTrades] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showLongTrades, setShowLongTrades] = useState(false);
  const [showShortTrades, setShowShortTrades] = useState(false);
  
  // NEW: State for "Show All" functionality for each section
  const [showAllUnique, setShowAllUnique] = useState(false);
  const [showAllDuplicates, setShowAllDuplicates] = useState(false);
  const [showAllLongs, setShowAllLongs] = useState(false);
  const [showAllShorts, setShowAllShorts] = useState(false);

  // File upload handling
  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError({
        type: 'file',
        message: 'Invalid file format',
        details: ['Please select a CSV file exported from your broker']
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError({
        type: 'file',
        message: 'File too large',
        details: ['Please select a file smaller than 10MB']
      });
      return;
    }

    setSelectedFile(file);
    setError(null);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Process CSV file
  const processFile = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setCurrentStep('processing');
    setError(null);

    try {
      const result = await tradesApi.import.process(selectedFile);

      console.log('🔍 Backend response:', result); // Debug log
      
      if (result.error) {
        setError({
          type: 'processing',
          message: result.error.message,
          details: result.error.details
        });
        setCurrentStep('upload');
        return;
      }

      setParsedTrades(result.trades || []);
      setImportSummary(result.summary);
      setDuplicateDetails(result.duplicateDetails || []); // NEW: Store duplicate details
      setCurrentStep('preview');
    } catch (error) {
      console.error('❌ Process error:', error);
      setError({
        type: 'processing',
        message: 'Failed to process CSV file',
        details: ['Please check file format and try again']
      });
      setCurrentStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // Save trades to database
  const saveTrades = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await tradesApi.import.save(parsedTrades, 1); //instead of brokerId 

      if (result.error) {
        // Enhanced error handling for subscription limits
        if (result.error === 'Import batch limit exceeded') {
          setError({
            type: 'subscription',
            message: 'Import Batch Limit Exceeded',
            details: [
              result.message || 'Free accounts can import up to 5 trades per batch.',
              `You tried to import: ${result.attemptedToImport || parsedTrades.length} trades`,
              `You can import up to: ${result.canImportPartial || 0} trades in this batch`,
              'Upgrade to Pro for unlimited batch imports.'
            ],
            canImportPartial: result.canImportPartial,
            maxBatchSize: result.maxBatchSize
          });
        } else if (result.error === 'Import would exceed monthly limit' || result.error === 'Subscription limit reached') {
          setError({
            type: 'subscription',
            message: 'Monthly Limit Reached',
            details: [
              result.message || 'Your current plan does not allow importing this many trades.',
              `Attempted to import: ${result.attemptedToImport || parsedTrades.length} trades`,
              `Remaining this month: ${result.remaining || 0} trades`,
              result.gracePeriod ? `Grace period available: ${result.gracePeriod} trades` : null,
              'Upgrade to Pro or Premium for unlimited trades.'
            ].filter(Boolean),
            canImportPartial: result.canImportPartial,
            gracePeriod: result.gracePeriod
          });
        } else {
          setError({
            type: 'database',
            message: result.error.message || result.error,
            details: result.error.details || [result.message]
          });
        }
        return;
      }

      setCurrentStep('complete');
    } catch (error) {
      setError({
        type: 'database',
        message: 'Failed to save trades to database',
        details: ['Please try again or contact support']
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset import process
  const resetImport = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setParsedTrades([]);
    setImportSummary(null);
    setError(null);
    setLoading(false);
    // NEW: Reset duplicate details and expandable states
    setDuplicateDetails([]);
    setShowUniqueTrades(false);
    setShowDuplicates(false);
    setShowLongTrades(false);
    setShowShortTrades(false);
    // NEW: Reset "Show All" states
    setShowAllUnique(false);
    setShowAllDuplicates(false);
    setShowAllLongs(false);
    setShowAllShorts(false);
  };

  // Handle partial import when batch limit is exceeded
  const handlePartialImport = async () => {
    if (!error || !error.canImportPartial) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Import only the allowed number of trades
      const tradesToImport = parsedTrades.slice(0, error.canImportPartial);
      console.log(`🚀 Attempting partial import of ${tradesToImport.length} trades out of ${parsedTrades.length} total`);
      
      const result = await tradesApi.import.save(tradesToImport, 1);
      console.log('✅ Partial import result:', result);
      
      if (result.error) {
        setError({
          type: 'database',
          message: result.error.message || result.error,
          details: result.error.details || [result.message]
        });
        return;
      }
      
      // Update state to show remaining trades
      const remainingTrades = parsedTrades.slice(error.canImportPartial);
      setParsedTrades(remainingTrades);
      
      // Get updated subscription status to show remaining monthly trades
      let monthlyRemaining = 0;
      try {
        const updatedStatus = await subscriptionsApi.getStatus();
        monthlyRemaining = updatedStatus.maxTrades - updatedStatus.tradeCount;
      } catch (statusError) {
        console.error('Error fetching updated subscription status:', statusError);
        // Continue with success message even if we can't get updated status
        monthlyRemaining = 0;
      }
      
      // Show success message and update summary
      setImportSummary({
        ...importSummary,
        saved: (importSummary?.saved || 0) + result.summary.saved,
        partialImport: {
          imported: result.summary.saved,
          remaining: remainingTrades.length,
          message: `Successfully imported ${result.summary.saved} trades. ${monthlyRemaining} trades remaining this month. ${remainingTrades.length} trades from your file were not imported.`
        }
      });
      
      // Show success notification
      setSuccess({
        type: 'success',
        message: 'Partial Import Successful',
        details: [
          `✅ Imported: ${result.summary.saved} trades`,
          `📊 Remaining this month: ${monthlyRemaining} trades`,
          `📁 Not imported: ${remainingTrades.length} trades from your file`,
          remainingTrades.length > 0 ? 'You can import more trades next month or upgrade for unlimited imports.' : ''
        ].filter(Boolean)
      });
      
      // Clear any existing errors
      setError(null);
      
      // Notify other components that subscription status has been updated
      window.dispatchEvent(new CustomEvent('subscriptionUpdated'));
      
      if (remainingTrades.length === 0) {
        setCurrentStep('complete');
      }
      
    } catch (error) {
      console.error('Partial import error:', error);
      setError({
        type: 'database',
        message: 'Failed to import trades',
        details: ['Please try again or contact support']
      });
      // Clear any success message if there was an actual error
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle upgrade action
  const handleUpgrade = () => {
    // Dispatch event to open subscription modal
    window.dispatchEvent(new CustomEvent('openSubscriptionModal'));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // NEW: Render trade preview tables
  const renderTradePreviewTables = () => {
    if (!parsedTrades.length && !duplicateDetails.length) return null;

    const longTrades = parsedTrades.filter(trade => trade.direction === 'Long');
    const shortTrades = parsedTrades.filter(trade => trade.direction === 'Short');

    return (
      <div className="space-y-4">
        {/* Unique Trades to Import */}
        {parsedTrades.length > 0 && (
          <div className="bg-gray-800 border border-green-600 rounded-lg">
            <div
              className="p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => setShowUniqueTrades(!showUniqueTrades)}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-green-400">
                  📊 Trades to Import ({parsedTrades.length})
                </h4>
                <span className="text-green-400">
                  {showUniqueTrades ? '▼' : '▶'}
                </span>
              </div>
            </div>
            {showUniqueTrades && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-3 text-left text-gray-300 font-medium">Symbol</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Direction</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Quantity</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Entry Date</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Entry Time</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Entry Price</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {parsedTrades.slice(0, showAllUnique ? parsedTrades.length : 10).map((trade, index) => (
                      <tr key={index} className="hover:bg-gray-700/30">
                        <td className="p-3 text-white font-medium">{trade.symbol}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="p-3 text-gray-300">{trade.quantity.toLocaleString()}</td>
                        <td className="p-3 text-gray-300">{trade.entryDate}</td>
                        <td className="p-3 text-gray-300">{trade.entryTime}</td>
                        <td className="p-3 text-gray-300">${trade.entryPrice.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            trade.status === 'Open' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedTrades.length > 10 && !showAllUnique && (
                  <div className="p-4 bg-gray-700/30 text-center">
                    <span className="text-gray-400 text-sm mr-4">
                      ... and {parsedTrades.length - 10} more trades
                    </span>
                    <button
                      onClick={() => setShowAllUnique(true)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Show All {parsedTrades.length} Trades
                    </button>
                  </div>
                )}
                {showAllUnique && parsedTrades.length > 10 && (
                  <div className="p-4 bg-gray-700/30 text-center">
                    <button
                      onClick={() => setShowAllUnique(false)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Duplicate Trades */}
        {duplicateDetails.length > 0 && (
          <div className="bg-gray-800 border border-red-600 rounded-lg">
            <div
              className="p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => setShowDuplicates(!showDuplicates)}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-red-400">
                  🚫 Duplicate Trades Rejected ({duplicateDetails.length})
                </h4>
                <span className="text-red-400">
                  {showDuplicates ? '▼' : '▶'}
                </span>
              </div>
            </div>
            {showDuplicates && (
              <div className="p-4">
                <div className="space-y-2">
                  {duplicateDetails.slice(0, showAllDuplicates ? duplicateDetails.length : 10).map((duplicate, index) => (
                    <div key={index} className="bg-red-600/10 border border-red-600/30 rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-red-300 font-medium">
                            {duplicate.symbol} - {duplicate.entryDate} {duplicate.entryTime}
                          </span>
                        </div>
                        <span className="text-red-400 text-sm">Duplicate</span>
                      </div>
                      <div className="text-red-300/70 text-sm mt-1">
                        {duplicate.reason}
                      </div>
                    </div>
                  ))}
                  {duplicateDetails.length > 10 && !showAllDuplicates && (
                    <div className="text-center pt-2">
                      <span className="text-gray-400 text-sm mr-4">
                        ... and {duplicateDetails.length - 10} more duplicates
                      </span>
                      <button
                        onClick={() => setShowAllDuplicates(true)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Show All {duplicateDetails.length} Duplicates
                      </button>
                    </div>
                  )}
                  {showAllDuplicates && duplicateDetails.length > 10 && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => setShowAllDuplicates(false)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Show Less
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Long Trades */}
        {longTrades.length > 0 && (
          <div className="bg-gray-800 border border-green-500 rounded-lg">
            <div
              className="p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => setShowLongTrades(!showLongTrades)}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-green-500">
                  📈 Long Trades ({longTrades.length})
                </h4>
                <span className="text-green-500">
                  {showLongTrades ? '▼' : '▶'}
                </span>
              </div>
            </div>
            {showLongTrades && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-3 text-left text-gray-300 font-medium">Symbol</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Quantity</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Entry Price</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Entry Time</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {longTrades.slice(0, showAllLongs ? longTrades.length : 5).map((trade, index) => (
                      <tr key={index} className="hover:bg-gray-700/30">
                        <td className="p-3 text-white font-medium">{trade.symbol}</td>
                        <td className="p-3 text-gray-300">{trade.quantity.toLocaleString()}</td>
                        <td className="p-3 text-gray-300">${trade.entryPrice.toFixed(2)}</td>
                        <td className="p-3 text-gray-300">{trade.entryDate} {trade.entryTime}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            trade.status === 'Open' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {longTrades.length > 5 && !showAllLongs && (
                  <div className="p-3 bg-gray-700/30 text-center">
                    <span className="text-gray-400 text-sm mr-4">
                      ... and {longTrades.length - 5} more long trades
                    </span>
                    <button
                      onClick={() => setShowAllLongs(true)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                    >
                      Show All {longTrades.length} Long Trades
                    </button>
                  </div>
                )}
                {showAllLongs && longTrades.length > 5 && (
                  <div className="p-3 bg-gray-700/30 text-center">
                    <button
                      onClick={() => setShowAllLongs(false)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Short Trades */}
        {shortTrades.length > 0 && (
          <div className="bg-gray-800 border border-red-500 rounded-lg">
            <div
              className="p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors"
              onClick={() => setShowShortTrades(!showShortTrades)}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-red-500">
                  📉 Short Trades ({shortTrades.length})
                </h4>
                <span className="text-red-500">
                  {showShortTrades ? '▼' : '▶'}
                </span>
              </div>
            </div>
            {showShortTrades && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-3 text-left text-gray-300 font-medium">Symbol</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Quantity</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Entry Price</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Entry Time</th>
                      <th className="p-3 text-left text-gray-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {shortTrades.slice(0, showAllShorts ? shortTrades.length : 5).map((trade, index) => (
                      <tr key={index} className="hover:bg-gray-700/30">
                        <td className="p-3 text-white font-medium">{trade.symbol}</td>
                        <td className="p-3 text-gray-300">{trade.quantity.toLocaleString()}</td>
                        <td className="p-3 text-gray-300">${trade.entryPrice.toFixed(2)}</td>
                        <td className="p-3 text-gray-300">{trade.entryDate} {trade.entryTime}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            trade.status === 'Open' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shortTrades.length > 5 && !showAllShorts && (
                  <div className="p-3 bg-gray-700/30 text-center">
                    <span className="text-gray-400 text-sm mr-4">
                      ... and {shortTrades.length - 5} more short trades
                    </span>
                    <button
                      onClick={() => setShowAllShorts(true)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                    >
                      Show All {shortTrades.length} Short Trades
                    </button>
                  </div>
                )}
                {showAllShorts && shortTrades.length > 5 && (
                  <div className="p-3 bg-gray-700/30 text-center">
                    <button
                      onClick={() => setShowAllShorts(false)}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      Show Less
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render upload step
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* File Upload Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Upload Broker Statement</h3>
          <p className="text-gray-400 text-sm mt-1">Select your CSV file exported from your broker</p>
        </div>
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              error?.type === 'file' 
                ? 'border-red-600 bg-red-600/10' 
                : 'border-gray-600 hover:border-gray-500 bg-gray-700/30'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-4">📄</div>
            <h4 className="text-lg font-medium text-white mb-2">
              {selectedFile ? selectedFile.name : 'Drop your CSV file here'}
            </h4>
            <p className="text-gray-400 mb-4">
              {selectedFile 
                ? `File size: ${(selectedFile.size / 1024).toFixed(1)} KB`
                : 'or click to browse your files'
              }
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedFile ? 'Select Different File' : 'Browse Files'}
              </button>
              
              {selectedFile && (
                <button
                  onClick={processFile}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Validating...' : 'Validate File'}
                </button>
              )}
            </div>
          </div>

          {error?.type === 'file' && (
            <div className="mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">⚠️</span>
                <h4 className="text-red-400 font-medium">{error.message}</h4>
              </div>
              {error.details && (
                <ul className="mt-2 text-red-300 text-sm space-y-1">
                  {error.details.map((detail, index) => (
                    <li key={index}>• {detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Requirements Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">CSV Format Requirements</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Must contain columns: Symbol, Side, Qty, Pos Effect, Net Price, Exec Time</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Pos Effect should be "TO OPEN" or "TO CLOSE"</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Dates in MM/DD/YY format</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Maximum file size: 10MB</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Processing CSV File</h3>
      </div>
      <div className="p-8 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h4 className="text-lg font-medium text-white mb-2">Analyzing your trades...</h4>
        <p className="text-gray-400">This may take a moment for large files</p>
      </div>
    </div>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* Summary Card */}
      {importSummary && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Import Summary</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">{importSummary.totalImported}</div>
                <div className="text-gray-400 text-sm">Trades Imported</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{importSummary.duplicatesRejected}</div>
                <div className="text-gray-400 text-sm">Duplicates Rejected</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{importSummary.longTrades}</div>
                <div className="text-gray-400 text-sm">Long Trades</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{importSummary.shortTrades}</div>
                <div className="text-gray-400 text-sm">Short Trades</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{importSummary.openLongs}</div>
                <div className="text-gray-400 text-sm">Open Longs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{importSummary.openShorts}</div>
                <div className="text-gray-400 text-sm">Open Shorts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Trade Preview Tables */}
      {renderTradePreviewTables()}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={resetImport}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel Import
        </button>
        <button
          onClick={saveTrades}
          disabled={loading || parsedTrades.length === 0}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            parsedTrades.length > 0
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading 
            ? 'Saving...' 
            : parsedTrades.length > 0 
              ? `Confirm Import (${parsedTrades.length} trades)`
              : 'No Trades to Import'
          }
        </button>
      </div>
    </div>
  );

  // Render complete step
  const renderCompleteStep = () => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg">
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-white mb-2">Import Complete!</h3>
        <p className="text-gray-400 mb-6">
          {importSummary?.totalImported === 0 
            ? 'No Records Imported'
            : `Import Complete - ${importSummary?.totalImported} trades imported`
          }
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={resetImport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import Another File
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // Render success state
  const renderSuccess = () => {
    if (!success) return null;

    return (
      <div className="border rounded-lg p-6 bg-green-900/20 border-green-700">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl text-green-400">✅</span>
          <h4 className="font-medium text-lg text-green-400">
            {success.message}
          </h4>
        </div>
        <ul className="text-sm space-y-1 mb-4 text-green-300">
          {success.details.map((detail, index) => (
            <li key={index}>• {detail}</li>
          ))}
        </ul>
        <div className="flex space-x-3">
          <button
            onClick={() => setSuccess(null)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  // Render error state
  const renderError = () => {
    if (!error) return null;

    const isSubscriptionError = error.type === 'subscription';

    return (
      <div className={`border rounded-lg p-6 ${
        isSubscriptionError 
          ? 'bg-yellow-900/20 border-yellow-700' 
          : 'bg-red-900/20 border-red-700'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className={`text-xl ${isSubscriptionError ? 'text-yellow-400' : 'text-red-400'}`}>
            {isSubscriptionError ? '⚡' : '⚠️'}
          </span>
          <h4 className={`font-medium text-lg ${isSubscriptionError ? 'text-yellow-400' : 'text-red-400'}`}>
            {error.message}
          </h4>
        </div>
        {error.details && (
          <ul className={`text-sm space-y-1 mb-4 ${isSubscriptionError ? 'text-yellow-300' : 'text-red-300'}`}>
            {error.details.map((detail, index) => (
              <li key={index}>• {detail}</li>
            ))}
          </ul>
        )}
        <div className="flex space-x-3">
          {isSubscriptionError ? (
            <>
              {/* Show partial import option if available */}
              {error.canImportPartial && error.canImportPartial > 0 && (
                <button
                  onClick={handlePartialImport}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Importing...' : `Import ${error.canImportPartial} Trades`}
                </button>
              )}
              <button
                onClick={handleUpgrade}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Upgrade Plan
              </button>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Dismiss
              </button>
            </>
          ) : (
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Import Trades</h2>
        <p className="text-gray-400">Upload your broker statement to automatically import trades</p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          {(['upload', 'processing', 'preview', 'complete'] as ImportStep[]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep === step ? 'bg-blue-600 text-white' : 
                  index < (['upload', 'processing', 'preview', 'complete'] as ImportStep[]).indexOf(currentStep) 
                    ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}
              `}>
                {index < (['upload', 'processing', 'preview', 'complete'] as ImportStep[]).indexOf(currentStep) ? '✓' : index + 1}
              </div>
              {index < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  index < (['upload', 'processing', 'preview', 'complete'] as ImportStep[]).indexOf(currentStep) 
                    ? 'bg-green-600' : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Success Display */}
      {success && renderSuccess()}

      {/* Error Display */}
      {error && renderError()}

      {/* Step Content */}
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'processing' && renderProcessingStep()}
      {currentStep === 'preview' && renderPreviewStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
};

export default ImportTrades;