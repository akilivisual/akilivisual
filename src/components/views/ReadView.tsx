import React from 'react';
import { ChevronDown, Search, MoreVertical, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Book } from '../../types';

interface ReadViewProps {
  book: Book;
  onAiClick: () => void;
}

export function ReadView({ book, onAiClick }: ReadViewProps) {
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
