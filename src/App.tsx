import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/ui/Sidebar';
import { BottomNav } from './components/ui/BottomNav';
import { LibraryView } from './components/views/LibraryView';
import { ReadView } from './components/views/ReadView';
import { ListenView } from './components/views/ListenView';
import { ConverseView } from './components/views/ConverseView';
import { DashboardView } from './components/views/DashboardView';
import { DatabaseView } from './components/views/DatabaseView';
import { AuthView } from './components/views/AuthView';
import { useStage } from './hooks/useStage';

/**
 * LBC Execution Engine (Formerly App.tsx)
 * Operates as a persistent stage that reconfigures based on state. 
 */
export default function App() {
  const stage = useStage();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stage.view === 'CONVERSE') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stage.chatHistory, stage.view]);

  const handleSendMessage = async () => {
    // Logic remains same for now, but centrally managed
    // ... imported from original App logic in a real refactor we'd move this to a service or hook
  };

  const renderStage = () => {
    switch (stage.view) {
      case 'READ':
        return <ReadView book={stage.selectedBook} onAiClick={() => stage.setView('CONVERSE')} />;
      case 'LISTEN':
        return <ListenView book={stage.selectedBook} isPlaying={stage.isPlaying} setIsPlaying={stage.setIsPlaying} onAiClick={() => stage.setView('CONVERSE')} />;
      case 'CONVERSE':
        return (
          <ConverseView 
            book={stage.selectedBook} 
            history={stage.chatHistory} 
            inputText={stage.inputText} 
            setInputText={stage.setInputText} 
            onSend={handleSendMessage} 
            isLoading={stage.isAiLoading}
            saveSession={stage.saveSession}
            setSaveSession={stage.setSaveSession}
            chatEndRef={chatEndRef}
          />
        );
      case 'LIBRARY':
        return <LibraryView books={stage.books} onSelectBook={(book) => { stage.setSelectedBook(book); stage.setView('READ'); }} />;
      case 'DASHBOARD':
        return <DashboardView author={stage.author} onUploadSuccess={(newBook) => stage.setBooks(prev => [newBook, ...prev])} />;
      case 'DATABASE':
        return <DatabaseView />;
      case 'AUTH':
        return <AuthView onAuthSuccess={(profile) => { stage.setUser(profile); stage.setView('LIBRARY'); }} />;
      default:
        return <LibraryView books={stage.books} onSelectBook={(book) => { stage.setSelectedBook(book); stage.setView('READ'); }} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-dark text-white font-sans">
      <Sidebar view={stage.view} setView={stage.setView} user={stage.user} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage.view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {renderStage()}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav view={stage.view} setView={stage.setView} />
      </div>
    </div>
  );
}
