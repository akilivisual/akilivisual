import React, { useState, useRef } from 'react';
import { Search, Bell, User, LayoutDashboard, CloudUpload, MoreVertical } from 'lucide-react';
import { AuthorProfile, Book } from '../../types';
import { supabaseService } from '../../services/supabaseService';

interface DashboardViewProps {
  author: AuthorProfile | null;
  onUploadSuccess: (newBook: Book) => void;
}

export function DashboardView({ author, onUploadSuccess }: DashboardViewProps) {
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
    <div className="flex h-full overflow-hidden font-body bg-brand-dark">
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 bg-transparent backdrop-blur-xl border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold font-heading tracking-tight text-white">Author Dashboard</h2>
              <p className="text-sm text-slate-500">Welcome back, your interactive library is live.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue/50 w-64 backdrop-blur-sm text-white" placeholder="Search books..." type="text"/>
              </div>
              <button className="p-2 text-slate-500 hover:bg-white/10 rounded-full relative transition-colors backdrop-blur-sm">
                <Bell size={20} />
                <span className="absolute top-2 right-2 size-2 bg-brand-blue rounded-full border-2 border-black"></span>
              </button>
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
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend?: string }) {
  return (
    <div className="glass-panel p-5 rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <span className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">{icon}</span>
        {trend && <span className="text-[10px] font-bold text-green-500">{trend}</span>}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="text-2xl font-black mt-1 font-heading text-white">{value}</h3>
    </div>
  );
}
