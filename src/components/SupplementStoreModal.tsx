import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, Flame, Check, Tag, Clock, ShoppingBag,
  ShieldCheck, AlertCircle, RefreshCw, Zap, ArrowRight,
  Copy, CheckCircle2, Ticket, ChevronRight, Star, Heart
} from 'lucide-react';
import { SupplementProduct, SupplementOrder, User, UserProfile } from '../types';

interface SupplementStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  userProfile?: UserProfile | null;
  initialProductId?: string | null;
  onOrderSuccess?: () => void;
}

export const SupplementStoreModal: React.FC<SupplementStoreModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  initialProductId,
  onOrderSuccess
}) => {
  const [products, setProducts] = useState<SupplementProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-orders'>('catalog');
  const [userOrders, setUserOrders] = useState<SupplementOrder[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<SupplementOrder | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(initialProductId || null);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/promotions');
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error fetching promotions', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const res = await fetch(`/api/promotions/orders/${currentUser.id}`);
      const data = await res.json();
      if (data.orders) {
        setUserOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPromotions();
      fetchUserOrders();
      if (initialProductId) {
        setHighlightedId(initialProductId);
      }
    }
  }, [isOpen, initialProductId, currentUser.id]);

  const handleReserveProduct = async (product: SupplementProduct) => {
    setReservingId(product.id);
    try {
      const res = await fetch('/api/promotions/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          productId: product.id
        })
      });

      const data = await res.json();
      if (data.success && data.order) {
        setConfirmedOrder(data.order);
        // Refresh products to show updated stock
        fetchPromotions();
        fetchUserOrders();
        if (onOrderSuccess) onOrderSuccess();
      } else {
        alert(data.error || 'No fue posible apartar el producto');
      }
    } catch (err) {
      console.error('Error reserving product', err);
    } finally {
      setReservingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!isOpen) return null;

  const categories = [
    { id: 'todos', label: 'Todos', icon: '✨' },
    { id: 'creatina', label: 'Creatina', icon: '⚡' },
    { id: 'proteina', label: 'Proteínas', icon: '🥛' },
    { id: 'preentreno', label: 'Pre-Entreno', icon: '💥' },
    { id: 'recuperacion', label: 'Recuperación', icon: '🌙' },
    { id: 'accesorios', label: 'Accesorios', icon: '🏆' }
  ];

  const filteredProducts = selectedCategory === 'todos'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-black text-lg tracking-tight">
                  Tienda FitMaster & Suplementos en Promoción
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  ⚡ OFERTAS FLASH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Creatina, proteínas y suplementación científica con descuentos de hasta el 32% para socios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside store: Catálogo vs Mis Reservas */}
        <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Catálogo en Oferta</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('my-orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'my-orders'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Mis Apartados en Mostrador</span>
              {userOrders.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black">
                  {userOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Loyalty stars badge */}
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ganas +5 ⭐ por cada suplemento apartado</span>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: CATALOG */}
          {activeTab === 'catalog' && (
            <>
              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      selectedCategory === c.id
                        ? 'bg-slate-100 text-slate-950 font-black shadow-md'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Flash Deal Alert Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm">
                      Promociones de Suplementación Activas en Recepción
                    </h4>
                    <p className="text-xs text-slate-300">
                      Aparta tu producto desde la app y liquídalo al precio de oferta al ingresar al gimnasio hoy.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Válido hasta agotar stock
                  </span>
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  Cargando promociones de suplementos...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No hay productos disponibles en esta categoría en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map(product => {
                    const isHighlighted = highlightedId === product.id;
                    const isOutOfStock = product.stock <= 0;

                    return (
                      <div
                        key={product.id}
                        className={`bg-slate-950 border rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                          isHighlighted
                            ? 'border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/30'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Top tag & discount ribbon */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${product.badgeColor}`}>
                            {product.tag}
                          </span>

                          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-xs font-black">
                            <Tag className="w-3 h-3" />
                            <span>-{product.discountPercent}% OFF</span>
                          </div>
                        </div>

                        {/* Product visual & details */}
                        <div className="flex gap-4 items-start">
                          <div className="relative flex-shrink-0">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-slate-800 shadow-lg"
                            />
                            {product.isFlashDeal && (
                              <span className="absolute -top-1.5 -left-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                                <Zap className="w-3 h-3 fill-slate-950" />
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-black text-sm leading-snug mb-1">
                              {product.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 mb-2 line-clamp-2">
                              {product.description}
                            </p>

                            <div className="flex items-center gap-2 text-[11px]">
                              <div className="flex items-center text-amber-400 font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                                <span>{product.rating}</span>
                              </div>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{product.servings}</span>
                            </div>
                          </div>
                        </div>

                        {/* Scientific Benefits bullet list */}
                        <div className="mt-4 pt-3 border-t border-slate-900/80 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Beneficios Principales:
                          </span>
                          {product.benefits.slice(0, 3).map((b, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{b}</span>
                            </div>
                          ))}
                        </div>

                        {/* Stock & Urgency indicator */}
                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {isOutOfStock ? (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Agotado en recepción
                              </span>
                            ) : (
                              <span className="text-amber-400 font-semibold flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                ¡Solo quedan <strong>{product.stock} unidades</strong>!
                              </span>
                            )}
                          </div>

                          <span className="text-slate-400 text-[10px]">
                            Ahorras ${(product.originalPrice - product.promoPrice).toFixed(2)}
                          </span>
                        </div>

                        {/* Pricing & CTA Button */}
                        <div className="mt-3 flex items-center justify-between gap-3 pt-2">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-white font-black text-xl tracking-tight">
                                ${product.promoPrice.toFixed(2)}
                              </span>
                              <span className="text-slate-500 line-through text-xs font-semibold">
                                ${product.originalPrice.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-semibold block">
                              Precio especial de atleta
                            </span>
                          </div>

                          <button
                            onClick={() => handleReserveProduct(product)}
                            disabled={isOutOfStock || reservingId === product.id}
                            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                              isOutOfStock
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20 active:scale-95'
                            }`}
                          >
                            {reservingId === product.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Apartando...</span>
                              </>
                            ) : isOutOfStock ? (
                              <span>Sin Stock</span>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Apartar Oferta</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: MY RESERVED ORDERS */}
          {activeTab === 'my-orders' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h4 className="text-white font-black text-sm mb-1">
                  Apartados Registrados en Mostrador del Gimnasio
                </h4>
                <p className="text-xs text-slate-400">
                  Muestra el código al personal de recepción para recoger tu suplemento al precio de promoción garantizado.
                </p>
              </div>

              {userOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <p className="text-xs">No tienes suplementos apartados actualmente.</p>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    Ver Ofertas Disponibles
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.map(order => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-bold text-sm">
                            {order.productName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Apartado el {new Date(order.createdAt).toLocaleDateString()} • Precio Promo: ${order.promoPrice.toFixed(2)} (Ahorraste ${order.savings.toFixed(2)})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                        <span className="font-mono text-xs text-amber-400 font-black tracking-wider">
                          {order.reservationCode}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order.reservationCode)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                          title="Copiar código de recepción"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Garantía de pureza y autenticidad certificada en recepción de FitMaster</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>

        {/* ORDER SUCCESS POPUP MODAL */}
        {confirmedOrder && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 text-center relative">
              <button
                onClick={() => setConfirmedOrder(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-white">¡Producto Apartado con Éxito!</h3>
              <p className="text-xs text-slate-300 mt-1">
                Tu precio de oferta exclusivo ha quedado reservado en el mostrador del gimnasio.
              </p>

              {/* Ticket Card */}
              <div className="my-5 p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-amber-500/50 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Código de Retiro</span>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    STOCK RESERVADO
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800 mb-3">
                  <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                    {confirmedOrder.reservationCode}
                  </span>
                  <button
                    onClick={() => copyToClipboard(confirmedOrder.reservationCode)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Producto:</span>
                    <strong className="text-white text-right">{confirmedOrder.productName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Precio Promoción:</span>
                    <strong className="text-amber-400">${confirmedOrder.promoPrice.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Ahorro Total:</span>
                    <strong className="text-emerald-400">-${confirmedOrder.savings.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Bonus Stars */}
              <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>+5 Estrellas de Fidelidad sumadas a tu perfil</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setConfirmedOrder(null);
                    setActiveTab('my-orders');
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Ver Mis Apartados
                </button>
                <button
                  onClick={() => setConfirmedOrder(null)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
                >
                  Seguir Navegando
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
