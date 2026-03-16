import React from 'react';
import { ChevronDown, MoreVertical, SkipBack, Play, Pause, SkipForward, Sparkles } from 'lucide-react';
import { Book } from '../../types';

interface ListenViewProps {
  book: Book;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  onAiClick: () => void;
}

export function ListenView({ book, isPlaying, setIsPlaying, onAiClick }: ListenViewProps) {
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
