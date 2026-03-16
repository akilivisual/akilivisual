import React from 'react';
import { ChevronDown, Search, MoreVertical, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Book, Chapter } from '../../types';
import { supabaseService } from '../../services/supabaseService';

interface ReadViewProps {
  book: Book;
  onAiClick: () => void;
}

export function ReadView({ book, onAiClick }: ReadViewProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = React.useState(0);
  const [chapterContent, setChapterContent] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  const currentChapter = book.chapters[currentChapterIndex];

  React.useEffect(() => {
    if (currentChapter?.id) {
      loadContent(currentChapter.id);
    } else {
      setChapterContent(book.content || 'No content available.');
    }
  }, [book.id, currentChapterIndex]);

  const loadContent = async (id: string) => {
    setIsLoading(true);
    try {
      const content = await supabaseService.getBookChapter(id);
      setChapterContent(content || 'Chapter content not found.');
    } catch (err) {
      console.error('Failed to load chapter content:', err);
      setChapterContent('Error loading content.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 pt-12 pb-6 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm shrink-0">
          <div className="flex justify-between items-center max-w-4xl mx-auto w-full">
            <button className="p-2 -ml-2 text-gray-400 hover:text-white md:hidden"><ChevronDown className="rotate-90" /></button>
            <div className="text-center md:text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                {currentChapter ? `Chapter ${currentChapterIndex + 1}` : 'Reading'}
              </span>
              <h1 className="text-sm font-semibold text-gray-200">{currentChapter?.title || book.title}</h1>
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
          <article className="max-w-prose mx-auto glass-panel rounded-3xl p-8 md:p-12 shadow-2xl mt-4 min-h-[60vh]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="size-10 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
                <p className="text-sm text-slate-500">Retrieving Meaning Layer...</p>
              </div>
            ) : (
              <div className="font-serif text-lg md:text-xl text-gray-300 space-y-6 leading-relaxed whitespace-pre-wrap">
                {chapterContent.split('\n\n').map((para, idx) => (
                  <p key={idx} className={idx === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-brand-blue" : ""}>
                    {para}
                  </p>
                ))}
              </div>
            )}
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
