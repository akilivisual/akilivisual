import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export function DatabaseView() {
  const [activeTab, setActiveTab] = useState<'users' | 'books' | 'interactions'>('users');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { getSupabase } = await import('../../lib/supabase');
      const supabase = getSupabase();
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
    const { getSupabase } = await import('../../lib/supabase');
    const supabase = getSupabase();
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
        // Try snake_case if camelCase fails
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
    <div className="flex flex-col h-full p-8 space-y-6 overflow-y-auto no-scrollbar bg-brand-dark">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-white">Database Manager</h1>
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
            <table className="w-full text-left text-sm text-white">
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
