import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_EXERCISES,
  INITIAL_PAYMENTS,
  INITIAL_PROFILES,
  INITIAL_PROGRESS_LOGS,
  INITIAL_USERS,
  LEVEL_TIERS,
  generateLocalAlgorithmicRoutine
} from './gymData';
import {
  INITIAL_SUPPLEMENT_PRODUCTS,
  INITIAL_NOTIFICATIONS
} from './supplementData';
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
} from './types';

// In-memory relational store
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

const userRoutinesMap = new Map<number, WorkoutRoutine[]>();

userRoutinesMap.set(3, generateLocalAlgorithmicRoutine({
  user_id: 3,
  gender: 'hombre',
  current_objective: 'hipertrofia',
  fitness_level: 'intermedio',
  active_injuries: ['molestia_hombro'],
  available_days: 4
}));

userRoutinesMap.set(4, generateLocalAlgorithmicRoutine({
  user_id: 4,
  gender: 'mujer',
  current_objective: 'grasa',
  fitness_level: 'intermedio',
  active_injuries: ['lesion_rodilla'],
  available_days: 4
}));

// Gemini AI client (Server-side)
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

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: ServerResponse, data: any, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export function apiPlugin(): Plugin {
  return {
    name: 'fitmaster-api-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const method = (req.method || 'GET').toUpperCase();

        if (!url.startsWith('/api/')) {
          return next();
        }

        const parsedUrl = new URL(url, 'http://localhost');
        const pathname = parsedUrl.pathname;

        try {
          // POST /api/auth/google-simulate
          if (pathname === '/api/auth/google-simulate' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { email } = body;
            const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

            if (!user) {
              return sendJson(res, {
                success: false,
                error: 'Usuario no registrado en el sistema del gimnasio. Diríjase a recepción para su alta.'
              }, 404);
            }

            if (user.membership_status === 'vencido') {
              return sendJson(res, {
                success: false,
                membership_status: 'vencido',
                error: 'Membresía Vencida. Su pago mensual se encuentra pendiente de liquidar en recepción.',
                user
              }, 403);
            }

            if (user.membership_status === 'suspendido') {
              return sendJson(res, {
                success: false,
                membership_status: 'suspendido',
                error: 'Cuenta suspendida temporalmente por administración.',
                user
              }, 403);
            }

            const profile = profiles.find(p => p.user_id === user.id);
            return sendJson(res, {
              success: true,
              jwt_token: `jwt_fitmaster_${user.id}_${Date.now()}`,
              user,
              profile
            });
          }

          // GET /api/users
          if (pathname === '/api/users' && method === 'GET') {
            const combined = users.map(user => {
              const profile = profiles.find(p => p.user_id === user.id);
              return { ...user, profile: profile || null };
            });
            return sendJson(res, { users: combined });
          }

          // POST /api/users
          if (pathname === '/api/users' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { name, email, role = 'atleta', membership_status = 'activo', phone, gender = 'hombre', objective = 'hipertrofia', days = 4 } = body;

            if (!name || !email) {
              return sendJson(res, { error: 'Nombre y correo requeridos.' }, 400);
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

            const routines = generateLocalAlgorithmicRoutine({
              user_id: newId,
              gender: newProfile.gender,
              current_objective: newProfile.current_objective,
              fitness_level: newProfile.fitness_level,
              active_injuries: [],
              available_days: newProfile.available_days
            });
            userRoutinesMap.set(newId, routines);

            return sendJson(res, { user: newUser, profile: newProfile }, 201);
          }

          // PATCH /api/users/:id/membership
          const membershipMatch = pathname.match(/^\/api\/users\/(\d+)\/membership$/);
          if (membershipMatch && method === 'PATCH') {
            const userId = parseInt(membershipMatch[1]);
            const body = await parseJsonBody(req);
            const { status } = body;
            const user = users.find(u => u.id === userId);
            if (!user) return sendJson(res, { error: 'Usuario no encontrado' }, 404);

            if (['activo', 'vencido', 'suspendido'].includes(status)) {
              user.membership_status = status;
              return sendJson(res, { success: true, user });
            }
            return sendJson(res, { error: 'Estado de membresía no válido' }, 400);
          }

          // GET & PUT /api/users/:id/profile
          const profileMatch = pathname.match(/^\/api\/users\/(\d+)\/profile$/);
          if (profileMatch) {
            const userId = parseInt(profileMatch[1]);
            let profile = profiles.find(p => p.user_id === userId);

            if (method === 'GET') {
              if (!profile) return sendJson(res, { error: 'Perfil no encontrado' }, 404);
              return sendJson(res, { profile });
            }

            if (method === 'PUT') {
              const body = await parseJsonBody(req);
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

              const { gender, current_objective, fitness_level, active_injuries, available_days, weight_kg, height_cm } = body;
              if (gender) profile.gender = gender;
              if (current_objective) profile.current_objective = current_objective;
              if (fitness_level) profile.fitness_level = fitness_level;
              if (Array.isArray(active_injuries)) profile.active_injuries = active_injuries;
              if (available_days) profile.available_days = Number(available_days);
              if (weight_kg) profile.weight_kg = Number(weight_kg);
              if (height_cm) profile.height_cm = Number(height_cm);

              return sendJson(res, { success: true, profile });
            }
          }

          // GET /api/exercises
          if (pathname === '/api/exercises' && method === 'GET') {
            return sendJson(res, { exercises });
          }

          // POST /api/exercises
          if (pathname === '/api/exercises' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { name, muscle_group, equipment_needed, gif_url, banned_for_injuries, gender_bias, description } = body;
            if (!name || !muscle_group) {
              return sendJson(res, { error: 'Nombre y grupo muscular son requeridos' }, 400);
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
            return sendJson(res, { exercise: newExercise }, 201);
          }

          // GET /api/payments
          if (pathname === '/api/payments' && method === 'GET') {
            return sendJson(res, { payments });
          }

          // POST /api/payments
          if (pathname === '/api/payments' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { user_id, amount, method: payMethod, plan_type } = body;
            const user = users.find(u => u.id === Number(user_id));

            const newPayment: PaymentRecord = {
              id: payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 101,
              user_id: Number(user_id),
              userName: user ? user.name : 'Usuario Desconocido',
              amount: Number(amount) || 50,
              date: new Date().toISOString().split('T')[0],
              method: payMethod || 'Tarjeta',
              plan_type: plan_type || 'Mensual VIP',
              status: 'Completado'
            };

            payments.unshift(newPayment);
            if (user && user.membership_status === 'vencido') {
              user.membership_status = 'activo';
            }
            return sendJson(res, { payment: newPayment }, 201);
          }

          // GET /api/users/:id/routines
          const routinesMatch = pathname.match(/^\/api\/users\/(\d+)\/routines$/);
          if (routinesMatch && method === 'GET') {
            const userId = parseInt(routinesMatch[1]);
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
            return sendJson(res, { routines });
          }

          // POST /api/routines/generate
          if (pathname === '/api/routines/generate' && method === 'POST') {
            const startTime = Date.now();
            const body = await parseJsonBody(req);
            const {
              user_id,
              gender = 'hombre',
              current_objective = 'hipertrofia',
              fitness_level = 'intermedio',
              active_injuries = [],
              available_days = 4,
              force_engine
            } = body;

            const validInjuries: string[] = Array.isArray(active_injuries) ? active_injuries : [];
            const allowedExercises = exercises.filter(
              ex => !ex.banned_for_injuries.some(inj => validInjuries.includes(inj))
            );

            let generatedRoutines: WorkoutRoutine[] | null = null;
            let engineUsed = 'motor_algoritmico';
            let engineNote = 'Motor de Reglas Algorítmico Local (Código puro a Costo Cero - 100% Fiabilidad)';

            if (ai && force_engine !== 'algorithmic') {
              try {
                const allowedNames = allowedExercises.map(e => `${e.name} (id:${e.id}, grupo:${e.muscle_group})`).join(', ');
                const prompt = `Eres el microservicio de IA para prescripción de entrenamiento biomecánico de gimnasio.
Genera una rutina de ${available_days} días para un usuario con:
- Sexo: ${gender} (${gender === 'mujer' ? 'Prioridad biomecánica a glúteos, femorales, cadera y postura' : 'Prioridad a hipertrofia de torso, hombro y piernas funcionales'})
- Nivel: ${fitness_level}
- Objetivo: ${current_objective}
- Lesiones ACTIVAS PROHIBIDAS: ${validInjuries.length > 0 ? validInjuries.join(', ') : 'Ninguna'}
- Días: ${available_days}
Catálogo: ${allowedNames}
Devuelve JSON: { "routines": [ { "day_name": "...", "objective": "${current_objective}", "coach_notes": "...", "exercises": [ { "exercise_id": 1, "exercise_name": "...", "muscle_group": "...", "sets": 4, "reps": "8-12", "rest_seconds": 90, "sort_order": 1 } ] } ] }`;

                const timeoutPromise = new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('timeout')), 3000)
                );

                const aiResponse = await Promise.race([
                  ai.models.generateContent({
                    model: 'gemini-3.8-flash',
                    contents: prompt,
                    config: { responseMimeType: 'application/json', temperature: 0.3 }
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
              } catch {
                // fall through to algorithmic engine
              }
            }

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

            userRoutinesMap.set(Number(user_id), generatedRoutines);
            const latencyMs = Date.now() - startTime;
            return sendJson(res, {
              success: true,
              engineUsed,
              engineNote,
              latencyMs,
              routines: generatedRoutines
            });
          }

          // PUT /api/routines/:id
          const editRoutineMatch = pathname.match(/^\/api\/routines\/(\d+)$/);
          if (editRoutineMatch && method === 'PUT') {
            const routineId = parseInt(editRoutineMatch[1]);
            const body = await parseJsonBody(req);
            const { user_id, day_name, coach_notes, exercises: updatedExercises, is_active } = body;
            const targetUserId = Number(user_id);
            const currentRoutines = userRoutinesMap.get(targetUserId) || [];
            const routineIndex = currentRoutines.findIndex(r => r.id === routineId);

            if (routineIndex === -1) {
              return sendJson(res, { error: 'Rutina no encontrada' }, 404);
            }

            if (day_name) currentRoutines[routineIndex].day_name = day_name;
            if (coach_notes !== undefined) currentRoutines[routineIndex].coach_notes = coach_notes;
            if (is_active !== undefined) currentRoutines[routineIndex].is_active = is_active;
            if (Array.isArray(updatedExercises)) {
              currentRoutines[routineIndex].exercises = updatedExercises;
              currentRoutines[routineIndex].created_by = 'entrenador_manual';
            }

            userRoutinesMap.set(targetUserId, currentRoutines);
            return sendJson(res, { success: true, routine: currentRoutines[routineIndex] });
          }

          // POST /api/progress/log
          if (pathname === '/api/progress/log' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { user_id, exercise_id, weight_lifted, reps_done, rpe_felt = 8, is_workout_finished = false } = body;
            const targetUserId = Number(user_id);
            const catalogEx = exercises.find(e => e.id === Number(exercise_id));

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

            const profile = profiles.find(p => p.user_id === targetUserId);
            let levelUp = false;
            let newLevel = 1;

            if (profile) {
              profile.stars = (profile.stars || 0) + starsEarned;
              const currentTier = LEVEL_TIERS.find(t => profile.stars >= t.minStars && profile.stars <= t.maxStars) || LEVEL_TIERS[LEVEL_TIERS.length - 1];
              if (currentTier.level > profile.level_stage) {
                profile.level_stage = currentTier.level;
                levelUp = true;
                newLevel = currentTier.level;
              }
            }

            return sendJson(res, {
              success: true,
              log: newLog,
              starsEarned,
              totalStars: profile?.stars || 0,
              levelStage: profile?.level_stage || 1,
              levelUp,
              newLevel
            }, 201);
          }

          // GET /api/progress/stats/:userId
          const statsMatch = pathname.match(/^\/api\/progress\/stats\/(\d+)$/);
          if (statsMatch && method === 'GET') {
            const userId = parseInt(statsMatch[1]);
            const userLogs = progressLogs.filter(l => l.user_id === userId);

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

            const volumeByMuscle: Record<string, number> = {};
            userLogs.forEach(log => {
              const ex = exercises.find(e => e.id === log.exercise_id);
              const muscle = ex ? ex.muscle_group : 'General';
              const volume = (log.weight_lifted || 0) * (log.reps_done || 0);
              volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + volume;
            });

            const heatmapData: Record<string, number> = {};
            userLogs.forEach(log => {
              const day = log.created_at.split('T')[0];
              heatmapData[day] = (heatmapData[day] || 0) + 1;
            });

            return sendJson(res, {
              oneRmHistory,
              volumeByMuscle,
              heatmapData,
              totalLogsCount: userLogs.length
            });
          }

          // GET /api/promotions
          if (pathname === '/api/promotions' && method === 'GET') {
            return sendJson(res, {
              success: true,
              products: supplementProducts,
              notifications: promoNotifications,
              activeFlashCount: supplementProducts.filter(p => p.isFlashDeal && p.stock > 0).length
            });
          }

          // POST /api/promotions/order
          if (pathname === '/api/promotions/order' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { userId, productId } = body;
            const user = users.find(u => u.id === Number(userId));
            const product = supplementProducts.find(p => p.id === productId);

            if (!product) {
              return sendJson(res, { success: false, error: 'Producto no encontrado' }, 404);
            }

            if (product.stock <= 0) {
              return sendJson(res, { success: false, error: 'Agotado: No quedan unidades en recepción' }, 400);
            }

            // Deduct stock
            product.stock -= 1;

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

            const profile = profiles.find(p => p.user_id === newOrder.userId);
            if (profile) {
              profile.stars += 5;
            }

            return sendJson(res, {
              success: true,
              message: `¡Producto apartado con éxito! Muestra tu código ${reservationCode} en recepción.`,
              order: newOrder,
              updatedProduct: product,
              starsEarned: 5
            }, 201);
          }

          // GET /api/promotions/orders/:userId
          const ordersMatch = pathname.match(/^\/api\/promotions\/orders\/(\d+)$/);
          if (ordersMatch && method === 'GET') {
            const userId = parseInt(ordersMatch[1]);
            const userOrders = supplementOrders.filter(o => o.userId === userId);
            return sendJson(res, {
              success: true,
              orders: userOrders
            });
          }

          // POST /api/promotions/trigger-flash
          if (pathname === '/api/promotions/trigger-flash' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { productId } = body;
            let targetProduct = supplementProducts.find(p => p.id === productId);

            if (!targetProduct) {
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

            promoNotifications.unshift(newNotification);
            if (promoNotifications.length > 10) {
              promoNotifications = promoNotifications.slice(0, 10);
            }

            return sendJson(res, {
              success: true,
              notification: newNotification,
              product: targetProduct
            });
          }

          // POST /api/promotions/mark-read
          if (pathname === '/api/promotions/mark-read' && method === 'POST') {
            const body = await parseJsonBody(req);
            const { notificationId } = body;
            if (notificationId) {
              promoNotifications = promoNotifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
            } else {
              promoNotifications = promoNotifications.map(n => ({ ...n, read: true }));
            }
            return sendJson(res, { success: true });
          }

          return sendJson(res, { error: 'Not found' }, 404);
        } catch (err: any) {
          return sendJson(res, { error: err?.message || 'Server error' }, 500);
        }
      });
    }
  };
}
