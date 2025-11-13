import { Database } from '@/lib/database.types';

export type RoutineRow = Database['public']['Tables']['user_routines']['Row'];
export type RoutineInsert = Database['public']['Tables']['user_routines']['Insert'];
export type RoutineUpdate = Database['public']['Tables']['user_routines']['Update'];

export type ActiveRoutine = Pick<RoutineRow, 'id' | 'content' | 'version' | 'created_at'>;

export type DraftRoutine = Pick<RoutineRow, 'id' | 'content' | 'version' | 'created_at' | 'updated_at'>;

