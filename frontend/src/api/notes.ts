import axios from 'axios';
import type { Note, CreateNoteData, UpdateNoteData, NotesSearchParams } from '../types/notes';
import { sanitizeJsonPayload } from '../utils/jsonSanitizer';

const API_BASE_URL = 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const notesApi = {
  // Get all notes with optional search/filter
  getAll: async (params?: NotesSearchParams): Promise<Note[]> => {
    const response = await api.get('/notes', { params });
    return response.data;
  },

  // Get single note by ID
  getById: async (id: string): Promise<Note> => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  // Create new note
  create: async (noteData: CreateNoteData): Promise<Note> => {
    const sanitizedData = sanitizeJsonPayload(noteData);
    const response = await api.post('/notes', sanitizedData);
    return response.data;
  },

  // Update existing note (for auto-save)
  update: async (id: string, noteData: UpdateNoteData): Promise<Note> => {
    const sanitizedData = sanitizeJsonPayload(noteData);
    const response = await api.put(`/notes/${id}`, sanitizedData);
    return response.data;
  },

  // Delete note
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notes/${id}`);
  },

  // Get all unique categories
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/notes/metadata/categories');
    return response.data;
  },

  // Get all unique tags
  getTags: async (): Promise<string[]> => {
    const response = await api.get('/notes/metadata/tags');
    return response.data;
  },
};