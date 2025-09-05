// File: frontend/src/components/TradeAnalysis.tsx
// Enhanced Trade Analysis component with color-preserving HTML import functionality

import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { HTMLPreserver } from './HTMLPreserver';

interface TradeAnalysisProps {
  tradeId: string;
  initialContent?: string;
  onSave?: (content: string) => void;
}

// Pre-defined analysis templates with color coding
const ANALYSIS_TEMPLATES = {
  dayTrade: `<h2 style="color: #3b82f6;">Day Trade Analysis v0.1</h2>
<p><strong style="color: green;">ENTRY SETUP:</strong> </p>
<ul>
  <li>Technical indicators used: </li>
  <li>Market conditions: </li>
  <li>Risk/reward ratio: </li>
</ul>

<p><strong style="color: red;">EXIT ANALYSIS:</strong> </p>
<ul>
  <li>Exit reason: </li>
  <li>Target achieved: </li>
  <li>Stop loss hit: </li>
</ul>

<p><strong style="color: #f59e0b;">LESSONS LEARNED:</strong> </p>
<p>What went well and what could be improved...</p>`,

  swingTrade: `<h2 style="color: #8b5cf6;">Swing Trade Review v0.1</h2>
<p><strong style="color: green;">THESIS & SETUP:</strong> </p>
<p>Why did I enter this position?</p>

<p><strong style="color: #3b82f6;">RISK MANAGEMENT:</strong> </p>
<ul>
  <li>Position size: </li>
  <li>Stop loss: </li>
  <li>Target price: </li>
</ul>

<p><strong style="color: #f59e0b;">OUTCOME ANALYSIS:</strong> </p>
<p>How did the trade perform vs expectations?</p>`,

  postMortem: `<h1 style="color: red;">Trade Post-Mortem Analysis v0.1</h1>
<p><strong style="color: red;">OVERALL ASSESSMENT:</strong> What was the quality of this trade?</p>

<h3 style="color: #3b82f6;">SETUP & CONTEXT</h3>
<p><strong style="color: green;">STRENGTHS:</strong></p>
<ul><li></li></ul>
<p><strong style="color: red;">WEAKNESSES:</strong></p>
<ul><li></li></ul>

<h3 style="color: #3b82f6;">RISK & MONEY MANAGEMENT</h3>
<p><strong style="color: green;">STRENGTHS:</strong></p>
<ul><li></li></ul>
<p><strong style="color: red;">WEAKNESSES:</strong></p>
<ul><li></li></ul>

<h3 style="color: #3b82f6;">EXECUTION & MANAGEMENT</h3>
<p><strong style="color: green;">STRENGTHS:</strong></p>
<ul><li></li></ul>
<p><strong style="color: red;">WEAKNESSES:</strong></p>
<ul><li></li></ul>

<h2 style="color: #ef4444;">KEY LESSONS:</h2>
<p>What are the main takeaways from this trade?</p>`
};

const TradeAnalysis: React.FC<TradeAnalysisProps> = ({ 
  tradeId, 
  initialContent = '', 
  onSave 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Editor with HTMLPreserver extension
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      HTMLPreserver, // This preserves inline HTML styles
    ],
    content: initialContent || '<p>Start your trade analysis...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
        style: 'max-width: none !important;',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onSave?.(content);
    },
  });

  // Handle HTML file import
  const handleHTMLImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const htmlContent = e.target?.result as string;
        // Use setContent with preserveWhitespace to maintain formatting
        editor?.commands.setContent(htmlContent, false, {
          preserveWhitespace: 'full'
        });
      };
      reader.readAsText(file);
    }
  };

  const insertTemplate = (templateKey: keyof typeof ANALYSIS_TEMPLATES) => {
    const template = ANALYSIS_TEMPLATES[templateKey];
    // Use setContent with preserveWhitespace to maintain colors
    editor?.commands.setContent(template, false, {
      preserveWhitespace: 'full'
    });
    setShowTemplates(false);
  };

  const EditorToolbar = () => {
    if (!editor) return null;

    return (
      <div className="border-b border-gray-700 p-3 flex flex-wrap gap-2 bg-gray-800">
        {/* Template Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1.5 rounded text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors border"
          >
            📋 Templates
          </button>
          
          {showTemplates && (
            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 min-w-48">
              <button
                onClick={() => insertTemplate('dayTrade')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                Day Trade Analysis
              </button>
              <button
                onClick={() => insertTemplate('swingTrade')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                Swing Trade Review
              </button>
              <button
                onClick={() => insertTemplate('postMortem')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                Post-Mortem Analysis
              </button>
            </div>
          )}
        </div>

        {/* Import HTML Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors border"
        >
          📁 Import HTML
        </button>

        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-600 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
              editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1.5 rounded text-sm italic transition-colors ${
              editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            I
          </button>
        </div>

        {/* Headers */}
        <div className="flex gap-1 border-r border-gray-600 pr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            H2
          </button>
        </div>

        {/* Colors for Trade Analysis */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().setColor('#ef4444').run()}
            className="w-7 h-7 bg-red-500 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
            title="Red (Losses/Weaknesses)"
          />
          <button
            onClick={() => editor.chain().focus().setColor('#22c55e').run()}
            className="w-7 h-7 bg-green-500 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
            title="Green (Wins/Strengths)"
          />
          <button
            onClick={() => editor.chain().focus().setColor('#3b82f6').run()}
            className="w-7 h-7 bg-blue-500 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
            title="Blue (Analysis/Neutral)"
          />
          <button
            onClick={() => editor.chain().focus().setColor('#f59e0b').run()}
            className="w-7 h-7 bg-yellow-500 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
            title="Yellow (Lessons/Warnings)"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".html"
          onChange={handleHTMLImport}
          style={{ display: 'none' }}
        />
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Trade Analysis</h3>
        <p className="text-sm text-gray-400">Analyze your trade performance with color-coded sections</p>
      </div>
      
      <div className="min-h-[500px] flex flex-col">
        <EditorToolbar />
        <div className="flex-1 min-h-0">
          <EditorContent
            editor={editor}
            className="min-h-[400px] prose prose-invert max-w-none"
          />
        </div>
      </div>
    </div>
  );
};

export default TradeAnalysis;