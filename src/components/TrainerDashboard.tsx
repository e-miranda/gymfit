import React, { useState, useEffect } from 'react';
import {
  Edit3, Save, Plus, Trash2, CheckCircle2, AlertTriangle, Sparkles, UserCheck, Dumbbell, Calendar,
  Flame, Zap
} from 'lucide-react';
import { LEVEL_TIERS, calculateBMI } from '../gymData';
import { User, UserProfile, WorkoutRoutine, Exercise, WorkoutExerciseItem } from '../types';

interface TrainerDashboardProps {
  currentUser: User;
  allUsers: (User & { profile: UserProfile | null })[];
  exercisesCatalog: Exercise[];
  onRefreshData: () => void;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({
  currentUser,
  allUsers,
  exercisesCatalog,
  onRefreshData
}) => {
  // Filter athletes
  const athletes = allUsers.filter(u => u.role === 'atleta' || u.role === 'client');
  const [selectedClientId, setSelectedClientId] = useState<number>(athletes[0]?.id || 3);
  const selectedUser = athletes.find(u => u.id === selectedClientId) || athletes[0];

  const [clientRoutines, setClientRoutines] = useState<WorkoutRoutine[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<number | null>(null);

  // Form state for routine modification
  const [editingExercises, setEditingExercises] = useState<any[]>([]);
  const [coachNotes, setCoachNotes] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [flashSentMsg, setFlashSentMsg] = useState('');

  const handleTriggerFlashCoach = async () => {
    try {
      const res = await fetch('/api/promotions/trigger-flash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setFlashSentMsg('¡Notificación flash enviada con éxito a los atletas!');
        setTimeout(() => setFlashSentMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch selected user's routines
  const loadRoutines = async (userId: number) => {
    setLoadingRoutines(true);
    try {
      const res = await fetch(`/api/users/${userId}/routines`);
      const data = await res.json();
      if (data.routines) {
        setClientRoutines(data.routines);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoutines(false);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      loadRoutines(selectedClientId);
      setEditingRoutineId(null);
    }
  }, [selectedClientId]);

  const handleStartEdit = (routine: WorkoutRoutine) => {
    setEditingRoutineId(routine.id);
    setEditingExercises(JSON.parse(JSON.stringify(routine.exercises)));
    setCoachNotes(routine.coach_notes || '');
  };

  const handleExerciseFieldChange = (idx: number, field: string, value: any) => {
    setEditingExercises((prev: any[]) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleReplaceExercise = (idx: number, newExId: number) => {
    const catalogEx = exercisesCatalog.find(e => e.id === newExId);
    if (!catalogEx) return;

    setEditingExercises((prev: any[]) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        exercise_id: catalogEx.id,
        exercise_name: catalogEx.name,
        muscle_group: catalogEx.muscle_group,
        equipment_needed: catalogEx.equipment_needed,
        gif_url: catalogEx.gif_url
      };
      return updated;
    });
  };

  const handleAddExerciseToRoutine = () => {
    const defaultEx = exercisesCatalog[0];
    if (!defaultEx) return;

    const newEx = {
      id: Date.now(),
      routine_id: editingRoutineId,
      exercise_id: defaultEx.id,
      exercise_name: defaultEx.name,
      muscle_group: defaultEx.muscle_group,
      equipment_needed: defaultEx.equipment_needed,
      gif_url: defaultEx.gif_url,
      sets: 3,
      reps: '10-12',
      rest_seconds: 90,
      sort_order: editingExercises.length + 1
    };

    setEditingExercises((prev: any[]) => [...prev, newEx]);
  };

  const handleRemoveExercise = (idx: number) => {
    setEditingExercises((prev: any[]) => prev.filter((_, i: number) => i !== idx));
  };

  const handleSaveRoutineOverride = async () => {
    if (!editingRoutineId) return;

    try {
      const res = await fetch(`/api/routines/${editingRoutineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedClientId,
          coach_notes: coachNotes,
          exercises: editingExercises
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg('¡Rutina modificada y guardada con éxito por el Entrenador!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
        setEditingRoutineId(null);
        loadRoutines(selectedClientId);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeAthleteDays = async (days: number) => {
    try {
      setLoadingRoutines(true);
      await fetch(`/api/users/${selectedClientId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available_days: days })
      });
      await fetch('/api/routines/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedClientId,
          gender: profile?.gender || 'hombre',
          current_objective: profile?.current_objective || 'hipertrofia',
          fitness_level: profile?.fitness_level || 'intermedio',
          active_injuries: profile?.active_injuries || [],
          available_days: days
        })
      });
      await loadRoutines(selectedClientId);
      onRefreshData();
      setSaveSuccessMsg(`¡Programa actualizado a ${days} días por semana (incluye Día 5 y Día 6)!`);
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRoutines(false);
    }
  };

  const profile = selectedUser?.profile;
  const currentLevel = LEVEL_TIERS.find(t => (profile?.level_stage || 1) === t.level) || LEVEL_TIERS[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Panel del Entrenador (Head Coach)
              </span>
              <h1 className="text-xl md:text-2xl font-black text-white mt-1">
                Supervisión y Modificación de Rutinas de Atletas
              </h1>
              <p className="text-xs text-slate-400">
                Revisa los entrenamientos generados por la IA y aplica ajustes personalizados según las lesiones y niveles de cada alumno.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-2xl text-right">
              <span className="text-[10px] text-slate-400 uppercase">Atletas a cargo</span>
              <p className="text-lg font-black text-white">{athletes.length} Atletas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Athlete list on left, routine editor on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Athlete Selector & Profile */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              Seleccionar Atleta
            </h3>

            <div className="space-y-2">
              {athletes.map(client => {
                const isSelected = client.id === selectedClientId;
                const cProfile = client.profile;
                const cTier = LEVEL_TIERS.find(t => (cProfile?.level_stage || 1) === t.level) || LEVEL_TIERS[0];

                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={client.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={client.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/20"
                      />
                      <div>
                        <h4 className="font-bold text-sm leading-tight">{client.name}</h4>
                        <p className={`text-[11px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {cProfile?.gender === 'mujer' ? 'Mujer' : 'Hombre'} • {cProfile?.current_objective || 'General'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        client.membership_status === 'activo'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {client.membership_status}
                      </span>
                      <p className="text-[10px] mt-1 font-semibold">{cTier.badge} Nivel {cProfile?.level_stage || 1}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Athlete Deep-Dive Card */}
          {selectedUser && (() => {
            const athleteBmi = calculateBMI(profile?.weight_kg || 70, profile?.height_cm || 170);
            return (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/50"
                  />
                  <div>
                    <h3 className="text-white font-bold text-base">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-400">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-amber-400 font-bold">⭐ {profile?.stars || 0} estrellas</span>
                      <span className="text-xs text-indigo-400 font-semibold">• {currentLevel.title}</span>
                    </div>
                  </div>
                </div>

                {/* Physical stats */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Peso</span>
                    <p className="text-sm font-bold text-white">{profile?.weight_kg || 70} kg</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Altura</span>
                    <p className="text-sm font-bold text-white">{profile?.height_cm || 170} cm</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Días/Semana</span>
                    <p className="text-sm font-bold text-emerald-400">{profile?.available_days || 4} días</p>
                  </div>
                </div>

                {/* Athlete IMC Assessment Card */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">IMC Antropométrico</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${athleteBmi.badgeBg}`}>
                      {athleteBmi.subCategory}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-mono font-black text-white">{athleteBmi.bmi}</span>
                    <span className="text-[11px] text-slate-400">kg/m² ({athleteBmi.mainCategory})</span>
                  </div>
                </div>

              {/* Active Injuries Alert */}
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Lesiones Activas Declaradas:
                </div>
                {profile?.active_injuries && profile.active_injuries.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {profile.active_injuries.map((inj: string) => (
                      <span key={inj} className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[11px] rounded-lg border border-rose-500/30">
                        ⚠️ {inj.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Sin lesiones activas reportadas.</p>
                )}
              </div>
            </div>
          );
        })()}

          {/* Flash Promo Broadcast Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-xs">Suplementos & Promociones Flash</h4>
                <p className="text-[10px] text-slate-400">Ofertas en recepción (Creatina, Whey, etc.)</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-snug">
              Lanza una notificación relámpago a las pantallas y apps de los atletas para motivar la compra de suplementación con descuento.
            </p>

            {flashSentMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-500/40 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{flashSentMsg}</span>
              </div>
            )}

            <button
              onClick={handleTriggerFlashCoach}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>⚡ Lanzar Notificación Flash a Atletas</span>
            </button>
          </div>
        </div>

        {/* Right Column: Routine Inspection & Live Override */}
        <div className="lg:col-span-8 space-y-4">
          {saveSuccessMsg && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {saveSuccessMsg}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Rutinas de Entrenamiento de {selectedUser.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Modifica series, repeticiones, descansos o reemplaza ejercicios según tu criterio técnico.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/30">
                  {clientRoutines.length} Días Diseñados
                </span>
                {clientRoutines.length < 6 && (
                  <button
                    onClick={() => handleChangeAthleteDays(6)}
                    className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    + Asignar 6 Días (Día 5 y 6)
                  </button>
                )}
              </div>
            </div>

            {/* Coach Day Switcher Bar */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Frecuencia Semanal del Atleta:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {[2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    onClick={() => handleChangeAthleteDays(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                      clientRoutines.length === d
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {d === 5 ? '5 Días (Día 5)' : d === 6 ? '6 Días (Día 5 y 6)' : `${d} Días`}
                  </button>
                ))}
              </div>
            </div>

            {loadingRoutines ? (
              <div className="py-12 text-center text-slate-400 text-sm">Cargando rutinas del atleta...</div>
            ) : clientRoutines.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No hay rutinas asignadas aún para este usuario.
              </div>
            ) : (
              <div className="space-y-4">
                {clientRoutines.map((routine: WorkoutRoutine) => {
                  const isEditingThis = editingRoutineId === routine.id;

                  return (
                    <div
                      key={routine.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{routine.day_name}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {routine.created_by === 'ia_gemini'
                                ? '⚡ IA Gemini'
                                : routine.created_by === 'entrenador_manual'
                                ? '👨‍🏫 Ajustado por Coach'
                                : '⚙️ Motor Algorítmico'}
                            </span>
                          </div>
                          {routine.coach_notes && (
                            <p className="text-xs text-amber-400/90 mt-1 italic">
                              Nota: {routine.coach_notes}
                            </p>
                          )}
                        </div>

                        {!isEditingThis ? (
                          <button
                            onClick={() => handleStartEdit(routine)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all w-fit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Modificar Rutina
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingRoutineId(null)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleSaveRoutineOverride}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Guardar Cambios
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Normal View of Exercises */}
                      {!isEditingThis ? (
                        <div className="space-y-2">
                          {routine.exercises.map((ex: WorkoutExerciseItem, idx: number) => (
                            <div
                              key={ex.id || idx}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[10px]">
                                  {idx + 1}
                                </span>
                                <div>
                                  <h4 className="font-bold text-white">{ex.exercise_name}</h4>
                                  <span className="text-[11px] text-slate-400">
                                    {ex.muscle_group} • {ex.equipment_needed}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-right">
                                <span className="font-bold text-emerald-400">{ex.sets} series</span>
                                <span className="text-slate-300 font-semibold">{ex.reps} reps</span>
                                <span className="text-amber-400/90 text-[11px]">{ex.rest_seconds}s descanso</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Live Override Editor */
                        <div className="space-y-4 pt-2">
                          <div className="space-y-3">
                            {editingExercises.map((ex: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 bg-slate-900 border border-indigo-500/40 rounded-xl space-y-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                                      Ejercicio #{idx + 1}
                                    </label>
                                    <select
                                      value={ex.exercise_id}
                                      onChange={(e) => handleReplaceExercise(idx, parseInt(e.target.value))}
                                      className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
                                    >
                                      {exercisesCatalog.map(catEx => (
                                        <option key={catEx.id} value={catEx.id}>
                                          {catEx.name} ({catEx.muscle_group})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <button
                                    onClick={() => handleRemoveExercise(idx)}
                                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors mt-4"
                                    title="Eliminar ejercicio de la rutina"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">Series</label>
                                    <input
                                      type="number"
                                      value={ex.sets}
                                      onChange={(e) => handleExerciseFieldChange(idx, 'sets', parseInt(e.target.value) || 1)}
                                      className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">Repeticiones</label>
                                    <input
                                      type="text"
                                      value={ex.reps}
                                      onChange={(e) => handleExerciseFieldChange(idx, 'reps', e.target.value)}
                                      className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-0.5">Descanso (s)</label>
                                    <input
                                      type="number"
                                      step="15"
                                      value={ex.rest_seconds}
                                      onChange={(e) => handleExerciseFieldChange(idx, 'rest_seconds', parseInt(e.target.value) || 60)}
                                      className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-amber-400"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={handleAddExerciseToRoutine}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-dashed border-indigo-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar Otro Ejercicio al Día
                          </button>

                          {/* Coach Note Input */}
                          <div>
                            <label className="text-xs text-slate-400 font-semibold block mb-1">
                              Indicaciones Técnicas del Entrenador para el Alumno:
                            </label>
                            <textarea
                              rows={2}
                              value={coachNotes}
                              onChange={(e) => setCoachNotes(e.target.value)}
                              placeholder="Ej: Mantén el torso erguido en la sentadilla. Si sientes molestia en el hombro avísame."
                              className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
