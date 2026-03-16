import React from 'react';
import { MoreVertical, Sparkles, User, Send, Save } from 'lucide-react';
import { Book, Message } from '../../types';
import { supabaseService } from '../../services/supabaseService';

interface ConverseViewProps {
  book: Book;
  history: Message[];
  inputText: string;
  setInputText: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  saveSession: boolean;
  setSaveSession: (v: boolean) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ConverseView({ 
  book, 
  history, 
  inputText, 
  setInputText, 
  onSend, 
  isLoading, 
  saveSession, 
  setSaveSession, 
  chatEndRef 
}: ConverseViewProps) {
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
            {history.map((msg: Message, idx: number) => (
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
                              question: history[idx - 1]?.text || 'Context query',
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
