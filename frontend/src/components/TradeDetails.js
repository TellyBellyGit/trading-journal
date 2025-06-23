import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// File: frontend/src/components/TradeDetails.tsx
// Trading Journal - Trade Details with Rich Text Editor and Image Compression
import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { formatSimpleDate, formatTradingTime } from '../utils/formatters';
import { useDateFormat } from '../contexts/DateFormatContext';
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
    updateTradeNotes: async (tradeId, notes) => {
        try {
            const response = await fetch(`${API_BASE_URL}/trades/${tradeId}/notes`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes }), // Changed from commentary to notes
            });
            return response.ok;
        }
        catch (error) {
            console.error('Error updating trade notes:', error);
            return false;
        }
    }
};
// Custom ResizableImage extension - RESTORED FULL FUNCTIONALITY
const ResizableImage = Image.extend({
    name: 'resizableImage',
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                renderHTML: (attributes) => {
                    if (!attributes.width)
                        return {};
                    return { width: attributes.width };
                },
            },
            height: {
                default: null,
                renderHTML: (attributes) => {
                    if (!attributes.height)
                        return {};
                    return { height: attributes.height };
                },
            },
        };
    },
    addNodeView() {
        return ({ node, getPos, editor }) => {
            const container = document.createElement('div');
            container.className = 'image-container';
            container.style.position = 'relative';
            container.style.display = 'inline-block';
            container.style.margin = '1rem 0';
            const img = document.createElement('img');
            img.src = node.attrs.src;
            img.alt = node.attrs.alt || '';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            img.style.cursor = 'pointer';
            img.style.transition = 'transform 0.2s, box-shadow 0.2s';
            if (node.attrs.width) {
                img.style.width = node.attrs.width + 'px';
            }
            if (node.attrs.height) {
                img.style.height = node.attrs.height + 'px';
            }
            // Resize handles
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            resizeHandle.style.position = 'absolute';
            resizeHandle.style.bottom = '0';
            resizeHandle.style.right = '0';
            resizeHandle.style.width = '20px';
            resizeHandle.style.height = '20px';
            resizeHandle.style.background = '#3b82f6';
            resizeHandle.style.borderRadius = '50%';
            resizeHandle.style.cursor = 'se-resize';
            resizeHandle.style.display = 'none';
            resizeHandle.style.zIndex = '10';
            resizeHandle.style.border = '2px solid white';
            resizeHandle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            let isResizing = false;
            let startX, startY, startWidth, startHeight;
            const showHandle = () => {
                resizeHandle.style.display = 'block';
                container.style.outline = '2px solid #3b82f6';
                container.style.outlineOffset = '2px';
            };
            const hideHandle = () => {
                if (!isResizing) {
                    resizeHandle.style.display = 'none';
                    container.style.outline = 'none';
                }
            };
            img.addEventListener('click', () => {
                const pos = getPos();
                if (typeof pos === 'number') {
                    editor.commands.setNodeSelection(pos);
                    showHandle();
                }
            });
            img.addEventListener('mouseenter', () => {
                img.style.transform = 'scale(1.02)';
                img.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
            });
            img.addEventListener('mouseleave', () => {
                img.style.transform = 'scale(1)';
                img.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            });
            container.addEventListener('click', showHandle);
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    hideHandle();
                }
            });
            resizeHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = img.offsetWidth;
                startHeight = img.offsetHeight;
                const handleMouseMove = (e) => {
                    if (!isResizing)
                        return;
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;
                    const aspectRatio = startWidth / startHeight;
                    let newWidth = startWidth + deltaX;
                    let newHeight = newWidth / aspectRatio;
                    if (newWidth < 100) {
                        newWidth = 100;
                        newHeight = newWidth / aspectRatio;
                    }
                    const maxWidth = container.parentElement?.offsetWidth || 800;
                    if (newWidth > maxWidth) {
                        newWidth = maxWidth;
                        newHeight = newWidth / aspectRatio;
                    }
                    img.style.width = newWidth + 'px';
                    img.style.height = newHeight + 'px';
                };
                const handleMouseUp = () => {
                    if (isResizing) {
                        isResizing = false;
                        const pos = getPos();
                        if (typeof pos === 'number') {
                            editor.commands.updateAttributes('resizableImage', {
                                width: img.offsetWidth,
                                height: img.offsetHeight,
                            });
                        }
                    }
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            });
            container.appendChild(img);
            container.appendChild(resizeHandle);
            return {
                dom: container,
                update: (updatedNode) => {
                    if (updatedNode.type.name !== 'resizableImage')
                        return false;
                    img.src = updatedNode.attrs.src;
                    img.alt = updatedNode.attrs.alt || '';
                    if (updatedNode.attrs.width) {
                        img.style.width = updatedNode.attrs.width + 'px';
                    }
                    if (updatedNode.attrs.height) {
                        img.style.height = updatedNode.attrs.height + 'px';
                    }
                    return true;
                },
            };
        };
    },
});
// Image compression utility - FIXED AGAIN
const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }
        const img = document.createElement('img'); // FIXED: Use document.createElement
        img.onload = () => {
            try {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                // Set canvas size
                canvas.width = width;
                canvas.height = height;
                // Draw and compress image
                ctx.drawImage(img, 0, 0, width, height);
                // Convert to compressed base64
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                console.log(`🖼️ Image compressed: ${Math.round(file.size / 1024)}KB → ${Math.round((compressedDataUrl.length * 3) / 4 / 1024)}KB`);
                // Clean up object URL
                URL.revokeObjectURL(img.src);
                resolve(compressedDataUrl);
            }
            catch (error) {
                reject(error);
            }
        };
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        img.src = URL.createObjectURL(file);
    });
};
// FULL-FEATURED Enhanced Toolbar component for Tiptap with ALL functionality
const EditorToolbar = ({ editor }) => {
    const fileInputRef = useRef(null);
    if (!editor)
        return null;
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                // Show loading state
                console.log('🔄 Compressing image...');
                // Compress the image
                const compressedDataUrl = await compressImage(file);
                // Insert compressed image into editor
                editor.chain().focus().setImage({ src: compressedDataUrl }).run();
                console.log('✅ Compressed image inserted!');
            }
            catch (error) {
                console.error('Error compressing image:', error);
                // Fallback to original file if compression fails
                const reader = new FileReader();
                reader.onload = (e) => {
                    const url = e.target?.result;
                    editor.chain().focus().setImage({ src: url }).run();
                };
                reader.readAsDataURL(file);
            }
        }
    };
    const addImage = () => {
        fileInputRef.current?.click();
    };
    return (_jsxs("div", { className: "border-b border-gray-300 p-3 flex flex-wrap gap-2 bg-gray-50", children: [_jsxs("div", { className: "flex gap-1 pr-2 border-r border-gray-300", children: [_jsx("button", { onClick: () => editor.chain().focus().toggleBold().run(), className: `px-3 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Bold", children: "B" }), _jsx("button", { onClick: () => editor.chain().focus().toggleItalic().run(), className: `px-3 py-1.5 rounded text-sm italic transition-colors ${editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Italic", children: "I" }), _jsx("button", { onClick: () => editor.chain().focus().toggleStrike().run(), className: `px-3 py-1.5 rounded text-sm line-through transition-colors ${editor.isActive('strike') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Strikethrough", children: "S" })] }), _jsxs("div", { className: "flex gap-1 pr-2 border-r border-gray-300", children: [_jsx("button", { onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), className: `px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Heading 1", children: "H1" }), _jsx("button", { onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), className: `px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Heading 2", children: "H2" }), _jsx("button", { onClick: () => editor.chain().focus().setParagraph().run(), className: `px-2.5 py-1.5 rounded text-sm transition-colors ${editor.isActive('paragraph') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Paragraph", children: "P" })] }), _jsxs("div", { className: "flex gap-1 pr-2 border-r border-gray-300", children: [_jsx("button", { onClick: () => editor.chain().focus().toggleBulletList().run(), className: `px-2.5 py-1.5 rounded text-sm transition-colors ${editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Bullet List", children: "\u2022 List" }), _jsx("button", { onClick: () => editor.chain().focus().toggleOrderedList().run(), className: `px-2.5 py-1.5 rounded text-sm transition-colors ${editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Numbered List", children: "1. List" })] }), _jsxs("div", { className: "flex gap-1 pr-2 border-r border-gray-300", children: [_jsx("button", { onClick: () => editor.chain().focus().setColor('#ef4444').run(), className: "w-7 h-7 bg-red-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform", title: "Red Text" }), _jsx("button", { onClick: () => editor.chain().focus().setColor('#22c55e').run(), className: "w-7 h-7 bg-green-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform", title: "Green Text" }), _jsx("button", { onClick: () => editor.chain().focus().setColor('#3b82f6').run(), className: "w-7 h-7 bg-blue-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform", title: "Blue Text" }), _jsx("button", { onClick: () => editor.chain().focus().setColor('#f59e0b').run(), className: "w-7 h-7 bg-yellow-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform", title: "Yellow Text" }), _jsx("button", { onClick: () => editor.chain().focus().setColor('#8b5cf6').run(), className: "w-7 h-7 bg-purple-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform", title: "Purple Text" }), _jsx("button", { onClick: () => editor.chain().focus().setColor('#000000').run(), className: "w-7 h-7 bg-black rounded border-2 border-gray-300 hover:scale-110 transition-transform", title: "Black Text" })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: addImage, className: "px-3 py-1.5 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors border", title: "Add Image", children: "\uD83D\uDCF7 Image" }), _jsx("button", { onClick: () => editor.chain().focus().toggleBlockquote().run(), className: `px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor.isActive('blockquote') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`, title: "Quote", children: "\" Quote" }), _jsx("button", { onClick: () => editor.chain().focus().setHorizontalRule().run(), className: "px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors border", title: "Horizontal Line", children: "\u2500 Line" }), _jsx("button", { onClick: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo(), className: "px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors border disabled:opacity-50", title: "Undo", children: "\u21B6" }), _jsx("button", { onClick: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo(), className: "px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors border disabled:opacity-50", title: "Redo", children: "\u21B7" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleImageUpload, style: { display: 'none' } })] }));
};
const TradeDetails = ({ tradeId, onBack }) => {
    const { dateFormat } = useDateFormat();
    const [trade, setTrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    // FULL-FEATURED Tiptap editor with FIXED extensions
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            TextStyle,
            Color,
            ResizableImage.configure({
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
            if (trade && content !== trade.notes) { // Changed from commentary to notes
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
                        editor.commands.setContent(tradeData.notes || ''); // Changed from commentary to notes
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
                setTrade(prev => prev ? { ...prev, notes: content } : null); // Changed from commentary to notes
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
    const totalCost = trade.entryPrice * trade.quantity;
    const totalReturn = trade.exitPrice ? (trade.exitPrice * trade.quantity) : 0;
    const netPnL = trade.profitLoss || 0;
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("button", { onClick: onBack, className: "flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors", children: [_jsx("span", { children: "\u2190" }), _jsx("span", { children: "Back to Trades" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [isAutoSaving && (_jsxs("div", { className: "flex items-center space-x-2 text-yellow-400", children: [_jsx("div", { className: "w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-sm", children: "Saving..." })] })), lastSaved && !isAutoSaving && (_jsxs("span", { className: "text-sm text-green-400", children: ["Last saved: ", formatTradingTime(lastSaved)] }))] })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg", children: _jsx("span", { className: "text-white font-bold text-lg", children: trade.symbol.slice(0, 2) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: trade.symbol }), _jsxs("div", { className: "flex items-center space-x-3 mt-1", children: [_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`, children: trade.direction }), _jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'}`, children: trade.status }), _jsx("span", { className: "text-gray-400 text-sm", children: trade.orderType }), trade.assessment && (_jsxs("span", { className: "text-gray-400 text-sm", children: ["\u2022 ", trade.assessment] }))] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: `text-2xl font-bold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(netPnL) }), _jsx("div", { className: "text-gray-400 text-sm", children: "P&L" }), trade.percentChange && (_jsxs("div", { className: `text-sm ${trade.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [trade.percentChange > 0 ? '+' : '', trade.percentChange.toFixed(2), "%"] }))] })] }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-gray-700/30 rounded-lg p-4 border border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-green-400 uppercase tracking-wide", children: "Entry" }), _jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full" })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Date:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatSimpleDate(trade.entryDate, dateFormat) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Time:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatTradingTime(trade.entryDate) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Price:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatCurrency(trade.entryPrice) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Quantity:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.quantity })] }), _jsxs("div", { className: "flex justify-between items-center pt-2 mt-2 border-t border-gray-600", children: [_jsx("span", { className: "text-gray-300 text-sm font-medium", children: "Total Cost:" }), _jsx("span", { className: "text-white text-sm font-bold", children: formatCurrency(totalCost) })] })] })] }), _jsxs("div", { className: "bg-gray-700/30 rounded-lg p-4 border border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-red-400 uppercase tracking-wide", children: "Exit" }), _jsx("div", { className: `w-2 h-2 rounded-full ${trade.status === 'Closed' ? 'bg-red-400' : 'bg-gray-500'}` })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Date:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.exitDate ? formatSimpleDate(trade.exitDate, dateFormat) : '—' })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Time:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.exitDate ? formatTradingTime(trade.exitDate) : '—' })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Price:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.exitPrice ? formatCurrency(trade.exitPrice) : '—' })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Quantity:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.status === 'Closed' ? trade.quantity : '—' })] }), _jsxs("div", { className: "flex justify-between items-center pt-2 mt-2 border-t border-gray-600", children: [_jsx("span", { className: "text-gray-300 text-sm font-medium", children: "Total Return:" }), _jsx("span", { className: "text-white text-sm font-bold", children: trade.status === 'Closed' ? formatCurrency(totalReturn) : '—' })] })] })] }), _jsxs("div", { className: "bg-gray-700/30 rounded-lg p-4 border border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-blue-400 uppercase tracking-wide", children: "Details" }), _jsx("div", { className: "w-2 h-2 bg-blue-400 rounded-full" })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Order Type:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.orderType })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Assessment:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.assessment || '—' })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Duration:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.duration ? `${Math.round(trade.duration / 60)} hours` : '—' })] }), trade.broker && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Broker:" }), _jsx("span", { className: "text-white text-sm font-medium", children: trade.broker.name })] }))] })] }), _jsxs("div", { className: "bg-gray-700/30 rounded-lg p-4 border border-gray-600", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-purple-400 uppercase tracking-wide", children: "Performance" }), _jsx("div", { className: `w-2 h-2 rounded-full ${netPnL >= 0 ? 'bg-green-400' : 'bg-red-400'}` })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "P&L:" }), _jsx("span", { className: `text-sm font-semibold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(netPnL) })] }), trade.percentChange && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Return %:" }), _jsxs("span", { className: `text-sm font-semibold ${trade.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`, children: [trade.percentChange > 0 ? '+' : '', trade.percentChange.toFixed(2), "%"] })] })), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Capital:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatCurrency(trade.capitalDeployed) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Created:" }), _jsx("span", { className: "text-white text-sm font-medium", children: formatSimpleDate(trade.createdAt, dateFormat) })] })] })] })] }) })] }), _jsxs("div", { className: "bg-gray-800 border border-gray-700 rounded-lg overflow-hidden", children: [_jsxs("div", { className: "p-6 border-b border-gray-700", children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: "Trade Journal & Notes" }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: "Document your thoughts, analysis, and lessons learned. Add images by dragging & dropping, pasting, or using the \uD83D\uDCF7 button." })] }), _jsxs("div", { className: "bg-gray-800", children: [" ", isDragging && (_jsx("div", { className: "absolute inset-0 bg-blue-100/80 flex items-center justify-center z-10 pointer-events-none", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl mb-2", children: "\uD83D\uDCF7" }), _jsx("p", { className: "text-blue-600 font-semibold", children: "Drop your image here" })] }) })), _jsx(EditorToolbar, { editor: editor }), _jsx(EditorContent, { editor: editor, className: "min-h-[400px] max-h-[600px] overflow-y-auto" })] }), _jsx("div", { className: "p-4 bg-gray-800 border-t border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-400", children: [_jsxs("div", { className: "flex items-center space-x-6", children: [_jsx("span", { children: "\uD83D\uDCA1 Format text with the toolbar above" }), _jsx("span", { children: "\uD83D\uDCF7 Add images by drag & drop, paste, or click Image button" }), _jsx("span", { children: "\uD83D\uDD27 Click images to select, then drag the blue circle to resize" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { children: "Auto-save enabled" }), _jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full" })] })] }) })] }), _jsx("style", { children: `
        /* Enhanced editor styles - DARK THEME MATCHING */
        .ProseMirror {
          outline: none;
          padding: 1rem;
          min-height: 400px;
          background-color: #1f2937; /* Dark gray background to match theme */
          color: #f9fafb; /* Light text color */
        }
        
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #f9fafb; /* Light color for dark theme */
        }
        
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          color: #f9fafb; /* Light color for dark theme */
        }
        
        .ProseMirror p {
          margin-bottom: 1rem;
          line-height: 1.6;
          color: #f9fafb; /* Light text */
        }
        
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .ProseMirror li {
          margin-bottom: 0.25rem;
          color: #f9fafb; /* Light text for lists */
        }
        
        .ProseMirror ul {
          list-style-type: disc;
        }
        
        .ProseMirror ol {
          list-style-type: decimal;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid #6b7280; /* Darker border for dark theme */
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #d1d5db; /* Slightly lighter gray text */
        }
        
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #6b7280; /* Darker line for dark theme */
          margin: 2rem 0;
        }
        
        .ProseMirror .image-container {
          margin: 1rem 0;
          max-width: 100%;
        }
        
        .ProseMirror .image-container img {
          display: block;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); /* Darker shadow */
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .ProseMirror .resize-handle:hover {
          background: #2563eb !important;
          transform: scale(1.1);
        }
        
        .ProseMirror strong {
          font-weight: bold;
          color: #f9fafb;
        }
        
        .ProseMirror em {
          font-style: italic;
          color: #f9fafb;
        }
        
        .ProseMirror s {
          text-decoration: line-through;
          color: #f9fafb;
        }
        
        .ProseMirror code {
          background-color: #374151; /* Dark code background */
          color: #f9fafb;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        
        /* Placeholder styling for dark theme */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #6b7280; /* Darker placeholder for dark theme */
          pointer-events: none;
          height: 0;
        }
      ` })] }));
};
export default TradeDetails;
