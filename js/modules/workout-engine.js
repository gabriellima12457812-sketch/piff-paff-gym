/**
 * Piff Paff Gym — Motor de Treinos, 4 Matrizes Pro, Checklist Interativo,
 * Cronômetro de Descanso no Topo, Ajuste +/- de Carga e Gerador Personalizado.
 */

import { APP_CONFIG } from '../config.js';
import {
  PRO_MATRICES,
  EXERCISE_LIBRARY,
  buildAdaptiveWorkout,
  buildCustomWorkoutSession,
} from '../data/workouts.js';

// Estado em memória do treino ativo e cronômetro
let activeSession = null;
let sessionKey = '';
let viewMode = 'matrices'; // 'matrices' | 'builder'
let selectedCustomId = null;

// Cronômetro de descanso
let timerState = {
  totalSec: 60,
  remainingSec: 60,
  running: false,
  autoStart: true,
  intervalId: null,
};

// Rascunho do Gerador Personalizado
let builderDraft = {
  name: '',
  focus: '',
  location: 'gym',
  muscleFilter: 'Todos',
  exercises: [],
};

function playTimerBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.16);
      gain.gain.setValueAtTime(0.14, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.24);
    });
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
  } catch {
    // Ignorar se áudio bloqueado antes de interação
  }
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
  if (toggleBtn) toggleBtn.textContent = timerState.running ? 'Pausar' : 'Iniciar';
  if (bar) {
    bar.classList.toggle('timer-running', timerState.running);
    bar.classList.toggle('timer-done', !timerState.running && timerState.remainingSec === 0);
  }
}

export function startRestTimer(seconds) {
  stopTimerInterval();
  if (typeof seconds === 'number' && seconds > 0) {
    timerState.totalSec = seconds;
    timerState.remainingSec = seconds;
  } else if (timerState.remainingSec <= 0) {
    timerState.remainingSec = timerState.totalSec;
  }
  timerState.running = true;
  updateTimerDom();

  timerState.intervalId = setInterval(() => {
    timerState.remainingSec -= 1;
    if (timerState.remainingSec <= 0) {
      timerState.remainingSec = 0;
      stopTimerInterval();
      playTimerBeep();
    }
    updateTimerDom();
  }, 1000);
}

export function resetWorkoutRuntime() {
  activeSession = null;
  sessionKey = '';
  selectedCustomId = null;
  viewMode = 'matrices';
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
  const { user, data } = ctx;
  const isPro = user.level === 'pro';
  const locMeta = APP_CONFIG.LOCATIONS[user.location || 'gym'];
  const levelMeta = APP_CONFIG.LEVELS[user.level || 'intermediate'];
  const session = ensureSession(ctx);
  const metrics = calcSessionMetrics(session);
  const activeMatrix = PRO_MATRICES.find((m) => m.id === (data.activeMatrixId || 'shape_v')) || PRO_MATRICES[0];

  container.innerHTML = `
    <div class="section-header-row">
      <div>
        <h2 class="section-title">Central de Treinos</h2>
        <p class="section-subtitle">
          Adaptado em tempo real para <strong>${escapeHtml(locMeta.label)}</strong> ·
          <span class="${isPro ? 'text-gold' : 'text-emerald'}">${escapeHtml(levelMeta.label)} (${escapeHtml(levelMeta.rpeTarget)})</span>
        </p>
      </div>
      <div class="segmented-control">
        <button class="seg-btn ${viewMode === 'matrices' ? 'active' : ''}" data-wmode="matrices">4 Matrizes Pro</button>
        <button class="seg-btn ${viewMode === 'builder' ? 'active' : ''}" data-wmode="builder">+ Gerador Personalizado</button>
      </div>
    </div>

    ${viewMode === 'builder' ? renderBuilderView(ctx) : renderMatricesAndExecutionView(ctx, activeMatrix, session, metrics, isPro)}
  `;

  bindWorkoutEvents(container, ctx, session);
  updateTimerDom();
}

function renderMatricesAndExecutionView(ctx, activeMatrix, session, metrics, isPro) {
  const { data } = ctx;
  const customWorkouts = data.customWorkouts || [];

  const matrixCards = PRO_MATRICES.map((m) => {
    const isSelected = !selectedCustomId && (data.activeMatrixId || 'shape_v') === m.id;
    const isGold = m.accent === 'gold' || isPro;
    return `
      <button class="matrix-card ${isSelected ? 'selected' : ''} ${isSelected && isGold ? 'selected-gold' : ''}" data-select-matrix="${m.id}">
        <div class="matrix-card-top">
          <span class="matrix-name">${escapeHtml(m.name)}</span>
          ${isSelected ? `<span class="pill ${isGold ? 'pill-gold' : 'pill-emerald'}">Ativa</span>` : ''}
        </div>
        <div class="matrix-mentors">${escapeHtml(m.mentors)}</div>
        <p class="matrix-tagline">${escapeHtml(m.tagline)}</p>
        <div class="matrix-meta-line">${escapeHtml(m.splitSummary)}</div>
      </button>
    `;
  }).join('');

  const customPills = customWorkouts.length
    ? `
      <div class="custom-workouts-strip">
        <span class="strip-label">Meus Treinos Personalizados:</span>
        <div class="pill-scroll">
          ${customWorkouts
            .map(
              (cw) => `
              <div class="custom-pill-wrap ${selectedCustomId === cw.id ? 'active' : ''}">
                <button class="day-pill ${selectedCustomId === cw.id ? 'active' : ''}" data-select-custom="${cw.id}">
                  ⚡ ${escapeHtml(cw.name)} (${cw.exercises.length} ex.)
                </button>
                <button class="icon-mini-del" title="Excluir treino personalizado" data-del-custom="${cw.id}">×</button>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    `
    : '';

  const dayPills = !selectedCustomId
    ? `
      <div class="day-selector-row">
        ${activeMatrix.days
          .map(
            (day, idx) => `
            <button class="day-pill ${Number(data.activeDayIndex || 0) === idx ? 'active' : ''}" data-select-day="${idx}">
              <span class="day-code">Treino ${day.code}</span>
              <span class="day-title-short">${escapeHtml(day.title.split('—')[0].split('&')[0].trim())}</span>
            </button>
          `
          )
          .join('')}
      </div>
    `
    : '';

  const exerciseCards = session.exercises
    .map((ex, exIdx) => {
      const doneCount = ex.sets.filter((s) => s.done).length;
      const allDone = doneCount === ex.sets.length;
      const isNewPr = ex.prKg > 0 && Number(ex.loadKg) > ex.prKg;

      return `
        <article class="exercise-card ${allDone ? 'exercise-complete' : ''} ${ex.isFst7 ? 'exercise-fst7' : ''}">
          <div class="exercise-header">
            <div class="exercise-title-group">
              <div class="exercise-badges">
                <span class="tag-muscle">${escapeHtml(ex.muscle)}</span>
                <span class="tag-meta">${ex.sets.length} séries · ${escapeHtml(ex.reps)} reps</span>
                <span class="tag-meta">Descanso ${ex.restSec}s</span>
                ${ex.isFst7 ? '<span class="pill pill-gold">FST-7</span>' : ''}
                ${isNewPr ? '<span class="pill pill-gold">NOVO PR!</span>' : ''}
              </div>
              <h3 class="exercise-name">${escapeHtml(ex.name)}</h3>
              ${
                ex.technique
                  ? `<div class="pro-technique-line"><strong>Protocolo Pro (${escapeHtml(ex.rpeLabel)}):</strong> ${escapeHtml(ex.technique)}</div>`
                  : `<div class="exercise-rpe-sub">${escapeHtml(ex.rpeLabel)}${ex.prKg ? ` · PR Atual: <strong>${ex.prKg} kg</strong>` : ''}</div>`
              }
            </div>

            <div class="load-control-box">
              <span class="load-label">Carga (kg)</span>
              <div class="load-stepper">
                <button class="step-btn" data-load-delta="-2.5" data-ex-idx="${exIdx}" aria-label="Diminuir carga">−</button>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="600"
                  class="load-input"
                  value="${ex.loadKg}"
                  data-load-input="${exIdx}"
                />
                <button class="step-btn" data-load-delta="2.5" data-ex-idx="${exIdx}" aria-label="Aumentar carga">+</button>
              </div>
            </div>
          </div>

          <div class="sets-checklist">
            ${ex.sets
              .map(
                (s, sIdx) => `
                <button
                  class="set-chip ${s.done ? 'done' : ''} ${ex.isFst7 && s.done ? 'done-gold' : ''}"
                  data-toggle-set="${exIdx}:${sIdx}"
                  title="Marcar Série ${s.index}"
                >
                  <span class="set-check-icon">${s.done ? '✓' : s.index}</span>
                  <span class="set-chip-text">S${s.index}</span>
                </button>
              `
              )
              .join('')}
            <button class="btn-rest-quick" data-start-rest="${ex.restSec}" title="Disparar cronômetro de ${ex.restSec}s">
              ⏱ ${ex.restSec}s
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <div class="matrices-grid">${matrixCards}</div>
    ${customPills}
    ${dayPills}

    <!-- Sticky Rest Timer no Topo da Execução -->
    <div id="sticky-rest-timer" class="sticky-rest-timer">
      <div class="timer-left">
        <span class="timer-label">CRONÔMETRO DE DESCANSO</span>
        <div class="timer-readout-row">
          <span id="rest-timer-display" class="timer-display">${formatTimer(timerState.remainingSec)}</span>
          <div class="timer-presets">
            <button class="timer-preset-btn" data-timer-preset="35">35s FST-7</button>
            <button class="timer-preset-btn" data-timer-preset="60">60s</button>
            <button class="timer-preset-btn" data-timer-preset="90">90s</button>
            <button class="timer-preset-btn" data-timer-preset="120">120s</button>
          </div>
        </div>
      </div>
      <div class="timer-actions">
        <label class="auto-timer-toggle" title="Inicia o descanso automaticamente ao marcar uma série">
          <input type="checkbox" id="auto-timer-check" ${timerState.autoStart ? 'checked' : ''} />
          <span>Auto</span>
        </label>
        <button id="rest-timer-toggle" class="btn btn-sm btn-emerald">Iniciar</button>
        <button id="rest-timer-reset" class="btn btn-sm btn-ghost">Reset</button>
      </div>
      <div class="timer-progress-track">
        <div id="rest-timer-fill" class="timer-progress-fill" style="width: 100%"></div>
      </div>
    </div>

    <!-- Cabeçalho do Treino Ativo -->
    <div class="active-workout-banner ${isPro ? 'banner-pro' : ''}">
      <div>
        <div class="banner-eyebrow">${escapeHtml(session.matrixName)} · ${escapeHtml(session.mentors)}</div>
        <h3 class="banner-title">${escapeHtml(session.title)}</h3>
        <p class="banner-focus">${escapeHtml(session.focus)}</p>
      </div>
      <div class="banner-stats">
        <div class="mini-stat">
          <span class="mini-stat-val">${metrics.doneSets}/${metrics.totalSets}</span>
          <span class="mini-stat-lbl">Séries</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-val">${metrics.totalVolume.toLocaleString('pt-BR')} kg</span>
          <span class="mini-stat-lbl">Volume</span>
        </div>
        <button class="btn btn-sm btn-ghost" id="btn-open-spotify-mini">🎵 Spotify</button>
      </div>
    </div>

    <!-- Lista de Exercícios -->
    <div class="exercises-list">${exerciseCards}</div>

    <!-- Barra Finalizar Treino -->
    <div class="finish-workout-bar">
      <div class="finish-info">
        <strong>${metrics.doneSets} de ${metrics.totalSets} séries concluídas</strong>
        <span>Estima +${APP_CONFIG.SCORING.WORKOUT_BASE + metrics.doneSets * APP_CONFIG.SCORING.SET_COMPLETED + (isPro ? APP_CONFIG.SCORING.PRO_MODE_BONUS : 0)} pts no Score Piff Paff Gym</span>
      </div>
      <button id="btn-finish-workout" class="btn ${isPro ? 'btn-gold' : 'btn-emerald'} btn-lg">
        Finalizar Treino & Somar Pontos
      </button>
    </div>
  `;
}

function renderBuilderView(ctx) {
  const muscles = ['Todos', 'Peito', 'Costas', 'Pernas', 'Glúteos', 'Ombros', 'Braços', 'Core'];
  const filteredLib = EXERCISE_LIBRARY.filter(
    (ex) => builderDraft.muscleFilter === 'Todos' || ex.muscle === builderDraft.muscleFilter
  );

  return `
    <div class="builder-grid">
      <div class="card">
        <h3 class="card-title">1. Configurar Treino Personalizado</h3>
        <div class="form-grid-2">
          <div class="form-field">
            <label>Nome do Treino</label>
            <input type="text" id="builder-name" placeholder="Ex: Push Hipertrofia Máxima" value="${escapeHtml(builderDraft.name)}" />
          </div>
          <div class="form-field">
            <label>Foco / Objetivo</label>
            <input type="text" id="builder-focus" placeholder="Ex: Peito Superior, Ombro 3D & Tríceps" value="${escapeHtml(builderDraft.focus)}" />
          </div>
        </div>
        <div class="form-field">
          <label>Local Ideal</label>
          <select id="builder-location">
            <option value="gym" ${builderDraft.location === 'gym' ? 'selected' : ''}>Academia Completa</option>
            <option value="home" ${builderDraft.location === 'home' ? 'selected' : ''}>Treino em Casa</option>
            <option value="hybrid" ${builderDraft.location === 'hybrid' ? 'selected' : ''}>Híbrido / Viagem</option>
          </select>
        </div>

        <div class="divider"></div>
        <h4 class="sub-heading">Adicionar Exercício Manualmente</h4>
        <div class="manual-ex-row">
          <input type="text" id="manual-ex-name" placeholder="Nome do exercício customizado..." />
          <select id="manual-ex-muscle">
            <option>Peito</option><option>Costas</option><option>Pernas</option>
            <option>Glúteos</option><option>Ombros</option><option>Braços</option><option>Core</option>
          </select>
          <button type="button" class="btn btn-sm btn-emerald" id="btn-add-manual-ex">+ Incluir</button>
        </div>

        <div class="divider"></div>
        <h4 class="sub-heading">Exercícios Selecionados (${builderDraft.exercises.length})</h4>
        ${
          builderDraft.exercises.length === 0
            ? `<div class="empty-inline">Clique nos exercícios da biblioteca ao lado ou adicione manualmente para montar seu treino.</div>`
            : `<div class="builder-selected-list">
                ${builderDraft.exercises
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
                      <label>Carga(kg) <input type="number" min="0" step="1" value="${ex.loadKg}" data-bex-field="${idx}:loadKg" /></label>
                      <label>Técnica Pro
                        <select data-bex-field="${idx}:technique">
                          <option value="" ${!ex.technique ? 'selected' : ''}>Padrão</option>
                          <option value="FST-7" ${ex.technique === 'FST-7' ? 'selected' : ''}>FST-7 (7 séries)</option>
                          <option value="Rest-Pause" ${ex.technique === 'Rest-Pause' ? 'selected' : ''}>Rest-Pause</option>
                          <option value="Drop-Set" ${ex.technique === 'Drop-Set' ? 'selected' : ''}>Drop-Set</option>
                          <option value="RPE 9–10" ${ex.technique === 'RPE 9–10' ? 'selected' : ''}>RPE 9–10</option>
                        </select>
                      </label>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>`
        }

        <div class="builder-footer-actions">
          <button class="btn btn-emerald" id="btn-save-custom-workout">Salvar & Abrir Treino</button>
          <button class="btn btn-ghost" id="btn-clear-builder">Limpar</button>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">2. Biblioteca de Exercícios</h3>
        <div class="pill-scroll">
          ${muscles
            .map(
              (m) =>
                `<button class="filter-pill ${builderDraft.muscleFilter === m ? 'active' : ''}" data-builder-muscle="${m}">${m}</button>`
            )
            .join('')}
        </div>
        <div class="library-list">
          ${filteredLib
            .map(
              (ex) => `
              <div class="library-item">
                <div>
                  <div class="library-name">${escapeHtml(ex.name)}</div>
                  <div class="library-meta">${escapeHtml(ex.muscle)} · ${escapeHtml(ex.reps)} reps · ${ex.restSec}s</div>
                </div>
                <button class="btn btn-sm btn-ghost" data-add-lib-ex="${ex.id}">+ Adicionar</button>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function bindWorkoutEvents(container, ctx, session) {
  // Troca de modo (Matrizes vs Builder)
  container.querySelectorAll('[data-wmode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      viewMode = btn.dataset.wmode;
      renderWorkoutsTab(container, ctx);
    });
  });

  // Selecionar Matriz Pro
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

  // Selecionar Dia A/B/C/D
  container.querySelectorAll('[data-select-day]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCustomId = null;
      ctx.data.activeDayIndex = Number(btn.dataset.selectDay);
      ctx.saveData();
      activeSession = null;
      renderWorkoutsTab(container, ctx);
    });
  });

  // Selecionar Treino Personalizado
  container.querySelectorAll('[data-select-custom]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCustomId = btn.dataset.selectCustom;
      activeSession = null;
      renderWorkoutsTab(container, ctx);
    });
  });

  // Excluir Treino Personalizado
  container.querySelectorAll('[data-del-custom]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.delCustom;
      ctx.data.customWorkouts = (ctx.data.customWorkouts || []).filter((c) => c.id !== id);
      if (selectedCustomId === id) {
        selectedCustomId = null;
        activeSession = null;
      }
      ctx.saveData();
      ctx.toast('Treino personalizado removido.');
      renderWorkoutsTab(container, ctx);
    });
  });

  // Cronômetro presets e controles
  container.querySelectorAll('[data-timer-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sec = Number(btn.dataset.timerPreset);
      startRestTimer(sec);
    });
  });

  const toggleBtn = container.querySelector('#rest-timer-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (timerState.running) {
        stopTimerInterval();
        updateTimerDom();
      } else {
        startRestTimer();
      }
    });
  }

  const resetBtn = container.querySelector('#rest-timer-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      stopTimerInterval();
      timerState.remainingSec = timerState.totalSec;
      updateTimerDom();
    });
  }

  const autoCheck = container.querySelector('#auto-timer-check');
  if (autoCheck) {
    autoCheck.addEventListener('change', () => {
      timerState.autoStart = autoCheck.checked;
    });
  }

  // Botão rápido de Spotify Mini-Player
  const spotifyMiniBtn = container.querySelector('#btn-open-spotify-mini');
  if (spotifyMiniBtn) {
    spotifyMiniBtn.addEventListener('click', () => {
      ctx.openSpotifyMiniPlayer();
    });
  }

  // Ajuste +/- de carga
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

  // Checklist de séries
  container.querySelectorAll('[data-toggle-set]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [exIdx, sIdx] = btn.dataset.toggleSet.split(':').map(Number);
      const ex = session.exercises[exIdx];
      if (!ex || !ex.sets[sIdx]) return;
      ex.sets[sIdx].done = !ex.sets[sIdx].done;
      if (ex.sets[sIdx].done && timerState.autoStart) {
        startRestTimer(ex.restSec);
      }
      renderWorkoutsTab(container, ctx);
    });
  });

  // Botão de descanso específico do exercício
  container.querySelectorAll('[data-start-rest]').forEach((btn) => {
    btn.addEventListener('click', () => {
      startRestTimer(Number(btn.dataset.startRest));
    });
  });

  // Finalizar Treino & Somar Pontos
  const finishBtn = container.querySelector('#btn-finish-workout');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => finishActiveWorkout(container, ctx, session));
  }

  // Eventos do Gerador Personalizado
  if (viewMode === 'builder') {
    const nameIn = container.querySelector('#builder-name');
    const focusIn = container.querySelector('#builder-focus');
    const locIn = container.querySelector('#builder-location');

    nameIn?.addEventListener('input', () => (builderDraft.name = nameIn.value));
    focusIn?.addEventListener('input', () => (builderDraft.focus = focusIn.value));
    locIn?.addEventListener('change', () => (builderDraft.location = locIn.value));

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
      const n = container.querySelector('#manual-ex-name')?.value.trim();
      const m = container.querySelector('#manual-ex-muscle')?.value || 'Geral';
      if (!n) return ctx.toast('Digite o nome do exercício.', 'error');
      builderDraft.exercises.push({
        id: `man_${Date.now()}`,
        name: n,
        muscle: m,
        sets: 4,
        reps: '10–12',
        loadKg: 20,
        restSec: 75,
        technique: '',
      });
      renderWorkoutsTab(container, ctx);
    });

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

    container.querySelector('#btn-clear-builder')?.addEventListener('click', () => {
      builderDraft = { name: '', focus: '', location: ctx.user.location || 'gym', muscleFilter: 'Todos', exercises: [] };
      renderWorkoutsTab(container, ctx);
    });

    container.querySelector('#btn-save-custom-workout')?.addEventListener('click', () => {
      if (!builderDraft.name.trim()) return ctx.toast('Dê um nome ao seu treino personalizado.', 'error');
      if (builderDraft.exercises.length === 0) return ctx.toast('Adicione pelo menos 1 exercício.', 'error');
      const newCustom = {
        id: `cw_${Date.now()}`,
        name: builderDraft.name.trim(),
        focus: builderDraft.focus.trim() || 'Protocolo Personalizado',
        location: builderDraft.location,
        exercises: JSON.parse(JSON.stringify(builderDraft.exercises)),
      };
      ctx.data.customWorkouts = [newCustom, ...(ctx.data.customWorkouts || [])];
      ctx.saveData();
      selectedCustomId = newCustom.id;
      activeSession = null;
      viewMode = 'matrices';
      builderDraft = { name: '', focus: '', location: ctx.user.location || 'gym', muscleFilter: 'Todos', exercises: [] };
      ctx.toast('Treino personalizado salvo e carregado!', 'success');
      renderWorkoutsTab(container, ctx);
    });
  }
}

function finishActiveWorkout(container, ctx, session) {
  const metrics = calcSessionMetrics(session);
  if (metrics.doneSets === 0) {
    return ctx.toast('Marque pelo menos 1 série concluída antes de finalizar o treino.', 'error');
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

  // Atualizar Gamificação
  const gam = ctx.data.gamification;
  gam.score = (Number(gam.score) || 0) + totalPts;
  gam.totalWorkouts = (Number(gam.totalWorkouts) || 0) + 1;
  if (isPro) gam.proSessionsCompleted = (Number(gam.proSessionsCompleted) || 0) + 1;
  gam.prsBroken = (Number(gam.prsBroken) || 0) + newPrs.length;

  if (gam.lastWorkoutDate !== today) {
    gam.streakDays = (Number(gam.streakDays) || 0) + 1;
    gam.lastWorkoutDate = today;
  }

  // Conquistas automáticas
  const badges = new Set(gam.badges || []);
  badges.add('first_workout');
  if (gam.streakDays >= 7) badges.add('streak_7');
  if (gam.proSessionsCompleted >= 5) badges.add('pro_master');
  if (gam.prsBroken >= 3) badges.add('pr_breaker');
  gam.badges = Array.from(badges);

  // Registrar log
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

  // Auto-sincronizar metas de constância e Pro
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

  // Resetar checkboxes para próxima sessão
  session.exercises.forEach((ex) => ex.sets.forEach((s) => (s.done = false)));
  activeSession = null;

  ctx.openModal(
    'Treino Finalizado!',
    `
      <div class="finish-summary-modal">
        <div class="finish-points-hero">+${totalPts} pts</div>
        <p class="finish-points-sub">Adicionados ao seu <strong>Score Piff Paff Gym</strong> (Total: ${gam.score.toLocaleString('pt-BR')} pts)</p>
        <div class="finish-breakdown">
          <div><span>Treino Base</span><strong>+${basePts} pts</strong></div>
          <div><span>${metrics.doneSets} Séries Concluídas</span><strong>+${setPts} pts</strong></div>
          ${proPts ? `<div class="text-gold"><span>Bônus Atleta Pro</span><strong>+${proPts} pts</strong></div>` : ''}
          ${prPts ? `<div class="text-gold"><span>${newPrs.length} Novo(s) Recorde(s) Pessoal(is)</span><strong>+${prPts} pts</strong></div>` : ''}
          <div><span>Volume Total Movido</span><strong>${metrics.totalVolume.toLocaleString('pt-BR')} kg</strong></div>
        </div>
        ${
          newPrs.length
            ? `<div class="pr-alert-box">
                <strong>🏆 Novos PRs Registrados:</strong>
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
