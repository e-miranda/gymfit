import React, { useState, useEffect } from 'react';
import {
  Play, Sparkles, Dumbbell, ShieldAlert, Zap,
  TrendingUp, Award, User, RefreshCw, Cpu, Activity, Info, Scale, Heart, Check, Calendar,
  Flame, ShoppingBag, Tag
} from 'lucide-react';
import { Gender, ObjectiveType, User as UserType, UserProfile, WorkoutRoutine, Exercise } from '../types';
import { LEVEL_TIERS, calculateBMI } from '../gymData';
import { PerformanceCharts } from './PerformanceCharts';
import { ActiveWorkoutModal } from './ActiveWorkoutModal';

interface MobileClientViewProps {
  currentUser: UserType;
  userProfile: UserProfile;
  routines: WorkoutRoutine[];
  exercisesCatalog: Exercise[];
  statsData: {
    oneRmHistory: Record<string, any[]>;
    volumeByMuscle: Record<string, number>;
    heatmapData: Record<string, number>;
  };
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onRefreshRoutines: () => void;
  onRefreshData: () => void;
  onOpenStore?: (productId?: string) => void;
}

export const MobileClientView: React.FC<MobileClientViewProps> = ({
  currentUser,
  userProfile,
  routines,
  exercisesCatalog,
  statsData,
  onUpdateProfile,
  onRefreshRoutines,
  onRefreshData,
  onOpenStore
}) => {
  const [mobileTab, setMobileTab] = useState<'routine' | 'stats' | 'profile' | 'store'>('routine');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [activeWorkoutOpen, setActiveWorkoutOpen] = useState(false);
  const [generatingRoutine, setGeneratingRoutine] = useState(false);
  const [generationMetadata, setGenerationMetadata] = useState<{
    engineUsed?: string;
    engineNote?: string;
    latencyMs?: number;
  } | null>(null);

  // Forced engine selector: 'auto', 'ai', 'algorithmic'
  const [enginePreference, setEnginePreference] = useState<'auto' | 'ai' | 'algorithmic'>('auto');

  // Finish workout celebratory popup
  const [celebrationModal, setCelebrationModal] = useState<{ stars: number; exercisesCount: number } | null>(null);

  // Weight & Height state for BMI calculation
  const [weightInput, setWeightInput] = useState<number>(userProfile.weight_kg || 70);
  const [heightInput, setHeightInput] = useState<number>(userProfile.height_cm || 170);
  const [metricSaved, setMetricSaved] = useState(false);

  useEffect(() => {
    if (userProfile.weight_kg) setWeightInput(userProfile.weight_kg);
    if (userProfile.height_cm) setHeightInput(userProfile.height_cm);
  }, [userProfile.weight_kg, userProfile.height_cm]);

  const bmiInfo = calculateBMI(weightInput, heightInput);

  const handleSaveMetrics = () => {
    onUpdateProfile({
      weight_kg: Number(weightInput),
      height_cm: Number(heightInput)
    });
    setMetricSaved(true);
    setTimeout(() => setMetricSaved(false), 2500);
  };

  const activeRoutine = routines[selectedDayIndex] || routines[0];
  const currentTier = LEVEL_TIERS.find(t => userProfile.level_stage === t.level) || LEVEL_TIERS[0];
  const nextTier = LEVEL_TIERS.find(t => t.level === userProfile.level_stage + 1);

  // Progress towards next level
  const starsInCurrentTier = userProfile.stars - currentTier.minStars;
  const tierRange = (nextTier?.minStars || currentTier.maxStars) - currentTier.minStars;
  const levelProgressPercent = Math.min(100, Math.max(0, Math.round((starsInCurrentTier / (tierRange || 1)) * 100)));

  // Objective definitions
  const OBJECTIVES: { id: ObjectiveType; title: string; subtitle: string; icon: string }[] = [
    { id: 'hipertrofia', title: 'Hipertrofia', subtitle: 'Ganancia de masa muscular', icon: '💪' },
    { id: 'fuerza', title: 'Fuerza Máxima', subtitle: 'Sobrecarga y 1RM', icon: '🏋️‍♂️' },
    { id: 'grasa', title: 'Pérdida de Grasa', subtitle: 'Recomposición corporal', icon: '🔥' },
    { id: 'resistencia', title: 'Resistencia', subtitle: 'Tono y capacidad metabólica', icon: '⚡' },
    { id: 'postura', title: 'Salud & Postura', subtitle: 'Espalda sana y alineación', icon: '🧘' }
  ];

  const handleGenerateRoutine = async (forcedObj?: ObjectiveType, forcedDays?: number) => {
    setGeneratingRoutine(true);
    setGenerationMetadata(null);

    const obj = forcedObj || userProfile.current_objective;
    const days = forcedDays || userProfile.available_days || 4;

    try {
      const res = await fetch('/api/routines/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          gender: userProfile.gender,
          current_objective: obj,
          fitness_level: userProfile.fitness_level,
          active_injuries: userProfile.active_injuries,
          available_days: days,
          force_engine: enginePreference === 'algorithmic' ? 'algorithmic' : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setGenerationMetadata({
          engineUsed: data.engineUsed,
          engineNote: data.engineNote,
          latencyMs: data.latencyMs
        });
        setSelectedDayIndex(0);
        onRefreshRoutines();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingRoutine(false);
    }
  };

  const handleDaysChange = async (days: number) => {
    onUpdateProfile({ available_days: days });
    await handleGenerateRoutine(undefined, days);
  };

  const handleAddDays5and6 = async () => {
    onUpdateProfile({ available_days: 6 });
    await handleGenerateRoutine(undefined, 6);
    setSelectedDayIndex(4); // jumps to Día 5 so athlete can see it right away
  };

  const toggleInjury = (injury: string) => {
    const current = userProfile.active_injuries || [];
    const next = current.includes(injury) ? current.filter(i => i !== injury) : [...current, injury];
    onUpdateProfile({ active_injuries: next });
  };

  const handleObjectiveSelect = (obj: ObjectiveType) => {
    onUpdateProfile({ current_objective: obj });
    handleGenerateRoutine(obj);
  };

  const handleGenderChange = (gender: Gender) => {
    onUpdateProfile({ gender });
  };

  return (
    <div className="space-y-5">
      {/* Top Athlete Header & Gamification Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt={currentUser.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/50"
              />
              <span className="absolute -bottom-1 -right-1 text-sm">{currentTier.badge}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-black text-base">{currentUser.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {currentUser.membership_status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {userProfile.gender === 'mujer' ? '👩 Biomecánica Femenina' : '👨 Biomecánica Masculina'} • {currentTier.title}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 font-black text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{userProfile.stars} ⭐</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">
              Etapa {userProfile.level_stage} de 5
            </span>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              {currentTier.badge} {currentTier.title}
            </span>
            <span className="text-slate-400">
              {nextTier ? `Faltan ${nextTier.minStars - userProfile.stars} ⭐ para ${nextTier.title}` : '¡Nivel Máximo Legendario!'}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${levelProgressPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
            />
          </div>
        </div>
      </div>

      {/* Occasional Flash Promo Gym Banner */}
      {!bannerDismissed && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-slate-900 border border-amber-500/40 rounded-3xl p-3.5 shadow-lg flex items-center justify-between gap-3 relative overflow-hidden animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md flex-shrink-0">
              <Flame className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950">
                  OFERTA FLASH GYM
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  -31% DTO
                </span>
              </div>
              <h4 className="text-white font-bold text-xs mt-0.5 line-clamp-1">
                Creatina Creapure® Micronizada (Solo 5 unidades en recepción)
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onOpenStore && onOpenStore('creatina-creapure-300g')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
            >
              Apartar $28.99
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
              title="Ocultar aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Mobile Internal Navigation (Simulates React Native Bottom Tab or Top Bar) */}
      <div className="flex items-center justify-around bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-lg gap-1">
        <button
          onClick={() => setMobileTab('routine')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'routine'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span className="hidden xs:inline">Mi Rutina</span>
          <span className="xs:hidden">Rutina</span>
        </button>

        <button
          onClick={() => setMobileTab('stats')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'stats'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="hidden xs:inline">Progreso & 1RM</span>
          <span className="xs:hidden">Progreso</span>
        </button>

        <button
          onClick={() => setMobileTab('profile')}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'profile'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="hidden xs:inline">Perfil</span>
          <span className="xs:hidden">Perfil</span>
        </button>

        <button
          onClick={() => {
            if (onOpenStore) onOpenStore();
          }}
          className="flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-pointer shadow-sm"
          title="Ver suplementos en promoción con descuento exclusivo"
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Ofertas ⚡</span>
        </button>
      </div>

      {/* ---------------- TAB 1: MI RUTINA ---------------- */}
      {mobileTab === 'routine' && (
        <div className="space-y-4">
          {/* 5 Key Modules Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Módulo Clave de Entrenamiento (5 Módulos)
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Adaptativo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {OBJECTIVES.map(obj => {
                const isSelected = userProfile.current_objective === obj.id;
                return (
                  <button
                    key={obj.id}
                    onClick={() => handleObjectiveSelect(obj.id)}
                    className={`p-2.5 rounded-2xl text-left transition-all border ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl block mb-1">{obj.icon}</span>
                    <span className="text-xs font-black block leading-tight">{obj.title}</span>
                    <span className={`text-[10px] block line-clamp-1 mt-0.5 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      {obj.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generator Banner with Hybrid Engine Info */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <Cpu className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-white">Motor de Prescripción Híbrido</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gemini 3.8 Flash AI + Motor de Reglas Algorítmico Local (100% Fiabilidad a Costo $0)
                </p>
              </div>

              {/* Force Engine Switcher for Testing */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl text-[11px]">
                <button
                  onClick={() => setEnginePreference('auto')}
                  className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                    enginePreference === 'auto' ? 'bg-slate-800 text-white' : 'text-slate-400'
                  }`}
                >
                  Automático (Híbrido)
                </button>
                <button
                  onClick={() => setEnginePreference('algorithmic')}
                  className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                    enginePreference === 'algorithmic' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                  title="Fuerza el motor de código puro para probar fiabilidad sin IA"
                >
                  ⚙️ Motor Local ($0)
                </button>
              </div>
            </div>

            {/* Status of last generation */}
            {generationMetadata && (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs flex items-center justify-between">
                <span className="text-slate-300 font-medium">
                  {generationMetadata.engineUsed === 'gemini-3.8-flash' ? '⚡ ' : '⚙️ '}
                  {generationMetadata.engineNote}
                </span>
                {generationMetadata.latencyMs && (
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    {generationMetadata.latencyMs} ms
                  </span>
                )}
              </div>
            )}

            <button
              onClick={() => handleGenerateRoutine()}
              disabled={generatingRoutine}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingRoutine ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculando Biomecánica & Filtrando Lesiones...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Regenerar Rutina Adaptativa Ahora
                </>
              )}
            </button>
          </div>

          {/* Active Injuries Alert */}
          {userProfile.active_injuries && userProfile.active_injuries.length > 0 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Filtro Médico Activo:</strong> Se excluyeron ejercicios lesivos para:{' '}
                  {userProfile.active_injuries.map(i => i.replace('_', ' ')).join(', ')}.
                </span>
              </div>
              <button
                onClick={() => setMobileTab('profile')}
                className="text-[11px] text-rose-400 underline font-semibold hover:text-rose-300 shrink-0 ml-2"
              >
                Ajustar
              </button>
            </div>
          )}

          {/* Frequency Control & Quick Day 5 & Day 6 Adder */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  Días de Entrenamiento: {routines.length} Días Diseñados
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {routines.length >= 6 ? 'Día 1 al Día 6 (Completo)' : `Día 1 al Día ${routines.length}`}
                </span>
              </div>

              {(userProfile.available_days < 6 || routines.length < 6) && (
                <button
                  onClick={handleAddDays5and6}
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 w-full sm:w-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>+ Agregar Día 5 y Día 6</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[2, 3, 4, 5, 6].map(days => {
                const isSelected = (userProfile.available_days || routines.length) === days;
                return (
                  <button
                    key={days}
                    onClick={() => handleDaysChange(days)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-black leading-none">{days}</span>
                    <span className="text-[10px] leading-tight mt-0.5">
                      {days === 5 ? 'Día 5' : days === 6 ? 'Día 5 y 6' : 'Días'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Tabs */}
          {routines.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {routines.map((r, idx) => {
                const isDay5 = idx === 4;
                const isDay6 = idx === 5;
                const isSelected = idx === selectedDayIndex;

                return (
                  <button
                    key={r.id || idx}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/40 font-black'
                        : isDay5 || isDay6
                        ? 'bg-slate-900 text-amber-300 border border-amber-500/40 hover:border-amber-400'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{r.day_name.split(':')[0] || `Día ${idx + 1}`}</span>
                    {(isDay5 || isDay6) && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                        isSelected ? 'bg-slate-950 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {isDay5 ? 'Día 5' : 'Día 6'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Routine Day Detail Card */}
          {activeRoutine ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {activeRoutine.created_by === 'ia_gemini'
                        ? '⚡ IA Gemini'
                        : activeRoutine.created_by === 'entrenador_manual'
                        ? '👨‍🏫 Coach Override'
                        : '⚙️ Motor Algorítmico'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {activeRoutine.exercises.length} Ejercicios
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">
                    {activeRoutine.day_name}
                  </h3>
                  {activeRoutine.coach_notes && (
                    <p className="text-xs text-amber-400/90 italic mt-0.5">
                      💬 Indicación: {activeRoutine.coach_notes}
                    </p>
                  )}
                </div>

                {/* Star Feature: INICIAR ENTRENAMIENTO */}
                <button
                  onClick={() => setActiveWorkoutOpen(true)}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all transform active:scale-95"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  INICIAR ENTRENAMIENTO
                </button>
              </div>

              {/* Exercises List for this day */}
              <div className="space-y-2.5 pt-2">
                {activeRoutine.exercises.map((ex, idx) => (
                  <div
                    key={ex.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-white text-xs leading-snug">{ex.exercise_name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {ex.muscle_group} • {ex.equipment_needed}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-400 block">{ex.sets} series</span>
                      <span className="text-[11px] text-slate-300 font-semibold">{ex.reps} reps</span>
                      <span className="text-[10px] text-amber-400/80 block">{ex.rest_seconds}s rest</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              No hay rutina para este día. Presiona el botón para generarla.
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: PROGRESO DESCENTRALIZADO ---------------- */}
      {mobileTab === 'stats' && (
        <PerformanceCharts
          oneRmHistory={statsData.oneRmHistory}
          volumeByMuscle={statsData.volumeByMuscle}
          heatmapData={statsData.heatmapData}
          userGender={userProfile.gender}
        />
      )}

      {/* ---------------- TAB 3: PERFIL BIOMECÁNICO & NIVELES ---------------- */}
      {mobileTab === 'profile' && (
        <div className="space-y-5">
          {/* Biomechanical Sex Adaptation */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Sexo y Adaptación Biomecánica</h3>
                <p className="text-xs text-slate-400">
                  El motor adapta los vectores de carga articular y distribución muscular.
                </p>
              </div>
              <span className="text-lg">{userProfile.gender === 'mujer' ? '👩' : '👨'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleGenderChange('hombre')}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  userProfile.gender === 'hombre'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                <span className="text-base block mb-1">👨 Masculino</span>
                <span className="text-[11px] opacity-90 block">
                  Énfasis en densidad de torso, deltoides lateral, dorsal ancho y fuerza troncal.
                </span>
              </button>

              <button
                onClick={() => handleGenderChange('mujer')}
                className={`p-3 rounded-2xl text-left border transition-all ${
                  userProfile.gender === 'mujer'
                    ? 'bg-pink-600 text-white border-pink-400 shadow-md font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                <span className="text-base block mb-1">👩 Femenino</span>
                <span className="text-[11px] opacity-90 block">
                  Énfasis en glúteo mayor/medio, femorales, cadera, postura y tolerancia a densidad metabólica.
                </span>
              </button>
            </div>
          </div>

          {/* Active Injuries Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white">Lesiones y Molestias Médicas Activas</h3>
              <p className="text-xs text-slate-400">
                Los ejercicios etiquetados contra estas lesiones son removidos automáticamente de las rutinas.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'lesion_rodilla', label: 'Lesión de Rodilla' },
                { id: 'molestia_hombro', label: 'Molestia de Hombro' },
                { id: 'lumbar', label: 'Molestia Lumbar' },
                { id: 'cervical', label: 'Cervical' },
                { id: 'muneca', label: 'Dolor de Muñeca' },
                { id: 'codo', label: 'Molestia de Codo' }
              ].map(inj => {
                const isSelected = (userProfile.active_injuries || []).includes(inj.id);
                return (
                  <button
                    key={inj.id}
                    onClick={() => toggleInjury(inj.id)}
                    className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{inj.label}</span>
                    <span>{isSelected ? '🚫' : '✓'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Training Days: 2, 3, 4, 5, 6 Días */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Días Disponibles por Semana</h3>
                <p className="text-xs text-slate-400">Selecciona tu frecuencia de entrenamiento (2 a 6 días).</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                {userProfile.available_days} días activos
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[2, 3, 4, 5, 6].map(days => (
                <button
                  key={days}
                  onClick={() => handleDaysChange(days)}
                  className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center ${
                    userProfile.available_days === days
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md scale-105'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-sm font-black">{days}</span>
                  <span className="text-[10px] leading-none mt-0.5">
                    {days === 5 ? 'Día 5' : days === 6 ? 'Día 5+6' : 'Días'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Peso, Altura & Control de IMC (Índice de Masa Corporal) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Peso, Altura & Control de IMC</h3>
                  <p className="text-xs text-slate-400">Métricas antropométricas del atleta</p>
                </div>
              </div>

              {metricSaved && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                  <Check className="w-3 h-3" /> Guardado
                </span>
              )}
            </div>

            {/* Inputs de Peso y Altura */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Peso Corporal (kg)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.5"
                    min="30"
                    max="250"
                    value={weightInput}
                    onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-xs text-slate-400 font-semibold">kg</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Altura (cm)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="1"
                    min="100"
                    max="230"
                    value={heightInput}
                    onChange={(e) => setHeightInput(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-xs text-slate-400 font-semibold">cm</span>
                </div>
              </div>

              <div className="col-span-2 pt-1">
                <button
                  onClick={handleSaveMetrics}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Actualizar Métricas y Recalcular IMC
                </button>
              </div>
            </div>

            {/* Display del IMC Calculado */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tu IMC Calculado:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-white font-mono">{bmiInfo.bmi}</span>
                    <span className="text-xs text-slate-400 font-semibold">kg/m²</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${bmiInfo.badgeBg} block`}>
                    {bmiInfo.subCategory}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    Categoría: {bmiInfo.mainCategory}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 pt-2 border-t border-slate-800/80 leading-relaxed italic">
                💡 {bmiInfo.advice}
              </p>
            </div>

            {/* Clasificación Médica Completa del IMC */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Tabla Oficial de Clasificación del IMC
              </h4>

              {/* 1. Falta de Peso */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-sky-400">
                  <span>Falta de Peso (IMC menor a 18.5)</span>
                  {bmiInfo.mainCategory === 'Falta de Peso' && (
                    <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 text-[10px] rounded-full border border-sky-500/40 font-bold">
                      Tu Estado Actual
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-xs pl-2">
                  <div className={`flex justify-between py-1 px-2 rounded-lg transition-colors ${
                    bmiInfo.subCategory === 'Delgadez Severa' ? 'bg-sky-500/20 text-white font-bold ring-1 ring-sky-400' : 'text-slate-400'
                  }`}>
                    <span>• Delgadez Severa</span>
                    <span className="font-mono">Menor a 16.0</span>
                  </div>
                  <div className={`flex justify-between py-1 px-2 rounded-lg transition-colors ${
                    bmiInfo.subCategory === 'Delgadez Moderada' ? 'bg-sky-500/20 text-white font-bold ring-1 ring-sky-400' : 'text-slate-400'
                  }`}>
                    <span>• Delgadez Moderada</span>
                    <span className="font-mono">De 16.0 a 16.99</span>
                  </div>
                  <div className={`flex justify-between py-1 px-2 rounded-lg transition-colors ${
                    bmiInfo.subCategory === 'Delgadez Aceptable' ? 'bg-sky-500/20 text-white font-bold ring-1 ring-sky-400' : 'text-slate-400'
                  }`}>
                    <span>• Delgadez Aceptable</span>
                    <span className="font-mono">De 17.0 a 18.49</span>
                  </div>
                </div>
              </div>

              {/* 2. Peso Saludable */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-emerald-400">
                  <span>Peso Saludable</span>
                  {bmiInfo.mainCategory === 'Peso Saludable' && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full border border-emerald-500/40 font-bold">
                      Tu Estado Actual
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-xs pl-2">
                  <div className={`flex justify-between py-1 px-2 rounded-lg transition-colors ${
                    bmiInfo.subCategory === 'Normopeso (Peso Normal)' ? 'bg-emerald-500/20 text-white font-bold ring-1 ring-emerald-400' : 'text-slate-400'
                  }`}>
                    <span>• Normopeso (Peso Normal)</span>
                    <span className="font-mono">De 18.5 a 24.99</span>
                  </div>
                </div>
              </div>

              {/* 3. Exceso de Peso */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-amber-400">
                  <span>Exceso de Peso (IMC de 25.0 en adelante)</span>
                  {bmiInfo.mainCategory === 'Exceso de Peso' && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded-full border border-amber-500/40 font-bold">
                      Tu Estado Actual
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-xs pl-2">
                  <div className={`flex justify-between py-1 px-2 rounded-lg transition-colors ${
                    bmiInfo.subCategory === 'Sobrepeso (Preobesidad)' ? 'bg-amber-500/20 text-white font-bold ring-1 ring-amber-400' : 'text-slate-400'
                  }`}>
                    <span>• Sobrepeso (Preobesidad)</span>
                    <span className="font-mono">De 25.0 a 29.99</span>
                  </div>
                  <div className={`flex justify-between py-1 px-2 rounded-lg transition-colors ${
                    bmiInfo.subCategory === 'Obesidad Clase I (Leve)' ? 'bg-orange-500/20 text-white font-bold ring-1 ring-orange-400' : 'text-slate-400'
                  }`}>
                    <span>• Obesidad Clase I (Leve)</span>
                    <span className="font-mono">De 30.0 a 34.99</span>
                  </div>
                  <div className={`flex justify-between py-1 px-2 rounded-lg transition-colors ${
                    bmiInfo.subCategory === 'Obesidad Clase II (Severa)' ? 'bg-rose-500/20 text-white font-bold ring-1 ring-rose-400' : 'text-slate-400'
                  }`}>
                    <span>• Obesidad Clase II (Severa)</span>
                    <span className="font-mono">De 35.0 a 39.99</span>
                  </div>
                  <div className={`flex justify-between py-1 px-2 rounded-lg transition-colors ${
                    bmiInfo.subCategory === 'Obesidad Clase III (Mórbida)' ? 'bg-red-500/25 text-white font-bold ring-1 ring-red-400' : 'text-slate-400'
                  }`}>
                    <span>• Obesidad Clase III (Mórbida)</span>
                    <span className="font-mono">De 40.0 o más</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gamification Roadmap of Tiers / Etapas */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Etapas y Niveles de Progresión</h3>
            </div>
            <p className="text-xs text-slate-400">
              Ganas estrellas ⭐ por cada serie realizada con éxito y entrenamientos completados.
            </p>

            <div className="space-y-2 pt-2">
              {LEVEL_TIERS.map(tier => {
                const isCurrent = userProfile.level_stage === tier.level;
                const isPassed = userProfile.level_stage > tier.level;

                return (
                  <div
                    key={tier.level}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 ring-1 ring-amber-500/30'
                        : isPassed
                        ? 'bg-slate-950 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tier.badge}</span>
                      <div>
                        <h4 className="font-bold text-xs">Nivel {tier.level}: {tier.title}</h4>
                        <span className="text-[10px] block">
                          {tier.minStars} a {tier.maxStars} ⭐
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isCurrent ? (
                        <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full">
                          Etapa Actual
                        </span>
                      ) : isPassed ? (
                        <span className="text-emerald-400 font-bold text-xs">✓ Superado</span>
                      ) : (
                        <span className="text-slate-500 text-xs">Bloqueado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE WORKOUT FULL-SCREEN FOCUS MODE */}
      {activeWorkoutOpen && activeRoutine && (
        <ActiveWorkoutModal
          routine={activeRoutine}
          userId={currentUser.id}
          onClose={() => setActiveWorkoutOpen(false)}
          onFinishWorkout={(starsEarned, count) => {
            setActiveWorkoutOpen(false);
            setCelebrationModal({ stars: starsEarned, exercisesCount: count });
            onRefreshData();
          }}
        />
      )}

      {/* CELEBRATION MODAL */}
      {celebrationModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <span className="text-5xl block mb-2 animate-bounce">🏆</span>
            <h3 className="text-xl font-black text-white">¡Entrenamiento Completado!</h3>
            <p className="text-xs text-slate-300 mt-1">
              Has demostrado máxima disciplina en tu sesión de hoy.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span className="text-2xl font-black text-amber-400">+{celebrationModal.stars} Estrellas</span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Tus marcas han sido registradas en tu gráfico de 1RM y el volumen se sumó a tu semana.
            </p>

            {/* Post-Workout Supplement Recommendation */}
            <div className="mb-4 p-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-left flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-black flex-shrink-0">
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-400 block uppercase tracking-wider">
                    Ventana Post-Entreno Abierta
                  </span>
                  <span className="text-[11px] text-white font-bold leading-tight line-clamp-1">
                    Creatina Creapure® con 31% DTO
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCelebrationModal(null);
                  if (onOpenStore) onOpenStore('creatina-creapure-300g');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex-shrink-0 cursor-pointer shadow-md"
              >
                Ver Promo
              </button>
            </div>

            <button
              onClick={() => {
                setCelebrationModal(null);
                setMobileTab('stats');
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
            >
              Ver Mi Progreso & Estadísticas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
