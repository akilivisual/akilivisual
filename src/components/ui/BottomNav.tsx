import React from 'react';
import { Book as BookIcon, Headphones, MessageSquare, Library, LayoutDashboard } from 'lucide-react';
import { ViewMode } from '../../types';

interface BottomNavProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
}

export function BottomNav({ view, setView }: BottomNavProps) {
  return (
    <nav className="md:hidden bg-black/80 backdrop-blur-2xl border-t border-white/10 px-4 pb-8 pt-3 shrink-0 z-30">
      <ul className="flex justify-between items-center max-w-lg mx-auto">
        <NavItem icon={<BookIcon size={24} />} label="Read" active={view === 'READ'} onClick={() => setView('READ')} />
        <NavItem icon={<Headphones size={24} />} label="Listen" active={view === 'LISTEN'} onClick={() => setView('LISTEN')} />
        <NavItem icon={<MessageSquare size={24} />} label="Converse" active={view === 'CONVERSE'} onClick={() => setView('CONVERSE')} />
        <NavItem icon={<Library size={24} />} label="Library" active={view === 'LIBRARY'} onClick={() => setView('LIBRARY')} />
        <NavItem icon={<LayoutDashboard size={24} />} label="Dash" active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
      </ul>
    </nav>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
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
