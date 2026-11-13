import { Exercise, ExerciseObjectiveTag, LevelInfo, ObjectiveType, User, UserProfile, WorkoutRoutine, UserProgressLog, PaymentRecord, BmiCategoryInfo } from './types';

/**
 * Cálculo del IMC (Índice de Masa Corporal) con categorización clínica oficial:
 * Falta de Peso, Peso Saludable, Exceso de Peso y sus subcategorías exactas.
 */
export function calculateBMI(weightKg: number, heightCm: number): BmiCategoryInfo {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return {
      bmi: 0,
      mainCategory: 'Peso Saludable',
      subCategory: 'Normopeso (Peso Normal)',
      color: 'text-slate-400',
      badgeBg: 'bg-slate-800 text-slate-300 border border-slate-700',
      advice: 'Ingresa tu peso y altura para calcular tu IMC biomecánico.'
    };
  }

  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(2));

  // 1. Falta de Peso (IMC menor a 18.5)
  if (bmi < 18.5) {
    if (bmi < 16.0) {
      return {
        bmi,
        mainCategory: 'Falta de Peso',
        subCategory: 'Delgadez Severa',
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
        advice: 'Priorizar superávit calórico controlado y entrenamiento de hipertrofia sin fatiga excesiva.'
      };
    } else if (bmi < 17.0) {
      return {
        bmi,
        mainCategory: 'Falta de Peso',
        subCategory: 'Delgadez Moderada',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        advice: 'Enfocar en ganancia muscular limpia y fuerza básica con descanso adecuado.'
      };
    } else {
      return {
        bmi,
        mainCategory: 'Falta de Peso',
        subCategory: 'Delgadez Aceptable',
        color: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
        advice: 'Excelente base para construir masa muscular con volumen progresivo.'
      };
    }
  }

  // 2. Peso Saludable (18.5 a 24.99)
  if (bmi <= 24.99) {
    return {
      bmi,
      mainCategory: 'Peso Saludable',
      subCategory: 'Normopeso (Peso Normal)',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      advice: 'Rango óptimo para recomposición corporal, ganancia de fuerza o hipertrofia.'
    };
  }

  // 3. Exceso de Peso (25.0 en adelante)
  if (bmi <= 29.99) {
    return {
      bmi,
      mainCategory: 'Exceso de Peso',
      subCategory: 'Sobrepeso (Preobesidad)',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      advice: 'Buen potencial de fuerza; balancear con densidad metabólica y control articular.'
    };
  } else if (bmi <= 34.99) {
    return {
      bmi,
      mainCategory: 'Exceso de Peso',
      subCategory: 'Obesidad Clase I (Leve)',
      color: 'text-orange-400',
      badgeBg: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
      advice: 'Enfoque en déficit moderado, ejercicios sin impacto articular y recomposición.'
    };
  } else if (bmi <= 39.99) {
    return {
      bmi,
      mainCategory: 'Exceso de Peso',
      subCategory: 'Obesidad Clase II (Severa)',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
      advice: 'Priorizar máquinas guiadas y poleas para proteger rodillas y zona lumbar.'
    };
  } else {
    return {
      bmi,
      mainCategory: 'Exceso de Peso',
      subCategory: 'Obesidad Clase III (Mórbida)',
      color: 'text-red-500',
      badgeBg: 'bg-red-500/25 text-red-300 border border-red-500/50',
      advice: 'Supervisión médica y entrenamiento controlado de bajo impacto articular con el Coach.'
    };
  }
}

export const LEVEL_TIERS: LevelInfo[] = [
  {
    level: 1,
    title: 'Novato del Hierro',
    minStars: 0,
    maxStars: 50,
    color: 'from-amber-700 to-amber-900',
    badge: '🥉',
    perks: ['Acceso a biblioteca básica', 'Seguimiento de series y pesos']
  },
  {
    level: 2,
    title: 'Constancia Pura',
    minStars: 51,
    maxStars: 150,
    color: 'from-slate-400 to-slate-600',
    badge: '🥈',
    perks: ['Desbloqueo de 1RM dinámico', 'Cronómetro táctico de descanso']
  },
  {
    level: 3,
    title: 'Titán en Progreso',
    minStars: 151,
    maxStars: 300,
    color: 'from-yellow-500 to-amber-600',
    badge: '🥇',
    perks: ['Rutinas adaptativas con IA', 'Revisión prioritaria de Entrenador']
  },
  {
    level: 4,
    title: 'Bestia del Gym',
    minStars: 301,
    maxStars: 500,
    color: 'from-cyan-400 to-blue-600',
    badge: '💎',
    perks: ['Gráficos de volumen muscular', 'Ajuste biomecánico avanzado']
  },
  {
    level: 5,
    title: 'Leyenda Élite',
    minStars: 501,
    maxStars: 9999,
    color: 'from-purple-500 to-pink-600',
    badge: '👑',
    perks: ['Insignia Élite en Recepción', 'Plan maestro personalizado del Coach']
  }
];

export const INITIAL_EXERCISES: Exercise[] = [
  // Pierna / Glúteo / Cadena Posterior
  {
    id: 1,
    name: 'Sentadilla Libre con Barra',
    muscle_group: 'Cuádriceps',
    equipment_needed: 'barra',
    gif_url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['lesion_rodilla', 'lumbar'],
    gender_bias: 'neutral',
    description: 'Ejercicio multiarticular rey para desarrollo del tren inferior, cuádriceps y fuerza troncal.'
  },
  {
    id: 2,
    name: 'Hip Thrust con Barra / Pelvis Lift',
    muscle_group: 'Glúteos',
    equipment_needed: 'barra',
    gif_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'mujer_enfoque',
    description: 'Máxima activación del glúteo mayor en máxima extensión de cadera con mínimo estrés en rodillas.'
  },
  {
    id: 3,
    name: 'Prensa Inclinada de Piernas 45°',
    muscle_group: 'Cuádriceps',
    equipment_needed: 'maquina',
    gif_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['lesion_rodilla'],
    gender_bias: 'neutral',
    description: 'Permite sobrecarga progresiva controlada con soporte seguro de espalda.'
  },
  {
    id: 4,
    name: 'Peso Muerto Rumano con Mancuernas',
    muscle_group: 'Femoral',
    equipment_needed: 'mancuerna',
    gif_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['lumbar'],
    gender_bias: 'mujer_enfoque',
    description: 'Estiramiento bajo carga excéntrica para isquiotibiales y zona glútea.'
  },
  {
    id: 5,
    name: 'Abductores en Polea o Máquina',
    muscle_group: 'Glúteos',
    equipment_needed: 'maquina',
    gif_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'mujer_enfoque',
    description: 'Aislamiento del glúteo medio, mejorando estabilidad de cadera y forma lateral.'
  },
  {
    id: 6,
    name: 'Curl Femoral Tumbado / Sentado',
    muscle_group: 'Femoral',
    equipment_needed: 'maquina',
    gif_url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Flexión directa de rodilla para hipertrofia pura de la cabeza corta y larga del bíceps femoral.'
  },
  {
    id: 7,
    name: 'Elevación de Talones en Máquina (Gemelos)',
    muscle_group: 'Gemelos',
    equipment_needed: 'maquina',
    gif_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Fortalecimiento de gastrocnemios y sóleo con pausa isométrica en la contracción.'
  },

  // Pecho / Empuje
  {
    id: 8,
    name: 'Press de Banca Plano con Barra',
    muscle_group: 'Pectoral',
    equipment_needed: 'barra',
    gif_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['molestia_hombro', 'muneca'],
    gender_bias: 'hombre_enfoque',
    description: 'Ejercicio compuesto fundamental de empuje horizontal para pectoral mayor, tríceps y deltoides anterior.'
  },
  {
    id: 9,
    name: 'Press Inclinado con Mancuernas',
    muscle_group: 'Pectoral',
    equipment_needed: 'mancuerna',
    gif_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['molestia_hombro'],
    gender_bias: 'neutral',
    description: 'Enfoque en el haz clavicular (pectoral superior) con libertad de rotación articular de muñeca.'
  },
  {
    id: 10,
    name: 'Aperturas en Poleas Cruzadas / Cruce de Cables',
    muscle_group: 'Pectoral',
    equipment_needed: 'polea',
    gif_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['molestia_hombro'],
    gender_bias: 'neutral',
    description: 'Tensión constante durante todo el recorrido para aislamiento del pectoral interno.'
  },
  {
    id: 11,
    name: 'Fondos en Paralelas Asistidos o Libres',
    muscle_group: 'Pectoral',
    equipment_needed: 'peso_corporal',
    gif_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['molestia_hombro', 'codo'],
    gender_bias: 'hombre_enfoque',
    description: 'Gran estímulo para pectoral inferior y tríceps mediante flexo-extensión en paralelas.'
  },

  // Espalda / Tracción
  {
    id: 12,
    name: 'Jalón al Pecho en Polea Alta',
    muscle_group: 'Dorsales',
    equipment_needed: 'polea',
    gif_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Tracción vertical segura para ensanchar el dorsal ancho y mejorar la postura escapular.'
  },
  {
    id: 13,
    name: 'Remo con Barra Inclinado (Pendlay o 45°)',
    muscle_group: 'Dorsales',
    equipment_needed: 'barra',
    gif_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['lumbar'],
    gender_bias: 'hombre_enfoque',
    description: 'Densidad masiva de espalda media, romboides y dorsal con activación lumbar isométrica.'
  },
  {
    id: 14,
    name: 'Remo Unilateral con Mancuerna apoyado',
    muscle_group: 'Dorsales',
    equipment_needed: 'mancuerna',
    gif_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Excelente para corregir asimetrías y traccionar con rango de recorrido profundo sin fatiga lumbar.'
  },
  {
    id: 15,
    name: 'Face Pull en Polea con Cuerda',
    muscle_group: 'Espalda y Postura',
    equipment_needed: 'polea',
    gif_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Esencial para salud del manguito rotador, deltoides posterior y corrección de hombros caídos.'
  },

  // Hombros
  {
    id: 16,
    name: 'Press Militar con Mancuernas Sentado',
    muscle_group: 'Hombros',
    equipment_needed: 'mancuerna',
    gif_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['molestia_hombro', 'cervical'],
    gender_bias: 'neutral',
    description: 'Empuje vertical estricto para volumen del deltoides anterior y lateral con respaldo estabilizador.'
  },
  {
    id: 17,
    name: 'Elevaciones Laterales en Polea o Mancuernas',
    muscle_group: 'Hombros',
    equipment_needed: 'polea',
    gif_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Aislamiento supremo del deltoides medio para el efecto estético de hombro redondo y ancho.'
  },
  {
    id: 18,
    name: 'Pájaro Posterior en Máquina Peck Deck',
    muscle_group: 'Hombros',
    equipment_needed: 'maquina',
    gif_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Deltoides posterior y retracción escapular con cero impulso trampolín.'
  },

  // Brazos (Bíceps / Tríceps)
  {
    id: 19,
    name: 'Curl de Bíceps con Barra Z',
    muscle_group: 'Bíceps',
    equipment_needed: 'barra',
    gif_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['muneca', 'codo'],
    gender_bias: 'hombre_enfoque',
    description: 'La curvatura ergonómica protege las muñecas mientras estimula bíceps braquial.'
  },
  {
    id: 20,
    name: 'Extensiones de Tríceps en Polea con Cuerda',
    muscle_group: 'Tríceps',
    equipment_needed: 'polea',
    gif_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['codo'],
    gender_bias: 'neutral',
    description: 'Apertura final de cuerda al final del rango para máxima contracción de la cabeza lateral y medial.'
  },
  {
    id: 21,
    name: 'Press Francés con Mancuernas en Banco',
    muscle_group: 'Tríceps',
    equipment_needed: 'mancuerna',
    gif_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: ['codo'],
    gender_bias: 'neutral',
    description: 'Estiramiento profundo de la cabeza larga del tríceps por encima de la cabeza.'
  },

  // Core / Postura / Salud
  {
    id: 22,
    name: 'Plancha Abdominal Isométrica Activa',
    muscle_group: 'Core',
    equipment_needed: 'peso_corporal',
    gif_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Anti-extensión del transverso abdominal y estabilidad pélvica sin compresión de discos vertebrales.'
  },
  {
    id: 23,
    name: 'Pallof Press en Polea',
    muscle_group: 'Core',
    equipment_needed: 'polea',
    gif_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Ejercicio de oro anti-rotación para blindar la zona media y lumbalgias.'
  },
  {
    id: 24,
    name: 'Hiperextensiones en Banco 45°',
    muscle_group: 'Espalda Baja',
    equipment_needed: 'maquina',
    gif_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: [],
    gender_bias: 'neutral',
    description: 'Fortalecimiento de erectores espinales y glúteos con rango seguro para postura erguida.'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: 'Carlos Ramírez',
    email: 'admin@gymfitmaster.com',
    google_id: 'google-sub-admin-01',
    role: 'admin',
    membership_status: 'activo',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    phone: '+52 55 1234 5678',
    created_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 2,
    name: 'Marcos Silva (Head Coach)',
    email: 'coach.marcos@gymfitmaster.com',
    google_id: 'google-sub-coach-02',
    role: 'trainer',
    membership_status: 'activo',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    phone: '+52 55 8765 4321',
    created_at: '2026-01-15T11:00:00Z'
  },
  {
    id: 3,
    name: 'Alejandro Gómez',
    email: 'alejandro.gomez@gmail.com',
    google_id: 'google-sub-atleta-03',
    role: 'atleta',
    membership_status: 'activo',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+52 55 4433 2211',
    created_at: '2026-02-01T09:30:00Z'
  },
  {
    id: 4,
    name: 'Sofía Restrepo',
    email: 'sofia.restrepo@gmail.com',
    google_id: 'google-sub-atleta-04',
    role: 'atleta',
    membership_status: 'activo',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+52 55 9988 7766',
    created_at: '2026-02-10T14:20:00Z'
  },
  {
    id: 5,
    name: 'Diego Morales (Acceso Vencido)',
    email: 'diego.morales@hotmail.com',
    google_id: 'google-sub-atleta-05',
    role: 'atleta',
    membership_status: 'vencido',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+52 55 3322 1100',
    created_at: '2025-11-05T08:00:00Z'
  }
];

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 1,
    user_id: 3, // Alejandro
    gender: 'hombre',
    current_objective: 'hipertrofia',
    fitness_level: 'intermedio',
    active_injuries: ['molestia_hombro'],
    available_days: 6,
    weight_kg: 78.5,
    height_cm: 178,
    stars: 185,
    level_stage: 3,
    assigned_trainer_id: 2
  },
  {
    id: 2,
    user_id: 4, // Sofía
    gender: 'mujer',
    current_objective: 'grasa',
    fitness_level: 'intermedio',
    active_injuries: ['lesion_rodilla'],
    available_days: 6,
    weight_kg: 61.2,
    height_cm: 165,
    stars: 240,
    level_stage: 3,
    assigned_trainer_id: 2
  },
  {
    id: 3,
    user_id: 5, // Diego
    gender: 'hombre',
    current_objective: 'fuerza',
    fitness_level: 'principiante',
    active_injuries: ['lumbar'],
    available_days: 3,
    weight_kg: 84.0,
    height_cm: 180,
    stars: 35,
    level_stage: 1,
    assigned_trainer_id: 2
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 101,
    user_id: 3,
    userName: 'Alejandro Gómez',
    amount: 55.00,
    date: '2026-03-01',
    method: 'Tarjeta',
    plan_type: 'Mensual VIP',
    status: 'Completado'
  },
  {
    id: 102,
    user_id: 4,
    userName: 'Sofía Restrepo',
    amount: 140.00,
    date: '2026-02-15',
    method: 'Transferencia',
    plan_type: 'Trimestral Pro',
    status: 'Completado'
  },
  {
    id: 103,
    user_id: 5,
    userName: 'Diego Morales',
    amount: 55.00,
    date: '2026-01-05',
    method: 'Efectivo',
    plan_type: 'Mensual VIP',
    status: 'Fallido'
  }
];

export const INITIAL_PROGRESS_LOGS: UserProgressLog[] = [
  // Logs for Alejandro (User 3)
  { id: 1, user_id: 3, exercise_id: 8, exercise_name: 'Press de Banca Plano con Barra', weight_lifted: 70, reps_done: 8, rpe_felt: 8, created_at: '2026-02-10T18:00:00Z', stars_earned: 5 },
  { id: 2, user_id: 3, exercise_id: 8, exercise_name: 'Press de Banca Plano con Barra', weight_lifted: 75, reps_done: 7, rpe_felt: 8.5, created_at: '2026-02-17T18:00:00Z', stars_earned: 5 },
  { id: 3, user_id: 3, exercise_id: 8, exercise_name: 'Press de Banca Plano con Barra', weight_lifted: 77.5, reps_done: 8, rpe_felt: 8, created_at: '2026-02-24T18:00:00Z', stars_earned: 5 },
  { id: 4, user_id: 3, exercise_id: 8, exercise_name: 'Press de Banca Plano con Barra', weight_lifted: 80, reps_done: 6, rpe_felt: 9, created_at: '2026-03-03T18:00:00Z', stars_earned: 6 },
  { id: 5, user_id: 3, exercise_id: 8, exercise_name: 'Press de Banca Plano con Barra', weight_lifted: 82.5, reps_done: 6, rpe_felt: 8.5, created_at: '2026-03-10T18:00:00Z', stars_earned: 6 },
  { id: 6, user_id: 3, exercise_id: 1, exercise_name: 'Sentadilla Libre con Barra', weight_lifted: 90, reps_done: 8, rpe_felt: 8, created_at: '2026-02-12T18:00:00Z', stars_earned: 5 },
  { id: 7, user_id: 3, exercise_id: 1, exercise_name: 'Sentadilla Libre con Barra', weight_lifted: 95, reps_done: 8, rpe_felt: 8.5, created_at: '2026-02-19T18:00:00Z', stars_earned: 5 },
  { id: 8, user_id: 3, exercise_id: 1, exercise_name: 'Sentadilla Libre con Barra', weight_lifted: 100, reps_done: 6, rpe_felt: 9, created_at: '2026-02-26T18:00:00Z', stars_earned: 6 },
  { id: 9, user_id: 3, exercise_id: 1, exercise_name: 'Sentadilla Libre con Barra', weight_lifted: 105, reps_done: 6, rpe_felt: 9, created_at: '2026-03-05T18:00:00Z', stars_earned: 6 },

  // Logs for Sofía (User 4)
  { id: 10, user_id: 4, exercise_id: 2, exercise_name: 'Hip Thrust con Barra / Pelvis Lift', weight_lifted: 70, reps_done: 12, rpe_felt: 8, created_at: '2026-02-11T17:00:00Z', stars_earned: 6 },
  { id: 11, user_id: 4, exercise_id: 2, exercise_name: 'Hip Thrust con Barra / Pelvis Lift', weight_lifted: 80, reps_done: 10, rpe_felt: 8, created_at: '2026-02-18T17:00:00Z', stars_earned: 6 },
  { id: 12, user_id: 4, exercise_id: 2, exercise_name: 'Hip Thrust con Barra / Pelvis Lift', weight_lifted: 85, reps_done: 10, rpe_felt: 8.5, created_at: '2026-02-25T17:00:00Z', stars_earned: 6 },
  { id: 13, user_id: 4, exercise_id: 2, exercise_name: 'Hip Thrust con Barra / Pelvis Lift', weight_lifted: 90, reps_done: 10, rpe_felt: 9, created_at: '2026-03-04T17:00:00Z', stars_earned: 7 },
  { id: 14, user_id: 4, exercise_id: 4, exercise_name: 'Peso Muerto Rumano con Mancuernas', weight_lifted: 36, reps_done: 12, rpe_felt: 8, created_at: '2026-02-14T17:00:00Z', stars_earned: 5 },
  { id: 15, user_id: 4, exercise_id: 4, exercise_name: 'Peso Muerto Rumano con Mancuernas', weight_lifted: 40, reps_done: 10, rpe_felt: 8.5, created_at: '2026-02-21T17:00:00Z', stars_earned: 5 },
  { id: 16, user_id: 4, exercise_id: 4, exercise_name: 'Peso Muerto Rumano con Mancuernas', weight_lifted: 44, reps_done: 10, rpe_felt: 9, created_at: '2026-02-28T17:00:00Z', stars_earned: 6 },
  { id: 17, user_id: 4, exercise_id: 12, exercise_name: 'Jalón al Pecho en Polea Alta', weight_lifted: 35, reps_done: 12, rpe_felt: 7.5, created_at: '2026-03-02T17:00:00Z', stars_earned: 5 },
  { id: 18, user_id: 4, exercise_id: 12, exercise_name: 'Jalón al Pecho en Polea Alta', weight_lifted: 40, reps_done: 10, rpe_felt: 8, created_at: '2026-03-09T17:00:00Z', stars_earned: 5 }
];

/**
 * Motor de Reglas Algorítmico Local (Código puro a Costo Cero)
 * Genera rutinas optimizadas de acuerdo a sexo, biomecánica, objetivo,
 * lesiones prohibidas y días disponibles con 100% de fiabilidad.
 */
export function generateLocalAlgorithmicRoutine(params: {
  user_id: number;
  gender: 'hombre' | 'mujer' | 'otro';
  current_objective: ObjectiveType;
  fitness_level: 'principiante' | 'intermedio' | 'avanzado';
  active_injuries: string[];
  available_days: number;
}): WorkoutRoutine[] {
  const { user_id, gender, current_objective, fitness_level, active_injuries, available_days } = params;

  // Filter available exercises strictly excluding banned injuries
  const safeExercises = INITIAL_EXERCISES.filter(ex => {
    return !ex.banned_for_injuries.some(injury => active_injuries.includes(injury));
  });

  // Determine parameter defaults based on objective
  let defaultSets = 3;
  let defaultReps = '10-12';
  let defaultRest = 90;

  switch (current_objective) {
    case 'fuerza':
      defaultSets = fitness_level === 'avanzado' ? 5 : 4;
      defaultReps = '3-5';
      defaultRest = 180;
      break;
    case 'hipertrofia':
      defaultSets = 4;
      defaultReps = '8-12';
      defaultRest = 90;
      break;
    case 'resistencia':
      defaultSets = 3;
      defaultReps = '15-20';
      defaultRest = 45;
      break;
    case 'grasa':
      defaultSets = 3;
      defaultReps = '12-15';
      defaultRest = 60;
      break;
    case 'postura':
      defaultSets = 3;
      defaultReps = '12-15';
      defaultRest = 60;
      break;
  }

  // Day distribution structure based on gender and days available (2, 3, 4, 5, 6 days)
  const routines: WorkoutRoutine[] = [];
  const daysCount = Math.min(Math.max(available_days || 3, 2), 6);

  let dayTemplates: { day_name: string; muscle_priority: string[] }[] = [];

  if (gender === 'mujer') {
    // Biomechanical focus: posterior chain, hips/glutes, pelvic stability, balanced upper body
    if (daysCount === 2) {
      dayTemplates = [
        { day_name: 'Día 1: Glúteos, Femorales & Core (Cadena Posterior)', muscle_priority: ['Glúteos', 'Femoral', 'Core'] },
        { day_name: 'Día 2: Torso, Postura & Pierna Global (Balance Total)', muscle_priority: ['Dorsales', 'Hombros', 'Cuádriceps', 'Espalda y Postura'] }
      ];
    } else if (daysCount === 3) {
      dayTemplates = [
        { day_name: 'Día 1: Glúteos & Isquiotibiales (Enfoque Prioritario)', muscle_priority: ['Glúteos', 'Femoral', 'Core'] },
        { day_name: 'Día 2: Torso, Espalda & Salud Postural', muscle_priority: ['Dorsales', 'Hombros', 'Pectoral', 'Espalda y Postura'] },
        { day_name: 'Día 3: Cuádriceps, Glúteos & Core Estructural', muscle_priority: ['Cuádriceps', 'Glúteos', 'Gemelos', 'Core'] }
      ];
    } else if (daysCount === 4) {
      dayTemplates = [
        { day_name: 'Día 1: Glúteos & Femorales A', muscle_priority: ['Glúteos', 'Femoral', 'Core'] },
        { day_name: 'Día 2: Espalda, Deltoides & Brazos', muscle_priority: ['Dorsales', 'Hombros', 'Tríceps', 'Bíceps'] },
        { day_name: 'Día 3: Cuádriceps & Glúteo Medio', muscle_priority: ['Cuádriceps', 'Glúteos', 'Gemelos'] },
        { day_name: 'Día 4: Full Body Metabólico & Core Antirotación', muscle_priority: ['Glúteos', 'Dorsales', 'Pectoral', 'Core'] }
      ];
    } else if (daysCount === 5) {
      dayTemplates = [
        { day_name: 'Día 1: Glúteo Máximo & Cadena Posterior', muscle_priority: ['Glúteos', 'Femoral'] },
        { day_name: 'Día 2: Torso Superior (Espalda y Hombros)', muscle_priority: ['Dorsales', 'Hombros'] },
        { day_name: 'Día 3: Cuádriceps & Estabilidad Articular', muscle_priority: ['Cuádriceps', 'Gemelos', 'Core'] },
        { day_name: 'Día 4: Glúteo Medio, Aductores & Brazos', muscle_priority: ['Glúteos', 'Tríceps', 'Bíceps'] },
        { day_name: 'Día 5: Postura Integral, Core & Quema Grasa', muscle_priority: ['Espalda y Postura', 'Core', 'Glúteos'] }
      ];
    } else {
      // 6 days split
      dayTemplates = [
        { day_name: 'Día 1: Glúteo Mayor & Femorales (Hipertrofia A)', muscle_priority: ['Glúteos', 'Femoral'] },
        { day_name: 'Día 2: Espalda, Deltoides & Postura Escapular', muscle_priority: ['Dorsales', 'Hombros', 'Espalda y Postura'] },
        { day_name: 'Día 3: Cuádriceps, Aductores & Glúteo Medio', muscle_priority: ['Cuádriceps', 'Glúteos', 'Gemelos'] },
        { day_name: 'Día 4: Cadena Posterior & Glúteo Sobrecarga', muscle_priority: ['Glúteos', 'Femoral', 'Core'] },
        { day_name: 'Día 5: Hombros, Brazos & Salud Articular', muscle_priority: ['Hombros', 'Tríceps', 'Bíceps'] },
        { day_name: 'Día 6: Full Body Metabólico & Core Anti-Extensión', muscle_priority: ['Glúteos', 'Dorsales', 'Core'] }
      ];
    }
  } else {
    // Hombre / Neutral: Upper density, balanced functional lower body
    if (daysCount === 2) {
      dayTemplates = [
        { day_name: 'Día 1: Torso Completo, Pectoral, Espalda & Brazos', muscle_priority: ['Pectoral', 'Dorsales', 'Hombros', 'Bíceps', 'Tríceps'] },
        { day_name: 'Día 2: Pierna Integral, Cadena Posterior & Core', muscle_priority: ['Cuádriceps', 'Femoral', 'Glúteos', 'Core'] }
      ];
    } else if (daysCount === 3) {
      dayTemplates = [
        { day_name: 'Día 1: Torso Completo (Pecho, Espalda, Hombros)', muscle_priority: ['Pectoral', 'Dorsales', 'Hombros'] },
        { day_name: 'Día 2: Pierna Integral & Core', muscle_priority: ['Cuádriceps', 'Femoral', 'Gemelos', 'Core'] },
        { day_name: 'Día 3: Empuje, Tracción & Brazos', muscle_priority: ['Pectoral', 'Dorsales', 'Bíceps', 'Tríceps'] }
      ];
    } else if (daysCount === 4) {
      dayTemplates = [
        { day_name: 'Día 1: Torso Pesado (Pectoral & Dorsal)', muscle_priority: ['Pectoral', 'Dorsales', 'Hombros'] },
        { day_name: 'Día 2: Pierna Completa & Core', muscle_priority: ['Cuádriceps', 'Femoral', 'Glúteos', 'Gemelos'] },
        { day_name: 'Día 3: Hombros, Brazos & Core', muscle_priority: ['Hombros', 'Bíceps', 'Tríceps', 'Core'] },
        { day_name: 'Día 4: Pierna & Cadena Posterior Hipertrofia', muscle_priority: ['Femoral', 'Cuádriceps', 'Core'] }
      ];
    } else if (daysCount === 5) {
      dayTemplates = [
        { day_name: 'Día 1: Pectoral & Deltoides Anterior', muscle_priority: ['Pectoral', 'Hombros'] },
        { day_name: 'Día 2: Dorsales, Espalda Media & Trapecios', muscle_priority: ['Dorsales', 'Espalda y Postura'] },
        { day_name: 'Día 3: Tren Inferior (Cuádriceps & Gemelos)', muscle_priority: ['Cuádriceps', 'Gemelos', 'Core'] },
        { day_name: 'Día 4: Hombros Lateral/Posterior & Brazos', muscle_priority: ['Hombros', 'Bíceps', 'Tríceps'] },
        { day_name: 'Día 5: Cadena Posterior (Femorales & Glúteos)', muscle_priority: ['Femoral', 'Glúteos', 'Core'] }
      ];
    } else {
      // 6 days split
      dayTemplates = [
        { day_name: 'Día 1: Empuje Fuerza (Pectoral, Deltoides Anterior, Tríceps)', muscle_priority: ['Pectoral', 'Hombros', 'Tríceps'] },
        { day_name: 'Día 2: Tracción Fuerza (Dorsales, Remos, Bíceps)', muscle_priority: ['Dorsales', 'Bíceps', 'Espalda y Postura'] },
        { day_name: 'Día 3: Pierna Completa & Core (Cuádriceps & Femoral)', muscle_priority: ['Cuádriceps', 'Femoral', 'Gemelos', 'Core'] },
        { day_name: 'Día 4: Empuje Hipertrofia & Deltoides Lateral', muscle_priority: ['Pectoral', 'Hombros', 'Tríceps'] },
        { day_name: 'Día 5: Tracción Densidad, Remos & Brazos', muscle_priority: ['Dorsales', 'Bíceps'] },
        { day_name: 'Día 6: Cadena Posterior, Glúteo & Fuerza Troncal', muscle_priority: ['Femoral', 'Glúteos', 'Core'] }
      ];
    }
  }

  // Populate exercises for each day
  dayTemplates.forEach((template, index) => {
    const routineId = index + 1;
    const selectedExercises: Exercise[] = [];

    // Prioritize safe exercises matching the template's muscle priority
    template.muscle_priority.forEach(muscle => {
      const candidates = safeExercises.filter(ex => 
        ex.muscle_group.toLowerCase().includes(muscle.toLowerCase()) || 
        muscle.toLowerCase().includes(ex.muscle_group.toLowerCase())
      );
      if (candidates.length > 0) {
        // Prefer gender bias match if applicable
        const biased = candidates.find(c => gender === 'mujer' ? c.gender_bias === 'mujer_enfoque' : c.gender_bias === 'hombre_enfoque');
        const chosen = biased || candidates[0];
        if (!selectedExercises.some(e => e.id === chosen.id)) {
          selectedExercises.push(chosen);
        }
      }
    });

    // Fill up to at least 4-5 exercises per workout
    safeExercises.forEach(ex => {
      if (selectedExercises.length < 5 && !selectedExercises.some(e => e.id === ex.id)) {
        selectedExercises.push(ex);
      }
    });

    const exerciseItems = selectedExercises.slice(0, 5).map((ex, exIdx) => ({
      id: routineId * 100 + exIdx + 1,
      routine_id: routineId,
      exercise_id: ex.id,
      exercise_name: ex.name,
      muscle_group: ex.muscle_group,
      equipment_needed: ex.equipment_needed,
      gif_url: ex.gif_url,
      sets: defaultSets,
      reps: defaultReps,
      rest_seconds: defaultRest,
      sort_order: exIdx + 1
    }));

    routines.push({
      id: routineId,
      user_id,
      day_name: template.day_name,
      is_active: index === 0,
      created_by: 'motor_algoritmico',
      objective: current_objective,
      coach_notes: `Generado por Motor Biomecánico Adaptativo. Restricción estricta de lesiones activas: ${active_injuries.length > 0 ? active_injuries.join(', ') : 'Ninguna'}.`,
      exercises: exerciseItems,
      created_at: new Date().toISOString()
    });
  });

  return routines;
}
