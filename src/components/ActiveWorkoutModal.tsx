import React, { useState, useEffect } from 'react';
import {
  X, Check, Play, Pause, RotateCcw, Plus,
  Award, ChevronRight, ChevronLeft, Volume2, Flame, Sparkles
} from 'lucide-react';
import { WorkoutExerciseItem, WorkoutRoutine } from '../types';
import { playChimeSound, playStarEarnedSound } from '../utils/audio';

interface ActiveWorkoutModalProps {
  routine: WorkoutRoutine;
  userId: number;
  onClose: () => void;
  onFinishWorkout: (starsEarned: number, logsCount: number) => void;
}

interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
  completed: boolean;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  routine,
  userId,
  onClose,
  onFinishWorkout
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const currentExercise = routine.exercises[currentExerciseIndex] || routine.exercises[0];

  // Map of exerciseId -> SetLog[]
  const [exerciseLogs, setExerciseLogs] = useState<Record<number, SetLog[]>>(() => {
    const initial: Record<number, SetLog[]> = {};
    routine.exercises.forEach(ex => {
      initial[ex.id] = Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: 20,
        reps: parseInt(ex.reps.split('-')[1] || ex.reps.split('-')[0] || '10') || 10,
        rpe: 8,
        completed: false
      }));
    });
    return initial;
  });

  // Floating countdown timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(currentExercise.rest_seconds || 90);
  const [totalTimerDuration, setTotalTimerDuration] = useState(currentExercise.rest_seconds || 90);
  const [timerFloatingVisible, setTimerFloatingVisible] = useState(false);

  // Total session stats
  const [sessionStars, setSessionStars] = useState(0);
  const [recentCelebration, setRecentCelebration] = useState<string | null>(null);

  // Countdown timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            playChimeSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleCompleteSet = async (setIdx: number) => {
    const currentSets = exerciseLogs[currentExercise.id] || [];
    const targetSet = currentSets[setIdx];
    if (!targetSet) return;

    const newCompleted = !targetSet.completed;
    const updatedSets = currentSets.map((s, idx) => idx === setIdx ? { ...s, completed: newCompleted } : s);

    setExerciseLogs(prev => ({
      ...prev,
      [currentExercise.id]: updatedSets
    }));

    if (newCompleted) {
      playStarEarnedSound();
      setSessionStars(prev => prev + 3);
      setRecentCelebration('+3 ⭐ Serie Completada');
      setTimeout(() => setRecentCelebration(null), 2500);

      // Trigger floating rest timer automatically as specified in prompt
      const restTime = currentExercise.rest_seconds || 90;
      setTimeLeft(restTime);
      setTotalTimerDuration(restTime);
      setIsTimerRunning(true);
      setTimerFloatingVisible(true);

      // Log progress to server
      try {
        await fetch('/api/progress/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            exercise_id: currentExercise.exercise_id,
            weight_lifted: targetSet.weight,
            reps_done: targetSet.reps,
            rpe_felt: targetSet.rpe,
            is_workout_finished: false
          })
        });
      } catch (e) {
        console.error('Error logging set to server', e);
      }
    }
  };

  const handleUpdateSetValue = (setIdx: number, field: 'weight' | 'reps' | 'rpe', val: number) => {
    const currentSets = exerciseLogs[currentExercise.id] || [];
    const updatedSets = currentSets.map((s, idx) => idx === setIdx ? { ...s, [field]: val } : s);
    setExerciseLogs(prev => ({
      ...prev,
      [currentExercise.id]: updatedSets
    }));
  };

  const handleFinishAll = async () => {
    // Workout completion bonus stars
    const bonusStars = 10;
    const finalStars = sessionStars + bonusStars;
    playChimeSound();

    try {
      await fetch('/api/progress/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          exercise_id: currentExercise.exercise_id,
          weight_lifted: 0,
          reps_done: 0,
          rpe_felt: 8,
          is_workout_finished: true
        })
      });
    } catch (e) {
      // ignore
    }

    onFinishWorkout(finalStars, routine.exercises.length);
  };

  const currentSets = exerciseLogs[currentExercise.id] || [];
  const completedSetsCount = currentSets.filter(s => s.completed).length;
  const isAllCurrentDone = completedSetsCount === currentSets.length && currentSets.length > 0;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const timerProgress = totalTimerDuration > 0 ? ((totalTimerDuration - timeLeft) / totalTimerDuration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-white font-bold text-sm tracking-wide">MODO ENFOQUE ACTIVO</h2>
            </div>
            <p className="text-xs text-slate-400">{routine.day_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>+{sessionStars} ⭐</span>
          </div>

          <button
            onClick={handleFinishAll}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            Terminar
          </button>
        </div>
      </div>

      {/* Floating Celebration Toast */}
      {recentCelebration && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-xs px-4 py-1.5 rounded-full shadow-2xl z-50 animate-bounce flex items-center gap-1.5">
          <Award className="w-4 h-4 text-slate-950" />
          {recentCelebration}
        </div>
      )}

      {/* Main Exercise Focus View */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-32">
        {/* Exercise Stepper Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 no-scrollbar">
          {routine.exercises.map((ex, idx) => {
            const exSets = exerciseLogs[ex.id] || [];
            const done = exSets.every(s => s.completed) && exSets.length > 0;
            const isCurrent = idx === currentExerciseIndex;

            return (
              <button
                key={ex.id}
                onClick={() => setCurrentExerciseIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/50'
                    : done
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {done && <Check className="w-3 h-3 text-emerald-400" />}
                <span>{idx + 1}. {ex.exercise_name.slice(0, 15)}...</span>
              </button>
            );
          })}
        </div>

        {/* Current Exercise Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl mb-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                {currentExercise.muscle_group} • {currentExercise.equipment_needed}
              </span>
              <h1 className="text-xl font-black text-white mt-2 leading-snug">
                {currentExercise.exercise_name}
              </h1>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Descanso objetivo</span>
              <p className="text-sm font-bold text-amber-400">{currentExercise.rest_seconds}s</p>
            </div>
          </div>

          {currentExercise.gif_url && (
            <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-slate-950 border border-slate-800/80">
              <img
                src={currentExercise.gif_url}
                alt={currentExercise.exercise_name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-3">
                <span className="text-xs text-slate-300 font-medium bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                  🎯 Rango objetivo sugerido: {currentExercise.reps} reps
                </span>
              </div>
            </div>
          )}

          {/* Sets Interactive Table */}
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              <span className="col-span-2 text-center">Serie</span>
              <span className="col-span-3 text-center">Peso (kg)</span>
              <span className="col-span-3 text-center">Reps</span>
              <span className="col-span-2 text-center">RPE</span>
              <span className="col-span-2 text-center">Marcar</span>
            </div>

            {currentSets.map((set, setIdx) => (
              <div
                key={setIdx}
                className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl transition-all ${
                  set.completed
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950 border border-slate-800/80 text-white'
                }`}
              >
                <div className="col-span-2 text-center font-bold text-sm">
                  #{set.setNumber}
                </div>

                {/* Weight Input */}
                <div className="col-span-3 flex items-center justify-center">
                  <input
                    type="number"
                    step="2.5"
                    value={set.weight}
                    disabled={set.completed}
                    onChange={(e) => handleUpdateSetValue(setIdx, 'weight', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-1 px-2 text-center text-sm font-bold text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Reps Input */}
                <div className="col-span-3 flex items-center justify-center">
                  <input
                    type="number"
                    value={set.reps}
                    disabled={set.completed}
                    onChange={(e) => handleUpdateSetValue(setIdx, 'reps', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-1 px-2 text-center text-sm font-bold text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* RPE Slider / Selector */}
                <div className="col-span-2 flex items-center justify-center">
                  <select
                    value={set.rpe}
                    disabled={set.completed}
                    onChange={(e) => handleUpdateSetValue(setIdx, 'rpe', parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-1 px-1 text-center text-xs font-semibold text-amber-400 focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    {[6, 7, 8, 9, 10].map(v => (
                      <option key={v} value={v}>@{v}</option>
                    ))}
                  </select>
                </div>

                {/* Complete Button */}
                <div className="col-span-2 flex justify-center">
                  <button
                    onClick={() => handleCompleteSet(setIdx)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform active:scale-90 ${
                      set.completed
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    <Check className={`w-5 h-5 ${set.completed ? 'stroke-[3]' : 'stroke-2'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Stepper Navigation */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-800">
            <button
              disabled={currentExerciseIndex === 0}
              onClick={() => setCurrentExerciseIndex(prev => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <span className="text-xs text-slate-400 font-medium">
              {currentExerciseIndex + 1} de {routine.exercises.length} ejercicios
            </span>

            <button
              disabled={currentExerciseIndex >= routine.exercises.length - 1}
              onClick={() => setCurrentExerciseIndex(prev => Math.min(routine.exercises.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 hover:bg-emerald-500/30"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* NATIVE FLOATING COUNTDOWN REST TIMER (Star feature from prompt) */}
      {timerFloatingVisible && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto bg-slate-900/95 border-2 border-emerald-500/80 backdrop-blur-xl rounded-3xl p-4 shadow-2xl z-50 text-white animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg animate-pulse">
                <Flame className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cronómetro de Descanso</h4>
                <p className="text-[11px] text-slate-400">Recupera ATP y prepárate para la siguiente serie</p>
              </div>
            </div>

            <button
              onClick={() => setTimerFloatingVisible(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Big timer countdown */}
          <div className="flex items-center justify-between my-2">
            <div className="text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-1">
              {formatTimer(timeLeft)}
              <span className="text-xs font-sans text-slate-400 font-normal">restantes</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeLeft(prev => prev + 15)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> 15s
              </button>

              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-2 rounded-xl font-bold ${
                  isTimerRunning ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setTimeLeft(0);
                  setIsTimerRunning(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold hover:text-white"
              >
                Omitir
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              style={{ width: `${timerProgress}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
            />
          </div>
        </div>
      )}
    </div>
  );
};
