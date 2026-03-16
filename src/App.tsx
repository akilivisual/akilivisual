import React, { useState, useEffect, useRef } from 'react';
import { 
  Book as BookIcon, 
  Headphones, 
  MessageSquare, 
  Library as LibraryIcon, 
  LayoutDashboard, 
  ChevronDown, 
  MoreVertical, 
  Send, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  CloudUpload,
  Search,
  Bell,
  User,
  Sparkles,
  Database,
  Save,
  Trash2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewMode, Book, Message, UserProfile, AuthorProfile } from './types';
import { MOCK_BOOKS } from './constants';
import { getBookCompanionResponse } from './services/geminiService';
import { supabaseService } from './services/supabaseService';

export default function App() {
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

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial Auth Check
    const checkAuth = async () => {
      try {
        const profile = await supabaseService.getCurrentUser();
        if (profile) {
          setUser(profile);
          const authorProfile = await supabaseService.getAuthorProfile(profile.id);
          setAuthor(authorProfile);
          
          // Fetch real books if logged in
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isAiLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputText('');
    setIsAiLoading(true);

    const responseText = await getBookCompanionResponse(
      selectedBook.title,
      selectedBook.content,
      inputText,
      chatHistory.map(h => ({ role: h.role, text: h.text }))
    );

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, aiMsg]);
    setIsAiLoading(false);
  };

  const renderView = () => {
    switch (view) {
      case 'READ':
        return <ReadView book={selectedBook} onAiClick={() => setView('CONVERSE')} />;
      case 'LISTEN':
        return <ListenView book={selectedBook} isPlaying={isPlaying} setIsPlaying={setIsPlaying} onAiClick={() => setView('CONVERSE')} />;
      case 'CONVERSE':
        return (
          <ConverseView 
            book={selectedBook} 
            history={chatHistory} 
            inputText={inputText} 
            setInputText={setInputText} 
            onSend={handleSendMessage} 
            isLoading={isAiLoading}
            saveSession={saveSession}
            setSaveSession={setSaveSession}
            chatEndRef={chatEndRef}
          />
        );
      case 'LIBRARY':
        return <LibraryView books={books} onSelectBook={(book) => { setSelectedBook(book); setView('READ'); }} />;
      case 'DASHBOARD':
        return <DashboardView author={author} onUploadSuccess={(newBook) => setBooks(prev => [newBook, ...prev])} />;
      case 'DATABASE':
        return <DatabaseView />;
      case 'AUTH':
        return <AuthView onAuthSuccess={(profile) => { setUser(profile); setView('LIBRARY'); }} />;
      default:
        return <LibraryView books={books} onSelectBook={(book) => { setSelectedBook(book); setView('READ'); }} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-dark text-white font-sans">
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 p-6 shrink-0 z-30">
        <div className="flex items-center gap-3 mb-10">
          <div className="size-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/30">
            <BookIcon size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none font-heading">LBC LITE</h1>
            <p className="text-[10px] uppercase tracking-widest text-brand-blue font-bold mt-1">Living Companion</p>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <SidebarItem icon={<LibraryIcon size={20} />} label="Library" active={view === 'LIBRARY'} onClick={() => setView('LIBRARY')} />
          <SidebarItem icon={<BookIcon size={20} />} label="Read" active={view === 'READ'} onClick={() => setView('READ')} />
          <SidebarItem icon={<Headphones size={20} />} label="Listen" active={view === 'LISTEN'} onClick={() => setView('LISTEN')} />
          <SidebarItem icon={<MessageSquare size={20} />} label="Converse" active={view === 'CONVERSE'} onClick={() => setView('CONVERSE')} />
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
          <SidebarItem icon={<Database size={20} />} label="Database" active={view === 'DATABASE'} onClick={() => setView('DATABASE')} />
        </div>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div 
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => !user && setView('AUTH')}
          >
            <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
              {user ? <img src={`https://ui-avatars.com/api/?name=${user.name}&background=006699&color=fff`} className="rounded-full" /> : <User size={20} />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user ? user.name : 'Sign In'}</p>
              <p className="text-[10px] text-white/40 truncate">{user ? user.role : 'Guest Reader'}</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden bg-black/80 backdrop-blur-2xl border-t border-white/10 px-4 pb-8 pt-3 shrink-0 z-30">
          <ul className="flex justify-between items-center max-w-lg mx-auto">
            <NavItem icon={<BookIcon size={24} />} label="Read" active={view === 'READ'} onClick={() => setView('READ')} />
            <NavItem icon={<Headphones size={24} />} label="Listen" active={view === 'LISTEN'} onClick={() => setView('LISTEN')} />
            <NavItem icon={<MessageSquare size={24} />} label="Converse" active={view === 'CONVERSE'} onClick={() => setView('CONVERSE')} />
            <NavItem icon={<LibraryIcon size={24} />} label="Library" active={view === 'LIBRARY'} onClick={() => setView('LIBRARY')} />
            <NavItem icon={<LayoutDashboard size={24} />} label="Dash" active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
          </ul>
        </nav>
      </div>
    </div>
  );
}

function AuthView({ onAuthSuccess }: { onAuthSuccess: (profile: UserProfile) => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await supabaseService.signInWithGoogle();
      // Note: OAuth redirect will happen, so we don't need to handle success here
      // The useEffect in App will pick up the session on reload
    } catch (err: any) {
      console.error('Sign in failed:', err);
      alert(`Sign in failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-brand-dark">
      <div className="max-w-md w-full glass-panel p-10 rounded-3xl text-center space-y-8 shadow-2xl border border-white/10">
        <div className="size-20 bg-brand-blue rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-blue/30">
          <BookIcon size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Welcome to LBC</h1>
          <p className="text-slate-400 mt-2">Sign in to access your library and interact with your favorite books.</p>
        </div>
        <button 
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
          ) : (
            <img src="https://www.google.com/favicon.ico" className="size-5" />
          )}
          Continue with Google
        </button>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Secure authentication via Supabase</p>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
    >
      <span className={`${active ? 'text-white' : 'text-white/40 group-hover:text-white'} transition-colors`}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {active && <motion.div layoutId="sidebar-pill" className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
    </button>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <li className="flex flex-col items-center gap-1 cursor-pointer group" onClick={onClick}>
      <div className={`p-1 transition-colors ${active ? 'text-brand-blue' : 'text-white/40 group-hover:text-white'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium uppercase tracking-tighter ${active ? 'text-brand-blue' : 'text-white/40'}`}>
        {label}
      </span>
      {active && <div className="w-1 h-1 bg-brand-blue rounded-full mt-0.5 shadow-[0_0_8px_rgba(0,102,153,0.8)]" />}
    </li>
  );
}

// --- Views ---

function ReadView({ book, onAiClick }: { book: Book, onAiClick: () => void }) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 pt-12 pb-6 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm shrink-0">
          <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
            <button className="p-2 -ml-2 text-gray-400 hover:text-white md:hidden"><ChevronDown className="rotate-90" /></button>
            <div className="text-center md:text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Chapter 4</span>
              <h1 className="text-sm font-semibold text-gray-200">{book.chapters[book.chapters.length - 1]?.title || book.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-white hidden md:flex items-center gap-2 text-xs font-medium border border-white/10 rounded-lg px-3">
                <Search size={14} /> Search
              </button>
              <button className="p-2 -mr-2 text-gray-400 hover:text-white"><MoreVertical size={20} /></button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32">
          <article className="max-w-prose mx-auto glass-panel rounded-3xl p-8 md:p-12 shadow-2xl mt-4">
            <div className="font-serif text-lg md:text-2xl text-gray-300 space-y-8 leading-relaxed">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-brand-blue">The sun had dipped below the horizon hours ago, leaving the valley in a deep, sapphire gloom. Elara adjusted her cloak, the heavy wool scratching against her neck as she peered into the reflective surface of the Obsidian Mirror.</p>
              <p>It wasn't just a relic; it was a doorway. Or so the legends whispered in the tavern corners of Oakhaven. To Elara, it looked like a sheet of frozen night, polished so smooth that the stars themselves seemed to get lost in its depths.</p>
              <p>"Are you certain of this?" Kael asked from the shadows. His voice was a rasp, tight with a fear he refused to name. He stepped into the faint circle of light cast by Elara's lantern.</p>
              <p>She didn't look away from the glass. "Certainty is a luxury we burned along with the maps, Kael. We follow the reflection now, or we don't follow anything at all."</p>
              <p>She reached out, her fingertips hovering just inches from the cold surface. The air around the mirror hummed with a low-frequency vibration that rattled her teeth. It was the sound of a world holding its breath.</p>
            </div>
          </article>
        </main>

        <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-20">
          <button 
            onClick={onAiClick}
            className="glass-button hover:bg-opacity-60 transition-all duration-300 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg shadow-brand-blue/20 group relative"
          >
            <Sparkles className="text-white w-7 h-7 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
            <span className="absolute inset-0 rounded-full bg-brand-blue animate-ping opacity-10"></span>
          </button>
        </div>
      </div>

      {/* Desktop Side Panel */}
      <aside className="hidden xl:flex w-80 bg-black/20 border-l border-white/10 flex-col p-6 overflow-y-auto no-scrollbar">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-6">AI Insights</h3>
        <div className="space-y-6">
          <div className="glass-panel p-4 rounded-xl border-l-2 border-brand-blue">
            <p className="text-xs font-bold mb-2">Symbolism: The Mirror</p>
            <p className="text-xs text-white/60 leading-relaxed">The Obsidian Mirror represents the boundary between the known and the unknown, reflecting Elara's internal conflict.</p>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-xs font-bold mb-2">Key Characters</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-6 rounded-full bg-brand-blue/20 flex items-center justify-center text-[10px] font-bold">E</div>
              <span className="text-xs">Elara (Protagonist)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">K</div>
              <span className="text-xs">Kael (Companion)</span>
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-xs font-bold mb-2">Vocabulary</p>
            <p className="text-[10px] text-white/40 mb-1 italic">Obsidian</p>
            <p className="text-xs text-white/70">A hard, dark, glass-like volcanic rock formed by the rapid solidification of lava without crystallization.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ListenView({ book, isPlaying, setIsPlaying, onAiClick }: { book: Book, isPlaying: boolean, setIsPlaying: (v: boolean) => void, onAiClick: () => void }) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col px-8 pb-12 overflow-y-auto no-scrollbar">
        <header className="py-6 flex justify-between items-center shrink-0 max-w-4xl mx-auto w-full">
          <button className="p-2 md:hidden"><ChevronDown /></button>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-gray-400">Now Playing</p>
            <h1 className="text-sm font-semibold truncate max-w-[200px]">{book.title}</h1>
          </div>
          <button className="p-2"><MoreVertical /></button>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-10">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 w-full">
            <div className="w-full aspect-square max-w-[300px] md:max-w-[400px] shadow-2xl rounded-3xl overflow-hidden glass-panel p-3 shrink-0">
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
            </div>

            <div className="flex-1 w-full text-center md:text-left">
              <div className="mb-8">
                <h2 className="text-3xl md:text-5xl font-bold mb-2 font-heading tracking-tight">Chapter 3: The Party</h2>
                <p className="text-xl text-gray-400 font-medium">{book.author}</p>
              </div>

              <div className="w-full mb-10">
                <div className="w-full bg-white/10 h-2 rounded-full mb-3 overflow-hidden">
                  <div className="h-full bg-brand-blue rounded-full w-[40%] transition-all duration-500 shadow-[0_0_15px_rgba(0,102,153,0.5)]"></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500 font-mono">
                  <span>12:45</span>
                  <span>-32:10</span>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-8 mb-12">
                <button className="text-gray-400 hover:text-white transition-colors"><SkipBack size={36} /></button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                </button>
                <button className="text-gray-400 hover:text-white transition-colors"><SkipForward size={36} /></button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <button 
                  onClick={onAiClick}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-brand-blue text-white hover:bg-brand-blue/80 transition-all text-sm font-bold shadow-xl shadow-brand-blue/20"
                >
                  <Sparkles size={18} />
                  Talk to AI Companion
                </button>
                <p className="text-xs text-gray-500 italic">"Ask about the symbolism of Gatsby's car..."</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Desktop Playlist Sidebar */}
      <aside className="hidden lg:flex w-80 bg-black/20 border-l border-white/10 flex-col p-6 overflow-y-auto no-scrollbar">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-6">Chapters</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(num => (
            <button 
              key={num}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${num === 3 ? 'bg-brand-blue/20 border border-brand-blue/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <span className={`text-xs font-mono ${num === 3 ? 'text-brand-blue' : 'text-white/30'}`}>0{num}</span>
              <div className="text-left overflow-hidden">
                <p className={`text-sm font-medium truncate ${num === 3 ? 'text-white' : 'text-white/60'}`}>The Beginning of the End</p>
                <p className="text-[10px] text-white/30">14:20</p>
              </div>
              {num === 3 && <div className="ml-auto size-1.5 bg-brand-blue rounded-full animate-pulse" />}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function ConverseView({ book, history, inputText, setInputText, onSend, isLoading, saveSession, setSaveSession, chatEndRef }: any) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden border-r border-white/10">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-black/20 backdrop-blur-md">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-widest text-white/90 uppercase font-heading">AI COMPANION</h1>
            <span className="text-[10px] text-brand-blue font-bold uppercase tracking-tighter">Deep Context Mode</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Auto-Save</span>
              <button 
                onClick={() => setSaveSession(!saveSession)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${saveSession ? 'bg-brand-blue' : 'bg-white/20'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${saveSession ? 'translate-x-4' : 'translate-x-0'}`}></span>
              </button>
            </div>
            <button className="p-2 text-white/40 hover:text-white transition-colors"><MoreVertical size={20} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-brand-dark/30">
          <div className="max-w-3xl mx-auto w-full space-y-8">
            {history.map((msg: Message) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'ai' ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30' : 'bg-white/10 text-white border border-white/10'}`}>
                  {msg.role === 'ai' ? <Sparkles size={20} /> : <User size={20} />}
                </div>
                <div className={`flex flex-col ${msg.role === 'ai' ? 'items-start' : 'items-end'} flex-1`}>
                  <div className={`p-5 text-sm leading-relaxed shadow-xl border group relative ${msg.role === 'ai' ? 'bg-white/5 border-white/10 rounded-2xl rounded-tl-none text-white/90' : 'bg-brand-blue text-white border-brand-blue/50 rounded-2xl rounded-tr-none'}`}>
                    {msg.text}
                    {msg.role === 'ai' && (
                      <button 
                        onClick={async () => {
                          try {
                            await supabaseService.saveInteraction({
                              userId: 'guest', // In real app, use user.id
                              bookTitle: book.title,
                              question: history[history.indexOf(msg) - 1]?.text || 'Context query',
                              aiResponse: msg.text
                            });
                            alert('Insight saved to Supabase!');
                          } catch (err) {
                            console.error('Save failed:', err);
                          }
                        }}
                        className="absolute -right-12 top-0 p-2 bg-white/5 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Save to Supabase"
                      >
                        <Save size={16} className="text-brand-blue" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-white/30 mt-2 font-medium tracking-wider uppercase">
                    {msg.role === 'ai' ? 'Companion' : 'Reader'} • {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4">
                <div className="size-10 rounded-xl bg-brand-blue/20 text-brand-blue border border-brand-blue/30 flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles size={20} />
                </div>
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none shadow-xl">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </main>

        <section className="p-6 bg-black/40 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-3xl mx-auto flex items-end gap-4">
            <div className="relative flex-1">
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent transition-all resize-none min-h-[56px] max-h-40 backdrop-blur-sm shadow-inner" 
                placeholder="Ask about themes, characters, or plot points..." 
                rows={1}
              />
            </div>
            <button 
              onClick={onSend}
              disabled={isLoading || !inputText.trim()}
              className="bg-brand-blue hover:bg-brand-blue/80 disabled:opacity-50 text-white w-14 h-14 rounded-2xl transition-all shrink-0 flex items-center justify-center shadow-xl shadow-brand-blue/20 active:scale-95"
            >
              <Send size={24} />
            </button>
          </div>
        </section>
      </div>

      {/* Desktop Context Sidebar */}
      <aside className="hidden xl:flex w-96 bg-black/10 flex-col p-8 overflow-y-auto no-scrollbar">
        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-4">Current Context</h3>
          <div className="glass-panel p-5 rounded-2xl border border-white/5">
            <div className="flex gap-4 mb-4">
              <img src={book.coverUrl} alt={book.title} className="w-16 h-20 object-cover rounded-lg shadow-lg" referrerPolicy="no-referrer" />
              <div>
                <h4 className="text-sm font-bold leading-tight">{book.title}</h4>
                <p className="text-xs text-white/40 mt-1">{book.author}</p>
                <div className="mt-2 px-2 py-0.5 bg-brand-blue/20 text-brand-blue text-[10px] font-bold rounded inline-block">Chapter 4</div>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed italic">"The Obsidian Mirror represents the boundary between the known and the unknown..."</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-blue">Suggested Topics</h3>
          <div className="grid gap-3">
            {['Character Motivations', 'Thematic Analysis', 'Plot Summary', 'Historical Context'].map(topic => (
              <button key={topic} className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-brand-blue/30 transition-all text-xs font-medium">
                {topic}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function LibraryView({ books, onSelectBook }: { books: Book[], onSelectBook: (book: Book) => void }) {
  const [filter, setFilter] = useState('All');
  const categories = ['All', 'Sci-Fi', 'Fantasy', 'Non-Fiction', 'History', 'Mystery'];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="sticky top-0 z-20 bg-brand-dark/80 backdrop-blur-md px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Library</h1>
          <button className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <User size={20} />
          </button>
        </div>

        <div className="relative group mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 group-focus-within:text-brand-blue transition-colors" />
          </div>
          <input className="block w-full pl-10 pr-3 py-3 border-none bg-slate-900/50 rounded-xl focus:ring-2 focus:ring-brand-blue/50 placeholder-slate-500 text-sm transition-all" placeholder="Search your collection..." type="text"/>
        </div>

        <div className="flex overflow-x-auto gap-3 py-4 no-scrollbar -mx-4 px-4">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex-none px-5 py-2 rounded-full text-xs font-semibold transition-all ${filter === cat ? 'bg-brand-blue/20 border border-brand-blue text-white shadow-[0_0_10px_rgba(0,102,153,0.3)]' : 'glass-panel text-slate-400 border-slate-700/50 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-6 border-b border-slate-800">
          <button className="pb-2 text-sm font-semibold border-b-2 border-brand-blue text-brand-blue">All Books</button>
          <button className="pb-2 text-sm font-medium text-slate-400 border-b-2 border-transparent">Recent</button>
          <button className="pb-2 text-sm font-medium text-slate-400 border-b-2 border-transparent">Favorites</button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {books.map(book => (
            <div 
              key={book.id} 
              onClick={() => onSelectBook(book)}
              className="glass-panel rounded-2xl overflow-hidden flex flex-col group transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-blue/10 cursor-pointer border border-white/5"
            >
              <div className="aspect-[3/4] bg-slate-800 relative overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={book.coverUrl} alt={book.title} referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                  {book.progress === 100 ? 'Completed' : `${book.progress}%`}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button className="w-full py-2 bg-brand-blue text-white text-xs font-bold rounded-lg shadow-lg">Read Now</button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold leading-tight truncate group-hover:text-brand-blue transition-colors">{book.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{book.author}</p>
                <div className="mt-4 w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${book.progress === 100 ? 'bg-green-500' : 'bg-brand-blue'}`} style={{ width: `${book.progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function DatabaseView() {
  const [activeTab, setActiveTab] = useState<'users' | 'books' | 'interactions'>('users');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const supabase = (await import('./lib/supabase')).getSupabase();
      const { data: result, error } = await supabase.from(activeTab).select('*');
      if (error) throw error;
      setData(result || []);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = async () => {
    const supabase = (await import('./lib/supabase')).getSupabase();
    let payload = {};
    
    if (activeTab === 'users') {
      payload = { name: 'New User', email: `user_${Date.now()}@example.com`, role: 'reader' };
    } else if (activeTab === 'books') {
      payload = { title: 'New Manual Book', author_id: null, pdf_path: 'manual/path' };
    } else if (activeTab === 'interactions') {
      payload = { 
        userId: 'guest_user', 
        bookTitle: 'System Test', 
        question: 'How does this work?', 
        aiResponse: 'This is a manually added test response.' 
      };
    }

    try {
      const { error } = await supabase.from(activeTab).insert(payload);
      if (error) {
        // Try snake_case if camelCase fails (common Supabase mismatch)
        if (activeTab === 'interactions') {
          const snakePayload = { 
            user_id: 'guest_user', 
            book_title: 'System Test', 
            question: 'How does this work?', 
            ai_response: 'This is a manually added test response.' 
          };
          const { error: retryError } = await supabase.from(activeTab).insert(snakePayload);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      fetchData();
    } catch (err: any) {
      console.error('Insert failed:', err);
      alert(`Failed to add row: ${err.message || 'Check your Supabase RLS policies and table schema.'}`);
    }
  };

  return (
    <div className="flex flex-col h-full p-8 space-y-6 overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Database Manager</h1>
          <p className="text-slate-400">Directly view and add information to your Supabase tables.</p>
        </div>
        <button 
          onClick={handleAddRow}
          className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-blue/80 transition-all"
        >
          <Plus size={20} /> Add Row
        </button>
      </div>

      <div className="flex gap-4 border-b border-white/10">
        {(['users', 'books', 'interactions'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-white/40 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="size-12 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading table data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  {data.length > 0 ? Object.keys(data[0]).map(key => (
                    <th key={key} className="px-6 py-4 font-bold uppercase tracking-tighter">{key}</th>
                  )) : <th className="px-6 py-4">No data found</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-6 py-4 text-slate-300 truncate max-w-[200px]">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardView({ author, onUploadSuccess }: { author: AuthorProfile | null, onUploadSuccess: (book: Book) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !author) return;

    setIsUploading(true);
    try {
      const title = file.name.replace('.pdf', '');
      const newBook = await supabaseService.uploadBookPDF(file, author.id, title);
      onUploadSuccess(newBook);
      alert('Book uploaded successfully!');
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden font-body">
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 bg-transparent backdrop-blur-xl border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold font-heading tracking-tight">Author Dashboard</h2>
              <p className="text-sm text-slate-500">Welcome back, your interactive library is live.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 w-64 backdrop-blur-sm" placeholder="Search books..." type="text"/>
              </div>
              <button className="p-2 text-slate-500 hover:bg-white/10 rounded-full relative transition-colors backdrop-blur-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2 size-2 bg-brand-blue rounded-full border-2 border-black"></span>
              </button>
              <div className="size-10 rounded-full bg-stone-700/50 overflow-hidden border-2 border-brand-blue/20 backdrop-blur-sm">
                <img alt="Author profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKcRlgjMe5frPtfGXktBrtOqZLc-rVLdrct0GADFbXwkzA8IUgWGphoBsCdeVKE_2rBA7-9bW-2UgTodTDDYxpO9iOeUE2DfPun_W0mLBXi0nZ4QAxnn8ZgTkqPcO0zyJ2XTfXUwm-s2KkZm4tTiXaMnZYQEOCMu6cwm6b3omfSpXnzP4XgXVAK13aIBnVsQ3SVD3qXhMROV9oHbLo5jTglPfSMTJfhCAGKdhGXHCPsgax1-uBYcCYCl9p8S_YE_MiFQuKwELaCcuN" />
              </div>
            </div>
          </header>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={<User size={20} />} label="Total Readers" value="12,482" trend="+12%" />
              <StatCard icon={<LayoutDashboard size={20} />} label="Avg. Session" value="24m 12s" trend="+5m" />
              <StatCard icon={<LayoutDashboard size={20} />} label="Top Chapter" value="Ch 4: The Void" />
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              accept=".pdf" 
              className="hidden" 
            />

            <button 
              onClick={() => author ? fileInputRef.current?.click() : alert('Please sign in as an author to upload.')}
              disabled={isUploading}
              className="group flex items-center justify-center gap-4 w-full p-6 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl transition-all shadow-xl shadow-brand-blue/20 relative overflow-hidden disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {isUploading ? (
                <div className="size-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <CloudUpload size={40} className="group-hover:scale-110 transition-transform" />
              )}
              <div className="text-left">
                <p className="text-xl font-heading">{isUploading ? 'Uploading...' : 'Upload PDF'}</p>
                <p className="text-sm font-normal opacity-80">Add a new Interactive Book to your library</p>
              </div>
            </button>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-heading">Library Overview</h3>
                <button className="text-sm text-brand-blue font-semibold hover:underline">View All</button>
              </div>
              <div className="glass-panel rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-500 font-medium font-heading">
                    <tr>
                      <th className="px-6 py-4">Book Title</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Added Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <BookTableRow title="The Quantum Paradox" status="Processed" date="Oct 24, 2023" />
                    <BookTableRow title="Shadow of Eternity" status="Processing" date="Nov 12, 2023" />
                    <BookTableRow title="The Architect's Secret" status="Processed" date="Aug 05, 2023" />
                    <BookTableRow title="Echoes of the Deep" status="Processed" date="Jul 20, 2023" />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-96 glass-panel border-l border-white/10 flex flex-col overflow-hidden hidden xl:flex">
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-lg sticky top-0 z-10">
            <h3 className="text-lg font-bold font-heading">Reader Interactions</h3>
            <span className="px-2 py-0.5 bg-brand-blue/20 text-brand-blue text-[10px] font-bold rounded uppercase">Live Feed</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            <InteractionItem 
              user="User #4829" 
              time="2m ago" 
              question="Why did the protagonist decide to enter the portal in Chapter 3?" 
              answer="Based on the text, it was a choice driven by desperation and the hope of saving his family..."
            />
            <hr className="border-white/5"/>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="size-8 rounded-full bg-teal-900/30 border border-teal-500/20 flex-shrink-0 flex items-center justify-center text-teal-400">
                  <User size={14} />
                </div>
                <div className="glass-panel p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-brand-blue font-heading">User #2103</p>
                    <span className="text-[10px] text-slate-400">15m ago</span>
                  </div>
                  <p className="text-slate-300 italic">"Can you summarize the political structure of the Empire?"</p>
                </div>
              </div>
              <div className="pt-2 pl-11">
                <button className="w-full py-2 flex items-center justify-center gap-2 border border-dashed border-brand-blue/30 text-brand-blue rounded-xl text-xs font-semibold hover:bg-brand-blue/10 transition-colors backdrop-blur-sm">
                  Reply as Author
                </button>
              </div>
            </div>
            <button className="w-full py-3 text-xs font-bold text-slate-500 hover:text-brand-blue transition-colors border border-dashed border-white/10 rounded-lg font-heading backdrop-blur-sm">
              View Full Interaction History
            </button>
          </div>
          <div className="p-4 bg-black/40 backdrop-blur-lg border-t border-white/10">
            <p className="text-[10px] text-center text-slate-500 font-medium uppercase tracking-widest">End of Recent Interactions</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function DashboardNavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${active ? 'bg-brand-blue/20 text-brand-blue font-semibold backdrop-blur-sm' : 'text-slate-400 hover:bg-white/5'}`} href="#">
      {icon}
      <span className="text-sm">{label}</span>
    </a>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend?: string }) {
  return (
    <div className="glass-panel p-5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <span className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">{icon}</span>
        {trend && <span className="text-[10px] font-bold text-green-500">{trend}</span>}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="text-2xl font-black mt-1 font-heading">{value}</h3>
    </div>
  );
}

function BookTableRow({ title, status, date }: { title: string, status: string, date: string }) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-6 py-4 font-semibold font-heading">{title}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status === 'Processed' ? 'bg-green-900/30 text-green-400 border-green-500/20' : 'bg-brand-blue/20 text-brand-blue border-brand-blue/20'}`}>
          <span className={`size-1.5 rounded-full ${status === 'Processed' ? 'bg-green-400' : 'bg-brand-blue animate-pulse'}`}></span>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-slate-500">{date}</td>
      <td className="px-6 py-4 text-right">
        <button className="p-1 hover:bg-white/10 rounded text-slate-400"><MoreVertical size={16} /></button>
      </td>
    </tr>
  );
}

function InteractionItem({ user, time, question, answer }: { user: string, time: string, question: string, answer: string }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-start">
        <div className="size-8 rounded-full bg-indigo-900/30 border border-indigo-500/20 flex-shrink-0 flex items-center justify-center text-indigo-400">
          <User size={14} />
        </div>
        <div className="glass-panel p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-brand-blue font-heading">{user}</p>
            <span className="text-[10px] text-slate-400">{time}</span>
          </div>
          <p className="text-slate-300 italic">"{question}"</p>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <div className="bg-brand-blue/10 backdrop-blur-md p-3 rounded-tl-xl rounded-bl-xl rounded-br-xl border border-brand-blue/20 text-xs text-right shadow-sm max-w-[85%]">
          <p className="font-bold text-brand-blue mb-1 font-heading">Companion AI</p>
          <p className="text-slate-300">{answer}</p>
        </div>
        <div className="size-8 rounded-full bg-brand-blue/20 flex-shrink-0 flex items-center justify-center text-brand-blue shadow-lg shadow-brand-blue/10">
          <Sparkles size={14} />
        </div>
      </div>
    </div>
  );
}
