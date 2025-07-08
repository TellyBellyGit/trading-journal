// File: frontend/src/components/TradeDetails.tsx
// Trading Journal - Trade Details with Rich Text Editor and Image Compression

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { formatSimpleDate, formatTradingTime } from '../utils/formatters';
import { useDateFormat } from '../contexts/DateFormatContext';
import { sanitizeForJSON } from '../utils/jsonSanitizer';

// API configuration
const API_BASE_URL = 'http://localhost:3002/api';

// Extend window object for timeout
declare global {
  interface Window {
    assessmentTimeout: NodeJS.Timeout;
  }
}

// Types matching your Prisma schema
interface Trade {
  id: number;
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  percentChange?: number;
  orderType: string;
  assessment?: string;
  capital: number;
  entryDate: string;
  exitDate?: string;
  duration?: number;
  status: 'Open' | 'Closed';
  notes?: string; // Changed from commentary to notes
  createdAt: string;
  updatedAt: string;
  broker?: {
    id: number;
    name: string;
  };
}

// API service functions
const api = {
  getTrade: async (tradeId: number): Promise<Trade | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch trade');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching trade:', error);
      return null;
    }
  },

  updateTradeNotes: async (tradeId: number, notes: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/${tradeId}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: sanitizeForJSON(notes) }), // Changed from commentary to notes
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating trade notes:', error);
      return false;
    }
  },

  updateTradeAssessment: async (tradeId: number, assessment: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/${tradeId}/assessment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessment }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating trade assessment:', error);
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
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
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
      let startX: number, startY: number, startWidth: number, startHeight: number;

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
        if (!container.contains(e.target as Node)) {
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

        const handleMouseMove = (e: MouseEvent) => {
          if (!isResizing) return;
          
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
          if (updatedNode.type.name !== 'resizableImage') return false;
          
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
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<string> => {
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
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

interface TradeDetailsProps {
  tradeId: number;
  onBack: () => void;
}

// FULL-FEATURED Enhanced Toolbar component for Tiptap with ALL functionality
const EditorToolbar = ({ editor }: { editor: any }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original file if compression fails
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          editor.chain().focus().setImage({ src: url }).run();
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-b border-gray-300 p-3 flex flex-wrap gap-2 bg-gray-50">
      {/* Text Formatting - RESTORED ALL */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
            editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
          title="Bold"
        >
          B
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded text-sm italic transition-colors ${
            editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
          title="Italic"
        >
          I
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 rounded text-sm line-through transition-colors ${
            editor.isActive('strike') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
          title="Strikethrough"
        >
          S
        </button>
      </div>

      {/* Headers - RESTORED */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
          title="Heading 2"
        >
          H2
        </button>

        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2.5 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('paragraph') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
          title="Paragraph"
        >
          P
        </button>
      </div>

      {/* Lists - RESTORED */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2.5 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
          title="Bullet List"
        >
          • List
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2.5 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
          title="Numbered List"
        >
          1. List
        </button>
      </div>

      {/* Colors - RESTORED FULL COLOR PALETTE */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        <button
          onClick={() => editor.chain().focus().setColor('#ef4444').run()}
          className="w-7 h-7 bg-red-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
          title="Red Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#22c55e').run()}
          className="w-7 h-7 bg-green-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
          title="Green Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#3b82f6').run()}
          className="w-7 h-7 bg-blue-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
          title="Blue Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#f59e0b').run()}
          className="w-7 h-7 bg-yellow-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
          title="Yellow Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#8b5cf6').run()}
          className="w-7 h-7 bg-purple-500 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
          title="Purple Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#000000').run()}
          className="w-7 h-7 bg-black rounded border-2 border-gray-300 hover:scale-110 transition-transform"
          title="Black Text"
        />
      </div>

      {/* Media & Utilities - RESTORED ALL */}
      <div className="flex gap-1">
        <button
          onClick={addImage}
          className="px-3 py-1.5 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors border"
          title="Add Image"
        >
          📷 Image
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            editor.isActive('blockquote') ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
          }`}
          title="Quote"
        >
          " Quote
        </button>
        
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors border"
          title="Horizontal Line"
        >
          ─ Line
        </button>
        
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors border disabled:opacity-50"
          title="Undo"
        >
          ↶
        </button>
        
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors border disabled:opacity-50"
          title="Redo"
        >
          ↷
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

const TradeDetails: React.FC<TradeDetailsProps> = ({ tradeId, onBack }) => {
  const { dateFormat } = useDateFormat();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
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
        } else {
          setError('Trade not found');
        }
      } catch (error) {
        console.error('Error loading trade:', error);
        setError('Failed to load trade data');
      } finally {
        setLoading(false);
      }
    };

    loadTradeData();
  }, [tradeId, editor]);

  // Cleanup assessment timeout on unmount
  useEffect(() => {
    return () => {
      if (window.assessmentTimeout) {
        clearTimeout(window.assessmentTimeout);
      }
    };
  }, []);

  // Auto-save functionality
  const triggerAutoSave = async (content: string) => {
    if (!trade) return;
    
    setIsAutoSaving(true);
    try {
      const success = await api.updateTradeNotes(trade.id, content);
      if (success) {
        setLastSaved(new Date());
        setTrade(prev => prev ? { ...prev, notes: content } : null); // Changed from commentary to notes
      }
    } catch (error) {
      console.error('Error auto-saving notes:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Handle assessment change with debouncing
  const handleAssessmentChange = (assessment: string) => {
    if (!trade) return;

    // Update local state immediately for responsive UI
    setTrade(prev => prev ? { ...prev, assessment } : null);

    // Debounce the API call
    clearTimeout(window.assessmentTimeout);
    window.assessmentTimeout = setTimeout(async () => {
      try {
        setIsAutoSaving(true);
        const success = await api.updateTradeAssessment(trade.id, assessment);
        if (success) {
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Error updating assessment:', error);
        // Optionally revert the change or show an error message
      } finally {
        setIsAutoSaving(false);
      }
    }, 500); // Wait 500ms after user stops typing
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Trade Details...</h3>
          <p className="text-gray-400">Fetching trade information from database</p>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="p-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">Trade Not Found</h3>
          <p className="text-gray-400 mb-6">{error || 'The requested trade could not be found.'}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ← Back to Trades
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };


  const totalCost = trade.entryPrice * trade.quantity;
  const totalReturn = trade.exitPrice ? (trade.exitPrice * trade.quantity) : 0;
  const netPnL = trade.pnl || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
        >
          <span>←</span>
          <span>Back to Trades</span>
        </button>
        
        <div className="flex items-center space-x-4">
          {isAutoSaving && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Saving...</span>
            </div>
          )}
          {lastSaved && !isAutoSaving && (
            <span className="text-sm text-green-400">
              Last saved: {formatTradingTime(lastSaved)}
            </span>
          )}
        </div>
      </div>

      {/* Trade Summary Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-3 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base">{trade.symbol.slice(0, 2)}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{trade.symbol}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                    trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {trade.direction}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                    trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {trade.status}
                  </span>
                  <span className="text-gray-400 text-sm">{trade.orderType}</span>
                </div>
              </div>
              
              {/* Assessment Input - Moved to Left */}
              <div className="flex flex-col">
                <label className="text-gray-400 text-xs mb-1">Assessment</label>
                <input
                  type="text"
                  value={trade.assessment || ''}
                  onChange={(e) => handleAssessmentChange(e.target.value)}
                  className="w-96 px-3 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Brief assessment of this trade..."
                />
              </div>
            </div>
            
            {/* P&L Display - Stays on Right */}
            <div className="text-right">
              <div className={`text-xl font-bold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(netPnL)}
              </div>
              <div className="text-gray-400 text-sm">P&L</div>
              {trade.percentChange && (
                <div className={`text-sm ${trade.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.percentChange > 0 ? '+' : ''}{trade.percentChange.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trade Details Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Entry Details */}
            <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide">Entry</h3>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Date:</span>
                  <span className="text-white text-sm font-medium">{formatSimpleDate(trade.entryDate, dateFormat)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Time:</span>
                  <span className="text-white text-sm font-medium">{formatTradingTime(trade.entryDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Price:</span>
                  <span className="text-white text-sm font-medium">{formatCurrency(trade.entryPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Quantity:</span>
                  <span className="text-white text-sm font-medium">{trade.quantity}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-600">
                  <span className="text-gray-300 text-sm font-medium">Total Cost:</span>
                  <span className="text-white text-sm font-bold">{formatCurrency(totalCost)}</span>
                </div>
              </div>
            </div>

            {/* Exit Details */}
            <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Exit</h3>
                <div className={`w-2 h-2 rounded-full ${trade.status === 'Closed' ? 'bg-red-400' : 'bg-gray-500'}`}></div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Date:</span>
                  <span className="text-white text-sm font-medium">
                    {trade.exitDate ? formatSimpleDate(trade.exitDate, dateFormat) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Time:</span>
                  <span className="text-white text-sm font-medium">
                    {trade.exitDate ? formatTradingTime(trade.exitDate) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Price:</span>
                  <span className="text-white text-sm font-medium">
                    {trade.exitPrice ? formatCurrency(trade.exitPrice) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Quantity:</span>
                  <span className="text-white text-sm font-medium">{trade.status === 'Closed' ? trade.quantity : '—'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-600">
                  <span className="text-gray-300 text-sm font-medium">Total Return:</span>
                  <span className="text-white text-sm font-bold">
                    {trade.status === 'Closed' ? formatCurrency(totalReturn) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Details</h3>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Order Type:</span>
                  <span className="text-white text-sm font-medium">{trade.orderType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Assessment:</span>
                  <span className="text-white text-sm font-medium">{trade.assessment || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Duration:</span>
                  <span className="text-white text-sm font-medium">
                    {trade.duration ? `${Math.round(trade.duration / 60)} hours` : '—'}
                  </span>
                </div>
                {trade.broker && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Broker:</span>
                    <span className="text-white text-sm font-medium">{trade.broker.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">Performance</h3>
                <div className={`w-2 h-2 rounded-full ${netPnL >= 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span 
                    className="text-gray-400 text-sm cursor-help relative group"
                    title="ROI vs Capital Deployed"
                  >
                    ROI vs Capital:
                    <div className="fixed z-50 w-80 p-4 bg-gray-900 border border-gray-600 rounded-lg shadow-lg text-white text-xs hidden group-hover:block">
                      <div className="font-semibold mb-2">ROI vs Capital Deployed</div>
                      <div className="mb-2">Formula: P&L ÷ Capital Deployed × 100</div>
                      <div className="text-gray-300 space-y-1">
                        <div>• <span className="text-green-400">Positive return:</span> Your trade made money relative to capital used - means you're deploying capital effectively</div>
                        <div>• <span className="text-red-400">Loss on trade:</span> Your trade lost money relative to capital used - impacts your account growth negatively</div>
                        <div>• <span className="text-blue-400">5-15%:</span> Good short-term return</div>
                        <div>• <span className="text-purple-400">20%+:</span> Excellent return</div>
                      </div>
                      <div className="text-gray-400 mt-2 text-[11px]">Impact: Higher ROI means better capital utilization and faster account growth</div>
                    </div>
                  </span>
                  <span className={`text-sm font-semibold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.capital > 0 ? `${((netPnL / trade.capital) * 100).toFixed(2)}%` : '0.00%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span 
                    className="text-gray-400 text-sm cursor-help relative group"
                    title="Capital Efficiency"
                  >
                    Capital Efficiency:
                    <div className="fixed z-50 w-80 p-4 bg-gray-900 border border-gray-600 rounded-lg shadow-lg text-white text-xs hidden group-hover:block">
                      <div className="font-semibold mb-2">Capital Efficiency</div>
                      <div className="mb-2">Shows dollar profit/loss per $1000 of capital deployed</div>
                      <div className="mb-2">Formula: (P&L ÷ Capital) × 1000</div>
                      <div className="text-gray-300 space-y-1">
                        <div>• <span className="text-green-400">Positive:</span> Profit per $1K deployed</div>
                        <div>• <span className="text-red-400">Negative:</span> Loss per $1K deployed</div>
                        <div>• <span className="text-blue-400">$50-$100/1K:</span> Good efficiency</div>
                        <div>• <span className="text-purple-400">$200+/1K:</span> Excellent efficiency</div>
                      </div>
                      <div className="text-gray-400 mt-2 text-[11px]">Compare across trades to find your most capital-efficient strategies</div>
                    </div>
                  </span>
                  <span className={`text-sm font-semibold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.capital > 0 ? `${netPnL >= 0 ? '' : '-'}$${Math.abs((netPnL / trade.capital) * 1000).toFixed(0)} / $1000` : '$0 / $1000'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Capital Deployed:</span>
                  <span className="text-white text-sm font-medium">{formatCurrency(trade.capital)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Created:</span>
                  <span className="text-white text-sm font-medium">{formatSimpleDate(trade.createdAt, dateFormat)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section with FULL-FEATURED Tiptap Editor */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Trade Journal & Notes</h2>
          <p className="text-gray-400 text-sm mt-1">
            Document your thoughts, analysis, and lessons learned. Add images by dragging & dropping, pasting, or using the 📷 button.
          </p>
        </div>
        
        <div className="bg-gray-800"> {/* Changed from bg-white to match dark theme */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-100/80 flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-blue-600 font-semibold">Drop your image here</p>
              </div>
            </div>
          )}
          <EditorToolbar editor={editor} />
          <EditorContent 
            editor={editor} 
            className="min-h-[400px] max-h-[600px] overflow-y-auto"
          />
        </div>
        
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-6">
              <span>💡 Format text with the toolbar above</span>
              <span>📷 Add images by drag & drop, paste, or click Image button</span>
              <span>🔧 Click images to select, then drag the blue circle to resize</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Auto-save enabled</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
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
      `}</style>
    </div>
  );
};

export default TradeDetails;