import React, { useState } from 'react';
import {
  Smartphone, Monitor, Shield, Award, Users,
  Dumbbell, Info, X, Zap, Database, Server,
  Bell, Flame, ShoppingBag
} from 'lucide-react';
import { Role, User, UserProfile } from '../types';

interface HeaderBarProps {
  currentUser: User;
  allUsers: (User & { profile: UserProfile | null })[];
  viewMode: 'mobile' | 'desktop';
  onSelectUser: (user: User) => void;
  onToggleViewMode: (mode: 'mobile' | 'desktop') => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenStore?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentUser,
  allUsers,
  viewMode,
  onSelectUser,
  onToggleViewMode,
  unreadCount = 0,
  onOpenNotifications,
  onOpenStore
}) => {
  const [showArchModal, setShowArchModal] = useState(false);

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Architecture Tag */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-black text-base tracking-tight leading-none">
                    FitMaster <span className="text-emerald-400 font-mono text-xs">OS</span>
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Ecosistema Híbrido
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Entrenamientos Biomecánicos por Sexo & IA Adaptativa
                </p>
              </div>
            </div>

            {/* Architecture Info Button */}
            <button
              onClick={() => setShowArchModal(true)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
              title="Ver Arquitectura Técnica de Microservicios"
            >
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[11px] font-semibold">Arquitectura</span>
            </button>
          </div>

          {/* Controls: Role / User Switcher & View Mode */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* User / Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-2xl">
              <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Usuario:</span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const target = allUsers.find(u => u.id === parseInt(e.target.value));
                  if (target) onSelectUser(target);
                }}
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
              >
                {allUsers.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                    {u.role === 'admin' ? '👑 ' : u.role === 'trainer' ? '👨‍🏫 ' : '🏃 '}
                    {u.name} ({u.role === 'admin' ? 'ADMIN' : u.role === 'trainer' ? 'ENTRENADOR' : 'ATLETA'})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle: Mobile App Preview vs Web Desktop */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => onToggleViewMode('mobile')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'mobile'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Simular Experiencia Móvil de React Native"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">App Móvil</span>
              </button>

              <button
                onClick={() => onToggleViewMode('desktop')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'desktop'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Panel Web Panorámico de Recepción / Entrenador"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Panel Web</span>
              </button>
            </div>

            {/* Suplementos / Promociones Button */}
            {onOpenStore && (
              <button
                onClick={onOpenStore}
                className="px-3 py-1.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Ver suplementos y promociones con descuento"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Ofertas Gym</span>
              </button>
            )}

            {/* Notification Bell */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                title="Notificaciones de ofertas y promociones"
              >
                <Bell className="w-4 h-4 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ARCHITECTURE MODAL */}
      {showArchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowArchModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ecosistema Tecnológico Híbrido ($0 en IA)</h3>
                <p className="text-xs text-slate-400">Arquitectura de microservicios con motor de reglas algorítmico local</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4" /> Frontend Web (Laravel 11 + Livewire)
                </span>
                <p className="text-slate-300">
                  Panel centralizado para administración. Maneja membresías, pagos, altas de socios y el catálogo maestro de ejercicios. Enfoque Mobile-First para tabletas de recepción.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> App Móvil (React Native)
                </span>
                <p className="text-slate-300">
                  Modo Enfoque Activo, cronómetro flotante nativo en cuenta regresiva para descansos, gráficas descentralizadas de 1RM, volumen semanal acumulado y consistencia.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Microservicio IA (Python + FastAPI)
                </span>
                <p className="text-slate-300">
                  Intenta generar la rutina con Google Gemini 3.8 Flash. Si la cuota se satura o la API falla, activa en milisegundos el <strong>Motor Algorítmico Local (Código puro a Costo Cero)</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4" /> Base de Datos Central (PostgreSQL)
                </span>
                <p className="text-slate-300">
                  Tablas relacionales: users, user_profiles, exercises, exercise_objective_tags, workout_routines, workout_exercises, user_progress_logs.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowArchModal(false)}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
