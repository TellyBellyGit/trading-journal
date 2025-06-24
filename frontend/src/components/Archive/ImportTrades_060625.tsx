import React, { useState, useCallback, useRef } from 'react';
import { tradesApi } from '../api/trades'; // Add this import

// Types for import process
interface ImportSummary {
  totalImported: number;
  duplicatesRejected: number;
  longTrades: number;
  shortTrades: number;
  openLongs: number;
  openShorts: number;
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
  type: 'file' | 'processing' | 'validation' | 'database';
  message: string;
  details?: string[];
}

type ImportStep = 'upload' | 'processing' | 'preview' | 'complete';

const ImportTrades: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<ImportError | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // NEW: State for duplicate details and expandable sections
  const [duplicateDetails, setDuplicateDetails] = useState<any[]>([]);
  const [showUniqueTrades, setShowUniqueTrades] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showLongTrades, setShowLongTrades] = useState(false);
  const [showShortTrades, setShowShortTrades] = useState(false);

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
        setError({
          type: 'database',
          message: result.error.message,
          details: result.error.details
        });
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
                    {parsedTrades.slice(0, 10).map((trade, index) => (
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
                {parsedTrades.length > 10 && (
                  <div className="p-4 bg-gray-700/30 text-center text-gray-400 text-sm">
                    ... and {parsedTrades.length - 10} more trades
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
                  {duplicateDetails.slice(0, 10).map((duplicate, index) => (
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
                  {duplicateDetails.length > 10 && (
                    <div className="text-center text-gray-400 text-sm pt-2">
                      ... and {duplicateDetails.length - 10} more duplicates
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
                    {longTrades.slice(0, 5).map((trade, index) => (
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
                {longTrades.length > 5 && (
                  <div className="p-3 bg-gray-700/30 text-center text-gray-400 text-sm">
                    ... and {longTrades.length - 5} more long trades
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
                    {shortTrades.slice(0, 5).map((trade, index) => (
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
                {shortTrades.length > 5 && (
                  <div className="p-3 bg-gray-700/30 text-center text-gray-400 text-sm">
                    ... and {shortTrades.length - 5} more short trades
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {selectedFile ? 'Select Different File' : 'Browse Files'}
            </button>
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

      {/* Action Buttons */}
      {selectedFile && (
        <div className="flex justify-end">
          <button
            onClick={processFile}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process File'}
          </button>
        </div>
      )}
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
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Confirm Import'}
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
          {importSummary?.totalImported} trades have been successfully imported to your journal
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

  // Render error state
  const renderError = () => {
    if (!error) return null;

    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-red-400 text-xl">⚠️</span>
          <h4 className="text-red-400 font-medium text-lg">{error.message}</h4>
        </div>
        {error.details && (
          <ul className="text-red-300 text-sm space-y-1 mb-4">
            {error.details.map((detail, index) => (
              <li key={index}>• {detail}</li>
            ))}
          </ul>
        )}
        <button
          onClick={() => setError(null)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Dismiss
        </button>
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