export type ViewMode = 'READ' | 'LISTEN' | 'CONVERSE' | 'LIBRARY' | 'DASHBOARD' | 'AUTH' | 'DATABASE';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'reader' | 'author' | 'admin';
  created_at: string;
}

export interface AuthorProfile {
  id: string;
  user_id: string;
  bio: string;
  website: string;
  social_links: any;
}

export interface Book {
  id: string;
  author_id?: string;
  title: string;
  author: string; // Display name
  coverUrl: string;
  progress: number;
  category: string;
  content: string;
  chapters: Chapter[];
  pdf_path?: string;
  uploaded_at?: string;
  metadata?: any;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface ReaderInteraction {
  id: string;
  userId: string;
  question: string;
  aiResponse: string;
  timestamp: string;
  bookTitle: string;
}
