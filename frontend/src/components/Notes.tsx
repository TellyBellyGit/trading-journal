// File: frontend/src/components/Notes.tsx
// Notes System with Two-Panel Layout and Rich Text Editor

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { HTMLPreserver } from './HTMLPreserver';
import { notesApi } from '../api/notes';
import type { Note, CreateNoteData, UpdateNoteData, SaveStatus } from '../types/notes';
import { sanitizeForJSON } from '../utils/jsonSanitizer';

// Custom ResizableImage extension
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
      container.className = 'relative inline-block group';
      
      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      img.className = 'max-w-full h-auto cursor-pointer transition-all duration-200 group-hover:shadow-lg';
      
      if (node.attrs.width) img.style.width = node.attrs.width + 'px';
      if (node.attrs.height) img.style.height = node.attrs.height + 'px';
      
      container.appendChild(img);
      
      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false;
          if (updatedNode.attrs.src !== img.src) img.src = updatedNode.attrs.src;
          return true;
        },
      };
    };
  },
});

// Image compression utility
const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    const img = document.createElement('img');
    
    img.onload = () => {
      try {
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
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

// Editor Toolbar Component
const EditorToolbar = ({ editor }: { editor: any }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file);
        editor.chain().focus().setImage({ src: compressedDataUrl }).run();
      } catch (error) {
        console.error('Error compressing image:', error);
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

  const handleHTMLImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/html') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const htmlContent = e.target?.result as string;
        // Use setContent with preserveWhitespace to maintain formatting and colors
        editor.commands.setContent(htmlContent, false, {
          preserveWhitespace: 'full'
        });
      };
      reader.readAsText(file);
    }
  };

  const importHTML = () => {
    htmlInputRef.current?.click();
  };

  return (
    <div className="border-b border-gray-700 p-3 flex flex-wrap gap-2 bg-gray-800">
      {/* Text Formatting */}
      <div className="flex gap-1 pr-2 border-r border-gray-600">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded text-sm font-bold transition-colors ${
            editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
          }`}
          title="Bold"
        >
          B
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded text-sm italic transition-colors ${
            editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
          }`}
          title="Italic"
        >
          I
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 rounded text-sm line-through transition-colors ${
            editor.isActive('strike') ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
          }`}
          title="Strikethrough"
        >
          S
        </button>
      </div>

      {/* Headers */}
      <div className="flex gap-1 pr-2 border-r border-gray-600">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1.5 rounded text-sm font-bold transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
          }`}
          title="Heading 2"
        >
          H2
        </button>

        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2.5 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('paragraph') ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
          }`}
          title="Paragraph"
        >
          P
        </button>
      </div>

      {/* Lists */}
      <div className="flex gap-1 pr-2 border-r border-gray-600">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2.5 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
          }`}
          title="Bullet List"
        >
          • List
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2.5 py-1.5 rounded text-sm transition-colors ${
            editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
          }`}
          title="Numbered List"
        >
          1. List
        </button>
      </div>

      {/* Colors */}
      <div className="flex gap-1 pr-2 border-r border-gray-600">
        <button
          onClick={() => editor.chain().focus().setColor('#ef4444').run()}
          className="w-7 h-7 bg-red-500 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
          title="Red Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#22c55e').run()}
          className="w-7 h-7 bg-green-500 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
          title="Green Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#3b82f6').run()}
          className="w-7 h-7 bg-blue-500 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
          title="Blue Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#f59e0b').run()}
          className="w-7 h-7 bg-yellow-500 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
          title="Yellow Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#8b5cf6').run()}
          className="w-7 h-7 bg-purple-500 rounded border-2 border-gray-600 hover:scale-110 transition-transform"
          title="Purple Text"
        />
        <button
          onClick={() => editor.chain().focus().setColor('#000000').run()}
          className="w-7 h-7 bg-black rounded border-2 border-gray-600 hover:scale-110 transition-transform"
          title="Black Text"
        />
      </div>

      {/* Media & Utilities */}
      <div className="flex gap-1">
        <button
          onClick={importHTML}
          className="px-3 py-1.5 rounded text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors border"
          title="Import HTML Analysis"
        >
          📁 Import HTML
        </button>
        
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
            editor.isActive('blockquote') ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={htmlInputRef}
        type="file"
        accept=".html"
        onChange={handleHTMLImport}
        style={{ display: 'none' }}
      />
    </div>
  );
};

// Main Notes Component
const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ status: 'idle' });
  const [noteTitle, setNoteTitle] = useState('');
  const [noteCategory, setNoteCategory] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
   const autoSaveTimeoutRef = useRef<number | null>(null);

  // Editor setup
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
      HTMLPreserver, // Preserves inline HTML styles including colors
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
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
        style: 'max-width: none !important;',
        'data-placeholder': 'Start writing your note...',
      },
    },
    onUpdate: ({ editor }) => {
      if (selectedNote) {
        const content = editor.getHTML();
        triggerAutoSave({ content });
      }
    },
  });

  // Auto-save functionality
  const triggerAutoSave = useCallback((data: { title?: string; content?: string; category?: string; tags?: string[] }) => {
    if (!selectedNote) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaveStatus({ status: 'saving' });

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const updateData: UpdateNoteData = {};
        
        if (data.title !== undefined && data.title !== selectedNote.title) {
          updateData.title = sanitizeForJSON(data.title);
        }
        if (data.content !== undefined && data.content !== selectedNote.content) {
          updateData.content = sanitizeForJSON(data.content);
        }
        if (data.category !== undefined && data.category !== selectedNote.category) {
          updateData.category = sanitizeForJSON(data.category);
        }
        if (data.tags !== undefined && JSON.stringify(data.tags) !== JSON.stringify(selectedNote.tags)) {
          updateData.tags = data.tags;
        }

        if (Object.keys(updateData).length > 0) {
          const updatedNote = await notesApi.update(selectedNote.id, updateData);
          setSelectedNote(updatedNote);
          setNotes(prev => prev.map(note => note.id === updatedNote.id ? updatedNote : note));
          setSaveStatus({ status: 'saved' });
          
          setTimeout(() => {
            setSaveStatus({ status: 'idle' });
          }, 2000);
        } else {
          setSaveStatus({ status: 'idle' });
        }
      } catch (error) {
        setSaveStatus({ status: 'error', message: 'Failed to save' });
      }
    }, 2000);
  }, [selectedNote]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [notesData, categoriesData, tagsData] = await Promise.all([
          notesApi.getAll(),
          notesApi.getCategories(),
          notesApi.getTags()
        ]);
        
        setNotes(notesData);
        setCategories(categoriesData);
        setAvailableTags(tagsData);
      } catch (error) {
        console.error('Error loading notes data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter notes based on search and filters
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchTerm || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || note.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => note.tags.includes(tag));
    
    return matchesSearch && matchesCategory && matchesTags;
  });

  // Handle note selection
  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteCategory(note.category || '');
    setNoteTags(note.tags);
    editor?.commands.setContent(note.content);
  };

  // Create new note
  const handleNewNote = async () => {
    try {
      const newNote: CreateNoteData = {
        title: sanitizeForJSON('New Note'),
        content: sanitizeForJSON('<p>Start writing your note...</p>'),
        category: sanitizeForJSON(''),
        tags: []
      };
      
      const createdNote = await notesApi.create(newNote);
      setNotes(prev => [createdNote, ...prev]);
      handleNoteSelect(createdNote);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await notesApi.delete(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setNoteTitle('');
        setNoteCategory('');
        setNoteTags([]);
        editor?.commands.setContent('');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setNoteTitle(newTitle);
    triggerAutoSave({ title: newTitle });
  };

  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    setNoteCategory(newCategory);
    triggerAutoSave({ category: newCategory });
  };

  // Handle tag operations
  const addTag = (tag: string) => {
    if (tag && !noteTags.includes(tag)) {
      const newTags = [...noteTags, tag];
      setNoteTags(newTags);
      triggerAutoSave({ tags: newTags });
      setNewTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = noteTags.filter(tag => tag !== tagToRemove);
    setNoteTags(newTags);
    triggerAutoSave({ tags: newTags });
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-900">
      {/* Left Panel - Notes List (Narrower) */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-screen">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-700 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Notes</h2>
            <button
              onClick={handleNewNote}
              className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              + New Note
            </button>
          </div>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          {/* Tag Filters */}
          <div className="flex flex-wrap gap-1">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          
          {/* Clear Filters */}
          {(searchTerm || selectedCategory || selectedTags.length > 0) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedTags([]);
              }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          )}
        </div>
        
        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {notes.length === 0 ? 'No notes yet. Create your first note!' : 'No notes match your filters.'}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => handleNoteSelect(note)}
                className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                  selectedNote?.id === note.id ? 'bg-gray-700 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{note.title}</h3>
                    <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                      {note.content.replace(/<[^>]*>/g, '')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {note.category && (
                        <span className="px-2 py-0.5 bg-green-600 text-green-100 rounded text-xs">
                          {note.category}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {note.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="ml-2 p-1 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Right Panel - Note Editor (Full Height) */}
      <div className="flex-1 flex flex-col h-screen">
        {selectedNote ? (
          <>
            {/* Note Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800">
              <div className="space-y-3">
                {/* Title */}
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full text-xl font-semibold px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Note title..."
                />
                
                <div className="flex gap-4 items-center">
                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={noteCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      list="categories"
                      className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter category..."
                    />
                    <datalist id="categories">
                      {categories.map(category => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                  </div>
                  
                  {/* Save Status */}
                  <div className="flex items-center gap-2 text-sm">
                    {saveStatus.status === 'saving' && (
                      <span className="text-blue-400">💾 Saving...</span>
                    )}
                    {saveStatus.status === 'saved' && (
                      <span className="text-green-400">✅ Saved</span>
                    )}
                    {saveStatus.status === 'error' && (
                      <span className="text-red-400">❌ {saveStatus.message}</span>
                    )}
                  </div>
                </div>
                
                {/* Tags */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    {noteTags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-600 text-blue-100 rounded text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-blue-200 hover:text-blue-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTag(newTagInput);
                          }
                        }}
                        list="available-tags"
                        className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm w-24 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add tag..."
                      />
                      <button
                        onClick={() => addTag(newTagInput)}
                        className="px-2 py-1 bg-gray-600 text-gray-200 rounded text-sm hover:bg-gray-500 transition-colors"
                      >
                        +
                      </button>
                      <datalist id="available-tags">
                        {availableTags.map(tag => (
                          <option key={tag} value={tag} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Editor */}
               <div className="flex-1 flex flex-col bg-gray-800 min-h-0">
    <EditorToolbar editor={editor} />
    <div className="flex-1 overflow-y-auto min-h-0">
      <EditorContent
        editor={editor}
        className="h-full min-h-full"
        
      />
    </div>
  </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-900 h-screen">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-white">Select a note to edit</h3>
              <p className="text-sm mt-2">Choose a note from the list or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;