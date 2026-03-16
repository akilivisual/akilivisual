import React from 'react';
import { Book as BookIcon, Library, BookOpen, Headphones, MessageSquare, LayoutDashboard, Database, User } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewMode, UserProfile } from '../../types';

interface SidebarProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  user: UserProfile | null;
}

export function Sidebar({ view, setView, user }: SidebarProps) {
  return (
    <nav className="hidden md:flex flex-col w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 p-6 shrink-0 z-30">
      <div className="flex items-center gap-3 mb-10">
        <div className="size-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/30">
          <BookIcon size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none font-heading text-white">LBC LITE</h1>
          <p className="text-[10px] uppercase tracking-widest text-brand-blue font-bold mt-1">Living Companion</p>
        </div>
      </div>

      <div className="space-y-2 flex-1">
        <SidebarItem icon={<Library size={20} />} label="Library" active={view === 'LIBRARY'} onClick={() => setView('LIBRARY')} />
        <SidebarItem icon={<BookOpen size={20} />} label="Read" active={view === 'READ'} onClick={() => setView('READ')} />
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
          <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            {user ? <img src={`https://ui-avatars.com/api/?name=${user.name}&background=006699&color=fff`} className="rounded-full" /> : <User size={20} className="text-white/40" />}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">{user ? user.name : 'Sign In'}</p>
            <p className="text-[10px] text-white/40 truncate">{user ? user.role : 'Guest Reader'}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
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
