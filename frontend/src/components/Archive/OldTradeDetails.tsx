import React, { useState, useEffect, useRef } from 'react';
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

// Types matching your Prisma schema
interface Trade {
  id: number;
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  profitLoss?: number;
  percentChange?: number;
  orderType: string;
  assessment?: string;
  capitalDeployed: number;
  entryDate: string;
  exitDate?: string;
  duration?: number;
  status: 'Open' | 'Closed';
  commentary?: string;
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

  updateTradeNotes: async (tradeId: number, commentary: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentary }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating trade notes:', error);
      return false;
    }
  }
};

interface TradeDetailsProps {
  tradeId: number;
  onBack: () => void;
}

// Enhanced Toolbar component for Tiptap
const EditorToolbar = ({ editor }: { editor: any }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        editor.chain().focus().setImage({ src: url }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-b border-gray-300 p-3 flex flex-wrap gap-2 bg-gray-50">
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
      </div>

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
      </div>

      <div className="flex gap-1">
        <button
          onClick={addImage}
          className="px-3 py-1.5 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors border"
          title="Add Image"
        >
          📷 Image
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
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  // Auto-save functionality
  const triggerAutoSave = async (content: string) => {
    if (!trade) return;
    
    setIsAutoSaving(true);
    try {
      const success = await api.updateTradeNotes(trade.id, content);
      if (success) {
        setLastSaved(new Date());
        setTrade(prev => prev ? { ...prev, commentary: content } : null);
      }
    } catch (error) {
      console.error('Error auto-saving notes:', error);
    } finally {
      setIsAutoSaving(false);
    }
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

  const formatSimpleDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalCost = trade.entryPrice * trade.quantity;
  const totalReturn = trade.exitPrice ? (trade.exitPrice * trade.quantity) : 0;
  const netPnL = trade.profitLoss || 0;

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
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Trade Summary Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{trade.symbol.slice(0, 2)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{trade.symbol}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                    trade.direction === 'Long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {trade.direction}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                    trade.status === 'Open' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {trade.status}
                  </span>
                  <span className="text-gray-400 text-sm">{trade.orderType}</span>
                  {trade.assessment && (
                    <span className="text-gray-400 text-sm">• {trade.assessment}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-2xl font-bold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                  <span className="text-white text-sm font-medium">{formatSimpleDate(trade.entryDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Time:</span>
                  <span className="text-white text-sm font-medium">{formatTime(trade.entryDate)}</span>
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
                    {trade.exitDate ? formatSimpleDate(trade.exitDate) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Time:</span>
                  <span className="text-white text-sm font-medium">
                    {trade.exitDate ? formatTime(trade.exitDate) : '—'}
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
                  <span className="text-gray-400 text-sm">P&L:</span>
                  <span className={`text-sm font-semibold ${netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(netPnL)}
                  </span>
                </div>
                {trade.percentChange && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Return %:</span>
                    <span className={`text-sm font-semibold ${trade.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.percentChange > 0 ? '+' : ''}{trade.percentChange.toFixed(2)}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Capital:</span>
                  <span className="text-white text-sm font-medium">{formatCurrency(trade.capitalDeployed)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Created:</span>
                  <span className="text-white text-sm font-medium">{formatSimpleDate(trade.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section with Tiptap Editor */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Trade Journal & Notes</h2>
          <p className="text-gray-400 text-sm mt-1">
            Document your thoughts, analysis, and lessons learned. Add images by using the 📷 button.
          </p>
        </div>
        
        <div className="bg-white">
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
              <span>📷 Add images using the Image button</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Auto-save enabled</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDetails;