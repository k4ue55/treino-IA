import React from 'react';
import { UserStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Flame, Calendar, Clock, Trophy } from 'lucide-react';

interface StatsProps {
  stats: UserStats;
  history: { date: string; duration: number }[];
}

export const Stats: React.FC<StatsProps> = ({ stats, history }) => {
  // Prepare data for chart (Last 7 workouts)
  const chartData = history.slice(-7).map((h, i) => ({
    name: new Date(h.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    minutos: Math.round(h.duration / 60),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Stat Cards */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-orange-500/20 rounded-lg text-orange-500">
          <Flame size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs uppercase font-bold">Sequência</p>
          <p className="text-2xl font-bold text-white">{stats.currentStreak} <span className="text-sm font-normal text-slate-500">dias</span></p>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
          <Calendar size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs uppercase font-bold">Treinos Totais</p>
          <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-purple-500/20 rounded-lg text-purple-500">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs uppercase font-bold">Tempo Total</p>
          <p className="text-2xl font-bold text-white">{(stats.totalMinutes / 60).toFixed(1)} <span className="text-sm font-normal text-slate-500">horas</span></p>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
        <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
          <Trophy size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs uppercase font-bold">Último Treino</p>
          <p className="text-lg font-bold text-white">
            {stats.lastWorkoutDate 
              ? new Date(stats.lastWorkoutDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) 
              : '--'}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 mt-4">
        <h3 className="text-lg font-bold text-white mb-4">Duração dos Últimos Treinos</h3>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} unit="m" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="minutos" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#00E5FF" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              Sem dados de treino ainda. Comece hoje!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
