import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import { Book } from '../../types';

interface LibraryViewProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export function LibraryView({ books, onSelectBook }: LibraryViewProps) {
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
