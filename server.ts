import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  INITIAL_EXERCISES,
  INITIAL_PAYMENTS,
  INITIAL_PROFILES,
  INITIAL_PROGRESS_LOGS,
  INITIAL_USERS,
  LEVEL_TIERS,
  generateLocalAlgorithmicRoutine
} from './src/gymData';
import {
  INITIAL_SUPPLEMENT_PRODUCTS,
  INITIAL_NOTIFICATIONS
} from './src/supplementData';
import {
  Exercise,
  PaymentRecord,
  User,
  UserProfile,
  UserProgressLog,
  WorkoutRoutine,
  SupplementProduct,
  PromoNotification,
  SupplementOrder
} from './src/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize server-side in-memory relational store
let users: User[] = [...INITIAL_USERS];
let profiles: UserProfile[] = [...INITIAL_PROFILES];
let exercises: Exercise[] = [...INITIAL_EXERCISES];
let payments: PaymentRecord[] = [...INITIAL_PAYMENTS];
let progressLogs: UserProgressLog[] = [...INITIAL_PROGRESS_LOGS];
let supplementProducts: SupplementProduct[] = [...INITIAL_SUPPLEMENT_PRODUCTS];
let promoNotifications: PromoNotification[] = [...INITIAL_NOTIFICATIONS];
let supplementOrders: SupplementOrder[] = [
  {
    id: 'ord-101',
    userId: 3,
    productId: 'creatina-creapure-300g',
    productName: 'Creatina Creapure® Micronizada 300g',
    promoPrice: 28.99,
    originalPrice: 42.0,
    savings: 13.01,
    reservationCode: 'REC-CREA-9021',
    status: 'reservado',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

// Map of userId -> WorkoutRoutine[]
const userRoutinesMap = new Map<number, WorkoutRoutine[]>();

// Prepopulate routines for existing users with 6 full training days (including Día 5 and Día 6)
userRoutinesMap.set(3, generateLocalAlgorithmicRoutine({
  user_id: 3,
  gender: 'hombre',
  current_objective: 'hipertrofia',
  fitness_level: 'intermedio',
  active_injuries: ['molestia_hombro'],
  available_days: 6
}));

userRoutinesMap.set(4, generateLocalAlgorithmicRoutine({
  user_id: 4,
  gender: 'mujer',
  current_objective: 'grasa',
  fitness_level: 'intermedio',
  active_injuries: ['lesion_rodilla'],
  available_days: 6
}));

// Gemini AI client (Server-side only)
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ---------------------------------------------
// API Endpoints: Auth Simulation & Users
// ---------------------------------------------

// Simulates Google OAuth callback + verification with Laravel membership check
app.post('/api/auth/google-simulate', (req: Request, res: Response) => {
  const { email, google_token } = req.body;
  const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no registrado en el sistema del gimnasio. Diríjase a recepción para su alta.'
    });
  }

  // Check membership status as specified in the prompt
  if (user.membership_status === 'vencido') {
    return res.status(403).json({
      success: false,
      membership_status: 'vencido',
      error: 'Membresía Vencida. Su pago mensual se encuentra pendiente de liquidar en recepción.',
      user
    });
  }

  if (user.membership_status === 'suspendido') {
    return res.status(403).json({
      success: false,
      membership_status: 'suspendido',
      error: 'Cuenta suspendida temporalmente por administración.',
      user
    });
  }

  const profile = profiles.find(p => p.user_id === user.id);

  return res.json({
    success: true,
    jwt_token: `jwt_fitmaster_${user.id}_${Date.now()}`,
    user,
    profile
  });
});

// Get all users (Admin & Trainer view)
app.get('/api/users', (req: Request, res: Response) => {
  const combined = users.map(user => {
    const profile = profiles.find(p => p.user_id === user.id);
    return {
      ...user,
      profile: profile || null
    };
  });
  res.json({ users: combined });
});

// Create new user (Admin alta de socios)
app.post('/api/users', (req: Request, res: Response) => {
  const { name, email, role = 'client', membership_status = 'activo', phone, gender = 'hombre', objective = 'hipertrofia', days = 4 } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nombre y correo requeridos.' });
  }

  const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const newUser: User = {
    id: newId,
    name,
    email,
    google_id: `google-sub-${newId}`,
    role: role as any,
    membership_status: membership_status as any,
    phone: phone || '+52 55 0000 0000',
    avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    created_at: new Date().toISOString()
  };

  const newProfile: UserProfile = {
    id: profiles.length + 1,
    user_id: newId,
    gender: gender as any,
    current_objective: objective as any,
    fitness_level: 'principiante',
    active_injuries: [],
    available_days: Number(days) || 3,
    weight_kg: 70,
    height_cm: 172,
    stars: 10,
    level_stage: 1,
    assigned_trainer_id: 2
  };

  users.push(newUser);
  profiles.push(newProfile);

  // Auto-generate starter routine
  const routines = generateLocalAlgorithmicRoutine({
    user_id: newId,
    gender: newProfile.gender,
    current_objective: newProfile.current_objective,
    fitness_level: newProfile.fitness_level,
    active_injuries: [],
    available_days: newProfile.available_days
  });
  userRoutinesMap.set(newId, routines);

  res.status(201).json({ user: newUser, profile: newProfile });
});

// Update membership status (Admin)
app.patch('/api/users/:id/membership', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const { status } = req.body;

  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (['activo', 'vencido', 'suspendido'].includes(status)) {
    user.membership_status = status;
    return res.json({ success: true, user });
  }

  res.status(400).json({ error: 'Estado de membresía no válido' });
});

// Get user profile
app.get('/api/users/:id/profile', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const profile = profiles.find(p => p.user_id === userId);
  if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });
  res.json({ profile });
});

// Update user profile (Cliente o Entrenador)
app.put('/api/users/:id/profile', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  let profile = profiles.find(p => p.user_id === userId);

  if (!profile) {
    profile = {
      id: profiles.length + 1,
      user_id: userId,
      gender: 'hombre',
      current_objective: 'hipertrofia',
      fitness_level: 'intermedio',
      active_injuries: [],
      available_days: 4,
      weight_kg: 75,
      height_cm: 175,
      stars: 0,
      level_stage: 1
    };
    profiles.push(profile);
  }

  const { gender, current_objective, fitness_level, active_injuries, available_days, weight_kg, height_cm } = req.body;
  if (gender) profile.gender = gender;
  if (current_objective) profile.current_objective = current_objective;
  if (fitness_level) profile.fitness_level = fitness_level;
  if (Array.isArray(active_injuries)) profile.active_injuries = active_injuries;
  if (available_days) profile.available_days = Number(available_days);
  if (weight_kg) profile.weight_kg = Number(weight_kg);
  if (height_cm) profile.height_cm = Number(height_cm);

  res.json({ success: true, profile });
});

// ---------------------------------------------
// API Endpoints: Exercises Catalog (Admin)
// ---------------------------------------------

app.get('/api/exercises', (req: Request, res: Response) => {
  res.json({ exercises });
});

app.post('/api/exercises', (req: Request, res: Response) => {
  const { name, muscle_group, equipment_needed, gif_url, banned_for_injuries, gender_bias, description } = req.body;

  if (!name || !muscle_group) {
    return res.status(400).json({ error: 'Nombre y grupo muscular son requeridos' });
  }

  const newExercise: Exercise = {
    id: exercises.length > 0 ? Math.max(...exercises.map(e => e.id)) + 1 : 1,
    name,
    muscle_group,
    equipment_needed: equipment_needed || 'maquina',
    gif_url: gif_url || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
    banned_for_injuries: Array.isArray(banned_for_injuries) ? banned_for_injuries : [],
    gender_bias: gender_bias || 'neutral',
    description: description || 'Ejercicio registrado en catálogo maestro.'
  };

  exercises.push(newExercise);
  res.status(201).json({ exercise: newExercise });
});

app.patch('/api/exercises/:id', (req: Request, res: Response) => {
  const exId = parseInt(req.params.id);
  const exercise = exercises.find(e => e.id === exId);
  if (!exercise) return res.status(404).json({ error: 'Ejercicio no encontrado' });

  const { name, muscle_group, equipment_needed, gif_url, banned_for_injuries, gender_bias, description } = req.body;
  if (name) exercise.name = name;
  if (muscle_group) exercise.muscle_group = muscle_group;
  if (equipment_needed) exercise.equipment_needed = equipment_needed;
  if (gif_url) exercise.gif_url = gif_url;
  if (Array.isArray(banned_for_injuries)) exercise.banned_for_injuries = banned_for_injuries;
  if (gender_bias) exercise.gender_bias = gender_bias;
  if (description) exercise.description = description;

  res.json({ success: true, exercise });
});

// ---------------------------------------------
// API Endpoints: Payments (Admin)
// ---------------------------------------------

app.get('/api/payments', (req: Request, res: Response) => {
  res.json({ payments });
});

app.post('/api/payments', (req: Request, res: Response) => {
  const { user_id, amount, method, plan_type } = req.body;
  const user = users.find(u => u.id === Number(user_id));

  const newPayment: PaymentRecord = {
    id: payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 101,
    user_id: Number(user_id),
    userName: user ? user.name : 'Usuario Desconocido',
    amount: Number(amount) || 50,
    date: new Date().toISOString().split('T')[0],
    method: method || 'Tarjeta',
    plan_type: plan_type || 'Mensual VIP',
    status: 'Completado'
  };

  payments.unshift(newPayment);

  // If user was expired, reactivate them
  if (user && user.membership_status === 'vencido') {
    user.membership_status = 'activo';
  }

  res.status(201).json({ payment: newPayment });
});

// ---------------------------------------------
// API Endpoints: Routines & Hybrid Generator (AI + Algorithmic Rule Engine)
// ---------------------------------------------

app.get('/api/users/:id/routines', (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  let routines = userRoutinesMap.get(userId);

  if (!routines || routines.length === 0) {
    const profile = profiles.find(p => p.user_id === userId);
    routines = generateLocalAlgorithmicRoutine({
      user_id: userId,
      gender: profile?.gender || 'hombre',
      current_objective: profile?.current_objective || 'hipertrofia',
      fitness_level: profile?.fitness_level || 'intermedio',
      active_injuries: profile?.active_injuries || [],
      available_days: profile?.available_days || 4
    });
    userRoutinesMap.set(userId, routines);
  }

  res.json({ routines });
});

// Hybrid Routine Generator
app.post('/api/routines/generate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const {
    user_id,
    gender = 'hombre',
    current_objective = 'hipertrofia',
    fitness_level = 'intermedio',
    active_injuries = [],
    available_days = 4,
    force_engine // 'ai' or 'algorithmic' for testing
  } = req.body;

  const validInjuries: string[] = Array.isArray(active_injuries) ? active_injuries : [];

  // Filter available exercises in our catalog strictly excluding banned injuries
  const allowedExercises = exercises.filter(
    ex => !ex.banned_for_injuries.some(inj => validInjuries.includes(inj))
  );

  let generatedRoutines: WorkoutRoutine[] | null = null;
  let engineUsed = 'motor_algoritmico';
  let engineNote = 'Generado con Motor Algorítmico Local (Fiabilidad total a Costo $0)';

  // Try Gemini AI if available and not forced to algorithmic
  if (ai && force_engine !== 'algorithmic') {
    try {
      const allowedNames = allowedExercises.map(e => `${e.name} (id:${e.id}, grupo:${e.muscle_group})`).join(', ');

      const prompt = `Eres el microservicio de IA para prescripción de entrenamiento biomecánico de gimnasio.
Genera una rutina de ${available_days} días para un usuario con:
- Sexo: ${gender} (${gender === 'mujer' ? 'Dar prioridad biomecánica a glúteos, femorales, cadera y postura, evitando cargas excesivas axiales' : 'Dar prioridad a hipertrofia de torso, hombro y piernas funcionales'})
- Nivel de forma: ${fitness_level}
- Objetivo Clave: ${current_objective} (Opciones: hipertrofia, fuerza, resistencia, grasa, postura)
- Lesiones ACTIVAS PROHIBIDAS: ${validInjuries.length > 0 ? validInjuries.join(', ') : 'Ninguna'}
- Días disponibles a la semana: ${available_days}

Catálogo de ejercicios permitidos (DEBES USAR SOLO EJERCICIOS DE ESTA LISTA O COMPATIBLES SIN LESIONES):
${allowedNames}

Devuelve un JSON estrictamente con la siguiente estructura:
{
  "routines": [
    {
      "day_name": "Día 1: Nombre descriptivo",
      "objective": "${current_objective}",
      "coach_notes": "Recomendación técnica del día",
      "exercises": [
        {
          "exercise_id": 1,
          "exercise_name": "Nombre exacto",
          "muscle_group": "Cuádriceps",
          "sets": 4,
          "reps": "8-12",
          "rest_seconds": 90,
          "sort_order": 1
        }
      ]
    }
  ]
}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout - activando motor local')), 3500)
      );

      const aiResponse = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        }),
        timeoutPromise
      ]);

      const rawJson = aiResponse.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (parsed && Array.isArray(parsed.routines) && parsed.routines.length > 0) {
          generatedRoutines = parsed.routines.map((r: any, rIdx: number) => ({
            id: rIdx + 1,
            user_id: Number(user_id),
            day_name: r.day_name || `Día ${rIdx + 1}`,
            is_active: rIdx === 0,
            created_by: 'ia_gemini',
            objective: current_objective,
            coach_notes: r.coach_notes || 'Rutina optimizada con IA Gemini 3.8 Flash.',
            created_at: new Date().toISOString(),
            exercises: (r.exercises || []).map((ex: any, exIdx: number) => {
              const catalogEx = exercises.find(c => c.id === ex.exercise_id || c.name.toLowerCase() === (ex.exercise_name || '').toLowerCase());
              return {
                id: (rIdx + 1) * 100 + exIdx + 1,
                routine_id: rIdx + 1,
                exercise_id: catalogEx ? catalogEx.id : (ex.exercise_id || 1),
                exercise_name: catalogEx ? catalogEx.name : ex.exercise_name,
                muscle_group: catalogEx ? catalogEx.muscle_group : (ex.muscle_group || 'General'),
                equipment_needed: catalogEx ? catalogEx.equipment_needed : 'maquina',
                gif_url: catalogEx ? catalogEx.gif_url : '',
                sets: Number(ex.sets) || 3,
                reps: String(ex.reps || '10-12'),
                rest_seconds: Number(ex.rest_seconds) || 90,
                sort_order: exIdx + 1
              };
            })
          }));

          engineUsed = 'gemini-3.8-flash';
          engineNote = 'Generado con Google Gemini 3.8 Flash (Adaptado en tiempo real)';
        }
      }
    } catch (err: any) {
      console.warn('Gemini AI unavailable or saturated, falling back seamlessly to Local Algorithmic Engine:', err?.message || err);
      // Fallback activates seamlessly!
    }
  }

  // If AI was not used or errored, activate Local Algorithmic Rule Engine
  if (!generatedRoutines) {
    generatedRoutines = generateLocalAlgorithmicRoutine({
      user_id: Number(user_id),
      gender,
      current_objective,
      fitness_level,
      active_injuries: validInjuries,
      available_days: Number(available_days)
    });
    engineUsed = 'motor_algoritmico';
    engineNote = 'Motor de Reglas Algorítmico Local (Código puro a Costo Cero - 100% Fiabilidad)';
  }

  // Store in user routines
  userRoutinesMap.set(Number(user_id), generatedRoutines);

  const latencyMs = Date.now() - startTime;
  res.json({
    success: true,
    engineUsed,
    engineNote,
    latencyMs,
    routines: generatedRoutines
  });
});

// Update / Override Routine by Coach or Client
app.put('/api/routines/:id', (req: Request, res: Response) => {
  const routineId = parseInt(req.params.id);
  const { user_id, day_name, coach_notes, exercises: updatedExercises, is_active } = req.body;

  const targetUserId = Number(user_id);
  const currentRoutines = userRoutinesMap.get(targetUserId) || [];
  const routineIndex = currentRoutines.findIndex(r => r.id === routineId);

  if (routineIndex === -1) {
    return res.status(404).json({ error: 'Rutina no encontrada' });
  }

  if (day_name) currentRoutines[routineIndex].day_name = day_name;
  if (coach_notes !== undefined) currentRoutines[routineIndex].coach_notes = coach_notes;
  if (is_active !== undefined) currentRoutines[routineIndex].is_active = is_active;
  if (Array.isArray(updatedExercises)) {
    currentRoutines[routineIndex].exercises = updatedExercises;
    currentRoutines[routineIndex].created_by = 'entrenador_manual';
  }

  userRoutinesMap.set(targetUserId, currentRoutines);
  res.json({ success: true, routine: currentRoutines[routineIndex] });
});

// ---------------------------------------------
// API Endpoints: Progress Logs, 1RM Stats & Gamification Stars
// ---------------------------------------------

app.post('/api/progress/log', (req: Request, res: Response) => {
  const { user_id, exercise_id, weight_lifted, reps_done, rpe_felt = 8, is_workout_finished = false } = req.body;

  const targetUserId = Number(user_id);
  const catalogEx = exercises.find(e => e.id === Number(exercise_id));

  // Calculate stars earned:
  // Base 3 stars per completed set, +1 for RPE >= 8, +5 if workout finished
  let starsEarned = 3;
  if (Number(rpe_felt) >= 8) starsEarned += 1;
  if (is_workout_finished) starsEarned += 10;

  const newLog: UserProgressLog = {
    id: progressLogs.length > 0 ? Math.max(...progressLogs.map(l => l.id)) + 1 : 1,
    user_id: targetUserId,
    exercise_id: Number(exercise_id),
    exercise_name: catalogEx ? catalogEx.name : 'Ejercicio Libre',
    weight_lifted: Number(weight_lifted) || 0,
    reps_done: Number(reps_done) || 1,
    rpe_felt: Number(rpe_felt) || 7,
    created_at: new Date().toISOString(),
    stars_earned: starsEarned
  };

  progressLogs.push(newLog);

  // Update profile stars and check level promotion
  const profile = profiles.find(p => p.user_id === targetUserId);
  let levelUp = false;
  let newLevel = 1;

  if (profile) {
    profile.stars = (profile.stars || 0) + starsEarned;
    // Determine level stage from LEVEL_TIERS
    const currentTier = LEVEL_TIERS.find(t => profile.stars >= t.minStars && profile.stars <= t.maxStars) || LEVEL_TIERS[LEVEL_TIERS.length - 1];
    if (currentTier.level > profile.level_stage) {
      profile.level_stage = currentTier.level;
      levelUp = true;
      newLevel = currentTier.level;
    }
  }

  res.status(201).json({
    success: true,
    log: newLog,
    starsEarned,
    totalStars: profile?.stars || 0,
    levelStage: profile?.level_stage || 1,
    levelUp,
    newLevel
  });
});

// Get decentralized analytics: 1RM, Volume by Muscle, Consistency Heatmap
app.get('/api/progress/stats/:userId', (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const userLogs = progressLogs.filter(l => l.user_id === userId);

  // 1. Calculate Estimated 1RM via Brzycki Formula: Weight * (36 / (37 - Reps))
  // Key exercises tracked: Press Banca (id:8), Sentadilla (id:1), Hip Thrust (id:2), Peso Muerto (id:4), Press Militar (id:16)
  const keyExerciseIds = [1, 2, 8, 4, 16];
  const oneRmHistory: Record<string, { date: string; weight: number; reps: number; estimated1RM: number }[]> = {};

  keyExerciseIds.forEach(exId => {
    const ex = exercises.find(e => e.id === exId);
    if (!ex) return;
    const logs = userLogs.filter(l => l.exercise_id === exId);
    oneRmHistory[ex.name] = logs.map(l => {
      const reps = Math.min(Math.max(l.reps_done, 1), 36);
      const est1RM = Math.round(l.weight_lifted * (36 / (37 - reps)));
      return {
        date: l.created_at.split('T')[0],
        weight: l.weight_lifted,
        reps: l.reps_done,
        estimated1RM: est1RM
      };
    });
  });

  // 2. Weekly Cumulative Volume by Muscle Group
  const volumeByMuscle: Record<string, number> = {};
  userLogs.forEach(log => {
    const ex = exercises.find(e => e.id === log.exercise_id);
    const muscle = ex ? ex.muscle_group : 'General';
    const volume = (log.weight_lifted || 0) * (log.reps_done || 0);
    volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + volume;
  });

  // 3. Consistency Heatmap (past 12 weeks: count of workout actions per day)
  const heatmapData: Record<string, number> = {};
  userLogs.forEach(log => {
    const day = log.created_at.split('T')[0];
    heatmapData[day] = (heatmapData[day] || 0) + 1;
  });

  res.json({
    oneRmHistory,
    volumeByMuscle,
    heatmapData,
    totalLogsCount: userLogs.length
  });
});

// ---------------------------------------------
// API Endpoints: Supplements & Promo Notifications
// ---------------------------------------------

// Get all promotional supplement products & notifications
app.get('/api/promotions', (req: Request, res: Response) => {
  res.json({
    success: true,
    products: supplementProducts,
    notifications: promoNotifications,
    activeFlashCount: supplementProducts.filter(p => p.isFlashDeal && p.stock > 0).length
  });
});

// Reserve / Purchase a promotional supplement
app.post('/api/promotions/order', (req: Request, res: Response) => {
  const { userId, productId } = req.body;
  const user = users.find(u => u.id === Number(userId));
  const product = supplementProducts.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ success: false, error: 'Producto no encontrado' });
  }

  if (product.stock <= 0) {
    return res.status(400).json({ success: false, error: 'Agotado: No quedan unidades en recepción para esta oferta' });
  }

  // Deduct stock
  product.stock -= 1;

  // Generate unique order ticket code
  const codePrefix = product.category.substring(0, 4).toUpperCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const reservationCode = `REC-${codePrefix}-${randomDigits}`;

  const newOrder: SupplementOrder = {
    id: `ord-${Date.now()}`,
    userId: Number(userId) || (user ? user.id : 3),
    productId: product.id,
    productName: product.name,
    promoPrice: product.promoPrice,
    originalPrice: product.originalPrice,
    savings: Math.round((product.originalPrice - product.promoPrice) * 100) / 100,
    reservationCode,
    status: 'reservado',
    createdAt: new Date().toISOString()
  };

  supplementOrders.unshift(newOrder);

  // Award athlete loyalty points (e.g. 5 stars) if profile exists
  const profile = profiles.find(p => p.user_id === newOrder.userId);
  if (profile) {
    profile.stars += 5;
  }

  res.json({
    success: true,
    message: `¡Producto apartado con éxito! Muestra tu código ${reservationCode} en recepción.`,
    order: newOrder,
    updatedProduct: product,
    starsEarned: 5
  });
});

// Get user supplement orders / reservations
app.get('/api/promotions/orders/:userId', (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const userOrders = supplementOrders.filter(o => o.userId === userId);
  res.json({
    success: true,
    orders: userOrders
  });
});

// Trigger a flash sale notification (by coach or occasional app event)
app.post('/api/promotions/trigger-flash', (req: Request, res: Response) => {
  const { productId } = req.body;
  let targetProduct = supplementProducts.find(p => p.id === productId);

  if (!targetProduct) {
    // Pick random available product
    const available = supplementProducts.filter(p => p.stock > 0);
    targetProduct = available[Math.floor(Math.random() * available.length)] || supplementProducts[0];
  }

  const notifId = `notif-${Date.now()}`;
  const iconMapping: Record<string, 'creatina' | 'proteina' | 'fire' | 'flash' | 'gift'> = {
    creatina: 'creatina',
    proteina: 'proteina',
    preentreno: 'fire',
    recuperacion: 'flash',
    accesorios: 'gift'
  };

  const newNotification: PromoNotification = {
    id: notifId,
    productId: targetProduct.id,
    title: `⚡ ¡Oferta Flash: ${targetProduct.name.split(' ')[0]} ${targetProduct.name.split(' ')[1] || ''}!`,
    message: `${targetProduct.tag}. Solo quedan ${targetProduct.stock} unidades con ${targetProduct.discountPercent}% OFF en el mostrador del gimnasio.`,
    discountText: `-${targetProduct.discountPercent}% DTO`,
    promoPrice: targetProduct.promoPrice,
    originalPrice: targetProduct.originalPrice,
    expiresAt: new Date(Date.now() + (targetProduct.expiresInHours || 3) * 3600 * 1000).toISOString(),
    read: false,
    timestamp: 'Ahora mismo',
    iconType: iconMapping[targetProduct.category] || 'flash'
  };

  // Add to notifications list at beginning
  promoNotifications.unshift(newNotification);
  // Keep max 10 notifications
  if (promoNotifications.length > 10) {
    promoNotifications = promoNotifications.slice(0, 10);
  }

  res.json({
    success: true,
    notification: newNotification,
    product: targetProduct
  });
});

// Mark notifications as read
app.post('/api/promotions/mark-read', (req: Request, res: Response) => {
  const { notificationId } = req.body;
  if (notificationId) {
    promoNotifications = promoNotifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
  } else {
    promoNotifications = promoNotifications.map(n => ({ ...n, read: true }));
  }
  res.json({ success: true });
});

// ---------------------------------------------
// Dev & Production Frontend Serving
// ---------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitMaster Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
