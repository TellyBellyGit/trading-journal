import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useCallback, useRef } from 'react';
import { tradesApi } from '../api/trades'; // Add this import
const ImportTrades = () => {
    const [currentStep, setCurrentStep] = useState('upload');
    const [selectedFile, setSelectedFile] = useState(null);
    const [parsedTrades, setParsedTrades] = useState([]);
    const [importSummary, setImportSummary] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    // NEW: State for duplicate details and expandable sections
    const [duplicateDetails, setDuplicateDetails] = useState([]);
    const [showUniqueTrades, setShowUniqueTrades] = useState(false);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [showLongTrades, setShowLongTrades] = useState(false);
    const [showShortTrades, setShowShortTrades] = useState(false);
    // File upload handling
    const handleFileSelect = useCallback((file) => {
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
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);
    // Process CSV file
    const processFile = async () => {
        if (!selectedFile)
            return;
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
        }
        catch (error) {
            console.error('❌ Process error:', error);
            setError({
                type: 'processing',
                message: 'Failed to process CSV file',
                details: ['Please check file format and try again']
            });
            setCurrentStep('upload');
        }
        finally {
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
        }
        catch (error) {
            setError({
                type: 'database',
                message: 'Failed to save trades to database',
                details: ['Please try again or contact support']
            });
        }
        finally {
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
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };
    // NEW: Render trade preview tables
    const renderTradePreviewTables = () => {
        if (!parsedTrades.length && !duplicateDetails.length)
            return null;
        const longTrades = parsedTrades.filter(trade => trade.direction === 'Long');
        const shortTrades = parsedTrades.filter(trade => trade.direction === 'Short');
        return (_jsxs("div", { className: "space-y-4", children: [parsedTrades.length > 0 && (_jsxs("div", { className: "bg-gray-800 border border-green-600 rounded-lg", children: [_jsx("div", { className: "p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors", onClick: () => setShowUniqueTrades(!showUniqueTrades), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h4", { className: "text-lg font-semibold text-green-400", children: ["\uD83D\uDCCA Trades to Import (", parsedTrades.length, ")"] }), _jsx("span", { className: "text-green-400", children: showUniqueTrades ? '▼' : '▶' })] }) }), showUniqueTrades && (_jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-700", children: _jsxs("tr", { children: [_jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Symbol" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Direction" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Quantity" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Entry Date" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Entry Time" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Entry Price" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-700", children: parsedTrades.slice(0, 10).map((trade, index) => (_jsxs("tr", { className: "hover:bg-gray-700/30", children: [_jsx("td", { className: "p-3 text-white font-medium", children: trade.symbol }), _jsx("td", { className: "p-3", children: _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`, children: trade.direction }) }), _jsx("td", { className: "p-3 text-gray-300", children: trade.quantity.toLocaleString() }), _jsx("td", { className: "p-3 text-gray-300", children: trade.entryDate }), _jsx("td", { className: "p-3 text-gray-300", children: trade.entryTime }), _jsxs("td", { className: "p-3 text-gray-300", children: ["$", trade.entryPrice.toFixed(2)] }), _jsx("td", { className: "p-3", children: _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.status === 'Open' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'}`, children: trade.status }) })] }, index))) })] }), parsedTrades.length > 10 && (_jsxs("div", { className: "p-4 bg-gray-700/30 text-center text-gray-400 text-sm", children: ["... and ", parsedTrades.length - 10, " more trades"] }))] }))] })), duplicateDetails.length > 0 && (_jsxs("div", { className: "bg-gray-800 border border-red-600 rounded-lg", children: [_jsx("div", { className: "p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors", onClick: () => setShowDuplicates(!showDuplicates), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h4", { className: "text-lg font-semibold text-red-400", children: ["\uD83D\uDEAB Duplicate Trades Rejected (", duplicateDetails.length, ")"] }), _jsx("span", { className: "text-red-400", children: showDuplicates ? '▼' : '▶' })] }) }), showDuplicates && (_jsx("div", { className: "p-4", children: _jsxs("div", { className: "space-y-2", children: [duplicateDetails.slice(0, 10).map((duplicate, index) => (_jsxs("div", { className: "bg-red-600/10 border border-red-600/30 rounded p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { children: _jsxs("span", { className: "text-red-300 font-medium", children: [duplicate.symbol, " - ", duplicate.entryDate, " ", duplicate.entryTime] }) }), _jsx("span", { className: "text-red-400 text-sm", children: "Duplicate" })] }), _jsx("div", { className: "text-red-300/70 text-sm mt-1", children: duplicate.reason })] }, index))), duplicateDetails.length > 10 && (_jsxs("div", { className: "text-center text-gray-400 text-sm pt-2", children: ["... and ", duplicateDetails.length - 10, " more duplicates"] }))] }) }))] })), longTrades.length > 0 && (_jsxs("div", { className: "bg-gray-800 border border-green-500 rounded-lg", children: [_jsx("div", { className: "p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors", onClick: () => setShowLongTrades(!showLongTrades), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h4", { className: "text-lg font-semibold text-green-500", children: ["\uD83D\uDCC8 Long Trades (", longTrades.length, ")"] }), _jsx("span", { className: "text-green-500", children: showLongTrades ? '▼' : '▶' })] }) }), showLongTrades && (_jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-700", children: _jsxs("tr", { children: [_jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Symbol" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Quantity" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Entry Price" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Entry Time" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-700", children: longTrades.slice(0, 5).map((trade, index) => (_jsxs("tr", { className: "hover:bg-gray-700/30", children: [_jsx("td", { className: "p-3 text-white font-medium", children: trade.symbol }), _jsx("td", { className: "p-3 text-gray-300", children: trade.quantity.toLocaleString() }), _jsxs("td", { className: "p-3 text-gray-300", children: ["$", trade.entryPrice.toFixed(2)] }), _jsxs("td", { className: "p-3 text-gray-300", children: [trade.entryDate, " ", trade.entryTime] }), _jsx("td", { className: "p-3", children: _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.status === 'Open' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'}`, children: trade.status }) })] }, index))) })] }), longTrades.length > 5 && (_jsxs("div", { className: "p-3 bg-gray-700/30 text-center text-gray-400 text-sm", children: ["... and ", longTrades.length - 5, " more long trades"] }))] }))] })), shortTrades.length > 0 && (_jsxs("div", { className: "bg-gray-800 border border-red-500 rounded-lg", children: [_jsx("div", { className: "p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition-colors", onClick: () => setShowShortTrades(!showShortTrades), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h4", { className: "text-lg font-semibold text-red-500", children: ["\uD83D\uDCC9 Short Trades (", shortTrades.length, ")"] }), _jsx("span", { className: "text-red-500", children: showShortTrades ? '▼' : '▶' })] }) }), showShortTrades && (_jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-700", children: _jsxs("tr", { children: [_jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Symbol" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Quantity" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Entry Price" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Entry Time" }), _jsx("th", { className: "p-3 text-left text-gray-300 font-medium", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-700", children: shortTrades.slice(0, 5).map((trade, index) => (_jsxs("tr", { className: "hover:bg-gray-700/30", children: [_jsx("td", { className: "p-3 text-white font-medium", children: trade.symbol }), _jsx("td", { className: "p-3 text-gray-300", children: trade.quantity.toLocaleString() }), _jsxs("td", { className: "p-3 text-gray-300", children: ["$", trade.entryPrice.toFixed(2)] }), _jsxs("td", { className: "p-3 text-gray-300", children: [trade.entryDate, " ", trade.entryTime] }), _jsx("td", { className: "p-3", children: _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${trade.status === 'Open' ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white'}`, children: trade.status }) })] }, index))) })] }), shortTrades.length > 5 && (_jsxs("div", { className: "p-3 bg-gray-700/30 text-center text-gray-400 text-sm", children: ["... and ", shortTrades.length - 5, " more short trades"] }))] }))] }))] }));
    };
    // Render upload step
    const renderUploadStep = () => (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg", children: [_jsxs("div", { className: "p-6 border-b border-gray-700", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Upload Broker Statement" }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: "Select your CSV file exported from your broker" })] }), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: `border-2 border-dashed rounded-lg p-8 text-center transition-colors ${error?.type === 'file'
                                    ? 'border-red-600 bg-red-600/10'
                                    : 'border-gray-600 hover:border-gray-500 bg-gray-700/30'}`, onDragOver: handleDragOver, onDrop: handleDrop, children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDCC4" }), _jsx("h4", { className: "text-lg font-medium text-white mb-2", children: selectedFile ? selectedFile.name : 'Drop your CSV file here' }), _jsx("p", { className: "text-gray-400 mb-4", children: selectedFile
                                            ? `File size: ${(selectedFile.size / 1024).toFixed(1)} KB`
                                            : 'or click to browse your files' }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".csv", onChange: (e) => e.target.files?.[0] && handleFileSelect(e.target.files[0]), className: "hidden" }), _jsx("button", { onClick: () => fileInputRef.current?.click(), className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: selectedFile ? 'Select Different File' : 'Browse Files' })] }), error?.type === 'file' && (_jsxs("div", { className: "mt-4 bg-red-900/20 border border-red-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-red-400", children: "\u26A0\uFE0F" }), _jsx("h4", { className: "text-red-400 font-medium", children: error.message })] }), error.details && (_jsx("ul", { className: "mt-2 text-red-300 text-sm space-y-1", children: error.details.map((detail, index) => (_jsxs("li", { children: ["\u2022 ", detail] }, index))) }))] }))] })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 border-b border-gray-700", children: _jsx("h3", { className: "text-lg font-semibold text-white", children: "CSV Format Requirements" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-green-400", children: "\u2713" }), _jsx("span", { className: "text-gray-300", children: "Must contain columns: Symbol, Side, Qty, Pos Effect, Net Price, Exec Time" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-green-400", children: "\u2713" }), _jsx("span", { className: "text-gray-300", children: "Pos Effect should be \"TO OPEN\" or \"TO CLOSE\"" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-green-400", children: "\u2713" }), _jsx("span", { className: "text-gray-300", children: "Dates in MM/DD/YY format" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-green-400", children: "\u2713" }), _jsx("span", { className: "text-gray-300", children: "Maximum file size: 10MB" })] })] }) })] }), selectedFile && (_jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: processFile, disabled: loading, className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50", children: loading ? 'Processing...' : 'Process File' }) }))] }));
    // Render processing step
    const renderProcessingStep = () => (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 border-b border-gray-700", children: _jsx("h3", { className: "text-lg font-semibold text-white", children: "Processing CSV File" }) }), _jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" }), _jsx("h4", { className: "text-lg font-medium text-white mb-2", children: "Analyzing your trades..." }), _jsx("p", { className: "text-gray-400", children: "This may take a moment for large files" })] })] }));
    // Render preview step
    const renderPreviewStep = () => (_jsxs("div", { className: "space-y-6", children: [importSummary && (_jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg", children: [_jsx("div", { className: "p-6 border-b border-gray-700", children: _jsx("h3", { className: "text-lg font-semibold text-white", children: "Import Summary" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4 text-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-blue-400", children: importSummary.totalImported }), _jsx("div", { className: "text-gray-400 text-sm", children: "Trades Imported" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-red-400", children: importSummary.duplicatesRejected }), _jsx("div", { className: "text-gray-400 text-sm", children: "Duplicates Rejected" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-green-400", children: importSummary.longTrades }), _jsx("div", { className: "text-gray-400 text-sm", children: "Long Trades" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-purple-400", children: importSummary.shortTrades }), _jsx("div", { className: "text-gray-400 text-sm", children: "Short Trades" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-orange-400", children: importSummary.openLongs }), _jsx("div", { className: "text-gray-400 text-sm", children: "Open Longs" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-yellow-400", children: importSummary.openShorts }), _jsx("div", { className: "text-gray-400 text-sm", children: "Open Shorts" })] })] }) })] })), renderTradePreviewTables(), _jsxs("div", { className: "flex justify-between", children: [_jsx("button", { onClick: resetImport, className: "px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors", children: "Cancel Import" }), _jsx("button", { onClick: saveTrades, disabled: loading, className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50", children: loading ? 'Saving...' : 'Confirm Import' })] })] }));
    // Render complete step
    const renderCompleteStep = () => (_jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg", children: _jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\u2705" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "Import Complete!" }), _jsxs("p", { className: "text-gray-400 mb-6", children: [importSummary?.totalImported, " trades have been successfully imported to your journal"] }), _jsxs("div", { className: "flex justify-center space-x-4", children: [_jsx("button", { onClick: resetImport, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "Import Another File" }), _jsx("button", { onClick: () => window.location.reload(), className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors", children: "View Dashboard" })] })] }) }));
    // Render error state
    const renderError = () => {
        if (!error)
            return null;
        return (_jsxs("div", { className: "bg-red-900/20 border border-red-700 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("span", { className: "text-red-400 text-xl", children: "\u26A0\uFE0F" }), _jsx("h4", { className: "text-red-400 font-medium text-lg", children: error.message })] }), error.details && (_jsx("ul", { className: "text-red-300 text-sm space-y-1 mb-4", children: error.details.map((detail, index) => (_jsxs("li", { children: ["\u2022 ", detail] }, index))) })), _jsx("button", { onClick: () => setError(null), className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm", children: "Dismiss" })] }));
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: "Import Trades" }), _jsx("p", { className: "text-gray-400", children: "Upload your broker statement to automatically import trades" })] }), _jsx("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-4", children: _jsx("div", { className: "flex items-center justify-between", children: ['upload', 'processing', 'preview', 'complete'].map((step, index) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep === step ? 'bg-blue-600 text-white' :
                                    index < ['upload', 'processing', 'preview', 'complete'].indexOf(currentStep)
                                        ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}
              `, children: index < ['upload', 'processing', 'preview', 'complete'].indexOf(currentStep) ? '✓' : index + 1 }), index < 3 && (_jsx("div", { className: `w-16 h-1 mx-2 ${index < ['upload', 'processing', 'preview', 'complete'].indexOf(currentStep)
                                    ? 'bg-green-600' : 'bg-gray-600'}` }))] }, step))) }) }), error && renderError(), currentStep === 'upload' && renderUploadStep(), currentStep === 'processing' && renderProcessingStep(), currentStep === 'preview' && renderPreviewStep(), currentStep === 'complete' && renderCompleteStep()] }));
};
export default ImportTrades;
