import React, { useState } from 'react';
import { Exercise } from '../types';
import { Info, RefreshCw, CheckCircle } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  onSwap: () => void;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
  showActions?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  exercise, 
  onSwap, 
  isCompleted = false, 
  onToggleComplete,
  showActions = true
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Use API provided image if available, otherwise generate a consistent placeholder
  const imageSeed = exercise.name.replace(/\s/g, '');
  const placeholderUrl = `https://picsum.photos/seed/${imageSeed}/400/300`;
  const imageUrl = exercise.gifUrl || placeholderUrl;

  return (
    <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${isCompleted ? 'border-green-500/50 bg-green-900/10' : 'border-slate-700 bg-slate-800/50'}`}>
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="w-full md:w-1/3 h-48 md:h-auto relative group bg-black">
          <img 
            src={imageUrl} 
            alt={exercise.name} 
            className="w-full h-full object-contain md:object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // Fallback if gifUrl is broken
              (e.target as HTMLImageElement).src = placeholderUrl;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary rounded-full border border-primary/30 backdrop-blur-sm">
              {exercise.muscle}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-lg font-bold ${isCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                {exercise.name}
              </h3>
              {showActions && (
                <button 
                  onClick={onSwap}
                  className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-700 rounded-full transition-colors"
                  title="Substituir exercício"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
            
            <div className="flex gap-4 text-sm text-slate-300 mb-3">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase">Séries</span>
                <span className="font-mono font-bold">{exercise.sets || 3}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase">Reps</span>
                <span className="font-mono font-bold">{exercise.reps || '10-12'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase">Tipo</span>
                <span className="capitalize">{exercise.type || 'Força'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Info size={14} />
              {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
            </button>

            {onToggleComplete && (
              <button 
                onClick={onToggleComplete}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isCompleted 
                    ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <CheckCircle size={16} />
                {isCompleted ? 'Feito' : 'Concluir'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="p-4 bg-slate-900/50 border-t border-slate-700 text-sm text-slate-300 animate-in slide-in-from-top-2">
          <p className="mb-2"><strong className="text-white">Equipamento:</strong> {exercise.equipment || 'N/A'}</p>
          <p><strong className="text-white">Instruções:</strong> {exercise.instructions}</p>
        </div>
      )}
    </div>
  );
};
