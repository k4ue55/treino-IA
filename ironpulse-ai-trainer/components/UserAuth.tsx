import React, { useState, useEffect } from 'react';
import { User, Plus, ArrowRight, Dumbbell } from 'lucide-react';

interface UserAuthProps {
  onLogin: (username: string) => void;
}

export const UserAuth: React.FC<UserAuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [existingUsers, setExistingUsers] = useState<string[]>([]);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('ironpulse_users') || '[]');
    setExistingUsers(users);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    const trimmedName = username.trim();
    
    // Add to user list if not exists
    if (!existingUsers.includes(trimmedName)) {
      const newUsers = [...existingUsers, trimmedName];
      localStorage.setItem('ironpulse_users', JSON.stringify(newUsers));
      setExistingUsers(newUsers);
    }
    
    onLogin(trimmedName);
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="bg-primary p-4 rounded-2xl inline-block mb-4 shadow-[0_0_20px_rgba(0,229,255,0.3)]">
          <Dumbbell className="text-dark w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">IronPulse <span className="text-primary">AI</span></h1>
        <p className="text-slate-400">Seu treinador pessoal inteligente</p>
      </div>

      <div className="w-full max-w-md bg-surface border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <User className="text-primary" /> Quem está treinando hoje?
        </h2>

        {/* Existing Users List */}
        {existingUsers.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Perfis Encontrados</p>
            <div className="grid grid-cols-1 gap-2">
              {existingUsers.map(user => (
                <button
                  key={user}
                  onClick={() => onLogin(user)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-primary transition-all text-left group"
                >
                  <span className="font-medium text-white">{user}</span>
                  <ArrowRight size={16} className="text-slate-500 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New User Form */}
        <form onSubmit={handleSubmit} className="relative">
          <p className="text-xs text-slate-500 uppercase font-bold mb-2">
            {existingUsers.length > 0 ? 'Ou criar novo perfil' : 'Criar Perfil'}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu nome..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <button 
              type="submit"
              disabled={!username.trim()}
              className="bg-primary text-dark font-bold p-3 rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
