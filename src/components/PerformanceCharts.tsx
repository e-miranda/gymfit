import React, { useState } from 'react';
import { Dumbbell, TrendingUp, Calendar, BarChart2 } from 'lucide-react';

interface PerformanceChartsProps {
  oneRmHistory: Record<string, { date: string; weight: number; reps: number; estimated1RM: number }[]>;
  volumeByMuscle: Record<string, number>;
  heatmapData: Record<string, number>;
  userGender?: string;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  oneRmHistory,
  volumeByMuscle,
  heatmapData,
  userGender
}) => {
  const exerciseKeys = Object.keys(oneRmHistory);
  // Default to Hip Thrust for women if available, or Bench/Squat
  const initialKey = exerciseKeys.find(k => 
    userGender === 'mujer' ? k.toLowerCase().includes('hip thrust') : k.toLowerCase().includes('press de banca')
  ) || exerciseKeys[0] || '';

  const [selectedExercise, setSelectedExercise] = useState<string>(initialKey);

  const selectedData = selectedExercise ? (oneRmHistory[selectedExercise] || []) : [];
  const max1RM = selectedData.length > 0 ? Math.max(...selectedData.map(d => d.estimated1RM)) : 100;
  const min1RM = selectedData.length > 0 ? Math.min(...selectedData.map(d => d.estimated1RM)) : 0;
  const yRange = Math.max(max1RM - min1RM, 20);

  // Calculate percentage gain
  const first1RM = selectedData.length > 0 ? selectedData[0].estimated1RM : 0;
  const last1RM = selectedData.length > 0 ? selectedData[selectedData.length - 1].estimated1RM : 0;
  const gainPercent = first1RM > 0 ? Math.round(((last1RM - first1RM) / first1RM) * 100) : 0;

  // Muscle Volume calculation
  const muscleEntries = Object.entries(volumeByMuscle);
  const maxVolume = muscleEntries.length > 0 ? Math.max(...muscleEntries.map(([, v]) => v)) : 1;

  // Heatmap: generate past 12 weeks of days (84 days)
  const today = new Date();
  const heatmapDays: { dateStr: string; dayLabel: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    heatmapDays.push({
      dateStr,
      dayLabel: d.toLocaleDateString('es-ES', { weekday: 'narrow' }),
      count: heatmapData[dateStr] || 0
    });
  }

  return (
    <div className="space-y-6">
      {/* 1RM Estimated Progression Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Evolución de 1RM Estimado</h3>
              <p className="text-xs text-slate-400">Fórmula de Brzycki: Peso × (36 / (37 - Reps))</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {exerciseKeys.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            {gainPercent > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                +{gainPercent}% Fuerza
              </span>
            )}
          </div>
        </div>

        {selectedData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Sin marcas registradas aún para este ejercicio. ¡Completa tu primer entrenamiento!
          </div>
        ) : (
          <div className="pt-2">
            <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2 relative">
              {/* Background horizontal grid lines */}
              <div className="absolute inset-x-2 top-4 border-b border-slate-800/60 flex justify-end">
                <span className="text-[10px] text-slate-500 pr-1">{max1RM} kg</span>
              </div>
              <div className="absolute inset-x-2 top-20 border-b border-slate-800/60 flex justify-end">
                <span className="text-[10px] text-slate-500 pr-1">{Math.round((max1RM + min1RM) / 2)} kg</span>
              </div>

              {/* Data points */}
              {selectedData.map((pt, idx) => {
                const heightPercent = Math.max(15, Math.round(((pt.estimated1RM - (min1RM * 0.85)) / (max1RM - (min1RM * 0.85) || 1)) * 80));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-800 text-white text-[11px] font-medium py-1 px-2 rounded shadow-md pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                      {pt.estimated1RM} kg 1RM ({pt.weight}kg × {pt.reps})
                    </div>
                    
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[28px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md hover:brightness-125 transition-all relative flex items-start justify-center pt-1"
                    >
                      <div className="w-2 h-2 rounded-full bg-white shadow"></div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 truncate w-full text-center">
                      {pt.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>Registro inicial: <strong className="text-white">{first1RM} kg</strong></span>
              <span>1RM Actual Estimado: <strong className="text-emerald-400 text-sm font-bold">{last1RM} kg</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Volume by Muscle Group */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Volumen Semanal Acumulado (kg levantados)</h3>
            <p className="text-xs text-slate-400">Suma total de Peso × Repeticiones por grupo muscular</p>
          </div>
        </div>

        {muscleEntries.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No hay volumen registrado en esta semana.
          </div>
        ) : (
          <div className="space-y-3">
            {muscleEntries.map(([muscle, volume]) => {
              const percent = Math.min(100, Math.round((volume / maxVolume) * 100));
              return (
                <div key={muscle} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{muscle}</span>
                    <span className="text-indigo-400 font-semibold">{volume.toLocaleString()} kg</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GitHub-style Consistency Heatmap */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Calendario de Consistencia</h3>
              <p className="text-xs text-slate-400">12 Semanas de constancia y asistencia al gimnasio</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Menos</span>
            <div className="w-2.5 h-2.5 rounded-xs bg-slate-800"></div>
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-900"></div>
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-600"></div>
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-400"></div>
            <span>Más</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
            {heatmapDays.map((day, idx) => {
              let bg = 'bg-slate-800/80';
              if (day.count === 1) bg = 'bg-emerald-900/90 border border-emerald-700/50';
              if (day.count === 2) bg = 'bg-emerald-600 text-white';
              if (day.count >= 3) bg = 'bg-emerald-400 shadow-sm shadow-emerald-500/50';

              return (
                <div
                  key={idx}
                  title={`${day.dateStr}: ${day.count} series/entrenamientos`}
                  className={`w-3.5 h-3.5 rounded-xs ${bg} transition-colors cursor-pointer hover:ring-2 hover:ring-emerald-400/80`}
                />
              );
            })}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 text-right">
          Cada día de entrenamiento completado premia tu constancia y multiplica tus estrellas ⭐
        </p>
      </div>
    </div>
  );
};
