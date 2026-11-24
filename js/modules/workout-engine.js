/**
 * Piff Paff Gym — Motor de Treinos Minimalista & Didático (Estilo Mobile)
 * Cada etapa tem sua própria tela limpa:
 *  - 'home'     : Treino do dia (limpo e direto) + atalhos para Matrizes e Personalizados
 *  - 'active'   : Execução passo a passo (1 exercício por tela + alternância opcional para Lista)
 *  - 'matrices' : Escolha das 4 Matrizes Pro + Divisão A/B/C/D
 *  - 'custom'   : Meus Treinos Personalizados
 *  - 'builder'  : Gerador de Treino Personalizado em 2 passos simples
 */

import { APP_CONFIG } from '../config.js';
import {
  PRO_MATRICES,
  EXERCISE_LIBRARY,
  buildAdaptiveWorkout,
  buildCustomWorkoutSession,
} from '../data/workouts.js';
import { renderExerciseDemoMarkup, mountDemoVideos } from './exercise-demo.js';

let activeSession = null;
let sessionKey = '';
let workoutScreen = 'home'; // 'home' | 'active' | 'matrices' | 'custom' | 'builder'
let executionLayout = 'focus'; // 'focus' (1 por vez didático) | 'list'
let showFocusDemo = true;
let currentExIndex = 0;
let selectedCustomId = null;

// Cronômetro de descanso preciso (endTimeMs) + Notificação Nativa + Alerta Visual/Sonoro
let timerState = {
  totalSec: 60,
  remainingSec: 60,
  endTimeMs: null,
  running: false,
  autoStart: true,
  soundEnabled: true,
  intervalId: null,
  activeExerciseName: '',
};

// Gerador Personalizado (2 passos limpos)
let builderStep = 1; // 1 = escolher exercícios, 2 = configurar e salvar
let builderDraft = {
  name: '',
  focus: '',
  location: 'gym',
  muscleFilter: 'Todos',
  exercises: [],
};

let sharedAudioCtx = null;

function unlockAudioContext() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) sharedAudioCtx = new AudioCtx();
    if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playTimerChime() {
  if (!timerState.soundEnabled) return;
  try {
    const ctx = unlockAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [880, 1108.73, 1318.51];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      gain.gain.setValueAtTime(0.001, now + i * 0.14);
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.36);
    });
  } catch {
    // Silencioso se bloqueado
  }
}

function getNotificationStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

async function requestRestNotificationPermission(ctx) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    ctx?.toast('Alerta visual e sonoro ativo! (Notificação push indisponível neste navegador)');
    return false;
  }
  if (window.Notification.permission === 'granted') {
    ctx?.toast('Notificações de descanso já estão ativas! 🔔', 'success');
    return true;
  }
  if (window.Notification.permission === 'denied') {
    ctx?.toast('Notificações bloqueadas no navegador. Ative nas permissões do site.', 'error');
    return false;
  }
  try {
    const perm = await window.Notification.requestPermission();
    if (perm === 'granted') {
      ctx?.toast('Notificações ativadas! Você será avisado quando o descanso acabar. 🔔', 'success');
      return true;
    }
    ctx?.toast('Permissão não concedida — manteremos alerta visual + som + vibração.');
    return false;
  } catch {
    return false;
  }
}

async function showSystemRestNotification(exName) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;

  const title = '⏱️ Descanso Finalizado — Piff Paff Gym';
  const body = exName
    ? `Hora da próxima série de ${exName}! Bora pra cima!`
    : 'Tempo de descanso zerado! Hora da próxima série!';
  const options = {
    body,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: [220, 100, 220, 100, 320],
    tag: 'piff-paff-rest-done',
    renotify: true,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return;
      }
    }
    new window.Notification(title, options);
  } catch {
    // Banner visual in-app cobre o aviso
  }
}

function showInAppRestDoneBanner(exName) {
  const banner = document.getElementById('rest-done-banner');
  if (!banner) return;
  const sub = banner.querySelector('#rest-done-sub');
  if (sub) {
    sub.textContent = exName ? `Próxima série: ${exName}` : 'Hora da próxima série!';
  }
  banner.classList.remove('hidden');
  requestAnimationFrame(() => banner.classList.add('show'));

  const dismiss = () => {
    banner.classList.remove('show');
    setTimeout(() => banner.classList.add('hidden'), 260);
  };

  const okBtn = banner.querySelector('#btn-rest-done-ok');
  const plusBtn = banner.querySelector('#btn-rest-done-plus30');
  if (okBtn) okBtn.onclick = dismiss;
  if (plusBtn) {
    plusBtn.onclick = () => {
      dismiss();
      startRestTimer(30, exName);
    };
  }
}

function fireRestFinishedAlert() {
  playTimerChime();
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([220, 100, 220, 100, 320]);
  }
  showInAppRestDoneBanner(timerState.activeExerciseName);
  showSystemRestNotification(timerState.activeExerciseName);
}

function formatTimer(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function stopTimerInterval() {
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  timerState.running = false;
  timerState.endTimeMs = null;
}

function updateTimerDom() {
  const display = document.getElementById('rest-timer-display');
  const fill = document.getElementById('rest-timer-fill');
  const toggleBtn = document.getElementById('rest-timer-toggle');
  const bar = document.getElementById('sticky-rest-timer');
  if (!display) return;

  display.textContent = formatTimer(timerState.remainingSec);
  const pct = timerState.totalSec > 0
    ? Math.max(0, Math.min(100, (timerState.remainingSec / timerState.totalSec) * 100))
    : 0;
  if (fill) fill.style.width = `${pct}%`;
  if (toggleBtn) toggleBtn.textContent = timerState.running ? 'Pausar' : '▶';
  if (bar) {
    bar.classList.toggle('timer-running', timerState.running);
    bar.classList.toggle('timer-done', !timerState.running && timerState.remainingSec === 0);
  }
}

function tickTimer() {
  if (!timerState.running || !timerState.endTimeMs) return;
  const msLeft = timerState.endTimeMs - Date.now();
  const secLeft = Math.ceil(msLeft / 1000);
  if (secLeft <= 0) {
    timerState.remainingSec = 0;
    stopTimerInterval();
    updateTimerDom();
    fireRestFinishedAlert();
  } else {
    timerState.remainingSec = secLeft;
    updateTimerDom();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && timerState.running) {
      tickTimer();
    }
  });
}

export function startRestTimer(seconds, exerciseName = '') {
  unlockAudioContext();
  stopTimerInterval();

  const prevBanner = document.getElementById('rest-done-banner');
  if (prevBanner) {
    prevBanner.classList.remove('show');
    prevBanner.classList.add('hidden');
  }

  if (exerciseName) timerState.activeExerciseName = exerciseName;

  if (typeof seconds === 'number' && seconds > 0) {
    timerState.totalSec = seconds;
    timerState.remainingSec = seconds;
  } else if (timerState.remainingSec <= 0) {
    timerState.remainingSec = timerState.totalSec;
  }

  timerState.running = true;
  timerState.endTimeMs = Date.now() + timerState.remainingSec * 1000;
  updateTimerDom();

  timerState.intervalId = setInterval(tickTimer, 500);
}

export function invalidateActiveSession() {
  activeSession = null;
  sessionKey = '';
}

export function resetWorkoutRuntime() {
  activeSession = null;
  sessionKey = '';
  selectedCustomId = null;
  workoutScreen = 'home';
  executionLayout = 'focus';
  currentExIndex = 0;
  builderStep = 1;
  stopTimerInterval();
  timerState.totalSec = 60;
  timerState.remainingSec = 60;
}

function ensureSession(ctx) {
  const { user, data } = ctx;
  const location = user.location || 'gym';
  const level = user.level || 'intermediate';

  if (selectedCustomId) {
    const custom = (data.customWorkouts || []).find((cw) => cw.id === selectedCustomId);
    if (custom) {
      const nextKey = `custom_${custom.id}_${level}_${user.uid}`;
      if (!activeSession || sessionKey !== nextKey) {
        activeSession = buildCustomWorkoutSession(custom, level, data.loadHistory || {});
        sessionKey = nextKey;
        currentExIndex = 0;
      }
      return activeSession;
    }
    selectedCustomId = null;
  }

  const matrixId = data.activeMatrixId || 'shape_v';
  const dayIndex = Number(data.activeDayIndex) || 0;
  const nextKey = `matrix_${matrixId}_${dayIndex}_${location}_${level}_${user.uid}`;

  if (!activeSession || sessionKey !== nextKey) {
    activeSession = buildAdaptiveWorkout(matrixId, dayIndex, location, level, data.loadHistory || {});
    sessionKey = nextKey;
    currentExIndex = 0;
  }
  return activeSession;
}

function calcSessionMetrics(session) {
  let totalSets = 0;
  let doneSets = 0;
  let totalVolume = 0;

  for (const ex of session.exercises) {
    totalSets += ex.sets.length;
    const avgReps = parseInt(String(ex.reps).match(/\d+/)?.[0] || '10', 10);
    for (const s of ex.sets) {
      if (s.done) {
        doneSets += 1;
        totalVolume += (Number(ex.loadKg) || 0) * avgReps;
      }
    }
  }
  return { totalSets, doneSets, totalVolume: Math.round(totalVolume) };
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderWorkoutsTab(container, ctx) {
  const session = ensureSession(ctx);

  if (workoutScreen === 'active') {
    renderActiveExecutionScreen(container, ctx, session);
    return;
  }
  if (workoutScreen === 'matrices') {
    renderMatricesScreen(container, ctx);
    return;
  }
  if (workoutScreen === 'custom') {
    renderCustomListScreen(container, ctx);
    return;
  }
  if (workoutScreen === 'builder') {
    renderBuilderScreen(container, ctx);
    return;
  }

  renderWorkoutHomeScreen(container, ctx, session);
}

/* ============================================================================
   TELA 1: HOME DO TREINO (Minimalista & Limpa)
   ============================================================================ */
function renderWorkoutHomeScreen(container, ctx, session) {
  const { user, data } = ctx;
  const isPro = user.level === 'pro';
  const activeMatrix = PRO_MATRICES.find((m) => m.id === (data.activeMatrixId || 'shape_v')) || PRO_MATRICES[0];
  const metrics = calcSessionMetrics(session);
  const firstName = (user.name || 'Atleta').split(' ')[0];
  const customCount = (data.customWorkouts || []).length;

  container.innerHTML = `
    <div class="screen-enter">
      <div class="home-greet-row">
        <div>
          <h1 class="screen-title">Olá, ${escapeHtml(firstName)}</h1>
          <p class="screen-sub">Pronto para evoluir hoje?</p>
        </div>
        <span class="pill ${isPro ? 'pill-gold' : 'pill-emerald'}">${APP_CONFIG.LEVELS[user.level || 'intermediate'].shortLabel}</span>
      </div>

      <!-- Seletores 1-Clique Ultra Compactos -->
      <div class="compact-context-stack mb-16">
        <div class="pill-choice-row">
          <button class="choice-chip ${user.location === 'gym' ? 'active' : ''}" data-home-loc="gym">🏋️ Academia</button>
          <button class="choice-chip ${user.location === 'home' ? 'active' : ''}" data-home-loc="home">🏠 Casa</button>
          <button class="choice-chip ${user.location === 'hybrid' ? 'active' : ''}" data-home-loc="hybrid">✈️ Híbrido</button>
        </div>
        <div class="pill-choice-row">
          <button class="choice-chip ${user.level === 'beginner' ? 'active' : ''}" data-home-lvl="beginner">Iniciante</button>
          <button class="choice-chip ${user.level === 'intermediate' ? 'active' : ''}" data-home-lvl="intermediate">Intermediário</button>
          <button class="choice-chip ${user.level === 'pro' ? 'active-gold' : ''}" data-home-lvl="pro">⚡ Atleta Pro</button>
        </div>
      </div>

      <!-- Card Principal: Treino de Hoje -->
      <section class="today-hero-card ${isPro ? 'hero-gold' : ''} mb-16">
        <div class="today-hero-top">
          <span class="mini-eyebrow ${isPro ? 'text-gold' : 'text-emerald'}">
            ${escapeHtml(session.matrixName)} · ${selectedCustomId ? 'Personalizado' : `Treino ${session.dayCode}`}
          </span>
          ${isPro ? '<span class="pill pill-gold pill-xs">FST-7 / RPE 9–10</span>' : ''}
        </div>

        <h2 class="today-hero-title">${escapeHtml(session.title.replace(/^Treino [A-Z]\s*—\s*/, ''))}</h2>
        <p class="today-hero-meta">
          ${session.exercises.length} exercícios · ${metrics.totalSets} séries · ${APP_CONFIG.LOCATIONS[user.location || 'gym'].shortLabel}
        </p>

        ${
          !selectedCustomId
            ? `
              <div class="day-dot-row">
                ${activeMatrix.days
                  .map(
                    (d, i) => `
                    <button class="day-dot-btn ${Number(data.activeDayIndex || 0) === i ? 'active' : ''}" data-pick-day="${i}">
                      ${d.code}
                    </button>
                  `
                  )
                  .join('')}
              </div>
            `
            : ''
        }

        <button class="btn ${isPro ? 'btn-gold' : 'btn-emerald'} btn-full btn-lg mt-12" id="btn-start-workout">
          ${metrics.doneSets > 0 ? `Continuar Treino (${metrics.doneSets}/${metrics.totalSets})` : 'Iniciar Treino →'}
        </button>
      </section>

      <!-- Navegação Minimalista para Outras Telas de Treino -->
      <div class="nav-list-group">
        <button class="nav-row-card" id="btn-goto-matrices">
          <div class="nav-row-icon icon-emerald">🎯</div>
          <div class="nav-row-body">
            <strong>4 Matrizes Pro</strong>
            <span>Ativa: ${escapeHtml(activeMatrix.name)} (${escapeHtml(activeMatrix.mentors)})</span>
          </div>
          <span class="nav-row-chevron">›</span>
        </button>

        <button class="nav-row-card" id="btn-goto-custom">
          <div class="nav-row-icon icon-gold">⚡</div>
          <div class="nav-row-body">
            <strong>Treinos Personalizados</strong>
            <span>${customCount ? `${customCount} treino(s) salvo(s)` : 'Monte seu treino sob medida'}</span>
          </div>
          <span class="nav-row-chevron">›</span>
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-home-loc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.setQuickLocation(btn.dataset.homeLoc);
    });
  });

  container.querySelectorAll('[data-home-lvl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.setQuickLevel(btn.dataset.homeLvl);
    });
  });

  container.querySelectorAll('[data-pick-day]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCustomId = null;
      ctx.data.activeDayIndex = Number(btn.dataset.pickDay);
      ctx.saveData();
      activeSession = null;
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelector('#btn-start-workout')?.addEventListener('click', () => {
    workoutScreen = 'active';
    renderWorkoutsTab(container, ctx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  container.querySelector('#btn-goto-matrices')?.addEventListener('click', () => {
    workoutScreen = 'matrices';
    renderWorkoutsTab(container, ctx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  container.querySelector('#btn-goto-custom')?.addEventListener('click', () => {
    workoutScreen = 'custom';
    renderWorkoutsTab(container, ctx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================================
   TELA 2: EXECUÇÃO DO TREINO (Ultra Didático — 1 Exercício por Vez + Lista)
   ============================================================================ */
function renderActiveExecutionScreen(container, ctx, session) {
  const isPro = ctx.user.level === 'pro';
  const metrics = calcSessionMetrics(session);
  const totalEx = session.exercises.length;
  if (currentExIndex >= totalEx) currentExIndex = Math.max(0, totalEx - 1);
  const ex = session.exercises[currentExIndex];
  const progressPct = metrics.totalSets ? Math.round((metrics.doneSets / metrics.totalSets) * 100) : 0;

  container.innerHTML = `
    <div class="screen-enter">
      <!-- Top Bar da Execução -->
      <div class="subscreen-topbar">
        <button class="back-btn" id="btn-exit-workout">← Treino</button>
        <div class="exec-progress-center">
          <span class="subscreen-title">${metrics.doneSets}/${metrics.totalSets} séries</span>
        </div>
        <div class="exec-top-actions">
          <button class="pill-btn-mini" id="btn-toggle-layout">${executionLayout === 'focus' ? 'Lista' : 'Foco'}</button>
          <button class="pill-btn-mini" id="btn-open-spotify-mini" title="Abrir Spotify">🎵</button>
        </div>
      </div>

      <!-- Barra fina de progresso do treino -->
      <div class="thin-progress-bar mb-12">
        <div class="thin-progress-fill ${isPro ? 'fill-gold' : ''}" style="width:${progressPct}%"></div>
      </div>

      <!-- Cronômetro Compacto Fixo no Topo -->
      <div id="sticky-rest-timer" class="compact-timer-bar mb-16">
        <div class="compact-timer-left">
          <span id="rest-timer-display" class="compact-timer-num">${formatTimer(timerState.remainingSec)}</span>
          <div class="compact-presets">
            <button data-timer-preset="35">35s</button>
            <button data-timer-preset="60">60s</button>
            <button data-timer-preset="90">90s</button>
          </div>
        </div>
        <div class="compact-timer-right">
          <button
            id="btn-timer-notify"
            class="timer-bell-btn ${getNotificationStatus() === 'granted' ? 'active' : ''}"
            title="${getNotificationStatus() === 'granted' ? 'Notificação de descanso ativa' : 'Ativar notificação quando o descanso acabar'}"
          >
            ${getNotificationStatus() === 'granted' ? '🔔' : '🔕'}
          </button>
          <label class="auto-mini" title="Auto-iniciar ao marcar série">
            <input type="checkbox" id="auto-timer-check" ${timerState.autoStart ? 'checked' : ''} />
            <span>Auto</span>
          </label>
          <button id="rest-timer-toggle" class="btn btn-xs btn-emerald">▶</button>
          <button id="rest-timer-reset" class="btn btn-xs btn-ghost">↺</button>
        </div>
        <div class="timer-progress-track">
          <div id="rest-timer-fill" class="timer-progress-fill" style="width:100%"></div>
        </div>
      </div>

      ${
        executionLayout === 'focus'
          ? renderFocusExerciseView(ex, currentExIndex, totalEx, session, metrics, isPro)
          : renderListExercisesView(session, metrics, isPro)
      }
    </div>
  `;

  mountDemoVideos(container);
  bindActiveExecutionEvents(container, ctx, session);
  updateTimerDom();
}

function renderFocusExerciseView(ex, idx, totalEx, session, metrics, isPro) {
  const isNewPr = ex.prKg > 0 && Number(ex.loadKg) > ex.prKg;
  const isLast = idx === totalEx - 1;

  return `
    <!-- Navegador de Passos (Bolinhas dos Exercícios) -->
    <div class="step-dots-bar mb-16">
      ${session.exercises
        .map((item, i) => {
          const doneAll = item.sets.every((s) => s.done);
          return `
            <button class="step-dot ${i === idx ? 'current' : ''} ${doneAll ? 'done' : ''}" data-jump-ex="${i}">
              ${doneAll ? '✓' : i + 1}
            </button>
          `;
        })
        .join('')}
    </div>

    <!-- Cartão Didático do Exercício Atual -->
    <section class="focus-exercise-card ${ex.isFst7 ? 'focus-card-gold' : ''}">
      <div class="focus-ex-meta">
        <span class="tag-muscle">${escapeHtml(ex.muscle)}</span>
        <span>Exercício ${idx + 1} de ${totalEx}</span>
        ${ex.isFst7 ? '<span class="pill pill-gold pill-xs">FST-7</span>' : ''}
        ${isNewPr ? '<span class="pill pill-gold pill-xs">NOVO PR!</span>' : ''}
        <button class="pill-btn-mini ml-auto" id="btn-toggle-focus-demo">
          ${showFocusDemo ? 'Ocultar Vídeo' : '▶ Vídeo'}
        </button>
      </div>

      <h2 class="focus-ex-title">${escapeHtml(ex.name)}</h2>

      ${showFocusDemo ? `<div class="mb-14">${renderExerciseDemoMarkup(ex.name, ex.muscle, true)}</div>` : ''}

      <div class="focus-specs-row">
        <div><strong>${ex.sets.length}</strong><span>Séries</span></div>
        <div><strong>${escapeHtml(ex.reps)}</strong><span>Reps</span></div>
        <div><strong>${ex.restSec}s</strong><span>Descanso</span></div>
      </div>

      ${
        ex.technique
          ? `<div class="pro-tip-clean">⚡ <strong>${escapeHtml(ex.rpeLabel)}:</strong> ${escapeHtml(ex.technique)}</div>`
          : `<div class="clean-rpe-note">${escapeHtml(ex.rpeLabel)}${ex.prKg ? ` · Seu PR: ${ex.prKg} kg` : ''}</div>`
      }

      <!-- Controle de Carga Grande e Fácil de Tocar -->
      <div class="focus-load-box">
        <span class="mini-eyebrow">CARGA (KG)</span>
        <div class="big-load-stepper">
          <button class="big-step-btn" data-load-delta="-2.5" data-ex-idx="${idx}" aria-label="Reduzir carga">−</button>
          <input
            type="number"
            step="0.5"
            min="0"
            max="600"
            class="big-load-input"
            value="${ex.loadKg}"
            data-load-input="${idx}"
          />
          <button class="big-step-btn" data-load-delta="2.5" data-ex-idx="${idx}" aria-label="Aumentar carga">+</button>
        </div>
      </div>

      <!-- Checklist Vertical Limpo de Séries -->
      <div class="sets-vertical-list">
        ${ex.sets
          .map(
            (s, sIdx) => `
            <button
              class="set-row-btn ${s.done ? 'done' : ''} ${ex.isFst7 && s.done ? 'done-gold' : ''}"
              data-toggle-set="${idx}:${sIdx}"
            >
              <div class="set-row-left">
                <span class="set-row-num">Série ${s.index}</span>
                <span class="set-row-detail">${escapeHtml(ex.reps)} reps · ${ex.loadKg} kg</span>
              </div>
              <span class="set-row-circle">${s.done ? '✓' : ''}</span>
            </button>
          `
          )
          .join('')}
      </div>
    </section>

    <!-- Navegação Didática Inferior -->
    <div class="focus-nav-footer mt-16">
      <button class="btn btn-ghost" id="btn-prev-ex" ${idx === 0 ? 'disabled' : ''}>← Anterior</button>
      ${
        isLast
          ? `<button class="btn ${isPro ? 'btn-gold' : 'btn-emerald'} flex-1" id="btn-finish-workout">Finalizar Treino ✓</button>`
          : `<button class="btn btn-emerald flex-1" id="btn-next-ex">Próximo Exercício →</button>`
      }
    </div>

    ${
      !isLast && metrics.doneSets > 0
        ? `<button class="btn-text-subtle mt-12" id="btn-finish-workout-early">Encerrar e salvar treino agora (${metrics.doneSets} séries)</button>`
        : ''
    }
  `;
}

function renderListExercisesView(session, metrics, isPro) {
  return `
    <div class="compact-ex-list">
      ${session.exercises
        .map((ex, idx) => {
          const doneCnt = ex.sets.filter((s) => s.done).length;
          const allDone = doneCnt === ex.sets.length;
          return `
            <div class="compact-ex-card ${allDone ? 'done' : ''}">
              <div class="compact-ex-top" data-open-focus-ex="${idx}">
                <div>
                  <div class="mini-eyebrow">${escapeHtml(ex.muscle)} · ${doneCnt}/${ex.sets.length} séries</div>
                  <strong>${idx + 1}. ${escapeHtml(ex.name)}</strong>
                </div>
                <span class="compact-load-pill">${ex.loadKg} kg</span>
              </div>
              <div class="sets-checklist mt-8">
                ${ex.sets
                  .map(
                    (s, sIdx) => `
                    <button class="set-chip ${s.done ? 'done' : ''}" data-toggle-set="${idx}:${sIdx}">
                      ${s.done ? '✓' : `S${s.index}`}
                    </button>
                  `
                  )
                  .join('')}
              </div>
            </div>
          `;
        })
        .join('')}
    </div>

    <button class="btn ${isPro ? 'btn-gold' : 'btn-emerald'} btn-full btn-lg mt-16" id="btn-finish-workout">
      Finalizar Treino (${metrics.doneSets}/${metrics.totalSets} séries)
    </button>
  `;
}

/* ============================================================================
   TELA 3: 4 MATRIZES PRO (Tela Separada)
   ============================================================================ */
function renderMatricesScreen(container, ctx) {
  const activeId = ctx.data.activeMatrixId || 'shape_v';
  const activeDay = Number(ctx.data.activeDayIndex) || 0;
  const activeMatrix = PRO_MATRICES.find((m) => m.id === activeId) || PRO_MATRICES[0];

  container.innerHTML = `
    <div class="screen-enter">
      <div class="subscreen-topbar">
        <button class="back-btn" id="btn-back-workout-home">← Treino</button>
        <span class="subscreen-title">4 Matrizes Pro</span>
        <span class="subscreen-spacer"></span>
      </div>

      <p class="screen-sub mb-16">Toque na metodologia ideal para o seu objetivo físico.</p>

      <div class="stack-12 mb-16">
        ${PRO_MATRICES.map((m) => {
          const sel = !selectedCustomId && activeId === m.id;
          return `
            <button class="matrix-row-card ${sel ? 'selected' : ''}" data-select-matrix="${m.id}">
              <div class="matrix-card-top">
                <strong>${escapeHtml(m.name)}</strong>
                ${sel ? '<span class="pill pill-emerald pill-xs">Ativa</span>' : ''}
              </div>
              <div class="matrix-mentors">${escapeHtml(m.mentors)}</div>
              <p>${escapeHtml(m.tagline)}</p>
            </button>
          `;
        }).join('')}
      </div>

      <section class="card mb-16">
        <div class="mini-eyebrow mb-8">DIVISÃO DA MATRIZ: ${escapeHtml(activeMatrix.name)}</div>
        <div class="stack-8">
          ${activeMatrix.days
            .map(
              (d, idx) => `
              <button class="day-list-btn ${activeDay === idx ? 'active' : ''}" data-select-day="${idx}">
                <span class="day-badge-sq">${d.code}</span>
                <div class="day-list-text">
                  <strong>${escapeHtml(d.title)}</strong>
                  <span>${d.exercises.length} exercícios</span>
                </div>
              </button>
            `
            )
            .join('')}
        </div>
      </section>

      <button class="btn btn-emerald btn-full btn-lg" id="btn-confirm-matrix">Começar Este Treino →</button>
    </div>
  `;

  container.querySelector('#btn-back-workout-home')?.addEventListener('click', () => {
    workoutScreen = 'home';
    renderWorkoutsTab(container, ctx);
  });

  container.querySelectorAll('[data-select-matrix]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCustomId = null;
      ctx.data.activeMatrixId = btn.dataset.selectMatrix;
      ctx.data.activeDayIndex = 0;
      ctx.saveData();
      activeSession = null;
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-select-day]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCustomId = null;
      ctx.data.activeDayIndex = Number(btn.dataset.selectDay);
      ctx.saveData();
      activeSession = null;
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelector('#btn-confirm-matrix')?.addEventListener('click', () => {
    workoutScreen = 'active';
    renderWorkoutsTab(container, ctx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================================
   TELA 4: TREINOS PERSONALIZADOS (Tela Separada)
   ============================================================================ */
function renderCustomListScreen(container, ctx) {
  const customWorkouts = ctx.data.customWorkouts || [];

  container.innerHTML = `
    <div class="screen-enter">
      <div class="subscreen-topbar">
        <button class="back-btn" id="btn-back-workout-home">← Treino</button>
        <span class="subscreen-title">Personalizados</span>
        <button class="pill-btn-mini pill-btn-emerald" id="btn-open-builder">+ Criar</button>
      </div>

      ${
        customWorkouts.length === 0
          ? `
            <div class="card empty-state-card">
              <p>Você ainda não criou nenhum treino personalizado.</p>
              <button class="btn btn-emerald mt-12" id="btn-empty-builder">+ Montar Meu Primeiro Treino</button>
            </div>
          `
          : `
            <div class="stack-10">
              ${customWorkouts
                .map(
                  (cw) => `
                  <div class="custom-item-card">
                    <div class="custom-item-main" data-start-custom="${cw.id}">
                      <strong>⚡ ${escapeHtml(cw.name)}</strong>
                      <span>${escapeHtml(cw.focus || 'Treino sob medida')} · ${cw.exercises.length} exercícios</span>
                    </div>
                    <button class="icon-mini-del" data-del-custom="${cw.id}" title="Excluir">×</button>
                  </div>
                `
                )
                .join('')}
            </div>
          `
      }
    </div>
  `;

  container.querySelector('#btn-back-workout-home')?.addEventListener('click', () => {
    workoutScreen = 'home';
    renderWorkoutsTab(container, ctx);
  });

  const openBuilder = () => {
    builderStep = 1;
    workoutScreen = 'builder';
    renderWorkoutsTab(container, ctx);
  };
  container.querySelector('#btn-open-builder')?.addEventListener('click', openBuilder);
  container.querySelector('#btn-empty-builder')?.addEventListener('click', openBuilder);

  container.querySelectorAll('[data-start-custom]').forEach((el) => {
    el.addEventListener('click', () => {
      selectedCustomId = el.dataset.startCustom;
      activeSession = null;
      workoutScreen = 'active';
      renderWorkoutsTab(container, ctx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  container.querySelectorAll('[data-del-custom]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delCustom;
      ctx.data.customWorkouts = (ctx.data.customWorkouts || []).filter((c) => c.id !== id);
      if (selectedCustomId === id) {
        selectedCustomId = null;
        activeSession = null;
      }
      ctx.saveData();
      ctx.toast('Treino removido.');
      renderWorkoutsTab(container, ctx);
    });
  });
}

/* ============================================================================
   TELA 5: GERADOR PERSONALIZADO EM 2 PASSOS LIMPOS
   ============================================================================ */
function renderBuilderScreen(container, ctx) {
  const muscles = ['Todos', 'Peito', 'Costas', 'Pernas', 'Glúteos', 'Ombros', 'Braços', 'Core'];
  const filteredLib = EXERCISE_LIBRARY.filter(
    (ex) => builderDraft.muscleFilter === 'Todos' || ex.muscle === builderDraft.muscleFilter
  );

  container.innerHTML = `
    <div class="screen-enter">
      <div class="subscreen-topbar">
        <button class="back-btn" id="btn-back-custom">← Voltar</button>
        <span class="subscreen-title">Criar Treino</span>
        <span class="subscreen-spacer"></span>
      </div>

      <div class="segmented-control full-seg mb-16">
        <button class="seg-btn ${builderStep === 1 ? 'active' : ''}" data-bstep="1">1. Exercícios (${builderDraft.exercises.length})</button>
        <button class="seg-btn ${builderStep === 2 ? 'active' : ''}" data-bstep="2">2. Detalhes & Salvar</button>
      </div>

      ${
        builderStep === 1
          ? `
            <div class="manual-add-bar mb-12">
              <input type="text" id="manual-ex-name" placeholder="Ou digite um exercício manual..." />
              <button class="btn btn-sm btn-emerald" id="btn-add-manual-ex">+ Add</button>
            </div>

            <div class="pill-scroll mb-12">
              ${muscles
                .map(
                  (m) =>
                    `<button class="filter-pill ${builderDraft.muscleFilter === m ? 'active' : ''}" data-builder-muscle="${m}">${m}</button>`
                )
                .join('')}
            </div>

            <div class="stack-8 mb-16">
              ${filteredLib
                .map((ex) => {
                  const count = builderDraft.exercises.filter((b) => b.name === ex.name).length;
                  return `
                    <div class="library-item">
                      <div>
                        <div class="library-name">${escapeHtml(ex.name)}</div>
                        <div class="library-meta">${escapeHtml(ex.muscle)} · ${escapeHtml(ex.reps)} reps</div>
                      </div>
                      <button class="btn btn-xs ${count ? 'btn-emerald' : 'btn-ghost'}" data-add-lib-ex="${ex.id}">
                        ${count ? `✓ (${count})` : '+ Add'}
                      </button>
                    </div>
                  `;
                })
                .join('')}
            </div>

            ${
              builderDraft.exercises.length > 0
                ? `<button class="btn btn-emerald btn-full btn-lg" id="btn-builder-next">Revisar ${builderDraft.exercises.length} Exercício(s) →</button>`
                : ''
            }
          `
          : `
            <div class="card mb-16">
              <div class="modal-form">
                <div class="form-field">
                  <label>Nome do Treino</label>
                  <input type="text" id="builder-name" placeholder="Ex: Upper Foco Ombros" value="${escapeHtml(builderDraft.name)}" />
                </div>
                <div class="form-field">
                  <label>Foco / Objetivo</label>
                  <input type="text" id="builder-focus" placeholder="Ex: Hipertrofia rápida" value="${escapeHtml(builderDraft.focus)}" />
                </div>
              </div>
            </div>

            <div class="stack-10 mb-16">
              ${
                builderDraft.exercises.length === 0
                  ? `<div class="empty-inline">Volte ao passo 1 e adicione exercícios.</div>`
                  : builderDraft.exercises
                      .map(
                        (ex, idx) => `
                        <div class="builder-ex-row">
                          <div class="builder-ex-top">
                            <strong>${idx + 1}. ${escapeHtml(ex.name)}</strong>
                            <button class="icon-mini-del" data-remove-builder-ex="${idx}">×</button>
                          </div>
                          <div class="builder-ex-inputs">
                            <label>Séries <input type="number" min="1" max="10" value="${ex.sets}" data-bex-field="${idx}:sets" /></label>
                            <label>Reps <input type="text" value="${escapeHtml(ex.reps)}" data-bex-field="${idx}:reps" /></label>
                            <label>Carga <input type="number" min="0" value="${ex.loadKg}" data-bex-field="${idx}:loadKg" /></label>
                            <label>Técnica
                              <select data-bex-field="${idx}:technique">
                                <option value="" ${!ex.technique ? 'selected' : ''}>Normal</option>
                                <option value="FST-7" ${ex.technique === 'FST-7' ? 'selected' : ''}>FST-7</option>
                                <option value="Rest-Pause" ${ex.technique === 'Rest-Pause' ? 'selected' : ''}>Rest-Pause</option>
                                <option value="Drop-Set" ${ex.technique === 'Drop-Set' ? 'selected' : ''}>Drop-Set</option>
                                <option value="RPE 9–10" ${ex.technique === 'RPE 9–10' ? 'selected' : ''}>RPE 9–10</option>
                              </select>
                            </label>
                          </div>
                        </div>
                      `
                      )
                      .join('')
              }
            </div>

            <button class="btn btn-emerald btn-full btn-lg" id="btn-save-custom-workout">Salvar & Iniciar Treino →</button>
          `
      }
    </div>
  `;

  bindBuilderEvents(container, ctx);
}

function bindActiveExecutionEvents(container, ctx, session) {
  container.querySelector('#btn-exit-workout')?.addEventListener('click', () => {
    workoutScreen = 'home';
    renderWorkoutsTab(container, ctx);
  });

  container.querySelector('#btn-toggle-layout')?.addEventListener('click', () => {
    executionLayout = executionLayout === 'focus' ? 'list' : 'focus';
    renderWorkoutsTab(container, ctx);
  });

  container.querySelector('#btn-toggle-focus-demo')?.addEventListener('click', () => {
    showFocusDemo = !showFocusDemo;
    renderWorkoutsTab(container, ctx);
  });

  container.querySelector('#btn-open-spotify-mini')?.addEventListener('click', () => {
    ctx.openSpotifyMiniPlayer();
  });

  container.querySelector('#btn-timer-notify')?.addEventListener('click', async () => {
    await requestRestNotificationPermission(ctx);
    renderWorkoutsTab(container, ctx);
  });

  container.querySelectorAll('[data-timer-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const curEx = session.exercises[currentExIndex];
      startRestTimer(Number(btn.dataset.timerPreset), curEx?.name || '');
    });
  });

  container.querySelector('#rest-timer-toggle')?.addEventListener('click', () => {
    if (timerState.running) {
      stopTimerInterval();
      updateTimerDom();
    } else {
      const curEx = session.exercises[currentExIndex];
      startRestTimer(null, curEx?.name || '');
    }
  });

  container.querySelector('#rest-timer-reset')?.addEventListener('click', () => {
    stopTimerInterval();
    timerState.remainingSec = timerState.totalSec;
    updateTimerDom();
  });

  container.querySelector('#auto-timer-check')?.addEventListener('change', (e) => {
    timerState.autoStart = e.target.checked;
  });

  container.querySelectorAll('[data-jump-ex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentExIndex = Number(btn.dataset.jumpEx);
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-open-focus-ex]').forEach((el) => {
    el.addEventListener('click', () => {
      currentExIndex = Number(el.dataset.openFocusEx);
      executionLayout = 'focus';
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-load-delta]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.exIdx);
      const delta = Number(btn.dataset.loadDelta);
      const ex = session.exercises[idx];
      if (!ex) return;
      ex.loadKg = Math.max(0, Math.round((Number(ex.loadKg) + delta) * 10) / 10);
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-load-input]').forEach((inp) => {
    inp.addEventListener('change', () => {
      const idx = Number(inp.dataset.loadInput);
      const ex = session.exercises[idx];
      if (!ex) return;
      ex.loadKg = Math.max(0, Number(inp.value) || 0);
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-toggle-set]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [exIdx, sIdx] = btn.dataset.toggleSet.split(':').map(Number);
      const ex = session.exercises[exIdx];
      if (!ex || !ex.sets[sIdx]) return;
      ex.sets[sIdx].done = !ex.sets[sIdx].done;
      if (ex.sets[sIdx].done && timerState.autoStart) {
        startRestTimer(ex.restSec, ex.name);
      }
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelector('#btn-prev-ex')?.addEventListener('click', () => {
    if (currentExIndex > 0) {
      currentExIndex -= 1;
      renderWorkoutsTab(container, ctx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  container.querySelector('#btn-next-ex')?.addEventListener('click', () => {
    if (currentExIndex < session.exercises.length - 1) {
      currentExIndex += 1;
      renderWorkoutsTab(container, ctx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  container.querySelector('#btn-finish-workout')?.addEventListener('click', () =>
    finishActiveWorkout(container, ctx, session)
  );
  container.querySelector('#btn-finish-workout-early')?.addEventListener('click', () =>
    finishActiveWorkout(container, ctx, session)
  );
}

function bindBuilderEvents(container, ctx) {
  container.querySelector('#btn-back-custom')?.addEventListener('click', () => {
    workoutScreen = 'custom';
    renderWorkoutsTab(container, ctx);
  });

  container.querySelectorAll('[data-bstep]').forEach((btn) => {
    btn.addEventListener('click', () => {
      builderStep = Number(btn.dataset.bstep);
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelector('#btn-builder-next')?.addEventListener('click', () => {
    builderStep = 2;
    renderWorkoutsTab(container, ctx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  container.querySelectorAll('[data-builder-muscle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      builderDraft.muscleFilter = btn.dataset.builderMuscle;
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-add-lib-ex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lib = EXERCISE_LIBRARY.find((e) => e.id === btn.dataset.addLibEx);
      if (!lib) return;
      builderDraft.exercises.push({
        id: lib.id,
        name: lib.name,
        muscle: lib.muscle,
        sets: 4,
        reps: lib.reps,
        loadKg: lib.defaultLoad,
        restSec: lib.restSec,
        technique: ctx.user.level === 'pro' ? 'Rest-Pause' : '',
      });
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelector('#btn-add-manual-ex')?.addEventListener('click', () => {
    const inp = container.querySelector('#manual-ex-name');
    const name = inp?.value.trim();
    if (!name) return ctx.toast('Digite o nome do exercício.', 'error');
    builderDraft.exercises.push({
      id: `man_${Date.now()}`,
      name,
      muscle: 'Geral',
      sets: 4,
      reps: '10–12',
      loadKg: 20,
      restSec: 75,
      technique: '',
    });
    renderWorkoutsTab(container, ctx);
  });

  container.querySelector('#builder-name')?.addEventListener('input', (e) => (builderDraft.name = e.target.value));
  container.querySelector('#builder-focus')?.addEventListener('input', (e) => (builderDraft.focus = e.target.value));

  container.querySelectorAll('[data-remove-builder-ex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      builderDraft.exercises.splice(Number(btn.dataset.removeBuilderEx), 1);
      renderWorkoutsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-bex-field]').forEach((el) => {
    el.addEventListener('change', () => {
      const [idx, field] = el.dataset.bexField.split(':');
      const ex = builderDraft.exercises[Number(idx)];
      if (!ex) return;
      ex[field] = field === 'sets' || field === 'loadKg' ? Number(el.value) : el.value;
      if (field === 'technique' && el.value === 'FST-7') {
        ex.sets = 7;
        ex.restSec = 35;
        renderWorkoutsTab(container, ctx);
      }
    });
  });

  container.querySelector('#btn-save-custom-workout')?.addEventListener('click', () => {
    if (!builderDraft.name.trim()) return ctx.toast('Dê um nome ao seu treino.', 'error');
    if (builderDraft.exercises.length === 0) return ctx.toast('Adicione pelo menos 1 exercício.', 'error');
    const newCustom = {
      id: `cw_${Date.now()}`,
      name: builderDraft.name.trim(),
      focus: builderDraft.focus.trim() || 'Treino Personalizado',
      location: ctx.user.location || 'gym',
      exercises: JSON.parse(JSON.stringify(builderDraft.exercises)),
    };
    ctx.data.customWorkouts = [newCustom, ...(ctx.data.customWorkouts || [])];
    ctx.saveData();
    selectedCustomId = newCustom.id;
    activeSession = null;
    workoutScreen = 'active';
    builderStep = 1;
    builderDraft = { name: '', focus: '', location: ctx.user.location || 'gym', muscleFilter: 'Todos', exercises: [] };
    ctx.toast('Treino salvo! Bom treino!', 'success');
    renderWorkoutsTab(container, ctx);
  });
}

function finishActiveWorkout(container, ctx, session) {
  const metrics = calcSessionMetrics(session);
  if (metrics.doneSets === 0) {
    return ctx.toast('Marque pelo menos 1 série concluída antes de finalizar.', 'error');
  }

  const today = new Date().toISOString().slice(0, 10);
  const isPro = ctx.user.level === 'pro';
  let newPrs = [];

  if (!ctx.data.loadHistory) ctx.data.loadHistory = {};

  for (const ex of session.exercises) {
    const completedAny = ex.sets.some((s) => s.done);
    const loadVal = Number(ex.loadKg) || 0;
    if (completedAny && loadVal > 0) {
      const list = ctx.data.loadHistory[ex.name] || [];
      const prevMax = list.length ? Math.max(...list.map((e) => Number(e.weightKg) || 0)) : 0;
      if (prevMax > 0 && loadVal > prevMax) {
        newPrs.push({ name: ex.name, prev: prevMax, next: loadVal });
      }
      list.push({ date: today, weightKg: loadVal });
      ctx.data.loadHistory[ex.name] = list;
    }
  }

  const basePts = APP_CONFIG.SCORING.WORKOUT_BASE;
  const setPts = metrics.doneSets * APP_CONFIG.SCORING.SET_COMPLETED;
  const proPts = isPro ? APP_CONFIG.SCORING.PRO_MODE_BONUS : 0;
  const prPts = newPrs.length * APP_CONFIG.SCORING.NEW_PR_BONUS;
  const totalPts = basePts + setPts + proPts + prPts;

  const gam = ctx.data.gamification;
  gam.score = (Number(gam.score) || 0) + totalPts;
  gam.totalWorkouts = (Number(gam.totalWorkouts) || 0) + 1;
  if (isPro) gam.proSessionsCompleted = (Number(gam.proSessionsCompleted) || 0) + 1;
  gam.prsBroken = (Number(gam.prsBroken) || 0) + newPrs.length;

  if (gam.lastWorkoutDate !== today) {
    gam.streakDays = (Number(gam.streakDays) || 0) + 1;
    gam.lastWorkoutDate = today;
  }

  const badges = new Set(gam.badges || []);
  badges.add('first_workout');
  if (gam.streakDays >= 7) badges.add('streak_7');
  if (gam.proSessionsCompleted >= 5) badges.add('pro_master');
  if (gam.prsBroken >= 3) badges.add('pr_breaker');
  gam.badges = Array.from(badges);

  ctx.data.workoutLogs = [
    {
      id: `wl_${Date.now()}`,
      date: today,
      title: session.title,
      matrixName: session.matrixName,
      location: ctx.user.location || 'gym',
      level: ctx.user.level || 'intermediate',
      setsCompleted: metrics.doneSets,
      volumeKg: metrics.totalVolume,
      pointsEarned: totalPts,
    },
    ...(ctx.data.workoutLogs || []),
  ];

  for (const g of ctx.data.goals || []) {
    if (!g.completed && g.category === 'constancia' && g.unit === 'treinos') {
      g.currentValue = gam.totalWorkouts;
    }
    if (!g.completed && g.category === 'pro' && (g.unit === 'sessões' || g.unit === 'treinos')) {
      g.currentValue = gam.proSessionsCompleted;
    }
  }

  ctx.saveData();
  stopTimerInterval();

  session.exercises.forEach((ex) => ex.sets.forEach((s) => (s.done = false)));
  activeSession = null;
  currentExIndex = 0;
  workoutScreen = 'home';

  ctx.openModal(
    'Treino Concluído!',
    `
      <div class="finish-summary-modal">
        <div class="finish-points-hero">+${totalPts} pts</div>
        <p class="finish-points-sub">Score Piff Paff Gym: <strong>${gam.score.toLocaleString('pt-BR')} pts</strong></p>
        <div class="finish-breakdown">
          <div><span>Treino Base</span><strong>+${basePts} pts</strong></div>
          <div><span>${metrics.doneSets} Séries</span><strong>+${setPts} pts</strong></div>
          ${proPts ? `<div class="text-gold"><span>Bônus Atleta Pro</span><strong>+${proPts} pts</strong></div>` : ''}
          ${prPts ? `<div class="text-gold"><span>${newPrs.length} Novo(s) PR(s)</span><strong>+${prPts} pts</strong></div>` : ''}
          <div><span>Volume Movido</span><strong>${metrics.totalVolume.toLocaleString('pt-BR')} kg</strong></div>
        </div>
        ${
          newPrs.length
            ? `<div class="pr-alert-box">
                <strong>🏆 Novos Recordes:</strong>
                ${newPrs.map((p) => `<div>${escapeHtml(p.name)}: ${p.prev}kg → <strong>${p.next}kg</strong></div>`).join('')}
              </div>`
            : ''
        }
      </div>
    `
  );

  ctx.refreshHeader();
  renderWorkoutsTab(container, ctx);
}
