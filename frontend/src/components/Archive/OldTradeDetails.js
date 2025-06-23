import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { ListItem } from '@tiptap/extension-list-item';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
// API configuration
const API_BASE_URL = 'http://localhost:3001/api';
// API service functions
const api = {
    getTrade: async (tradeId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`);
            if (!response.ok) {
                if (response.status === 404)
                    return null;
                throw new Error('Failed to fetch trade');
            }
            return await response.json();
        }
        catch (error) {
            console.error('Error fetching trade:', error);
            return null;
        }
    },
    updateTradeNotes: async (tradeId, commentary) => {
        try {
            const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ commentary }),
            });
            return response.ok;
        }
        catch (error) {
            console.error('Error updating trade notes:', error);
            return false;
        }
    }
};
// Enhanced Toolbar component for Tiptap
const EditorToolbar = ({ editor }) => {
    const fileInputRef = useRef(null);
    if (!editor)
        return null;
    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result;
                editor.chain().focus().setImage({ src: url }).run();
            };
            reader.readAsDataURL(file);
        }
    };
    const addImage = () => {
        fileInputRef.current?.click();
    };
    return (_jsxs("div", { className: "border-b border-gray-300 p-3 flex flex-wrap gap-2 bg-gray-50", children: [_jsxs("div", { className: "flex gap-1 pr-2 border-r border-gray-300", children: [_jsx("button", { onClick: () => editor.chain().focus().toggleBold().run(), className: `px-3 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Bold", children: "B" }), _jsx("button", { onClick: () => editor.chain().focus().toggleItalic().run(), className: `px-3 py-1.5 rounded text-sm italic transition-colors ${editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Italic", children: "I" })] }), _jsxs("div", { className: "flex gap-1 pr-2 border-r border-gray-300", children: [_jsx("button", { onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), className: `px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Heading 1", children: "H1" }), _jsx("button", { onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), className: `px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Heading 2", children: "H2" })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: addImage, className: "px-3 py-1.5 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors border", title: "Add Image", children: "\uD83D\uDCF7 Image" }), _jsx("button", { onClick: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo(), className: "px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors border disabled:opacity-50", title: "Undo", children: "\u21B6" }), _jsx("button", { onClick: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo(), className: "px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors border disabled:opacity-50", title: "Redo", children: "\u21B7" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleImageUpload, style: { display: 'none' } })] }));
};
const TradeDetails = ({ tradeId, onBack }) => {
    const [trade, setTrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    // Initialize Tiptap editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            ListItem,
            BulletList,
            OrderedList,
            Image.configure({
                HTMLAttributes: {
                    class: 'editor-image',
                },
                allowBase64: true,
                inline: false,
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
                style: 'max-width: none !important;',
            },
        },
        onUpdate: ({ editor }) => {
            const content = editor.getHTML();
            if (trade && content !== trade.commentary) {
                triggerAutoSave(content);
            }
        },
    });
    // Load trade data from API
    useEffect(() => {
        const loadTradeData = async () => {
            try {
                setLoading(true);
                setError(null);
                const tradeData = await api.getTrade(tradeId);
                if (tradeData) {
                    setTrade(tradeData);
                    if (editor) {
                        editor.commands.setContent(tradeData.commentary || '');
                    }
                }
                else {
                    setError('Trade not found');
                }
            }
            catch (error) {
                console.error('Error loading trade:', error);
                setError('Failed to load trade data');
            }
            finally {
                setLoading(false);
            }
        };
        loadTradeData();
    }, [tradeId, editor]);
    // Auto-save functionality
    const triggerAutoSave = async (content) => {
        if (!trade)
            return;
        setIsAutoSaving(true);
        try {
            const success = await api.updateTradeNotes(trade.id, content);
            if (success) {
                setLastSaved(new Date());
                setTrade(prev => prev ? { ...prev, commentary: content } : null);
            }
        }
        catch (error) {
            console.error('Error auto-saving notes:', error);
        }
        finally {
            setIsAutoSaving(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-8 text-center", children: [_jsx("div", { className: "animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "Loading Trade Details..." }), _jsx("p", { className: "text-gray-400", children: "Fetching trade information from database" })] }) }));
    }
    if (error || !trade) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg p-8 text-center", children: [_jsx("div", { className: "text-4xl mb-4", children: "\uD83D\uDD0D" }), _jsx("h3", { className: "text-xl font-semibold text-white mb-2", children: "Trade Not Found" }), _jsx("p", { className: "text-gray-400 mb-6", children: error || 'The requested trade could not be found.' }), _jsx("button", { onClick: onBack, className: "px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors", children: "\u2190 Back to Trades" })] }) }));
    }
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };
    const formatSimpleDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const totalCost = trade.entryPrice * trade.quantity;
    const totalReturn = trade.exitPrice ? (trade.exitPrice * trade.quantity) : 0;
    const netPnL = trade.profitLoss || 0;
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { onClick: onBack, className: "flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors", children: [_jsx("span", { children: "\u2190" }), _jsx("span", { children: "Back to Trades" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [isAutoSaving && (_jsxs("div", { className: "flex items-center space-x-2 text-yellow-400", children: [_jsx("div", { className: "w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-sm", children: "Saving..." })] })), lastSaved && !isAutoSaving && (_jsxs("span", { className: "text-sm text-green-400", children: ["Last saved: ", lastSaved.toLocaleTimeString()] }))] })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg", children: _jsx("span", { className: "text-white font-bold text-lg", children: trade.symbol.slice(0, 2) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: trade.symbol }), _jsxs("div", { className: "flex items-center space-x-3 mt-1", children: [_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`, children: trade.direction }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'}`, children: trade.status }), _jsx("span", { className: "text-gray-400 text-sm", children: trade.orderType }), trade.assessment && (_jsxs("span", { className: "text-gray-400 text-sm", children: ["\u2022 ", trade.assessment] }))] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: `text-2xl font-bold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(netPnL) }), _jsx("div", { className: "text-gray-400 text-sm", children: "P&L" }), trade.percentChange && (_jsxs("div", { className: `text-sm ${trade.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [trade.percentChange > 0 ? '+' : '', trade.percentChange.toFixed(2), "%"] }))] })] }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-gray-700/30 rounded-lg p-4 border border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-green-400 uppercase tracking-wide", children: "Entry" }), _jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full" })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Date:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatSimpleDate(trade.entryDate) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Time:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatTime(trade.entryDate) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Price:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatCurrency(trade.entryPrice) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Quantity:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.quantity })] }), _jsxs("div", { className: "flex justify-between items-center pt-2 mt-2 border-t border-gray-600", children: [_jsx("span", { className: "text-gray-300 text-sm font-medium", children: "Total Cost:" }), _jsx("span", { className: "text-white text-sm font-bold", children: formatCurrency(totalCost) })] })] })] }), _jsxs("div", { className: "bg-gray-700/30 rounded-lg p-4 border border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-red-400 uppercase tracking-wide", children: "Exit" }), _jsx("div", { className: `w-2 h-2 rounded-full ${trade.status === 'Closed' ? 'bg-red-400' : 'bg-gray-500'}` })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Date:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.exitDate ? formatSimpleDate(trade.exitDate) : '—' })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Time:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.exitDate ? formatTime(trade.exitDate) : '—' })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Price:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.exitPrice ? formatCurrency(trade.exitPrice) : '—' })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Quantity:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.status === 'Closed' ? trade.quantity : '—' })] }), _jsxs("div", { className: "flex justify-between items-center pt-2 mt-2 border-t border-gray-600", children: [_jsx("span", { className: "text-gray-300 text-sm font-medium", children: "Total Return:" }), _jsx("span", { className: "text-white text-sm font-bold", children: trade.status === 'Closed' ? formatCurrency(totalReturn) : '—' })] })] })] }), _jsxs("div", { className: "bg-gray-700/30 rounded-lg p-4 border border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-blue-400 uppercase tracking-wide", children: "Details" }), _jsx("div", { className: "w-2 h-2 bg-blue-400 rounded-full" })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Order Type:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.orderType })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Assessment:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.assessment || '—' })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Duration:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.duration ? `${Math.round(trade.duration / 60)} hours` : '—' })] }), trade.broker && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Broker:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.broker.name })] }))] })] }), _jsxs("div", { className: "bg-gray-700/30 rounded-lg p-4 border border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-purple-400 uppercase tracking-wide", children: "Performance" }), _jsx("div", { className: `w-2 h-2 rounded-full ${netPnL >= 0 ? 'bg-green-400' : 'bg-red-400'}` })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "P&L:" }), _jsx("span", { className: `text-sm font-semibold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(netPnL) })] }), trade.percentChange && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Return %:" }), _jsxs("span", { className: `text-sm font-semibold ${trade.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [trade.percentChange > 0 ? '+' : '', trade.percentChange.toFixed(2), "%"] })] })), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Capital:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatCurrency(trade.capitalDeployed) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Created:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatSimpleDate(trade.createdAt) })] })] })] })] }) })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg overflow-hidden", children: [_jsxs("div", { className: "p-6 border-b border-gray-700", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Trade Journal & Notes" }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: "Document your thoughts, analysis, and lessons learned. Add images by using the \uD83D\uDCF7 button." })] }), _jsxs("div", { className: "bg-white", children: [_jsx(EditorToolbar, { editor: editor }), _jsx(EditorContent, { editor: editor, className: "min-h-[400px] max-h-[600px] overflow-y-auto" })] }), _jsx("div", { className: "p-4 bg-gray-800 border-t border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-400", children: [_jsxs("div", { className: "flex items-center space-x-6", children: [_jsx("span", { children: "\uD83D\uDCA1 Format text with the toolbar above" }), _jsx("span", { children: "\uD83D\uDCF7 Add images using the Image button" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { children: "Auto-save enabled" }), _jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full" })] })] }) })] })] }));
};
export default TradeDetails;
