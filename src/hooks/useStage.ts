import { useState, useEffect } from 'react';
import { ViewMode, Book, UserProfile, AuthorProfile, Message } from '../types';
import { MOCK_BOOKS } from '../constants';
import { supabaseService } from '../services/supabaseService';

export function useStage() {
  const [view, setView] = useState<ViewMode>('LIBRARY');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [selectedBook, setSelectedBook] = useState<Book>(MOCK_BOOKS[0]);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { id: '1', role: 'ai', text: `Hello! I've been analyzing the latest chapters of "${MOCK_BOOKS[0].title}". Would you like to discuss the symbolism of the lighthouse, or shall we explore the protagonist's recent decision?`, timestamp: '10:24 AM' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saveSession, setSaveSession] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const profile = await supabaseService.getCurrentUser();
        if (profile) {
          setUser(profile);
          const authorProfile = await supabaseService.getAuthorProfile(profile.id);
          setAuthor(authorProfile);
          
          const realBooks = await supabaseService.getBooks();
          if (realBooks.length > 0) {
            setBooks(prev => [...realBooks, ...prev]);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    };
    checkAuth();
  }, []);

  return {
    view, setView,
    user, setUser,
    author, setAuthor,
    books, setBooks,
    selectedBook, setSelectedBook,
    chatHistory, setChatHistory,
    inputText, setInputText,
    isAiLoading, setIsAiLoading,
    isPlaying, setIsPlaying,
    saveSession, setSaveSession
  };
}
