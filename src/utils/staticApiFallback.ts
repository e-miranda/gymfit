import {
  INITIAL_EXERCISES,
  INITIAL_PAYMENTS,
  INITIAL_PROFILES,
  INITIAL_PROGRESS_LOGS,
  INITIAL_USERS,
  LEVEL_TIERS,
  generateLocalAlgorithmicRoutine
} from '../gymData';
import {
  INITIAL_SUPPLEMENT_PRODUCTS,
  INITIAL_NOTIFICATIONS
} from '../supplementData';
import {
  Exercise,
  PaymentRecord,
  PromoNotification,
  SupplementOrder,
  SupplementProduct,
  User,
  UserProfile,
  UserProgressLog,
  WorkoutRoutine
} from '../types';

const STORAGE_KEY = 'fitmaster_static_store_v1';

interface StaticStore {
  users: User[];
  profiles: UserProfile[];
  exercises: Exercise[];
  payments: PaymentRecord[];
  progressLogs: UserProgressLog[];
  supplementProducts: SupplementProduct[];
  promoNotifications: PromoNotification[];
  supplementOrders: SupplementOrder[];
  userRoutines: Record<number, WorkoutRoutine[]>;
}

function createInitialStore(): StaticStore {
  return {
    users: [...INITIAL_USERS],
    profiles: [...INITIAL_PROFILES],
    exercises: [...INITIAL_EXERCISES],
    payments: [...INITIAL_PAYMENTS],
    progressLogs: [...INITIAL_PROGRESS_LOGS],
    supplementProducts: [...INITIAL_SUPPLEMENT_PRODUCTS],
    promoNotifications: [...INITIAL_NOTIFICATIONS],
    supplementOrders: [
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
    ],
    userRoutines: {
      3: generateLocalAlgorithmicRoutine({
        user_id: 3,
        gender: 'hombre',
        current_objective: 'hipertrofia',
        fitness_level: 'intermedio',
        active_injuries: ['molestia_hombro'],
        available_days: 6
      }),
      4: generateLocalAlgorithmicRoutine({
        user_id: 4,
        gender: 'mujer',
        current_objective: 'grasa',
        fitness_level: 'intermedio',
        active_injuries: ['lesion_rodilla'],
        available_days: 6
      })
    }
  };
}

let memoryStore: StaticStore | null = null;

function getStore(): StaticStore {
  if (memoryStore) return memoryStore;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryStore = JSON.parse(raw) as StaticStore;
      return memoryStore;
    }
  } catch {
    // Ignore storage errors
  }
  memoryStore = createInitialStore();
  saveStore(memoryStore);
  return memoryStore;
}

function saveStore(store: StaticStore) {
  memoryStore = store;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors
  }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleStaticApi(pathname: string, method: string, bodyRaw?: BodyInit | null): Promise<Response> {
  const store = getStore();
  let body: any = {};
  if (typeof bodyRaw === 'string' && bodyRaw.trim()) {
    try {
      body = JSON.parse(bodyRaw);
    } catch {
      body = {};
    }
  }

  // GET /api/users
  if (pathname === '/api/users' && method === 'GET') {
    const combined = store.users.map(u => ({
      ...u,
      profile: store.profiles.find(p => p.user_id === u.id) || null
    }));
    return jsonResponse({ users: combined });
  }

  // POST /api/users
  if (pathname === '/api/users' && method === 'POST') {
    const newId = Math.max(0, ...store.users.map(u => u.id)) + 1;
    const newUser: User = {
      id: newId,
      name: body.name || 'Nuevo Atleta',
      email: body.email || `atleta${newId}@fitmaster.com`,
      google_id: `google_${Date.now()}`,
      role: body.role || 'atleta',
      membership_status: 'activo',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      created_at: new Date().toISOString()
    };
    const newProfile: UserProfile = {
      id: newId,
      user_id: newId,
      gender: body.gender || 'hombre',
      current_objective: body.current_objective || 'hipertrofia',
      fitness_level: body.fitness_level || 'principiante',
      active_injuries: body.active_injuries || [],
      available_days: body.available_days || 4,
      weight_kg: Number(body.weight_kg) || 70,
      height_cm: Number(body.height_cm) || 170,
      stars: 0,
      level_stage: 1,
      assigned_trainer_id: 2
    };
    store.users.push(newUser);
    store.profiles.push(newProfile);
    store.userRoutines[newId] = generateLocalAlgorithmicRoutine({
      user_id: newId,
      gender: newProfile.gender,
      current_objective: newProfile.current_objective,
      fitness_level: newProfile.fitness_level,
      active_injuries: newProfile.active_injuries,
      available_days: newProfile.available_days
    });
    saveStore(store);
    return jsonResponse({ success: true, user: newUser, profile: newProfile }, 201);
  }

  // PUT /api/users/:id/membership
  const membershipMatch = pathname.match(/^\/api\/users\/(\d+)\/membership$/);
  if (membershipMatch && method === 'PUT') {
    const userId = parseInt(membershipMatch[1], 10);
    const user = store.users.find(u => u.id === userId);
    if (!user) return jsonResponse({ error: 'Usuario no encontrado' }, 404);
    if (body.membership_status) user.membership_status = body.membership_status;
    saveStore(store);
    return jsonResponse({ success: true, user });
  }

  // GET /api/users/:id/profile
  const profileMatch = pathname.match(/^\/api\/users\/(\d+)\/profile$/);
  if (profileMatch && method === 'GET') {
    const userId = parseInt(profileMatch[1], 10);
    const profile = store.profiles.find(p => p.user_id === userId);
    if (!profile) return jsonResponse({ error: 'Perfil no encontrado' }, 404);
    return jsonResponse({ profile });
  }

  // PUT /api/users/:id/profile
  if (profileMatch && method === 'PUT') {
    const userId = parseInt(profileMatch[1], 10);
    const idx = store.profiles.findIndex(p => p.user_id === userId);
    if (idx === -1) return jsonResponse({ error: 'Perfil no encontrado' }, 404);
    store.profiles[idx] = { ...store.profiles[idx], ...body };
    saveStore(store);
    return jsonResponse({ success: true, profile: store.profiles[idx] });
  }

  // GET /api/users/:id/routines
  const routinesMatch = pathname.match(/^\/api\/users\/(\d+)\/routines$/);
  if (routinesMatch && method === 'GET') {
    const userId = parseInt(routinesMatch[1], 10);
    let routines = store.userRoutines[userId];
    if (!routines) {
      const profile = store.profiles.find(p => p.user_id === userId);
      routines = generateLocalAlgorithmicRoutine({
        user_id: userId,
        gender: profile?.gender || 'hombre',
        current_objective: profile?.current_objective || 'hipertrofia',
        fitness_level: profile?.fitness_level || 'principiante',
        active_injuries: profile?.active_injuries || [],
        available_days: profile?.available_days || 4
      });
      store.userRoutines[userId] = routines;
      saveStore(store);
    }
    return jsonResponse({ routines });
  }

  // POST /api/routines/generate
  if (pathname === '/api/routines/generate' && method === 'POST') {
    const userId = Number(body.user_id) || 3;
    const generated = generateLocalAlgorithmicRoutine({
      user_id: userId,
      gender: body.gender || 'hombre',
      current_objective: body.current_objective || 'hipertrofia',
      fitness_level: body.fitness_level || 'intermedio',
      active_injuries: body.active_injuries || [],
      available_days: body.available_days || 4
    });
    store.userRoutines[userId] = generated;
    const pIdx = store.profiles.findIndex(p => p.user_id === userId);
    if (pIdx !== -1) {
      store.profiles[pIdx] = {
        ...store.profiles[pIdx],
        current_objective: body.current_objective || store.profiles[pIdx].current_objective,
        available_days: body.available_days || store.profiles[pIdx].available_days,
        active_injuries: body.active_injuries ?? store.profiles[pIdx].active_injuries,
        gender: body.gender || store.profiles[pIdx].gender
      };
    }
    saveStore(store);
    return jsonResponse({
      success: true,
      engineUsed: 'motor_algoritmico',
      engineNote: 'Motor algorítmico biomecánico local activo (modo estático)',
      latencyMs: 12,
      routines: generated
    });
  }

  // PUT /api/routines/:routineId
  const routineUpdateMatch = pathname.match(/^\/api\/routines\/(\d+)$/);
  if (routineUpdateMatch && method === 'PUT') {
    const routineId = parseInt(routineUpdateMatch[1], 10);
    for (const uid of Object.keys(store.userRoutines)) {
      const list = store.userRoutines[Number(uid)];
      const idx = list.findIndex(r => r.id === routineId);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          exercises: body.exercises || list[idx].exercises,
          coach_notes: body.coach_notes ?? list[idx].coach_notes,
          created_by: 'entrenador_manual'
        };
        saveStore(store);
        return jsonResponse({ success: true, routine: list[idx] });
      }
    }
    return jsonResponse({ error: 'Rutina no encontrada' }, 404);
  }

  // GET /api/exercises
  if (pathname === '/api/exercises' && method === 'GET') {
    return jsonResponse({ exercises: store.exercises });
  }

  // GET /api/payments
  if (pathname === '/api/payments' && method === 'GET') {
    return jsonResponse({ payments: store.payments });
  }

  // POST /api/payments
  if (pathname === '/api/payments' && method === 'POST') {
    const userId = Number(body.user_id);
    const user = store.users.find(u => u.id === userId);
    const newPay: PaymentRecord = {
      id: Math.max(0, ...store.payments.map(p => p.id)) + 1,
      user_id: userId,
      userName: user?.name || 'Atleta',
      amount: Number(body.amount) || 55,
      date: new Date().toISOString().split('T')[0],
      method: body.method || 'Tarjeta',
      plan_type: body.plan_type || 'Mensual VIP',
      status: 'Completado'
    };
    store.payments.unshift(newPay);
    if (user) user.membership_status = 'activo';
    saveStore(store);
    return jsonResponse({ success: true, payment: newPay }, 201);
  }

  // POST /api/progress/log
  if (pathname === '/api/progress/log' && method === 'POST') {
    const userId = Number(body.user_id);
    const starsEarned = Number(body.stars_earned) || 1;
    const newLog: UserProgressLog = {
      id: Date.now(),
      user_id: userId,
      exercise_id: Number(body.exercise_id) || 1,
      exercise_name: body.exercise_name || 'Ejercicio',
      weight_lifted: Number(body.weight_lifted) || 0,
      reps_done: Number(body.reps_done) || 0,
      rpe_felt: Number(body.rpe_felt) || 8,
      created_at: new Date().toISOString(),
      stars_earned: starsEarned
    };
    store.progressLogs.push(newLog);
    const profile = store.profiles.find(p => p.user_id === userId);
    let levelUp = false;
    let newLevel = profile?.level_stage || 1;
    if (profile) {
      profile.stars += starsEarned;
      const tier = [...LEVEL_TIERS].reverse().find(t => profile.stars >= t.minStars) || LEVEL_TIERS[0];
      if (tier.level > profile.level_stage) {
        profile.level_stage = tier.level;
        levelUp = true;
        newLevel = tier.level;
      }
    }
    saveStore(store);
    return jsonResponse({
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
    const userId = parseInt(statsMatch[1], 10);
    const userLogs = store.progressLogs.filter(l => l.user_id === userId);
    const keyExerciseIds = [1, 2, 8, 4, 16];
    const oneRmHistory: Record<string, { date: string; weight: number; reps: number; estimated1RM: number }[]> = {};
    keyExerciseIds.forEach(exId => {
      const ex = store.exercises.find(e => e.id === exId);
      if (!ex) return;
      const logs = userLogs.filter(l => l.exercise_id === exId);
      oneRmHistory[ex.name] = logs.map(l => {
        const reps = Math.min(Math.max(l.reps_done, 1), 36);
        return {
          date: l.created_at.split('T')[0],
          weight: l.weight_lifted,
          reps: l.reps_done,
          estimated1RM: Math.round(l.weight_lifted * (36 / (37 - reps)))
        };
      });
    });

    const volumeByMuscle: Record<string, number> = {};
    userLogs.forEach(log => {
      const ex = store.exercises.find(e => e.id === log.exercise_id);
      const muscle = ex ? ex.muscle_group : 'General';
      volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + (log.weight_lifted || 0) * (log.reps_done || 0);
    });

    const heatmapData: Record<string, number> = {};
    userLogs.forEach(log => {
      const day = log.created_at.split('T')[0];
      heatmapData[day] = (heatmapData[day] || 0) + 1;
    });

    return jsonResponse({
      oneRmHistory,
      volumeByMuscle,
      heatmapData,
      totalLogsCount: userLogs.length
    });
  }

  // GET /api/promotions
  if (pathname === '/api/promotions' && method === 'GET') {
    return jsonResponse({
      success: true,
      products: store.supplementProducts,
      notifications: store.promoNotifications,
      activeFlashCount: store.supplementProducts.filter(p => p.isFlashDeal && p.stock > 0).length
    });
  }

  // POST /api/promotions/order
  if (pathname === '/api/promotions/order' && method === 'POST') {
    const product = store.supplementProducts.find(p => p.id === body.productId);
    if (!product) return jsonResponse({ success: false, error: 'Producto no encontrado' }, 404);
    if (product.stock <= 0) return jsonResponse({ success: false, error: 'Agotado en recepción' }, 400);

    product.stock -= 1;
    const codePrefix = product.category.substring(0, 4).toUpperCase();
    const reservationCode = `REC-${codePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: SupplementOrder = {
      id: `ord-${Date.now()}`,
      userId: Number(body.userId) || 3,
      productId: product.id,
      productName: product.name,
      promoPrice: product.promoPrice,
      originalPrice: product.originalPrice,
      savings: Math.round((product.originalPrice - product.promoPrice) * 100) / 100,
      reservationCode,
      status: 'reservado',
      createdAt: new Date().toISOString()
    };
    store.supplementOrders.unshift(newOrder);
    const profile = store.profiles.find(p => p.user_id === newOrder.userId);
    if (profile) profile.stars += 5;
    saveStore(store);

    return jsonResponse({
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
    const userId = parseInt(ordersMatch[1], 10);
    return jsonResponse({
      success: true,
      orders: store.supplementOrders.filter(o => o.userId === userId)
    });
  }

  // POST /api/promotions/trigger-flash
  if (pathname === '/api/promotions/trigger-flash' && method === 'POST') {
    let targetProduct = store.supplementProducts.find(p => p.id === body.productId);
    if (!targetProduct) {
      const available = store.supplementProducts.filter(p => p.stock > 0);
      targetProduct = available[Math.floor(Math.random() * available.length)] || store.supplementProducts[0];
    }
    const iconMapping: Record<string, 'creatina' | 'proteina' | 'fire' | 'flash' | 'gift'> = {
      creatina: 'creatina',
      proteina: 'proteina',
      preentreno: 'fire',
      recuperacion: 'flash',
      accesorios: 'gift'
    };
    const newNotification: PromoNotification = {
      id: `notif-${Date.now()}`,
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
    store.promoNotifications.unshift(newNotification);
    if (store.promoNotifications.length > 10) {
      store.promoNotifications = store.promoNotifications.slice(0, 10);
    }
    saveStore(store);
    return jsonResponse({ success: true, notification: newNotification, product: targetProduct });
  }

  // POST /api/promotions/mark-read
  if (pathname === '/api/promotions/mark-read' && method === 'POST') {
    store.promoNotifications = store.promoNotifications.map(n =>
      body.notificationId ? (n.id === body.notificationId ? { ...n, read: true } : n) : { ...n, read: true }
    );
    saveStore(store);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

/**
 * Installs a transparent fetch fallback for static hosts (such as GitHub Pages)
 * where there is no Node/Express backend serving /api/* routes.
 * When a real backend responds with JSON, its response is returned untouched.
 */
export function installStaticApiFallback() {
  if (typeof window === 'undefined' || (window as any).__fitmasterFetchPatched) return;
  (window as any).__fitmasterFetchPatched = true;

  const originalFetch = window.fetch.bind(window);
  let staticMode = false;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Only intercept relative /api/* requests
    if (!urlStr.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    const parsedUrl = new URL(urlStr, window.location.origin);
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

    if (staticMode) {
      return handleStaticApi(parsedUrl.pathname, method, init?.body);
    }

    try {
      const response = await originalFetch(input, init);
      const contentType = response.headers.get('content-type') || '';

      // If a static host (e.g. GitHub Pages) returns 404/405 HTML instead of JSON, switch to local engine
      if (!response.ok && !contentType.includes('application/json')) {
        staticMode = true;
        return handleStaticApi(parsedUrl.pathname, method, init?.body);
      }

      return response;
    } catch {
      staticMode = true;
      return handleStaticApi(parsedUrl.pathname, method, init?.body);
    }
  };
}
