// frontend/src/types/notes.ts

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

export interface NotesSearchParams {
  search?: string;
  category?: string;
  tags?: string;
}

export interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message?: string;
}