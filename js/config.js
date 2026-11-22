/**
 * Piff Paff Gym — Core Configuration
 * 100% Gratuito no lançamento, arquitetura modular pronta para Planos VIP futuros.
 */

export const APP_CONFIG = {
  APP_NAME: 'Piff Paff Gym',
  VERSION: '1.0.0',
  STORAGE_PREFIX: 'ppg_v1',

  // =========================================================================
  // MODO DE LANÇAMENTO — 100% GRATUITO (Sem Paywall)
  // Para ativar planos VIP no futuro, altere BILLING_ENABLED para true
  // e ajuste as permissões em js/modules/entitlements.js.
  // =========================================================================
  MONETIZATION: {
    BILLING_ENABLED: false,
    LAUNCH_MODE: 'FREE_ALL_ACCESS',
    LAUNCH_BADGE: '100% GRATUITO',
    FUTURE_PLANS: {
      free: { id: 'free', label: 'Gratuito', priceMonthly: 0 },
      vip_pro: { id: 'vip_pro', label: 'VIP Pro (Futuro)', priceMonthly: 29.9 },
    },
  },

  // =========================================================================
  // ADAPTADOR DE BANCO DE DADOS (Pronto para Supabase Free / Firebase Firestore)
  // =========================================================================
  BACKEND: {
    provider: 'local', // 'local' | 'supabase' | 'firestore'
    supabaseUrl: '',
    supabaseAnonKey: '',
    firebaseConfig: {
      apiKey: '',
      authDomain: '',
      projectId: '',
    },
  },

  LOCATIONS: {
    gym: {
      id: 'gym',
      label: 'Academia Completa',
      shortLabel: 'Academia',
      description: 'Barras, máquinas, polias, halteres pesados e racks completos.',
    },
    home: {
      id: 'home',
      label: 'Treino em Casa',
      shortLabel: 'Casa',
      description: 'Peso corporal, halteres/mochila, elásticos e variações unilaterais.',
    },
    hybrid: {
      id: 'hybrid',
      label: 'Híbrido / Viagem',
      shortLabel: 'Híbrido',
      description: 'Academia de hotel, elásticos, halteres moderados e alta densidade.',
    },
  },

  LEVELS: {
    beginner: {
      id: 'beginner',
      label: 'Iniciante',
      shortLabel: 'Iniciante',
      rpeTarget: 'RPE 7–7.5',
      restMultiplier: 1.0,
      badgeClass: 'badge-neutral',
      summary: 'Foco em técnica limpa, cadência controlada e base articular sólida.',
    },
    intermediate: {
      id: 'intermediate',
      label: 'Intermediário',
      shortLabel: 'Intermediário',
      rpeTarget: 'RPE 8–9',
      restMultiplier: 1.0,
      badgeClass: 'badge-emerald',
      summary: 'Sobrecarga progressiva estruturada, alto volume efetivo e precisão.',
    },
    pro: {
      id: 'pro',
      label: 'Atleta Pro',
      shortLabel: 'Atleta Pro',
      rpeTarget: 'RPE 9–10',
      restMultiplier: 0.9,
      badgeClass: 'badge-gold',
      summary: 'Protocolos avançados: FST-7, Rest-Pause, Drop-Set e séries até a falha técnica.',
    },
  },

  SCORING: {
    WORKOUT_BASE: 120,
    SET_COMPLETED: 8,
    PRO_MODE_BONUS: 45,
    NEW_PR_BONUS: 60,
    GOAL_COMPLETED: 150,
    HYDRATION_100_BONUS: 30,
    PROTEIN_100_BONUS: 30,
    PHOTO_CHECKIN: 40,
  },

  RANKS: [
    { id: 'recruta', name: 'Recruta', minScore: 0, color: '#a1a1aa', badge: 'I' },
    { id: 'disciplinado', name: 'Disciplinado', minScore: 500, color: '#34d399', badge: 'II' },
    { id: 'casca_grossa', name: 'Casca Grossa', minScore: 1500, color: '#10b981', badge: 'III' },
    { id: 'elite', name: 'Elite Piff Paff', minScore: 3000, color: '#22d3ee', badge: 'IV' },
    { id: 'monstro_pro', name: 'Monstro Pro', minScore: 5500, color: '#f59e0b', badge: 'V' },
    { id: 'lenda_olympia', name: 'Lenda Olympia', minScore: 9000, color: '#fbbf24', badge: 'VI' },
  ],

  SPOTIFY_PRESETS: [
    {
      id: 'beast_mode',
      name: 'Beast Mode',
      vibe: 'Hip-Hop & Hype Pesado',
      type: 'playlist',
      spotifyId: '37i9dQZF1DX76Wlfdnj7AP',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP',
    },
    {
      id: 'gym_phonk',
      name: 'Gym Phonk',
      vibe: 'Phonk & Bass Agressivo',
      type: 'playlist',
      spotifyId: '37i9dQZF1DWWY64wDtewQt',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DWWY64wDtewQt',
    },
    {
      id: 'eletronica',
      name: 'Eletrônica Workout',
      vibe: 'High-BPM EDM & Cardio',
      type: 'playlist',
      spotifyId: '37i9dQZF1DX32NsLKyzScr',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DX32NsLKyzScr',
    },
    {
      id: 'heavy_workout',
      name: 'Heavy Workout',
      vibe: 'Rock, Metal & PR Day',
      type: 'playlist',
      spotifyId: '37i9dQZF1DXdxcBWuJkbcy',
      url: 'https://open.spotify.com/playlist/37i9dQZF1DXdxcBWuJkbcy',
    },
  ],
};

export function getRankForScore(score = 0) {
  const s = Math.max(0, Number(score) || 0);
  let current = APP_CONFIG.RANKS[0];
  let next = APP_CONFIG.RANKS[1] || null;
  for (let i = 0; i < APP_CONFIG.RANKS.length; i++) {
    if (s >= APP_CONFIG.RANKS[i].minScore) {
      current = APP_CONFIG.RANKS[i];
      next = APP_CONFIG.RANKS[i + 1] || null;
    }
  }
  const progress = next
    ? Math.min(100, Math.round(((s - current.minScore) / (next.minScore - current.minScore)) * 100))
    : 100;
  return { current, next, progress };
}
