import React, { useState } from 'react';
import { Book as BookIcon } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { UserProfile } from '../../types';

interface AuthViewProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await supabaseService.signInWithGoogle();
      // OAuth redirect will happen
    } catch (err: any) {
      console.error('Sign in failed:', err);
      alert(`Sign in failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-brand-dark">
      <div className="max-w-md w-full glass-panel p-10 rounded-3xl text-center space-y-8 shadow-2xl border border-white/10">
        <div className="size-20 bg-brand-blue rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-blue/30">
          <BookIcon size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-heading">Welcome to LBC</h1>
          <p className="text-slate-400 mt-2">Sign in to access your library and interact with your favorite books.</p>
        </div>
        <button 
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
          ) : (
            <img src="https://www.google.com/favicon.ico" className="size-5" />
          )}
          Continue with Google
        </button>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Secure authentication via Supabase</p>
      </div>
    </div>
  );
}
