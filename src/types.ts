export type Role = 'admin' | 'trainer' | 'atleta' | 'client';
export type MembershipStatus = 'activo' | 'vencido' | 'suspendido';
export type Gender = 'hombre' | 'mujer' | 'otro';
export type ObjectiveType = 'hipertrofia' | 'fuerza' | 'resistencia' | 'grasa' | 'postura';
export type FitnessLevel = 'principiante' | 'intermedio' | 'avanzado';
export type EquipmentType = 'barra' | 'mancuerna' | 'polea' | 'maquina' | 'peso_corporal';

export interface BmiCategoryInfo {
  bmi: number;
  mainCategory: 'Falta de Peso' | 'Peso Saludable' | 'Exceso de Peso';
  subCategory: string;
  color: string;
  badgeBg: string;
  advice: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  google_id: string;
  role: Role;
  membership_status: MembershipStatus;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  gender: Gender;
  current_objective: ObjectiveType;
  fitness_level: FitnessLevel;
  active_injuries: string[]; // e.g. ["lesion_rodilla", "molestia_hombro", "lumbar"]
  available_days: number; // 2, 3, 4, 5, 6
  weight_kg: number;
  height_cm: number;
  stars: number;
  level_stage: number; // 1 to 5
  assigned_trainer_id?: number;
}

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string; // "Cuádriceps", "Pectoral", "Dorsales", "Glúteos", "Hombros", "Bíceps", "Tríceps", "Femoral", "Core", "Espalda Baja"
  equipment_needed: EquipmentType;
  gif_url: string;
  banned_for_injuries: string[]; // e.g. ["lesion_rodilla", "lumbar"]
  gender_bias?: 'neutral' | 'mujer_enfoque' | 'hombre_enfoque';
  description: string;
}

export interface ExerciseObjectiveTag {
  id: number;
  exercise_id: number;
  objective: ObjectiveType;
  default_sets: number;
  default_reps_range: string;
  default_rest_seconds: number;
}

export interface WorkoutExerciseItem {
  id: number;
  routine_id: number;
  exercise_id: number;
  exercise_name: string;
  muscle_group: string;
  equipment_needed: string;
  gif_url?: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  sort_order: number;
  coach_customized?: boolean;
}

export interface WorkoutRoutine {
  id: number;
  user_id: number;
  day_name: string; // e.g. "Día 1: Empuje & Pectoral", "Día 1: Glúteo & Cadena Posterior"
  is_active: boolean;
  created_by: 'ia_gemini' | 'motor_algoritmico' | 'entrenador_manual';
  objective: ObjectiveType;
  coach_notes?: string;
  exercises: WorkoutExerciseItem[];
  created_at: string;
}

export interface UserProgressLog {
  id: number;
  user_id: number;
  exercise_id: number;
  exercise_name: string;
  weight_lifted: number;
  reps_done: number;
  rpe_felt: number; // 1 to 10
  created_at: string;
  stars_earned: number;
}

export interface PaymentRecord {
  id: number;
  user_id: number;
  userName: string;
  amount: number;
  date: string;
  method: 'Tarjeta' | 'Transferencia' | 'Efectivo';
  plan_type: 'Mensual VIP' | 'Trimestral Pro' | 'Anual Élite';
  status: 'Completado' | 'Pendiente' | 'Fallido';
}

export interface LevelInfo {
  level: number;
  title: string;
  minStars: number;
  maxStars: number;
  color: string;
  badge: string;
  perks: string[];
}

export interface SupplementProduct {
  id: string;
  name: string;
  category: 'creatina' | 'proteina' | 'preentreno' | 'recuperacion' | 'accesorios';
  tag: string;
  originalPrice: number;
  promoPrice: number;
  discountPercent: number;
  stock: number;
  description: string;
  benefits: string[];
  servings: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  badgeColor: string;
  expiresInHours?: number;
  isFlashDeal: boolean;
}

export interface PromoNotification {
  id: string;
  productId: string;
  title: string;
  message: string;
  discountText: string;
  promoPrice: number;
  originalPrice: number;
  expiresAt: string;
  read: boolean;
  timestamp: string;
  iconType: 'creatina' | 'proteina' | 'fire' | 'flash' | 'gift';
}

export interface SupplementOrder {
  id: string;
  userId: number;
  productId: string;
  productName: string;
  promoPrice: number;
  originalPrice: number;
  savings: number;
  reservationCode: string;
  status: 'reservado' | 'entregado' | 'cancelado';
  createdAt: string;
}
