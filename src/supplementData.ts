import { SupplementProduct, PromoNotification } from './types';

export const INITIAL_SUPPLEMENT_PRODUCTS: SupplementProduct[] = [
  {
    id: 'creatina-creapure-300g',
    name: 'Creatina Creapure® Micronizada 300g',
    category: 'creatina',
    tag: '🔥 OFERTA FLASH GYM',
    originalPrice: 42.0,
    promoPrice: 28.99,
    discountPercent: 31,
    stock: 5,
    description: '100% Monohidrato de Creatina con sello Creapure® de máxima pureza alemana. Incrementa la fuerza explosiva, retrasa la fatiga y optimiza la síntesis de ATP en series pesadas.',
    benefits: [
      '+15% Fuerza máxima y rendimiento en series de 1RM',
      'Voluminización celular intracelular e hidratación muscular',
      'Certificación Creapure® libre de impurezas y metales pesados',
      'Sin sabor, disolución instantánea en agua o batido'
    ],
    servings: '60 servicios (5g por toma diaria)',
    rating: 4.95,
    reviewsCount: 142,
    imageUrl: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    expiresInHours: 4,
    isFlashDeal: true
  },
  {
    id: 'whey-isolate-hydro-2kg',
    name: 'Whey Protein Isolate 100% Hidrolizada 2kg',
    category: 'proteina',
    tag: '⚡ LIQUIDACIÓN STOCK',
    originalPrice: 68.0,
    promoPrice: 49.99,
    discountPercent: 26,
    stock: 8,
    description: 'Aislado de proteína de suero ultra-filtrado con 27g de proteína pura por scoop, 0g azúcares añadidos y rica en aminoácidos de cadena ramificada (BCAA).',
    benefits: [
      '27g de Proteína Isolate pura por servicio',
      'Absorción ultrarrápida post-entreno en menos de 20 min',
      'Cero lactosa, cero gluten y libre de hinchazón',
      'Enzimas digestivas DigeZyme® añadidas'
    ],
    servings: '66 servicios (30g por scoop)',
    rating: 4.9,
    reviewsCount: 98,
    imageUrl: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    expiresInHours: 8,
    isFlashDeal: true
  },
  {
    id: 'preworkout-nitro-extreme',
    name: 'Pre-Workout Nitro Extreme 350g (Focus & Pump)',
    category: 'preentreno',
    tag: '💥 EXCLUSIVO SOCIOS',
    originalPrice: 38.0,
    promoPrice: 26.5,
    discountPercent: 30,
    stock: 4,
    description: 'Fórmula ergogénica pre-entrenamiento con Citrulina Malato 2:1 (6000mg), Beta-Alanina (3200mg), Cafeína Anhidra (300mg) y Tirosina para máxima vasodilatación y foco mental.',
    benefits: [
      'Vasodilatación extrema y bombeo muscular masivo',
      'Enfoque túnel y conexión mente-músculo intensificada',
      'Sin bajón de energía posterior (Crash-Free Formula)',
      'Sabor Citrus Explosion refrescante'
    ],
    servings: '35 servicios potentes',
    rating: 4.88,
    reviewsCount: 76,
    imageUrl: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&auto=format&fit=crop&q=80',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    expiresInHours: 6,
    isFlashDeal: true
  },
  {
    id: 'magnesio-zinc-d3-night',
    name: 'Pack Recuperación Nocturna: Magnesio Bisglicinato + Zinc + D3',
    category: 'recuperacion',
    tag: '🌙 RECUPERACIÓN PRO',
    originalPrice: 29.0,
    promoPrice: 19.9,
    discountPercent: 31,
    stock: 12,
    description: 'Sinergia mineral de alta biodisponibilidad para optimizar el sueño profundo REM, relajar la musculatura sobreentrenada y promover niveles hormonales saludables.',
    benefits: [
      'Magnesio Bisglicinato de máxima absorción que no altera el estómago',
      'Disminución drástica de contracturas y calambres nocturnos',
      'Optimización de la síntesis proteica durante el descanso',
      'Cápsulas 100% vegetales sin colorantes artificiales'
    ],
    servings: '120 cápsulas (tratamiento para 2 meses)',
    rating: 4.92,
    reviewsCount: 110,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    expiresInHours: 12,
    isFlashDeal: false
  },
  {
    id: 'bcaa-electrolitos-intra',
    name: 'BCAA 2:1:1 + Electrolitos Hidratación Intra-Workout 400g',
    category: 'recuperacion',
    tag: '💧 HIDRATACIÓN MÁXIMA',
    originalPrice: 34.0,
    promoPrice: 24.5,
    discountPercent: 28,
    stock: 7,
    description: 'Aminoácidos fermentados de origen vegetal enriquecidos con Sodio, Potasio, Magnesio y Agua de Coco en polvo para entrenamientos intensos de más de 45 minutos.',
    benefits: [
      'Previene el catabolismo proteico en déficit o entrenamientos intensos',
      'Restablece los electrolitos perdidos por el sudor',
      'Mejora el rendimiento en los últimos ejercicios de la sesión',
      'Sabor Sandía Glaciar helada'
    ],
    servings: '40 tomas intra-entreno',
    rating: 4.85,
    reviewsCount: 54,
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    expiresInHours: 24,
    isFlashDeal: false
  },
  {
    id: 'shaker-termico-inox',
    name: 'Shaker Pro Térmico Acero Inoxidable 750ml (Antifugas)',
    category: 'accesorios',
    tag: '🏆 EDICIÓN LIMITADA',
    originalPrice: 22.0,
    promoPrice: 14.9,
    discountPercent: 32,
    stock: 9,
    description: 'Vaso mezclador de doble pared aislante al vacío que mantiene tus batidos y bebidas frías hasta por 24 horas. Cierre hermético 100% a prueba de goteo.',
    benefits: [
      'Acero inoxidable 18/8 de grado alimentario antibacteriano',
      'Rejilla mezcladora silenciosa integrada para batidos sin grumos',
      'Grabado láser oficial del gimnasio FitMaster',
      'Libre de BPA y apto para lavavajillas'
    ],
    servings: 'Capacidad 750ml con marcas grabadas',
    rating: 4.96,
    reviewsCount: 88,
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    badgeColor: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40',
    expiresInHours: 48,
    isFlashDeal: false
  }
];

export const INITIAL_NOTIFICATIONS: PromoNotification[] = [
  {
    id: 'notif-creatina-1',
    productId: 'creatina-creapure-300g',
    title: '⚡ ¡Oferta Flash de Creatina!',
    message: 'Solo hoy: Creatina Creapure® con 31% de descuento. Solo 5 unidades en stock en recepción.',
    discountText: '-31% DTO',
    promoPrice: 28.99,
    originalPrice: 42.0,
    expiresAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    read: false,
    timestamp: 'Hace 5 min',
    iconType: 'creatina'
  },
  {
    id: 'notif-whey-2',
    productId: 'whey-isolate-hydro-2kg',
    title: '🥛 Proteína Isolate en Promoción',
    message: 'Asegura tu recuperación post-entreno con un 26% de rebaja en la Whey Hydro 2kg.',
    discountText: '-26% DTO',
    promoPrice: 49.99,
    originalPrice: 68.0,
    expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    read: false,
    timestamp: 'Hace 25 min',
    iconType: 'proteina'
  }
];
