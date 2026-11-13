import React, { useState } from 'react';
import {
  Users, CreditCard, Dumbbell, UserPlus, CheckCircle2,
  XCircle, AlertCircle, Plus, Search, ShieldCheck, DollarSign
} from 'lucide-react';
import { Exercise, MembershipStatus, PaymentRecord, User, UserProfile } from '../types';

interface AdminWebPanelProps {
  allUsers: (User & { profile: UserProfile | null })[];
  payments: PaymentRecord[];
  exercises: Exercise[];
  onRefreshData: () => void;
}

export const AdminWebPanel: React.FC<AdminWebPanelProps> = ({
  allUsers,
  payments,
  exercises,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'payments' | 'exercises' | 'new_user'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserGender, setNewUserGender] = useState<'hombre' | 'mujer' | 'otro'>('hombre');
  const [newUserObjective, setNewUserObjective] = useState('hipertrofia');
  const [newUserDays, setNewUserDays] = useState(4);

  // New Exercise Form State
  const [showNewExerciseModal, setShowNewExerciseModal] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('Cuádriceps');
  const [newExEquipment, setNewExEquipment] = useState<'barra' | 'mancuerna' | 'polea' | 'maquina' | 'peso_corporal'>('maquina');
  const [newExBannedInjuries, setNewExBannedInjuries] = useState<string[]>([]);
  const [newExDesc, setNewExDesc] = useState('');

  // Quick Payment Form State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payUserId, setPayUserId] = useState<number>(allUsers[0]?.id || 1);
  const [payAmount, setPayAmount] = useState<number>(55);
  const [payMethod, setPayMethod] = useState<'Tarjeta' | 'Transferencia' | 'Efectivo'>('Tarjeta');
  const [payPlan, setPayPlan] = useState<'Mensual VIP' | 'Trimestral Pro' | 'Anual Élite'>('Mensual VIP');

  // Change Membership Status
  const handleUpdateMembership = async (userId: number, newStatus: MembershipStatus) => {
    try {
      const res = await fetch(`/api/users/${userId}/membership`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Membresía actualizada a '${newStatus}' con éxito.`);
        setTimeout(() => setStatusMessage(null), 3000);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          phone: newUserPhone,
          gender: newUserGender,
          objective: newUserObjective,
          days: newUserDays,
          membership_status: 'activo'
        })
      });
      const data = await res.json();
      if (data.user) {
        setStatusMessage(`¡Socio ${newUserName} registrado y rutina inicial autogenerada!`);
        setTimeout(() => setStatusMessage(null), 3500);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPhone('');
        setActiveTab('users');
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit New Payment
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: payUserId,
          amount: payAmount,
          method: payMethod,
          plan_type: payPlan
        })
      });
      const data = await res.json();
      if (data.payment) {
        setStatusMessage('¡Pago registrado con éxito y membresía reactivada!');
        setTimeout(() => setStatusMessage(null), 3000);
        setShowPaymentModal(false);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit New Exercise
  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName) return;

    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newExName,
          muscle_group: newExMuscle,
          equipment_needed: newExEquipment,
          banned_for_injuries: newExBannedInjuries,
          description: newExDesc || 'Ejercicio agregado al catálogo maestro.'
        })
      });
      const data = await res.json();
      if (data.exercise) {
        setStatusMessage(`Ejercicio '${newExName}' agregado con sus restricciones biomecánicas.`);
        setTimeout(() => setStatusMessage(null), 3000);
        setShowNewExerciseModal(false);
        setNewExName('');
        setNewExBannedInjuries([]);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCollected = payments.reduce((acc, p) => acc + (p.status === 'Completado' ? p.amount : 0), 0);
  const activeMembersCount = allUsers.filter(u => u.membership_status === 'activo' && (u.role === 'atleta' || u.role === 'client')).length;
  const expiredMembersCount = allUsers.filter(u => u.membership_status === 'vencido' && (u.role === 'atleta' || u.role === 'client')).length;

  return (
    <div className="space-y-6">
      {/* Top Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Panel Central de Administración (Laravel 11 + Livewire)
              </span>
              <h1 className="text-xl md:text-2xl font-black text-white mt-1">
                Control de Recepción, Membresías y Catálogo Maestro
              </h1>
              <p className="text-xs text-slate-400">
                Diseñado para tabletas de recepción y administradores: valida acceso con Google OAuth y estados de cuenta.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase">Activos</span>
              <p className="text-base font-bold text-emerald-400">{activeMembersCount}</p>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase">Vencidos</span>
              <p className="text-base font-bold text-rose-400">{expiredMembersCount}</p>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 uppercase">Recaudado</span>
              <p className="text-base font-bold text-amber-400">${totalCollected}</p>
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {statusMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Socios y Membresías ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Caja y Pagos ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('exercises')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'exercises'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Catálogo Maestro ({exercises.length})
        </button>

        <button
          onClick={() => setActiveTab('new_user')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto ${
            activeTab === 'new_user'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Alta de Atleta en Recepción
        </button>
      </div>

      {/* TAB 1: USERS & MEMBERSHIPS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4" />
              Cobrar Cuota / Renovar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Socio</th>
                  <th className="py-3 px-3">Rol</th>
                  <th className="py-3 px-3">Estado Membresía</th>
                  <th className="py-3 px-3">Perfil & Objetivo</th>
                  <th className="py-3 px-3">Estrellas & Nivel</th>
                  <th className="py-3 px-3 text-right">Acción de Recepción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map(user => {
                  const prof = user.profile;
                  return (
                    <tr key={user.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt={user.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-700"
                          />
                          <div>
                            <span className="font-bold text-white block">{user.name}</span>
                            <span className="text-[11px] text-slate-400">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize font-semibold text-slate-300">
                          {user.role === 'admin' ? 'Dueño/Admin' : user.role === 'trainer' ? 'Entrenador' : 'Atleta'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          user.membership_status === 'activo'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : user.membership_status === 'vencido'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-600'
                        }`}>
                          {user.membership_status === 'activo' && <CheckCircle2 className="w-3 h-3" />}
                          {user.membership_status === 'vencido' && <AlertCircle className="w-3 h-3" />}
                          {user.membership_status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300 capitalize block">
                          {prof?.gender === 'mujer' ? 'Mujer' : 'Hombre'} • {prof?.current_objective || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {prof?.available_days || 3} días/sem • {prof?.active_injuries?.length || 0} lesiones
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-amber-400 font-bold block">
                          ⭐ {prof?.stars || 0} estrellas
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Etapa {prof?.level_stage || 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5">
                        {user.membership_status !== 'activo' && (
                          <button
                            onClick={() => handleUpdateMembership(user.id, 'activo')}
                            className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold border border-emerald-500/30"
                          >
                            Activar
                          </button>
                        )}
                        {user.membership_status !== 'vencido' && (
                          <button
                            onClick={() => handleUpdateMembership(user.id, 'vencido')}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-[11px] font-semibold border border-rose-500/30"
                          >
                            Vencer
                          </button>
                        )}
                        {user.membership_status !== 'suspendido' && (
                          <button
                            onClick={() => handleUpdateMembership(user.id, 'suspendido')}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-[11px] font-semibold"
                          >
                            Suspender
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS & CASH */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-sm">Libro de Pagos y Membresías</h3>
              <p className="text-xs text-slate-400">Control de cuotas cobradas en recepción o pasarela.</p>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Pago
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Socio</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">Monto</th>
                  <th className="py-3 px-3">Método</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-850">
                    <td className="py-2.5 px-3 font-mono text-slate-500">#{pay.id}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{pay.userName}</td>
                    <td className="py-2.5 px-3 text-slate-300">{pay.plan_type}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">${pay.amount}.00</td>
                    <td className="py-2.5 px-3 text-slate-300">{pay.method}</td>
                    <td className="py-2.5 px-3 text-slate-400">{pay.date}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pay.status === 'Completado'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXERCISES CATALOG */}
      {activeTab === 'exercises' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-sm">Catálogo Maestro del Gimnasio</h3>
              <p className="text-xs text-slate-400">
                Lógica biomecánica: define equipamiento y qué lesiones médicas excluyen este ejercicio.
              </p>
            </div>
            <button
              onClick={() => setShowNewExerciseModal(true)}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Ejercicio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exercises.map(ex => (
              <div key={ex.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {ex.muscle_group}
                    </span>
                    <h4 className="text-white font-bold text-sm mt-1">{ex.name}</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 capitalize">{ex.equipment_needed}</span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">{ex.description}</p>

                {/* Injury restrictions */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                    Restricciones de Lesión:
                  </span>
                  {ex.banned_for_injuries.length === 0 ? (
                    <span className="text-[11px] text-emerald-400 font-medium">✓ Seguro para todas las lesiones</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {ex.banned_for_injuries.map(b => (
                        <span key={b} className="text-[10px] px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                          🚫 {b.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NEW USER REGISTRATION */}
      {activeTab === 'new_user' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Alta Rápida de Nuevo Atleta en Recepción</h2>
              <p className="text-xs text-slate-400">
                Al registrar al atleta, el sistema genera de inmediato su token y rutina adaptativa inicial.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Valeria Mendoza"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Correo Electrónico (Google ID)</label>
                <input
                  type="email"
                  required
                  placeholder="valeria.mendoza@gmail.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="+52 55 9876 5432"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Sexo (Biomecánica)</label>
                <select
                  value={newUserGender}
                  onChange={(e) => setNewUserGender(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="hombre">Hombre (Torso / Empuje / Cargas)</option>
                  <option value="mujer">Mujer (Glúteos / Cadena Posterior / Estabilidad)</option>
                  <option value="otro">Otro / Neutro</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Objetivo Inicial (5 Módulos)</label>
                <select
                  value={newUserObjective}
                  onChange={(e) => setNewUserObjective(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="hipertrofia">Ganancia Muscular (Hipertrofia)</option>
                  <option value="fuerza">Fuerza Máxima</option>
                  <option value="grasa">Pérdida de Grasa / Recomposición</option>
                  <option value="resistencia">Resistencia Muscular</option>
                  <option value="postura">Salud General y Postura</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">Días Disponibles por Semana</label>
                <select
                  value={newUserDays}
                  onChange={(e) => setNewUserDays(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value={2}>2 Días por semana (Iniciación / Mantenimiento)</option>
                  <option value={3}>3 Días por semana</option>
                  <option value={4}>4 Días por semana (Recomendado)</option>
                  <option value={5}>5 Días por semana</option>
                  <option value={6}>6 Días por semana (Atletas Avanzados)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-600 cursor-pointer"
              >
                Completar Registro y Activar Membresía
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: COBRAR CUOTA / REGISTRAR PAGO */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Registrar Cobro de Membresía</h3>
            <p className="text-xs text-slate-400 mb-4">
              Al cobrar la cuota, el socio se reactiva instantáneamente para ingresar a la app.
            </p>

            <form onSubmit={handleRegisterPayment} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Socio</label>
                <select
                  value={payUserId}
                  onChange={(e) => setPayUserId(parseInt(e.target.value))}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs"
                >
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.membership_status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Plan</label>
                <select
                  value={payPlan}
                  onChange={(e) => {
                    const plan = e.target.value as any;
                    setPayPlan(plan);
                    if (plan === 'Mensual VIP') setPayAmount(55);
                    if (plan === 'Trimestral Pro') setPayAmount(140);
                    if (plan === 'Anual Élite') setPayAmount(480);
                  }}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Mensual VIP">Mensual VIP ($55 USD)</option>
                  <option value="Trimestral Pro">Trimestral Pro ($140 USD)</option>
                  <option value="Anual Élite">Anual Élite ($480 USD)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Monto ($ USD)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Método de Pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo en Recepción</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO EJERCICIO EN CATÁLOGO */}
      {showNewExerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Nuevo Ejercicio en Catálogo Maestro</h3>
            <p className="text-xs text-slate-400 mb-4">
              Asigna sus restricciones mecánicas para que el motor de IA y el motor local filtren adecuadamente.
            </p>

            <form onSubmit={handleCreateExercise} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Nombre del Ejercicio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Peso Muerto Sumo con Barra"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Grupo Muscular</label>
                  <select
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="Cuádriceps">Cuádriceps</option>
                    <option value="Glúteos">Glúteos</option>
                    <option value="Femoral">Femoral / Isquios</option>
                    <option value="Pectoral">Pectoral</option>
                    <option value="Dorsales">Dorsales</option>
                    <option value="Hombros">Hombros</option>
                    <option value="Bíceps">Bíceps</option>
                    <option value="Tríceps">Tríceps</option>
                    <option value="Core">Core</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Equipamiento</label>
                  <select
                    value={newExEquipment}
                    onChange={(e) => setNewExEquipment(e.target.value as any)}
                    className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="barra">Barra Olímpica</option>
                    <option value="mancuerna">Mancuernas</option>
                    <option value="polea">Poleas</option>
                    <option value="maquina">Máquina</option>
                    <option value="peso_corporal">Peso Corporal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Prohibido para Lesiones Activas (Restricción Médica):
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {['lesion_rodilla', 'molestia_hombro', 'lumbar', 'cervical', 'muneca', 'codo'].map(injury => {
                    const isChecked = newExBannedInjuries.includes(injury);
                    return (
                      <label key={injury} className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setNewExBannedInjuries(prev => [...prev, injury]);
                            else setNewExBannedInjuries(prev => prev.filter(i => i !== injury));
                          }}
                          className="rounded text-amber-500"
                        />
                        <span>{injury.replace('_', ' ')}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Descripción / Técnica</label>
                <textarea
                  rows={2}
                  value={newExDesc}
                  onChange={(e) => setNewExDesc(e.target.value)}
                  placeholder="Detalles de ejecución biomecánica..."
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewExerciseModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow"
                >
                  Guardar Ejercicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
