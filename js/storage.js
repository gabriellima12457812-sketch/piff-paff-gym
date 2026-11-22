/**
 * Piff Paff Gym — Storage Layer com Isolamento Estrito por UID
 * Suporta:
 *  - LocalStorageAdapter (ativo por padrão, zero-config, offline PWA)
 *  - SupabaseAdapter (pronto para Supabase Free + database/supabase-rls.sql)
 *  - FirestoreAdapter (pronto para Firebase Firestore + database/firestore.rules)
 */

import { APP_CONFIG } from './config.js';

const PREFIX = APP_CONFIG.STORAGE_PREFIX;

const KEYS = {
  USERS_INDEX: `${PREFIX}_users_index`,
  SESSION: `${PREFIX}_session`,
  SEEDED: `${PREFIX}_seeded_v1`,
  userDataKey: (uid) => `${PREFIX}_uid_data_${uid}`,
};

export function createEmptyUserData(profile = {}) {
  const weight = Number(profile.weightKg) || 75;
  const height = Number(profile.heightCm) || 175;
  const goalWeight = Number(profile.goalWeightKg) || weight;
  const today = new Date().toISOString().slice(0, 10);

  return {
    uid: profile.uid || '',
    activeMatrixId: 'shape_v',
    activeDayIndex: 0,
    customWorkouts: [],
    workoutLogs: [],
    loadHistory: {},
    weightHistory: [
      {
        id: `wh_${Date.now()}`,
        date: today,
        weightKg: weight,
        bodyFatPct: null,
        note: 'Registro inicial',
      },
    ],
    bodyProfile: {
      weightKg: weight,
      heightCm: height,
      goalWeightKg: goalWeight,
      bodyFatPct: null,
      gender: profile.gender || 'male',
      neckCm: null,
      waistCm: null,
      hipCm: null,
    },
    goals: [],
    evolutionPhotos: [],
    nutrition: {
      date: today,
      waterMl: 0,
      proteinFactor: profile.level === 'pro' ? 2.2 : profile.level === 'intermediate' ? 2.0 : 1.8,
      proteinConsumedG: 0,
      hydrationBonusAwardedDate: null,
      proteinBonusAwardedDate: null,
    },
    spotify: {
      activePlaylistId: 'beast_mode',
      customPlaylists: [],
      miniPlayerOpen: false,
      miniPlayerExpanded: false,
    },
    gamification: {
      score: Number(profile.score) || 0,
      streakDays: Number(profile.streakDays) || 0,
      lastWorkoutDate: null,
      totalWorkouts: 0,
      proSessionsCompleted: 0,
      prsBroken: 0,
      badges: [],
    },
    activeWorkoutDraft: null,
    updatedAt: new Date().toISOString(),
  };
}

class LocalStorageAdapter {
  getUsers() {
    try {
      const raw = localStorage.getItem(KEYS.USERS_INDEX);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveUsers(users) {
    localStorage.setItem(KEYS.USERS_INDEX, JSON.stringify(users));
  }

  getUserByUid(uid) {
    return this.getUsers().find((u) => u.uid === uid) || null;
  }

  upsertUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.uid === user.uid);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    this.saveUsers(users);
    return user;
  }

  deleteUser(uid) {
    const users = this.getUsers().filter((u) => u.uid !== uid);
    this.saveUsers(users);
    localStorage.removeItem(KEYS.userDataKey(uid));
  }

  getUserData(uid, fallbackProfile = {}) {
    if (!uid) return null;
    try {
      const raw = localStorage.getItem(KEYS.userDataKey(uid));
      if (!raw) {
        const fresh = createEmptyUserData({ ...fallbackProfile, uid });
        this.saveUserData(uid, fresh);
        return fresh;
      }
      const parsed = JSON.parse(raw);
      // Garantia extra de isolamento de UID
      if (parsed.uid && parsed.uid !== uid) {
        console.warn('[Storage] UID mismatch detected, resetting isolated bucket');
        const fresh = createEmptyUserData({ ...fallbackProfile, uid });
        this.saveUserData(uid, fresh);
        return fresh;
      }
      return parsed;
    } catch {
      const fresh = createEmptyUserData({ ...fallbackProfile, uid });
      this.saveUserData(uid, fresh);
      return fresh;
    }
  }

  saveUserData(uid, data) {
    if (!uid) throw new Error('UID obrigatório para salvar dados isolados.');
    const payload = {
      ...data,
      uid,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(KEYS.userDataKey(uid), JSON.stringify(payload));
    } catch (err) {
      // Caso o limite do localStorage seja atingido por fotos grandes
      console.error('[Storage] Quota exceeded:', err);
      throw new Error('Espaço local cheio. Remova fotos antigas ou conecte o Supabase/Firestore.');
    }
    return payload;
  }

  getSession() {
    try {
      const raw = localStorage.getItem(KEYS.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveSession(session) {
    if (!session) {
      localStorage.removeItem(KEYS.SESSION);
    } else {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    }
  }

  isSeeded() {
    return localStorage.getItem(KEYS.SEEDED) === 'true';
  }

  markSeeded() {
    localStorage.setItem(KEYS.SEEDED, 'true');
  }
}

/**
 * Adaptador pronto para Supabase Free (REST/PostgREST com RLS por auth.uid()).
 * Faz mirror local automático para manter o PWA funcionando 100% offline.
 */
class SupabaseAdapter extends LocalStorageAdapter {
  constructor(url, anonKey) {
    super();
    this.url = url.replace(/\/$/, '');
    this.anonKey = anonKey;
  }

  async syncToCloud(uid, accessToken, data) {
    if (!this.url || !this.anonKey || !accessToken) return false;
    const res = await fetch(`${this.url}/rest/v1/user_app_state`, {
      method: 'POST',
      headers: {
        apikey: this.anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        uid,
        custom_workouts: data.customWorkouts,
        workout_logs: data.workoutLogs,
        load_history: data.loadHistory,
        weight_history: data.weightHistory,
        goals: data.goals,
        evolution_photos: data.evolutionPhotos,
        nutrition_state: data.nutrition,
        spotify_playlists: data.spotify.customPlaylists,
        active_matrix: data.activeMatrixId,
        updated_at: new Date().toISOString(),
      }),
    });
    return res.ok;
  }

  async pullFromCloud(uid, accessToken) {
    if (!this.url || !this.anonKey || !accessToken) return null;
    const res = await fetch(
      `${this.url}/rest/v1/user_app_state?uid=eq.${encodeURIComponent(uid)}&select=*`,
      {
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  }
}

/**
 * Adaptador pronto para Firebase Firestore (Spark Free Plan + firestore.rules).
 */
class FirestoreAdapter extends LocalStorageAdapter {
  constructor(firebaseConfig) {
    super();
    this.firebaseConfig = firebaseConfig;
  }

  async syncToCloud(uid, idToken, data) {
    const projectId = this.firebaseConfig?.projectId;
    if (!projectId || !idToken) return false;
    const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/app_data/main`;
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          payloadJson: { stringValue: JSON.stringify(data) },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });
    return res.ok;
  }
}

function createStorageAdapter() {
  const { provider, supabaseUrl, supabaseAnonKey, firebaseConfig } = APP_CONFIG.BACKEND;
  if (provider === 'supabase' && supabaseUrl && supabaseAnonKey) {
    return new SupabaseAdapter(supabaseUrl, supabaseAnonKey);
  }
  if (provider === 'firestore' && firebaseConfig?.projectId) {
    return new FirestoreAdapter(firebaseConfig);
  }
  return new LocalStorageAdapter();
}

export const storage = createStorageAdapter();
export { LocalStorageAdapter, SupabaseAdapter, FirestoreAdapter };
