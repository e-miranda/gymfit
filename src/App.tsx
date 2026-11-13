/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { MobileClientView } from './components/MobileClientView';
import { TrainerDashboard } from './components/TrainerDashboard';
import { AdminWebPanel } from './components/AdminWebPanel';
import { PromoNotificationToast } from './components/PromoNotificationToast';
import { SupplementStoreModal } from './components/SupplementStoreModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { User, UserProfile, WorkoutRoutine, Exercise, PaymentRecord, PromoNotification, SupplementProduct } from './types';
import { ShieldAlert, CreditCard, RefreshCw, Smartphone, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [allUsers, setAllUsers] = useState<(User & { profile: UserProfile | null })[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  // Supplement Promotions & Occasional Notifications state
  const [promoNotifications, setPromoNotifications] = useState<PromoNotification[]>([]);
  const [promoProducts, setPromoProducts] = useState<SupplementProduct[]>([]);
  const [activeToast, setActiveToast] = useState<{ notification: PromoNotification; product?: SupplementProduct } | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [selectedStoreProductId, setSelectedStoreProductId] = useState<string | null>(null);

  const [statsData, setStatsData] = useState<{
    oneRmHistory: Record<string, any[]>;
    volumeByMuscle: Record<string, number>;
    heatmapData: Record<string, number>;
  }>({
    oneRmHistory: {},
    volumeByMuscle: {},
    heatmapData: {}
  });

  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const fetchData = async () => {
    try {
      // 1. Fetch Users
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      const loadedUsers = usersData.users || [];
      setAllUsers(loadedUsers);

      // Default user: Alejandro Gómez (id:3) or first client
      const initialClient = loadedUsers.find((u: User) => u.id === 3) || loadedUsers[0];
      if (!currentUser && initialClient) {
        setCurrentUser(initialClient);
      }

      // 2. Fetch Exercises
      const exRes = await fetch('/api/exercises');
      const exData = await exRes.json();
      setExercises(exData.exercises || []);

      // 3. Fetch Payments
      const payRes = await fetch('/api/payments');
      const payData = await payRes.json();
      setPayments(payData.payments || []);

      // 4. Fetch Supplement Promotions & Notifications
      const promoRes = await fetch('/api/promotions');
      const promoData = await promoRes.json();
      if (promoData.products) setPromoProducts(promoData.products);
      if (promoData.notifications) setPromoNotifications(promoData.notifications);
    } catch (err) {
      console.error('Error loading initial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When currentUser changes, fetch their specific profile, routines, and stats
  const fetchUserData = async (userId: number) => {
    try {
      // Profile
      const profRes = await fetch(`/api/users/${userId}/profile`);
      const profData = await profRes.json();
      if (profData.profile) setCurrentProfile(profData.profile);

      // Routines
      const routRes = await fetch(`/api/users/${userId}/routines`);
      const routData = await routRes.json();
      if (routData.routines) setRoutines(routData.routines);

      // Stats (1RM, Volume, Consistency Heatmap)
      const statsRes = await fetch(`/api/progress/stats/${userId}`);
      const statsJson = await statsRes.json();
      setStatsData({
        oneRmHistory: statsJson.oneRmHistory || {},
        volumeByMuscle: statsJson.volumeByMuscle || {},
        heatmapData: statsJson.heatmapData || {}
      });
    } catch (e) {
      console.error('Error loading user specific data', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserData(currentUser.id);
    }
  }, [currentUser]);

  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.profile) {
        setCurrentProfile(data.profile);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    // If switching to admin or trainer, default viewMode can be desktop
    if (user.role === 'admin' || user.role === 'trainer') {
      setViewMode('desktop');
    } else {
      setViewMode('mobile');
    }
  };

  // Quick reactivation if user had membership 'vencido'
  const handleQuickReactivate = async (userId: number) => {
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          amount: 55,
          method: 'Tarjeta',
          plan_type: 'Mensual VIP'
        })
      });
      fetchData();
      if (currentUser) fetchUserData(currentUser.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Open Store Modal with optional specific product preselection
  const handleOpenStore = (productId?: string) => {
    setSelectedStoreProductId(productId || null);
    setStoreOpen(true);
    setActiveToast(null);
  };

  // Trigger flash deal announcement (occasional or manual by coach)
  const handleTriggerFlash = async (productId?: string) => {
    try {
      const res = await fetch('/api/promotions/trigger-flash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success && data.notification) {
        setPromoNotifications(prev => [data.notification, ...prev.filter(n => n.id !== data.notification.id)]);
        setActiveToast({ notification: data.notification, product: data.product });
      }
    } catch (err) {
      console.error('Error triggering flash promo', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/promotions/mark-read', { method: 'POST' });
      setPromoNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Occasional promotional notifications:
  // "suelen salir como notificaciones solo algunas veces"
  // 1. Initial subtle arrival after 8 seconds on app start
  // 2. Occasional periodic probability check (every 55s, 35% chance to appear)
  useEffect(() => {
    if (promoNotifications.length === 0) return;

    // First arrival after 8 seconds of browsing
    const initialTimer = setTimeout(() => {
      const topNotif = promoNotifications[0];
      const prod = promoProducts.find(p => p.id === topNotif.productId);
      setActiveToast({ notification: topNotif, product: prod });
    }, 8000);

    // Occasional periodic trigger (35% probability every 55 seconds)
    const periodicInterval = setInterval(() => {
      const shouldTrigger = Math.random() < 0.35;
      if (shouldTrigger && promoNotifications.length > 0) {
        const randomNotif = promoNotifications[Math.floor(Math.random() * promoNotifications.length)];
        const prod = promoProducts.find(p => p.id === randomNotif.productId);
        setActiveToast({ notification: randomNotif, product: prod });
      }
    }, 55000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(periodicInterval);
    };
  }, [promoNotifications.length, promoProducts]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <h2 className="text-sm font-bold text-slate-300">Inicializando Ecosistema FitMaster...</h2>
        <p className="text-xs text-slate-500">Cargando catálogo biomecánico y base de datos relacional</p>
      </div>
    );
  }

  // Check if athlete membership is expired (Simulating Google OAuth verification failure)
  const isExpiredClient = (currentUser.role === 'atleta' || currentUser.role === 'client') && currentUser.membership_status === 'vencido';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar with multi-role switcher & device toggle */}
      <HeaderBar
        currentUser={currentUser}
        allUsers={allUsers}
        viewMode={viewMode}
        onSelectUser={handleSelectUser}
        onToggleViewMode={setViewMode}
        unreadCount={promoNotifications.filter(n => !n.read).length}
        onOpenNotifications={() => setNotificationCenterOpen(true)}
        onOpenStore={() => handleOpenStore()}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6 px-4 max-w-7xl mx-auto w-full">
        {/* MEMBERSHIP EXPIRED SCREEN (Google OAuth Check Failure) */}
        {isExpiredClient ? (
          <div className="max-w-md mx-auto my-12 bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Acceso Bloqueado por Laravel Backend
              </span>
              <h2 className="text-xl font-black text-white mt-2">Membresía Vencida</h2>
              <p className="text-xs text-slate-400 mt-1">
                Hola {currentUser.name}, tu sesión con Google fue validada, pero tu cuota mensual se encuentra vencida en recepción.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Estado actual:</span>
                <strong className="text-rose-400 uppercase font-bold">Vencido</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Plan habitual:</span>
                <span className="text-white">Mensual VIP ($55 USD)</span>
              </div>
            </div>

            <button
              onClick={() => handleQuickReactivate(currentUser.id)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Simular Pago de Cuota en Recepción ($55)
            </button>
          </div>
        ) : (
          <>
            {/* 1. ADMIN ROLE VIEW */}
            {currentUser.role === 'admin' ? (
              <AdminWebPanel
                allUsers={allUsers}
                payments={payments}
                exercises={exercises}
                onRefreshData={() => {
                  fetchData();
                  if (currentUser) fetchUserData(currentUser.id);
                }}
              />
            ) : currentUser.role === 'trainer' ? (
              /* 2. TRAINER ROLE VIEW */
              <TrainerDashboard
                currentUser={currentUser}
                allUsers={allUsers}
                exercisesCatalog={exercises}
                onRefreshData={() => {
                  fetchData();
                  if (currentUser) fetchUserData(currentUser.id);
                }}
              />
            ) : (
              /* 3. CLIENT ROLE VIEW: Mobile Frame or Fullscreen Web */
              viewMode === 'mobile' ? (
                /* Native Smartphone Frame Simulator for React Native */
                <div className="flex justify-center items-center py-2">
                  <div className="w-full max-w-[430px] bg-slate-950 border-[6px] border-slate-800 rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden relative p-3">
                    {/* Simulated iPhone / Android Dynamic Island / Notch */}
                    <div className="h-6 w-full flex items-center justify-between px-6 pt-1 text-[11px] font-bold text-slate-400">
                      <span>9:41</span>
                      <div className="w-20 h-4 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-2 rounded-xs bg-emerald-400"></span>
                        <span className="text-[10px]">5G</span>
                      </div>
                    </div>

                    {/* Smartphone Content */}
                    <div className="py-2 max-h-[820px] overflow-y-auto no-scrollbar">
                      {currentProfile && (
                        <MobileClientView
                          currentUser={currentUser}
                          userProfile={currentProfile}
                          routines={routines}
                          exercisesCatalog={exercises}
                          statsData={statsData}
                          onUpdateProfile={handleUpdateProfile}
                          onRefreshRoutines={() => fetchUserData(currentUser.id)}
                          onRefreshData={() => {
                            fetchData();
                            fetchUserData(currentUser.id);
                          }}
                          onOpenStore={handleOpenStore}
                        />
                      )}
                    </div>

                    {/* Bottom Home Indicator Bar */}
                    <div className="h-4 w-full flex items-center justify-center pt-1">
                      <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fullscreen Web Tablet View for Clients */
                <div className="max-w-4xl mx-auto">
                  {currentProfile && (
                    <MobileClientView
                      currentUser={currentUser}
                      userProfile={currentProfile}
                      routines={routines}
                      exercisesCatalog={exercises}
                      statsData={statsData}
                      onUpdateProfile={handleUpdateProfile}
                      onRefreshRoutines={() => fetchUserData(currentUser.id)}
                      onRefreshData={() => {
                        fetchData();
                        fetchUserData(currentUser.id);
                      }}
                      onOpenStore={handleOpenStore}
                    />
                  )}
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        <p>FitMaster Gym OS • Arquitectura Híbrida: Laravel 11 + React Native + Gemini 3.8 / Python + PostgreSQL</p>
      </footer>

      {/* OCCASIONAL FLASH PROMO NOTIFICATION TOAST */}
      <PromoNotificationToast
        notification={activeToast?.notification || null}
        product={activeToast?.product || null}
        onOpenStore={(prodId) => handleOpenStore(prodId)}
        onDismiss={() => setActiveToast(null)}
      />

      {/* SUPPLEMENT PROMO STORE & RESERVATIONS MODAL */}
      <SupplementStoreModal
        isOpen={storeOpen}
        onClose={() => setStoreOpen(false)}
        currentUser={currentUser}
        userProfile={currentProfile}
        initialProductId={selectedStoreProductId}
        onOrderSuccess={() => {
          fetchData();
          if (currentUser) fetchUserData(currentUser.id);
        }}
      />

      {/* NOTIFICATIONS CENTER MODAL */}
      <NotificationCenterModal
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
        notifications={promoNotifications}
        onSelectNotification={(notif) => {
          handleOpenStore(notif.productId);
        }}
        onMarkAllRead={handleMarkAllRead}
        onTriggerTestNotification={() => handleTriggerFlash()}
      />
    </div>
  );
}
