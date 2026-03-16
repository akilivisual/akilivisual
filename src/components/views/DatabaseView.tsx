import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export function DatabaseView() {
  const [tableName, setTableName] = useState('users');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData(tableName);
  }, []);

  const fetchData = async (targetTable: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { getSupabase } = await import('../../lib/supabase');
      const supabase = getSupabase();
      const { data: result, error } = await supabase.from(targetTable).select('*').limit(50);
      if (error) throw error;
      setData(result || []);
      setTableName(targetTable);
    } catch (err: any) {
      console.error('Fetch failed:', err);
      setError(err.message || 'Failed to fetch table');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = async () => {
    const { getSupabase } = await import('../../lib/supabase');
    const supabase = getSupabase();
    let payload = {};
    
    if (tableName === 'users') {
      payload = { name: 'New User', email: `user_${Date.now()}@example.com`, role: 'reader' };
    } else if (tableName === 'books') {
      payload = { title: 'New Manual Book', author_id: null, pdf_path: 'manual/path' };
    } else {
      // Generic payload attempt
      payload = { placeholder: 'test' };
    }

    try {
      const { error } = await supabase.from(tableName).insert(payload);
      if (error) throw error;
      fetchData(tableName);
    } catch (err: any) {
      console.error('Insert failed:', err);
      alert(`Failed to add row: ${err.message}`);
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

      <div className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Table name (e.g. users, books, profiles)" 
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:border-brand-blue"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData(tableName)}
          />
        </div>
        <button 
          onClick={() => fetchData(tableName)}
          className="px-6 py-2 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition-all"
        >
          Check Table
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm font-medium">Error: {error}</p>
        </div>
      )}

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
