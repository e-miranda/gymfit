import React from 'react';
import {
  Bell, X, Flame, Sparkles, Tag, Check, Clock,
  ArrowRight, CheckCheck, RefreshCw, Zap
} from 'lucide-react';
import { PromoNotification } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PromoNotification[];
  onSelectNotification: (notification: PromoNotification) => void;
  onMarkAllRead: () => void;
  onTriggerTestNotification?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onSelectNotification,
  onMarkAllRead,
  onTriggerTestNotification
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-black text-sm sm:text-base">
                  Centro de Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Ofertas de creatina, suplementos y avisos del gimnasio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar: mark all read & trigger test */}
        <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-2 text-xs">
          <button
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className={`flex items-center gap-1 font-semibold text-[11px] cursor-pointer ${
              unreadCount > 0 ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Marcar todas como leídas</span>
          </button>

          {onTriggerTestNotification && (
            <button
              onClick={onTriggerTestNotification}
              className="flex items-center gap-1 font-bold text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
              title="Simula la llegada de una notificación ocasional de suplementos en oferta"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Simular Alerta Flash</span>
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No tienes notificaciones en este momento.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  onSelectNotification(n);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start relative group ${
                  !n.read
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/30'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {!n.read && (
                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}

                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-lg">
                  {n.iconType === 'creatina' ? '⚡' : n.iconType === 'proteina' ? '🥛' : n.iconType === 'fire' ? '🔥' : '🏷️'}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-white font-bold text-xs leading-snug truncate">
                      {n.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mb-2">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-amber-400 font-black">
                        ${n.promoPrice.toFixed(2)}
                      </span>
                      <span className="text-slate-500 text-[10px] line-through">
                        ${n.originalPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {n.discountText}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {n.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-center">
          <p className="text-[10px] text-slate-400">
            Las promociones relámpago se anuncian periódicamente para socios activos.
          </p>
        </div>
      </div>
    </div>
  );
};
