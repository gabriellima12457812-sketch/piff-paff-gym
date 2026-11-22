-- ============================================================================
-- Piff Paff Gym — Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Isolamento total de dados por UID (auth.uid()) + Acesso Admin Master
-- ============================================================================

-- 1. Perfis de Usuários (vinculados ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'admin')),
  tier TEXT NOT NULL DEFAULT 'free_launch' CHECK (tier IN ('free_launch', 'free', 'vip_pro')),
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'pro')),
  location TEXT NOT NULL DEFAULT 'gym' CHECK (location IN ('gym', 'home', 'hybrid')),
  weight_kg NUMERIC(5,2) DEFAULT 75.0,
  height_cm NUMERIC(5,1) DEFAULT 175.0,
  goal_weight_kg NUMERIC(5,2) DEFAULT 75.0,
  score INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Estado Consolidado Isolado por UID (Sincronização rápida com StorageAdapter)
CREATE TABLE IF NOT EXISTS public.user_app_state (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_workouts JSONB NOT NULL DEFAULT '[]'::jsonb,
  workout_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  load_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  weight_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  evolution_photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  nutrition_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  spotify_playlists JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_matrix TEXT DEFAULT 'shape_v',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Logs Detalhados de Treinos (opcional para Analytics / Admin CRM)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matrix_id TEXT,
  workout_name TEXT NOT NULL,
  location TEXT NOT NULL,
  level TEXT NOT NULL,
  total_volume_kg NUMERIC(10,2) DEFAULT 0,
  sets_completed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Função Auxiliar: Verificar se o usuário autenticado é Admin Master
CREATE OR REPLACE FUNCTION public.is_admin_master()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE uid = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================================
-- ATIVAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para public.profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = uid OR public.is_admin_master());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = uid OR public.is_admin_master());

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = uid OR public.is_admin_master())
  WITH CHECK (
    (auth.uid() = uid AND role = (SELECT role FROM public.profiles WHERE uid = auth.uid()))
    OR public.is_admin_master()
  );

DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;
CREATE POLICY "profiles_delete_admin_only"
  ON public.profiles FOR DELETE
  USING (public.is_admin_master());

-- Políticas para public.user_app_state (Isolamento estrito por UID)
DROP POLICY IF EXISTS "state_select_own_or_admin" ON public.user_app_state;
CREATE POLICY "state_select_own_or_admin"
  ON public.user_app_state FOR SELECT
  USING (auth.uid() = uid OR public.is_admin_master());

DROP POLICY IF EXISTS "state_insert_own_or_admin" ON public.user_app_state;
CREATE POLICY "state_insert_own_or_admin"
  ON public.user_app_state FOR INSERT
  WITH CHECK (auth.uid() = uid OR public.is_admin_master());

DROP POLICY IF EXISTS "state_update_own_or_admin" ON public.user_app_state;
CREATE POLICY "state_update_own_or_admin"
  ON public.user_app_state FOR UPDATE
  USING (auth.uid() = uid OR public.is_admin_master())
  WITH CHECK (auth.uid() = uid OR public.is_admin_master());

-- Políticas para public.workout_sessions
DROP POLICY IF EXISTS "sessions_select_own_or_admin" ON public.workout_sessions;
CREATE POLICY "sessions_select_own_or_admin"
  ON public.workout_sessions FOR SELECT
  USING (auth.uid() = uid OR public.is_admin_master());

DROP POLICY IF EXISTS "sessions_insert_own" ON public.workout_sessions;
CREATE POLICY "sessions_insert_own"
  ON public.workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = uid OR public.is_admin_master());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_workout_sessions_uid ON public.workout_sessions(uid, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
