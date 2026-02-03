import React, { useState, useEffect, useRef } from 'react';
import { Exercise, UserStats, SavedWorkout } from './types';
import { generateWorkoutPlan } from './services/geminiService';
import { setApiUrl, getApiUrl, getAllExercises } from './services/exerciseService';
import { ExerciseCard } from './components/ExerciseCard';
import { SwapModal } from './components/SwapModal';
import { Stats } from './components/Stats';
import { UserAuth } from './components/UserAuth';
import { Dumbbell, Play, Maximize2, Minimize2, Settings, Loader2, StopCircle, Save, HeartPulse, Bookmark, Trash2, FolderOpen, ArrowRight, LogOut, User } from 'lucide-react';

const App: React.FC = () => {
  // --- User State ---
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('ironpulse_current_user'));

  // --- App State ---
  const [customApiUrl, setCustomApiUrl] = useState<string>(() => localStorage.getItem('custom_api_url') || getApiUrl());
  const [showSettings, setShowSettings] = useState(false);

  // Workout Generation State
  const [goal, setGoal] = useState('Hipertrofia (Ganho de Massa)');
  const [level, setLevel] = useState('Intermediário');
  const [duration, setDuration] = useState('60 minutos');
  const [targetMuscle, setTargetMuscle] = useState('Corpo Todo (Full Body)');
  const [includeCardio, setIncludeCardio] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Active Workout State
  const [currentWorkout, setCurrentWorkout] = useState<{ name: string; exercises: Exercise[] } | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Saved Workouts State
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [showSavedList, setShowSavedList] = useState(false);

  // Swap Modal State
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [exerciseToSwap, setExerciseToSwap] = useState<Exercise | null>(null);

  // Stats State
  const [stats, setStats] = useState<UserStats>({
    totalWorkouts: 0,
    currentStreak: 0,
    lastWorkoutDate: null,
    totalMinutes: 0
  });
  const [history, setHistory] = useState<{ date: string; duration: number }[]>([]);

  const timerRef = useRef<number | null>(null);

  // --- Effects ---

  // Load User Data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const prefix = `ironpulse_${currentUser}_`;
      
      const savedStats = localStorage.getItem(`${prefix}stats`);
      const savedHistory = localStorage.getItem(`${prefix}history`);
      const savedWorkoutsData = localStorage.getItem(`${prefix}saved_workouts`);
      
      setStats(savedStats ? JSON.parse(savedStats) : {
        totalWorkouts: 0,
        currentStreak: 0,
        lastWorkoutDate: null,
        totalMinutes: 0
      });
      setHistory(savedHistory ? JSON.parse(savedHistory) : []);
      setSavedWorkouts(savedWorkoutsData ? JSON.parse(savedWorkoutsData) : []);
    }
  }, [currentUser]);

  useEffect(() => {
    // Initialize service with saved URL
    const savedUrl = localStorage.getItem('custom_api_url');
    if (savedUrl) {
      setApiUrl(savedUrl);
    }
  }, []);

  useEffect(() => {
    if (isWorkoutActive && workoutStartTime) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWorkoutActive, workoutStartTime]);

  // --- Handlers ---

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    localStorage.setItem('ironpulse_current_user', username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ironpulse_current_user');
    setCurrentWorkout(null);
    setIsWorkoutActive(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('custom_api_url', customApiUrl);
    setApiUrl(customApiUrl);
    setShowSettings(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const plan = await generateWorkoutPlan(goal, level, duration, targetMuscle, includeCardio);
      
      try {
        const apiExercises = await getAllExercises();
        if (apiExercises.length > 0) {
          plan.exercises = plan.exercises.map(genEx => {
            const match = apiExercises.find(apiEx => {
              const apiName = apiEx.name.toLowerCase();
              const genName = genEx.name.toLowerCase();
              return (apiName === genName || apiName.includes(genName) || genName.includes(apiName)) && 
                     (apiEx.muscle.toLowerCase() === genEx.muscle.toLowerCase());
            });
            
            if (match && match.gifUrl) {
              return { 
                ...genEx, 
                gifUrl: match.gifUrl,
                id: match.id || genEx.id 
              };
            }
            return genEx;
          });
        }
      } catch (enrichError) {
        console.warn("Failed to enrich exercises with images:", enrichError);
      }

      setCurrentWorkout(plan);
      setCompletedExercises(new Set());
      setElapsedTime(0);
      setIsWorkoutActive(false);
      setShowSavedList(false);
    } catch (error: any) {
      console.error("Generation Error:", error);
      const msg = error?.message || "Erro desconhecido";
      alert(`Erro ao gerar treino: ${msg}\n\nVerifique se a API Key está configurada corretamente no ambiente.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWorkout = () => {
    if (!currentWorkout || !currentUser) return;
    
    const newSavedWorkout: SavedWorkout = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2),
      name: currentWorkout.name,
      exercises: currentWorkout.exercises,
      createdAt: new Date().toISOString(),
      targetMuscle: targetMuscle,
      goal: goal
    };

    const updatedSaved = [newSavedWorkout, ...savedWorkouts];
    setSavedWorkouts(updatedSaved);
    localStorage.setItem(`ironpulse_${currentUser}_saved_workouts`, JSON.stringify(updatedSaved));
    alert("Treino salvo com sucesso!");
  };

  const handleLoadWorkout = (saved: SavedWorkout) => {
    setCurrentWorkout({
      name: saved.name,
      exercises: saved.exercises
    });
    setCompletedExercises(new Set());
    setElapsedTime(0);
    setIsWorkoutActive(false);
    setShowSavedList(false);
  };

  const handleDeleteWorkout = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!currentUser) return;

    if (window.confirm("Tem certeza que deseja excluir este treino salvo?")) {
      const updatedSaved = savedWorkouts.filter(w => w.id !== id);
      setSavedWorkouts(updatedSaved);
      localStorage.setItem(`ironpulse_${currentUser}_saved_workouts`, JSON.stringify(updatedSaved));
    }
  };

  const handleStartWorkout = () => {
    setIsWorkoutActive(true);
    setWorkoutStartTime(Date.now());
    if (isFullscreen) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
  };

  const handleFinishWorkout = () => {
    if (!currentWorkout || !currentUser) return;

    const durationSeconds = elapsedTime;
    const today = new Date().toISOString();
    
    // Update Stats
    const newHistory = [...history, { date: today, duration: durationSeconds }];
    
    // Calculate Streak
    let newStreak = stats.currentStreak;
    if (stats.lastWorkoutDate) {
      const lastDate = new Date(stats.lastWorkoutDate);
      const currDate = new Date();
      const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) newStreak += 1;
      else if (diffDays > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }

    const newStats: UserStats = {
      totalWorkouts: stats.totalWorkouts + 1,
      currentStreak: newStreak,
      lastWorkoutDate: today,
      totalMinutes: stats.totalMinutes + (durationSeconds / 60)
    };

    setStats(newStats);
    setHistory(newHistory);
    
    // Save to user specific keys
    const prefix = `ironpulse_${currentUser}_`;
    localStorage.setItem(`${prefix}stats`, JSON.stringify(newStats));
    localStorage.setItem(`${prefix}history`, JSON.stringify(newHistory));

    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
    setCurrentWorkout(null);
    if (document.fullscreenElement) document.exitFullscreen();
    setIsFullscreen(false);
  };

  const toggleExerciseComplete = (exName: string) => {
    const newSet = new Set(completedExercises);
    if (newSet.has(exName)) {
      newSet.delete(exName);
    } else {
      newSet.add(exName);
    }
    setCompletedExercises(newSet);
  };

  const openSwapModal = (exercise: Exercise) => {
    setExerciseToSwap(exercise);
    setSwapModalOpen(true);
  };

  const handleSwapExercise = (newExercise: Exercise) => {
    if (!currentWorkout || !exerciseToSwap) return;

    const updatedExercises = currentWorkout.exercises.map(ex => 
      ex.name === exerciseToSwap.name ? newExercise : ex
    );

    setCurrentWorkout({ ...currentWorkout, exercises: updatedExercises });
    setSwapModalOpen(false);
    setExerciseToSwap(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Render Auth Screen if no user ---
  if (!currentUser) {
    return <UserAuth onLogin={handleLogin} />;
  }

  // --- Render Main App ---
  return (
    <div className={`min-h-screen bg-dark text-white font-sans ${isFullscreen ? 'p-0' : 'p-4 md:p-8'}`}>
      
      {/* Header / Nav */}
      {!isFullscreen && (
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <Dumbbell className="text-dark" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">IronPulse <span className="text-primary">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
              <User size={16} className="text-primary" />
              <span className="font-medium text-sm">{currentUser}</span>
            </div>
            
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              title="Configurações"
            >
              <Settings size={20} />
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-slate-400 hover:text-red-500"
              title="Sair / Trocar Usuário"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Configurações</h2>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">URL da API de Exercícios</label>
                <input 
                  type="text" 
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                  placeholder="https://..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Padrão: Repositório GitHub (api-academia). Se rodar localmente, use <code>http://localhost:3333/exercises</code>
                </p>
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full bg-primary text-dark font-bold py-2 rounded hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto ${isFullscreen ? 'h-screen flex flex-col' : ''}`}>
        
        {/* Dashboard Stats (Only show if not in active workout mode) */}
        {!currentWorkout && <Stats stats={stats} history={history} />}

        {/* Generator Form (Only show if no workout generated) */}
        {!currentWorkout && (
          <div className="space-y-8">
            <div className="bg-surface border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-primary rounded-full"></span>
                Gerar Novo Treino
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Objetivo */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Objetivo Principal</label>
                  <select 
                    value={goal} 
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none"
                  >
                    <option>Hipertrofia (Ganho de Massa)</option>
                    <option>Emagrecimento (Perda de Peso)</option>
                    <option>Força Pura (Powerlifting)</option>
                    <option>Resistência Muscular</option>
                    <option>Saúde e Bem-estar</option>
                  </select>
                </div>

                {/* Foco Muscular */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Foco Muscular</label>
                  <select 
                    value={targetMuscle} 
                    onChange={(e) => setTargetMuscle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none"
                  >
                    <option>Corpo Todo (Full Body)</option>
                    <option>Peito e Tríceps (Push)</option>
                    <option>Costas e Bíceps (Pull)</option>
                    <option>Pernas (Legs)</option>
                    <option>Ombros e Abdômen</option>
                    <option>Apenas Peito</option>
                    <option>Apenas Costas</option>
                    <option>Apenas Pernas</option>
                    <option>Apenas Braços</option>
                  </select>
                </div>

                {/* Nível */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Nível de Experiência</label>
                  <select 
                    value={level} 
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none"
                  >
                    <option>Iniciante</option>
                    <option>Intermediário</option>
                    <option>Avançado</option>
                  </select>
                </div>

                {/* Duração */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Duração Disponível</label>
                  <select 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none"
                  >
                    <option>30 minutos</option>
                    <option>45 minutos</option>
                    <option>60 minutos</option>
                    <option>90 minutos</option>
                  </select>
                </div>

                {/* Cardio Toggle */}
                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${includeCardio ? 'bg-primary border-primary' : 'border-slate-600 bg-slate-900'}`}>
                      {includeCardio && <HeartPulse size={16} className="text-dark" />}
                    </div>
                    <input 
                      type="checkbox" 
                      checked={includeCardio}
                      onChange={(e) => setIncludeCardio(e.target.checked)}
                      className="hidden"
                    />
                    <span className={`font-medium transition-colors ${includeCardio ? 'text-primary' : 'text-slate-400 group-hover:text-slate-300'}`}>
                      Adicionar Cardio ao Treino
                    </span>
                  </label>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-dark font-bold text-lg py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" /> Criando seu plano...
                  </>
                ) : (
                  <>
                    Gerar Treino com IA <Play fill="currentColor" size={20} />
                  </>
                )}
              </button>
            </div>

            {/* Saved Workouts Section */}
            {savedWorkouts.length > 0 && (
              <div className="bg-surface border border-slate-700 rounded-2xl p-6 shadow-xl">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setShowSavedList(!showSavedList)}
                >
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FolderOpen className="text-primary" size={24} />
                    Meus Treinos Salvos ({savedWorkouts.length})
                  </h2>
                  <button className="text-slate-400 hover:text-white">
                    {showSavedList ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>

                {showSavedList && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in slide-in-from-top-2">
                    {savedWorkouts.map((workout) => (
                      <div key={workout.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-primary transition-all group relative">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-white text-lg">{workout.name}</h3>
                            <p className="text-xs text-slate-400">
                              {new Date(workout.createdAt).toLocaleDateString('pt-BR')} • {workout.targetMuscle}
                            </p>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteWorkout(workout.id, e)}
                            className="text-slate-500 hover:text-red-500 p-2 rounded-full hover:bg-slate-700 transition-colors z-10"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="text-sm text-slate-300 mb-4">
                          {workout.exercises.length} exercícios • {workout.goal}
                        </div>
                        <button 
                          onClick={() => handleLoadWorkout(workout)}
                          className="w-full bg-slate-700 hover:bg-primary hover:text-dark text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          Carregar Treino <ArrowRight size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active Workout View */}
        {currentWorkout && (
          <div className={`flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
            
            {/* Workout Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-surface/50 p-4 rounded-xl border border-slate-700 backdrop-blur-md sticky top-0 z-40">
              <div>
                <h2 className="text-2xl font-bold text-white">{currentWorkout.name}</h2>
                <p className="text-slate-400 text-sm">
                  {currentWorkout.exercises.length} exercícios • {completedExercises.size} concluídos
                </p>
              </div>

              <div className="flex items-center gap-4">
                {isWorkoutActive && (
                  <div className="text-3xl font-mono font-bold text-primary tabular-nums">
                    {formatTime(elapsedTime)}
                  </div>
                )}

                <button 
                  onClick={toggleFullscreen}
                  className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300"
                  title="Tela Cheia"
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>

                {!isWorkoutActive ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveWorkout}
                      className="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-600 flex items-center gap-2"
                      title="Salvar Treino"
                    >
                      <Bookmark size={20} /> <span className="hidden md:inline">Salvar</span>
                    </button>
                    <button 
                      onClick={handleStartWorkout}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 flex items-center gap-2"
                    >
                      <Play size={20} fill="currentColor" /> Iniciar
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleFinishWorkout}
                    className="bg-red-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-600 flex items-center gap-2"
                  >
                    <StopCircle size={20} /> Finalizar
                  </button>
                )}
              </div>
            </div>

            {/* Exercise List */}
            <div className={`grid grid-cols-1 gap-4 ${isFullscreen ? 'overflow-y-auto flex-1 pb-20 px-4' : ''}`}>
              {currentWorkout.exercises.map((ex, idx) => (
                <ExerciseCard 
                  key={`${ex.name}-${idx}`} 
                  exercise={ex} 
                  onSwap={() => openSwapModal(ex)}
                  isCompleted={completedExercises.has(ex.name)}
                  onToggleComplete={() => toggleExerciseComplete(ex.name)}
                  showActions={!isWorkoutActive} // Can only swap before starting or if paused (design choice: disable swap during active timer for focus)
                />
              ))}
            </div>
            
            {/* Cancel Button (if not started) */}
            {!isWorkoutActive && (
              <div className="mt-8 text-center">
                <button 
                  onClick={() => setCurrentWorkout(null)}
                  className="text-slate-500 hover:text-red-400 text-sm underline"
                >
                  Voltar / Descartar
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Swap Modal */}
      {exerciseToSwap && (
        <SwapModal 
          isOpen={swapModalOpen}
          onClose={() => setSwapModalOpen(false)}
          currentExercise={exerciseToSwap}
          onSelect={handleSwapExercise}
        />
      )}

    </div>
  );
};

export default App;
