/**
 * Piff Paff Gym — Contas Demo Prontas para Teste Imediato
 *  - admin / admin123        (Admin Master + CRM)
 *  - iniciante / 123456      (Lucas Silva — Iniciante / Casa / Meta Inversa Perda de Peso)
 *  - intermediario / 123456  (Mariana Costa — Intermediário / Academia / Ampulheta & Glúteos)
 *  - pro / 123456            (Rafael Mendes — Atleta Pro / FST-7 / Shape em V)
 */

import { storage } from '../storage.js';

function createDemoPhotoSvg({ title, subtitle, weight, accent = '#10b981', phase = 'ANTES', silhouetteScale = 1.0 }) {
  const sw = Math.round(78 * silhouetteScale);
  const waist = Math.round(52 * (phase === 'ANTES' ? 1.18 : 0.92));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#18181d"/>
        <stop offset="55%" stop-color="#0e0e12"/>
        <stop offset="100%" stop-color="#09090b"/>
      </linearGradient>
      <radialGradient id="spot" cx="50%" cy="28%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.26"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="600" height="800" fill="url(#bg)"/>
    <rect width="600" height="800" fill="url(#spot)"/>
    <!-- Subtle studio light bar -->
    <rect x="210" y="34" width="180" height="6" rx="3" fill="${accent}" opacity="0.65"/>
    <!-- Athletic silhouette -->
    <g transform="translate(300, 175)" fill="#27272f" stroke="${accent}" stroke-opacity="0.45" stroke-width="2.5">
      <circle cx="0" cy="0" r="38"/>
      <path d="M-${sw} 62 C-${sw + 22} 72 -${sw + 26} 128 -${sw + 6} 180 L-${waist} 265 L-${waist + 16} 455 L-18 455 L-6 295 L6 295 L18 455 L${waist + 16} 455 L${waist} 265 L${sw + 6} 180 C${sw + 26} 128 ${sw + 22} 72 ${sw} 62 C36 46 -36 46 -${sw} 62 Z"/>
    </g>
    <!-- Phase badge -->
    <rect x="36" y="36" width="128" height="36" rx="18" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-width="1.5"/>
    <text x="100" y="59" text-anchor="middle" fill="${accent}" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="800" letter-spacing="1.5">${phase}</text>
    <!-- Footer card -->
    <rect x="32" y="654" width="536" height="114" rx="20" fill="#121215" fill-opacity="0.92" stroke="rgba(255,255,255,0.1)"/>
    <text x="58" y="698" fill="#ffffff" font-family="Inter,system-ui,sans-serif" font-size="24" font-weight="800">${title}</text>
    <text x="58" y="734" fill="#a1a1aa" font-family="Inter,system-ui,sans-serif" font-size="17" font-weight="500">${subtitle}</text>
    <text x="542" y="716" text-anchor="end" fill="${accent}" font-family="Inter,system-ui,sans-serif" font-size="28" font-weight="800">${weight} kg</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function seedDemoAccountsIfNeeded() {
  if (storage.isSeeded() && storage.getUsers().length > 0) {
    return;
  }

  const demoUsers = [
    {
      uid: 'uid_admin_master',
      username: 'admin',
      email: 'admin@piffpaffgym.com',
      passwordHash: 'admin123',
      name: 'Admin Master',
      role: 'admin',
      tier: 'vip_pro',
      level: 'pro',
      location: 'gym',
      weightKg: 86.0,
      heightCm: 181,
      goalWeightKg: 88.0,
      gender: 'male',
      createdAt: '2026-08-01T10:00:00.000Z',
    },
    {
      uid: 'uid_demo_iniciante',
      username: 'iniciante',
      email: 'lucas.iniciante@piffpaffgym.com',
      passwordHash: '123456',
      name: 'Lucas Silva',
      role: 'athlete',
      tier: 'free_launch',
      level: 'beginner',
      location: 'home',
      weightKg: 89.2,
      heightCm: 178,
      goalWeightKg: 82.0,
      gender: 'male',
      createdAt: '2026-09-12T10:00:00.000Z',
    },
    {
      uid: 'uid_demo_intermediario',
      username: 'intermediario',
      email: 'mariana.inter@piffpaffgym.com',
      passwordHash: '123456',
      name: 'Mariana Costa',
      role: 'athlete',
      tier: 'free_launch',
      level: 'intermediate',
      location: 'gym',
      weightKg: 64.2,
      heightCm: 166,
      goalWeightKg: 62.0,
      gender: 'female',
      createdAt: '2026-08-25T10:00:00.000Z',
    },
    {
      uid: 'uid_demo_pro',
      username: 'pro',
      email: 'rafael.pro@piffpaffgym.com',
      passwordHash: '123456',
      name: 'Rafael Mendes',
      role: 'athlete',
      tier: 'free_launch',
      level: 'pro',
      location: 'gym',
      weightKg: 83.4,
      heightCm: 179,
      goalWeightKg: 85.0,
      gender: 'male',
      createdAt: '2026-07-15T10:00:00.000Z',
    },
  ];

  storage.saveUsers(demoUsers);

  const today = new Date().toISOString().slice(0, 10);

  // 1. Dados do Admin Master
  storage.saveUserData('uid_admin_master', {
    uid: 'uid_admin_master',
    activeMatrixId: 'massa_densidade',
    activeDayIndex: 0,
    customWorkouts: [
      {
        id: 'cw_admin_1',
        name: 'Protocolo Diretoria — Upper Pesado',
        focus: 'Peito, Costas & Braços (HIT)',
        location: 'gym',
        exercises: [
          { name: 'Supino Reto com Barra', muscle: 'Peito', sets: 4, reps: '6–8', loadKg: 110, restSec: 120, technique: 'RPE 9.5' },
          { name: 'Remada Curvada (Yates Row)', muscle: 'Costas', sets: 4, reps: '8–10', loadKg: 105, restSec: 90, technique: 'Rest-Pause' },
          { name: 'Elevação Lateral', muscle: 'Ombros', sets: 7, reps: '12–15', loadKg: 16, restSec: 35, technique: 'FST-7' },
        ],
      },
    ],
    workoutLogs: [
      { id: 'wl_a1', date: '2026-11-18', title: 'Treino A — Peito Pesado & Bíceps', matrixName: 'Massa & Densidade', location: 'gym', level: 'pro', setsCompleted: 18, volumeKg: 14820, pointsEarned: 309 },
      { id: 'wl_a2', date: '2026-11-20', title: 'Treino B — Costas Espessura & Trapézio', matrixName: 'Massa & Densidade', location: 'gym', level: 'pro', setsCompleted: 19, volumeKg: 16240, pointsEarned: 317 },
    ],
    loadHistory: {
      'Supino Reto com Barra Olímpica': [
        { date: '2026-08-15', weightKg: 90 },
        { date: '2026-09-10', weightKg: 98 },
        { date: '2026-10-08', weightKg: 105 },
        { date: '2026-11-18', weightKg: 112 },
      ],
      'Remada Curvada Supinada (Yates Row)': [
        { date: '2026-08-18', weightKg: 85 },
        { date: '2026-09-20', weightKg: 95 },
        { date: '2026-10-22', weightKg: 102 },
        { date: '2026-11-20', weightKg: 110 },
      ],
      'Agachamento Livre Barra Alta/Baixa': [
        { date: '2026-08-22', weightKg: 120 },
        { date: '2026-10-01', weightKg: 135 },
        { date: '2026-11-12', weightKg: 145 },
      ],
    },
    weightHistory: [
      { id: 'wh_a1', date: '2026-08-15', weightKg: 83.2, bodyFatPct: 12.8, note: 'Início Off Limpo' },
      { id: 'wh_a2', date: '2026-09-15', weightKg: 84.4, bodyFatPct: 12.5, note: 'Ganho seco' },
      { id: 'wh_a3', date: '2026-10-15', weightKg: 85.1, bodyFatPct: 12.2, note: 'Força subindo' },
      { id: 'wh_a4', date: '2026-11-18', weightKg: 86.0, bodyFatPct: 11.9, note: 'Densidade máxima' },
    ],
    bodyProfile: {
      weightKg: 86.0,
      heightCm: 181,
      goalWeightKg: 88.0,
      bodyFatPct: 11.9,
      gender: 'male',
      neckCm: 41,
      waistCm: 80,
      hipCm: null,
    },
    goals: [
      { id: 'g_a1', title: 'Supino Reto 120kg', category: 'forca', direction: 'up', startValue: 90, currentValue: 112, targetValue: 120, unit: 'kg', completed: false, createdAt: '2026-08-15' },
      { id: 'g_a2', title: 'Bulk Limpo até 88kg', category: 'peso', direction: 'up', startValue: 83.2, currentValue: 86.0, targetValue: 88.0, unit: 'kg', completed: false, createdAt: '2026-08-15' },
      { id: 'g_a3', title: '30 Sessões Modo Pro HIT/FST-7', category: 'pro', direction: 'up', startValue: 0, currentValue: 26, targetValue: 30, unit: 'treinos', completed: false, createdAt: '2026-09-01' },
    ],
    evolutionPhotos: [
      {
        id: 'ph_a1',
        date: '2026-08-15',
        weightKg: 83.2,
        bodyFatPct: 12.8,
        pose: 'Frente',
        note: 'Dia 1 — Base Off-Season',
        dataUrl: createDemoPhotoSvg({ title: 'Base Off-Season', subtitle: '15 Ago 2026 · Frente', weight: '83.2', accent: '#f59e0b', phase: 'ANTES', silhouetteScale: 0.96 }),
      },
      {
        id: 'ph_a2',
        date: '2026-11-18',
        weightKg: 86.0,
        bodyFatPct: 11.9,
        pose: 'Frente',
        note: 'Semana 14 — Mais densidade e largura',
        dataUrl: createDemoPhotoSvg({ title: 'Semana 14 Pro', subtitle: '18 Nov 2026 · Frente', weight: '86.0', accent: '#f59e0b', phase: 'DEPOIS', silhouetteScale: 1.08 }),
      },
    ],
    nutrition: {
      date: today,
      waterMl: 2250,
      proteinFactor: 2.2,
      proteinConsumedG: 145,
      hydrationBonusAwardedDate: null,
      proteinBonusAwardedDate: null,
    },
    spotify: {
      activePlaylistId: 'heavy_workout',
      customPlaylists: [],
      miniPlayerOpen: false,
      miniPlayerExpanded: false,
    },
    gamification: {
      score: 9420,
      streakDays: 21,
      lastWorkoutDate: '2026-11-20',
      totalWorkouts: 64,
      proSessionsCompleted: 26,
      prsBroken: 18,
      badges: ['first_workout', 'streak_7', 'pro_master', 'pr_breaker', 'hydration_hero'],
    },
    activeWorkoutDraft: null,
  });

  // 2. Dados do Iniciante (Lucas Silva — Casa + Meta Inversa de Perda de Peso)
  storage.saveUserData('uid_demo_iniciante', {
    uid: 'uid_demo_iniciante',
    activeMatrixId: 'atletico_seco',
    activeDayIndex: 0,
    customWorkouts: [
      {
        id: 'cw_ini_1',
        name: 'Circuito Casa 25 Minutos',
        focus: 'Queima calórica + base muscular',
        location: 'home',
        exercises: [
          { name: 'Flexão Declinada / Com Mochila', muscle: 'Peito', sets: 3, reps: '10–12', loadKg: 5, restSec: 60 },
          { name: 'Remada Unilateral (Serrote)', muscle: 'Costas', sets: 3, reps: '12–15', loadKg: 10, restSec: 60 },
          { name: 'Agachamento Búlgaro', muscle: 'Pernas', sets: 3, reps: '10–12', loadKg: 8, restSec: 75 },
        ],
      },
    ],
    workoutLogs: [
      { id: 'wl_i1', date: '2026-11-16', title: 'Treino A — Upper A Força', matrixName: 'Atlético & Seco', location: 'home', level: 'beginner', setsCompleted: 14, volumeKg: 2640, pointsEarned: 232 },
      { id: 'wl_i2', date: '2026-11-19', title: 'Treino B — Lower A Potência', matrixName: 'Atlético & Seco', location: 'home', level: 'beginner', setsCompleted: 12, volumeKg: 2980, pointsEarned: 216 },
    ],
    loadHistory: {
      'Flexão com Déficit (Mãos em Livros/Apoios)': [
        { date: '2026-09-15', weightKg: 0 },
        { date: '2026-10-05', weightKg: 4 },
        { date: '2026-10-25', weightKg: 8 },
        { date: '2026-11-16', weightKg: 12 },
      ],
      'Remada Curvada Unilateral com Mochila': [
        { date: '2026-09-15', weightKg: 8 },
        { date: '2026-10-10', weightKg: 12 },
        { date: '2026-11-16', weightKg: 16 },
      ],
    },
    weightHistory: [
      { id: 'wh_i1', date: '2026-09-12', weightKg: 94.0, bodyFatPct: 26.2, note: 'Começo da jornada' },
      { id: 'wh_i2', date: '2026-10-01', weightKg: 92.4, bodyFatPct: 25.1, note: 'Cortando açúcar + água 3L' },
      { id: 'wh_i3', date: '2026-10-20', weightKg: 90.8, bodyFatPct: 24.0, note: 'Mais fôlego nos treinos' },
      { id: 'wh_i4', date: '2026-11-19', weightKg: 89.2, bodyFatPct: 22.8, note: '-4.8kg já eliminados!' },
    ],
    bodyProfile: {
      weightKg: 89.2,
      heightCm: 178,
      goalWeightKg: 82.0,
      bodyFatPct: 22.8,
      gender: 'male',
      neckCm: 40,
      waistCm: 97,
      hipCm: null,
    },
    goals: [
      { id: 'g_i1', title: 'Secar até 82kg (Meta Inversa)', category: 'peso', direction: 'down', startValue: 94.0, currentValue: 89.2, targetValue: 82.0, unit: 'kg', completed: false, createdAt: '2026-09-12' },
      { id: 'g_i2', title: 'Reduzir Gordura para 18%', category: 'peso', direction: 'down', startValue: 26.2, currentValue: 22.8, targetValue: 18.0, unit: '%', completed: false, createdAt: '2026-09-12' },
      { id: 'g_i3', title: 'Completar 20 Treinos em Casa', category: 'constancia', direction: 'up', startValue: 0, currentValue: 11, targetValue: 20, unit: 'treinos', completed: false, createdAt: '2026-09-12' },
    ],
    evolutionPhotos: [
      {
        id: 'ph_i1',
        date: '2026-09-12',
        weightKg: 94.0,
        bodyFatPct: 26.2,
        pose: 'Frente',
        note: 'Início do projeto em casa',
        dataUrl: createDemoPhotoSvg({ title: 'Dia 01 · Início', subtitle: '12 Set 2026 · Frente', weight: '94.0', accent: '#10b981', phase: 'ANTES', silhouetteScale: 0.94 }),
      },
      {
        id: 'ph_i2',
        date: '2026-11-19',
        weightKg: 89.2,
        bodyFatPct: 22.8,
        pose: 'Frente',
        note: '-4.8kg com constância em casa',
        dataUrl: createDemoPhotoSvg({ title: 'Check-in 68 Dias', subtitle: '19 Nov 2026 · Frente', weight: '89.2', accent: '#10b981', phase: 'DEPOIS', silhouetteScale: 1.0 }),
      },
    ],
    nutrition: {
      date: today,
      waterMl: 1750,
      proteinFactor: 1.8,
      proteinConsumedG: 95,
      hydrationBonusAwardedDate: null,
      proteinBonusAwardedDate: null,
    },
    spotify: {
      activePlaylistId: 'eletronica',
      customPlaylists: [],
      miniPlayerOpen: false,
      miniPlayerExpanded: false,
    },
    gamification: {
      score: 740,
      streakDays: 5,
      lastWorkoutDate: '2026-11-19',
      totalWorkouts: 11,
      proSessionsCompleted: 0,
      prsBroken: 4,
      badges: ['first_workout'],
    },
    activeWorkoutDraft: null,
  });

  // 3. Dados da Intermediária (Mariana Costa — Ampulheta & Glúteos)
  storage.saveUserData('uid_demo_intermediario', {
    uid: 'uid_demo_intermediario',
    activeMatrixId: 'ampulheta_gluteos',
    activeDayIndex: 0,
    customWorkouts: [],
    workoutLogs: [
      { id: 'wl_m1', date: '2026-11-17', title: 'Treino A — Glúteos Máxima Tensão', matrixName: 'Ampulheta & Glúteos', location: 'gym', level: 'intermediate', setsCompleted: 15, volumeKg: 11240, pointsEarned: 240 },
      { id: 'wl_m2', date: '2026-11-19', title: 'Treino B — Superiores Ampulheta', matrixName: 'Ampulheta & Glúteos', location: 'gym', level: 'intermediate', setsCompleted: 18, volumeKg: 5420, pointsEarned: 264 },
    ],
    loadHistory: {
      'Elevação Pélvica (Hip Thrust) com Barra': [
        { date: '2026-08-28', weightKg: 80 },
        { date: '2026-09-20', weightKg: 95 },
        { date: '2026-10-18', weightKg: 110 },
        { date: '2026-11-17', weightKg: 125 },
      ],
      'Levantamento Terra Romeno (RDL) Barra/Halter': [
        { date: '2026-09-02', weightKg: 50 },
        { date: '2026-10-05', weightKg: 60 },
        { date: '2026-11-14', weightKg: 70 },
      ],
    },
    weightHistory: [
      { id: 'wh_m1', date: '2026-08-25', weightKg: 66.8, bodyFatPct: 23.4, note: 'Início Recomposição' },
      { id: 'wh_m2', date: '2026-09-25', weightKg: 65.6, bodyFatPct: 22.1, note: 'Cintura afinando' },
      { id: 'wh_m3', date: '2026-10-25', weightKg: 64.9, bodyFatPct: 21.0, note: 'Glúteo marcando bem' },
      { id: 'wh_m4', date: '2026-11-19', weightKg: 64.2, bodyFatPct: 20.1, note: 'Novo PR no Hip Thrust' },
    ],
    bodyProfile: {
      weightKg: 64.2,
      heightCm: 166,
      goalWeightKg: 62.0,
      bodyFatPct: 20.1,
      gender: 'female',
      neckCm: 32,
      waistCm: 67,
      hipCm: 101,
    },
    goals: [
      { id: 'g_m1', title: 'Hip Thrust 140kg (10 reps limpas)', category: 'forca', direction: 'up', startValue: 80, currentValue: 125, targetValue: 140, unit: 'kg', completed: false, createdAt: '2026-08-28' },
      { id: 'g_m2', title: 'Definição até 62kg (Meta Inversa)', category: 'peso', direction: 'down', startValue: 66.8, currentValue: 64.2, targetValue: 62.0, unit: 'kg', completed: false, createdAt: '2026-08-25' },
      { id: 'g_m3', title: 'Sequência de 14 Dias Ativa', category: 'constancia', direction: 'up', startValue: 0, currentValue: 11, targetValue: 14, unit: 'dias', completed: false, createdAt: '2026-11-01' },
    ],
    evolutionPhotos: [
      {
        id: 'ph_m1',
        date: '2026-08-25',
        weightKg: 66.8,
        bodyFatPct: 23.4,
        pose: 'Lateral',
        note: 'Dia 1 — Matriz Ampulheta',
        dataUrl: createDemoPhotoSvg({ title: 'Início Wellness', subtitle: '25 Ago 2026 · Lateral', weight: '66.8', accent: '#10b981', phase: 'ANTES', silhouetteScale: 0.95 }),
      },
      {
        id: 'ph_m2',
        date: '2026-11-19',
        weightKg: 64.2,
        bodyFatPct: 20.1,
        pose: 'Lateral',
        note: '12 semanas — Cintura mais fina e glúteo alto',
        dataUrl: createDemoPhotoSvg({ title: '12 Semanas Wellness', subtitle: '19 Nov 2026 · Lateral', weight: '64.2', accent: '#10b981', phase: 'DEPOIS', silhouetteScale: 1.03 }),
      },
    ],
    nutrition: {
      date: today,
      waterMl: 1500,
      proteinFactor: 2.0,
      proteinConsumedG: 90,
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
      score: 2480,
      streakDays: 11,
      lastWorkoutDate: '2026-11-19',
      totalWorkouts: 29,
      proSessionsCompleted: 3,
      prsBroken: 9,
      badges: ['first_workout', 'streak_7', 'pr_breaker'],
    },
    activeWorkoutDraft: null,
  });

  // 4. Dados do Atleta Pro (Rafael Mendes — Shape em V + FST-7)
  storage.saveUserData('uid_demo_pro', {
    uid: 'uid_demo_pro',
    activeMatrixId: 'shape_v',
    activeDayIndex: 0,
    customWorkouts: [
      {
        id: 'cw_pro_1',
        name: 'Finalizador Ombros 3D (FST-7)',
        focus: 'Deltoide Lateral + Posterior',
        location: 'gym',
        exercises: [
          { name: 'Desenvolvimento com Halteres', muscle: 'Ombros', sets: 4, reps: '8–10', loadKg: 32, restSec: 90, technique: 'RPE 9.5' },
          { name: 'Elevação Lateral', muscle: 'Ombros', sets: 7, reps: '12–15', loadKg: 14, restSec: 35, technique: 'FST-7' },
          { name: 'Face Pull (Deltoide Posterior)', muscle: 'Ombros', sets: 4, reps: '15–20', loadKg: 28, restSec: 45, technique: 'Drop-Set' },
        ],
      },
    ],
    workoutLogs: [
      { id: 'wl_p1', date: '2026-11-17', title: 'Treino A — Dorsais Largura & Deltoide Posterior', matrixName: 'Shape em V', location: 'gym', level: 'pro', setsCompleted: 22, volumeKg: 15840, pointsEarned: 341 },
      { id: 'wl_p2', date: '2026-11-19', title: 'Treino B — Peito Superior & Deltoide Lateral 3D', matrixName: 'Shape em V', location: 'gym', level: 'pro', setsCompleted: 22, volumeKg: 14120, pointsEarned: 341 },
    ],
    loadHistory: {
      'Puxada Alta Pegada Aberta Pronada': [
        { date: '2026-07-20', weightKg: 65 },
        { date: '2026-08-24', weightKg: 75 },
        { date: '2026-09-28', weightKg: 82 },
        { date: '2026-10-26', weightKg: 88 },
        { date: '2026-11-17', weightKg: 95 },
      ],
      'Supino Inclinado com Halteres (30°)': [
        { date: '2026-07-22', weightKg: 30 },
        { date: '2026-09-02', weightKg: 34 },
        { date: '2026-10-15', weightKg: 38 },
        { date: '2026-11-19', weightKg: 42 },
      ],
      'Agachamento Livre / Hack Squat Profundo': [
        { date: '2026-07-25', weightKg: 110 },
        { date: '2026-09-12', weightKg: 125 },
        { date: '2026-11-10', weightKg: 140 },
      ],
    },
    weightHistory: [
      { id: 'wh_p1', date: '2026-07-15', weightKg: 88.6, bodyFatPct: 15.8, note: 'Início Cutting Classic' },
      { id: 'wh_p2', date: '2026-08-20', weightKg: 86.5, bodyFatPct: 13.9, note: 'V-Taper aparecendo' },
      { id: 'wh_p3', date: '2026-09-25', weightKg: 84.8, bodyFatPct: 11.8, note: 'Cintura seca e ombros cheios' },
      { id: 'wh_p4', date: '2026-11-19', weightKg: 83.4, bodyFatPct: 9.8, note: 'Condição Pro < 10% BF' },
    ],
    bodyProfile: {
      weightKg: 83.4,
      heightCm: 179,
      goalWeightKg: 82.0,
      bodyFatPct: 9.8,
      gender: 'male',
      neckCm: 41.5,
      waistCm: 77,
      hipCm: null,
    },
    goals: [
      { id: 'g_p1', title: 'Puxada Aberta 100kg Controlada', category: 'forca', direction: 'up', startValue: 65, currentValue: 95, targetValue: 100, unit: 'kg', completed: false, createdAt: '2026-07-20' },
      { id: 'g_p2', title: 'Cutting Classic até 82kg (Meta Inversa)', category: 'peso', direction: 'down', startValue: 88.6, currentValue: 83.4, targetValue: 82.0, unit: 'kg', completed: false, createdAt: '2026-07-15' },
      { id: 'g_p3', title: 'Completar 25 Protocolos FST-7', category: 'pro', direction: 'up', startValue: 0, currentValue: 21, targetValue: 25, unit: 'sessões', completed: false, createdAt: '2026-08-01' },
    ],
    evolutionPhotos: [
      {
        id: 'ph_p1',
        date: '2026-07-15',
        weightKg: 88.6,
        bodyFatPct: 15.8,
        pose: 'Frente',
        note: 'Pré-prep Classic Physique',
        dataUrl: createDemoPhotoSvg({ title: 'Pré-Prep Classic', subtitle: '15 Jul 2026 · Frente', weight: '88.6', accent: '#f59e0b', phase: 'ANTES', silhouetteScale: 0.98 }),
      },
      {
        id: 'ph_p2',
        date: '2026-11-19',
        weightKg: 83.4,
        bodyFatPct: 9.8,
        pose: 'Frente',
        note: '-5.2kg · Condição Shape em V FST-7',
        dataUrl: createDemoPhotoSvg({ title: 'Shape em V Pro', subtitle: '19 Nov 2026 · Frente', weight: '83.4', accent: '#f59e0b', phase: 'DEPOIS', silhouetteScale: 1.12 }),
      },
    ],
    nutrition: {
      date: today,
      waterMl: 2750,
      proteinFactor: 2.2,
      proteinConsumedG: 160,
      hydrationBonusAwardedDate: null,
      proteinBonusAwardedDate: null,
    },
    spotify: {
      activePlaylistId: 'gym_phonk',
      customPlaylists: [],
      miniPlayerOpen: false,
      miniPlayerExpanded: false,
    },
    gamification: {
      score: 6180,
      streakDays: 18,
      lastWorkoutDate: '2026-11-19',
      totalWorkouts: 48,
      proSessionsCompleted: 21,
      prsBroken: 15,
      badges: ['first_workout', 'streak_7', 'pro_master', 'pr_breaker'],
    },
    activeWorkoutDraft: null,
  });

  storage.markSeeded();
}
