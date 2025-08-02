// backend/src/routes/notes.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Interface for note data
interface CreateNoteData {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

interface UpdateNoteData {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

// GET /api/notes - List all notes with optional search/filter
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search, category, tags } = req.query;
    
    let whereClause: any = { userId: req.user!.userId };
    
    // Add search filter
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Add category filter
    if (category && typeof category === 'string') {
      whereClause.category = category;
    }
    
    // Add tags filter
    if (tags && typeof tags === 'string') {
      whereClause.tags = { contains: tags };
    }
    
    const notes = await prisma.note.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    });
    
    // Parse tags from comma-separated string to array
    const notesWithParsedTags = notes.map(note => ({
      ...note,
      tags: note.tags ? note.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    }));
    
    res.json(notesWithParsedTags);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /api/notes/:id - Get specific note
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const note = await prisma.note.findUnique({
      where: { 
        id,
        userId: req.user!.userId
      }
    });
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Parse tags from comma-separated string to array
    const noteWithParsedTags = {
      ...note,
      tags: note.tags ? note.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };
    
    res.json(noteWithParsedTags);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /api/notes - Create new note
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags }: CreateNoteData = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Convert tags array to comma-separated string
    const tagsString = tags && tags.length > 0 ? tags.join(', ') : undefined;
    
    const note = await prisma.note.create({
      data: {
        title,
        content,
        category,
        tags: tagsString,
        userId: req.user!.userId
      }
    });
    
    // Parse tags back to array for response
    const noteWithParsedTags = {
      ...note,
      tags: note.tags ? note.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };
    
    res.status(201).json(noteWithParsedTags);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /api/notes/:id - Update note (for auto-save)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags }: UpdateNoteData = req.body;
    
    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { 
        id,
        userId: req.user!.userId
      }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Convert tags array to comma-separated string if provided
    const tagsString = tags && tags.length > 0 ? tags.join(', ') : undefined;
    
    const updatedNote = await prisma.note.update({
      where: { 
        id,
        userId: req.user!.userId
      },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags: tagsString })
      }
    });
    
    // Parse tags back to array for response
    const noteWithParsedTags = {
      ...updatedNote,
      tags: updatedNote.tags ? updatedNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };
    
    res.json(noteWithParsedTags);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { 
        id,
        userId: req.user!.userId
      }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    await prisma.note.delete({
      where: { 
        id,
        userId: req.user!.userId
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// GET /api/notes/categories - Get all unique categories
router.get('/metadata/categories', authenticateToken, async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      select: { category: true },
      where: { 
        userId: req.user!.userId,
        category: { not: null }
      }
    });
    
    const categories = [...new Set(notes.map(note => note.category).filter(Boolean))];
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/notes/tags - Get all unique tags
router.get('/metadata/tags', authenticateToken, async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      select: { tags: true },
      where: { 
        userId: req.user!.userId,
        tags: { not: null }
      }
    });
    
    const allTags = notes
      .map(note => note.tags ? note.tags.split(',').map(tag => tag.trim()) : [])
      .flat()
      .filter(tag => tag);
    
    const uniqueTags = [...new Set(allTags)];
    res.json(uniqueTags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;