import React, { useEffect, useState } from 'react';
import { Sparkles, X, Clock, Flame, Tag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PromoNotification, SupplementProduct } from '../types';

interface PromoNotificationToastProps {
  notification: PromoNotification | null;
  product?: SupplementProduct | null;
  onOpenStore: (productId?: string) => void;
  onDismiss: () => void;
}

export const PromoNotificationToast: React.FC<PromoNotificationToastProps> = ({
  notification,
  product,
  onOpenStore,
  onDismiss
}) => {
  const [timeLeft, setTimeLeft] = useState(15); // Auto-dismiss countdown in seconds

  useEffect(() => {
    if (!notification) return;
    setTimeLeft(15);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [notification?.id]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[92vw] sm:w-96 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 rounded-3xl p-4 shadow-2xl shadow-amber-500/20 backdrop-blur-xl relative overflow-hidden">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Flame className="w-3 h-3 text-amber-400" />
              Notificación Flash del Gym
            </span>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex gap-3 items-start my-2">
          {product?.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={notification.title}
              className="w-16 h-16 rounded-2xl object-cover border border-amber-500/40 flex-shrink-0 shadow-md"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 text-2xl">
              ⚡
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-xs leading-tight mb-1 line-clamp-2">
              {notification.title}
            </h4>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              {notification.message}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-amber-400 font-black text-sm">
                ${notification.promoPrice.toFixed(2)}
              </span>
              <span className="text-slate-500 text-[11px] line-through">
                ${notification.originalPrice.toFixed(2)}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {notification.discountText}
              </span>
            </div>
          </div>
        </div>

        {/* Action button & countdown */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="w-3 h-3 text-amber-400/80" />
            <span>Cierra en {timeLeft}s</span>
          </div>

          <button
            onClick={() => {
              onOpenStore(notification.productId);
              onDismiss();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <span>Ver Oferta</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
