import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { searchExercises } from '../services/exerciseService';
import { X, Search, Loader2 } from 'lucide-react';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExercise: Exercise;
  onSelect: (newExercise: Exercise) => void;
  // apiNinjasKey removed as it is no longer needed
}

export const SwapModal: React.FC<SwapModalProps> = ({ isOpen, onClose, currentExercise, onSelect }) => {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Exercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && currentExercise) {
      loadAlternatives();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentExercise]);

  const loadAlternatives = async () => {
    setLoading(true);
    try {
      // Fetch exercises with same muscle group using the new service
      const results = await searchExercises({ 
        muscle: currentExercise.muscle,
        name: searchTerm 
      });
      
      // Filter out the current exercise
      const filtered = results.filter(ex => ex.name !== currentExercise.name);
      setCandidates(filtered);
    } catch (error) {
      console.error("Error loading alternatives", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAlternatives();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Substituir Exercício</h2>
            <p className="text-sm text-slate-400">
              Buscando alternativas para: <span className="text-primary">{currentExercise.name}</span> ({currentExercise.muscle})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-900/50">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Buscar exercício específico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <button type="submit" className="absolute right-2 top-1.5 bg-primary/20 text-primary text-xs px-3 py-1 rounded hover:bg-primary/30">
              Buscar
            </button>
          </form>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              Nenhum exercício semelhante encontrado.
            </div>
          ) : (
            candidates.map((ex, idx) => (
              <div 
                key={idx}
                onClick={() => onSelect({
                  ...ex,
                  sets: currentExercise.sets,
                  reps: currentExercise.reps
                })}
                className="p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-primary cursor-pointer transition-all hover:bg-slate-750 group"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">{ex.name}</h4>
                    <div className="flex gap-2 mt-1 text-xs text-slate-400">
                      <span className="bg-slate-700 px-2 py-0.5 rounded capitalize">{ex.difficulty || 'Geral'}</span>
                      <span className="bg-slate-700 px-2 py-0.5 rounded capitalize">{ex.equipment || 'Livre'}</span>
                    </div>
                  </div>
                  {/* Show thumbnail if available */}
                  {ex.gifUrl && (
                    <div className="w-12 h-12 ml-4 rounded overflow-hidden bg-slate-900">
                      <img src={ex.gifUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-500 italic truncate">
                  {ex.instructions.substring(0, 80)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
