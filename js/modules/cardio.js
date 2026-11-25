/**
 * Piff Paff Gym — Corrida & Caminhada (Andar / Correr / Intervalado + Iniciar / Pausar / Stop)
 * Cronômetro preciso baseado em relógio real (Date.now), GPS opcional (Haversine) + modo Esteira/Indoor,
 * cálculo de pace, passos e calorias, com histórico isolado por UID.
 */

const CARDIO_MODES = {
  walk: {
    id: 'walk',
    label: 'Andar',
    icon: '🚶',
    met: 3.8,
    defaultKmh: 5.4,
    stepsPerMin: 108,
    desc: 'Caminhada aeróbica leve ou moderada',
  },
  run: {
    id: 'run',
    label: 'Correr',
    icon: '🏃',
    met: 9.2,
    defaultKmh: 9.6,
    stepsPerMin: 162,
    desc: 'Corrida contínua de rua ou esteira',
  },
  interval: {
    id: 'interval',
    label: 'Andar + Correr',
    icon: '⚡',
    met: 7.4,
    defaultKmh: 7.6,
    stepsPerMin: 136,
    desc: 'Alternância metabólica HIIT (caminhada + corrida)',
  },
};

let cardioState = {
  mode: 'run', // 'walk' | 'run' | 'interval'
  useGps: true,
  gpsStatus: 'idle', // 'idle' | 'searching' | 'active' | 'indoor'
  running: false,
  paused: false,
  accumulatedMs: 0,
  startedAtMs: null,
  gpsDistanceKm: 0,
  lastCoords: null,
  watchId: null,
  tickInterval: null,
};

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getElapsedMs() {
  if (cardioState.running && cardioState.startedAtMs) {
    return cardioState.accumulatedMs + (Date.now() - cardioState.startedAtMs);
  }
  return cardioState.accumulatedMs;
}

function formatClock(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function computeLiveMetrics(weightKg = 75) {
  const ms = getElapsedMs();
  const hours = ms / 3600000;
  const mins = ms / 60000;
  const cfg = CARDIO_MODES[cardioState.mode] || CARDIO_MODES.run;

  const distanceKm =
    cardioState.gpsStatus === 'active' && cardioState.gpsDistanceKm > 0.01
      ? cardioState.gpsDistanceKm
      : hours * cfg.defaultKmh;

  const paceMinPerKm = distanceKm > 0.02 ? mins / distanceKm : 0;
  const paceLabel =
    paceMinPerKm > 0 && paceMinPerKm < 40
      ? `${Math.floor(paceMinPerKm)}:${String(Math.round((paceMinPerKm % 1) * 60)).padStart(2, '0')}`
      : '--:--';

  const kcal = Math.round(cfg.met * (Number(weightKg) || 75) * hours);
  const steps = Math.round(mins * cfg.stepsPerMin);

  return {
    ms,
    clock: formatClock(ms),
    distanceKm: Number(distanceKm.toFixed(2)),
    paceLabel,
    kcal,
    steps,
  };
}

function stopGpsWatch() {
  if (cardioState.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(cardioState.watchId);
  }
  cardioState.watchId = null;
  cardioState.lastCoords = null;
}

function startGpsWatch() {
  stopGpsWatch();
  if (!cardioState.useGps || typeof navigator === 'undefined' || !navigator.geolocation) {
    cardioState.gpsStatus = 'indoor';
    return;
  }

  cardioState.gpsStatus = 'searching';
  try {
    cardioState.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy && accuracy > 45) return;
        cardioState.gpsStatus = 'active';
        if (cardioState.lastCoords && cardioState.running) {
          const stepKm = haversineKm(
            cardioState.lastCoords.lat,
            cardioState.lastCoords.lon,
            latitude,
            longitude
          );
          // Filtra ruídos mínimos (< 3m) e saltos irreais (> 120m em 1 leitura)
          if (stepKm >= 0.003 && stepKm <= 0.12) {
            cardioState.gpsDistanceKm += stepKm;
          }
        }
        cardioState.lastCoords = { lat: latitude, lon: longitude };
      },
      () => {
        cardioState.gpsStatus = 'indoor';
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  } catch {
    cardioState.gpsStatus = 'indoor';
  }
}

function stopTickInterval() {
  if (cardioState.tickInterval) {
    clearInterval(cardioState.tickInterval);
    cardioState.tickInterval = null;
  }
}

export function resetCardioRuntime() {
  stopTickInterval();
  stopGpsWatch();
  cardioState.running = false;
  cardioState.paused = false;
  cardioState.accumulatedMs = 0;
  cardioState.startedAtMs = null;
  cardioState.gpsDistanceKm = 0;
  cardioState.gpsStatus = 'idle';
}

export function isCardioRunning() {
  return cardioState.running || cardioState.paused;
}

export function getCardioQuickSummary() {
  if (!cardioState.running && !cardioState.paused) return null;
  const cfg = CARDIO_MODES[cardioState.mode] || CARDIO_MODES.run;
  return `${cfg.icon} ${cfg.label} · ${formatClock(getElapsedMs())}`;
}

function updateLiveCardioDom(weightKg) {
  const m = computeLiveMetrics(weightKg);
  const clockEl = document.getElementById('cardio-clock-val');
  const distEl = document.getElementById('cardio-dist-val');
  const paceEl = document.getElementById('cardio-pace-val');
  const kcalEl = document.getElementById('cardio-kcal-val');
  const stepsEl = document.getElementById('cardio-steps-val');
  const gpsEl = document.getElementById('cardio-gps-pill');

  if (clockEl) clockEl.textContent = m.clock;
  if (distEl) distEl.textContent = m.distanceKm.toFixed(2);
  if (paceEl) paceEl.textContent = m.paceLabel;
  if (kcalEl) kcalEl.textContent = String(m.kcal);
  if (stepsEl) stepsEl.textContent = m.steps.toLocaleString('pt-BR');
  if (gpsEl) {
    gpsEl.textContent =
      cardioState.gpsStatus === 'active'
        ? '🛰️ GPS Ativo'
        : cardioState.gpsStatus === 'searching'
          ? '🛰️ Buscando GPS...'
          : '🏃 Modo Esteira / Estimado';
  }
}

export function renderCardioScreen(container, ctx, onBack) {
  if (!Array.isArray(ctx.data.cardioSessions)) {
    ctx.data.cardioSessions = [];
  }

  const weightKg = Number(ctx.user.weightKg) || 75;
  const cfg = CARDIO_MODES[cardioState.mode] || CARDIO_MODES.run;
  const m = computeLiveMetrics(weightKg);
  const history = [...ctx.data.cardioSessions].reverse();
  const totalKmAll = ctx.data.cardioSessions.reduce((acc, s) => acc + (Number(s.distanceKm) || 0), 0);

  container.innerHTML = `
    <div class="screen-enter">
      <div class="subscreen-topbar">
        <button class="back-btn" id="btn-back-cardio-home">← Treino</button>
        <span class="subscreen-title">Corrida & Caminhada</span>
        <span class="pill pill-emerald pill-xs">${totalKmAll.toFixed(1)} km</span>
      </div>

      <!-- Seletor Rápido: Andar | Correr | Andar + Correr -->
      <div class="pill-choice-row mb-14">
        ${Object.values(CARDIO_MODES)
          .map(
            (mode) => `
          <button
            class="choice-chip ${cardioState.mode === mode.id ? 'active' : ''}"
            data-cardio-mode="${mode.id}"
            ${cardioState.running ? 'disabled' : ''}
          >
            ${mode.icon} ${mode.label}
          </button>
        `
          )
          .join('')}
      </div>

      <!-- Painel Principal do Cronômetro de Corrida / Caminhada -->
      <section class="card cardio-hero-card ${cardioState.running ? 'cardio-active' : ''} mb-16">
        <div class="cardio-top-row">
          <span class="mini-eyebrow text-emerald">${cfg.icon} ${cfg.label.toUpperCase()}</span>
          <button class="pill pill-neutral pill-xs cardio-gps-toggle" id="cardio-gps-pill" type="button">
            ${
              cardioState.gpsStatus === 'active'
                ? '🛰️ GPS Ativo'
                : cardioState.gpsStatus === 'searching'
                  ? '🛰️ Buscando GPS...'
                  : cardioState.useGps
                    ? '🛰️ GPS Pronto'
                    : '🏃 Modo Esteira'
            }
          </button>
        </div>

        <div class="cardio-clock-display" id="cardio-clock-val">${m.clock}</div>
        <p class="cardio-mode-hint">${escapeHtml(cfg.desc)}</p>

        <div class="cardio-metrics-grid">
          <div class="cardio-metric-box">
            <strong id="cardio-dist-val">${m.distanceKm.toFixed(2)}</strong>
            <span>km</span>
          </div>
          <div class="cardio-metric-box">
            <strong id="cardio-pace-val">${m.paceLabel}</strong>
            <span>min/km</span>
          </div>
          <div class="cardio-metric-box">
            <strong id="cardio-kcal-val">${m.kcal}</strong>
            <span>kcal</span>
          </div>
          <div class="cardio-metric-box">
            <strong id="cardio-steps-val">${m.steps.toLocaleString('pt-BR')}</strong>
            <span>passos</span>
          </div>
        </div>

        <!-- Botões Iniciar / Pausar / Stop & Salvar -->
        <div class="cardio-controls-row mt-16">
          ${
            !cardioState.running && !cardioState.paused
              ? `
                <button class="btn btn-emerald btn-lg btn-full" id="btn-cardio-start">
                  ▶ Iniciar ${cfg.label}
                </button>
              `
              : cardioState.running
                ? `
                  <button class="btn btn-ghost btn-lg" id="btn-cardio-pause">⏸ Pausar</button>
                  <button class="btn btn-danger-solid btn-lg" id="btn-cardio-stop">⏹ Stop & Salvar</button>
                `
                : `
                  <button class="btn btn-emerald btn-lg" id="btn-cardio-resume">▶ Retomar</button>
                  <button class="btn btn-danger-solid btn-lg" id="btn-cardio-stop">⏹ Stop & Salvar</button>
                  <button class="btn btn-ghost btn-sm" id="btn-cardio-reset" title="Descartar">↺</button>
                `
          }
        </div>
      </section>

      <!-- Histórico de Corridas & Caminhadas -->
      <div class="mini-eyebrow mb-8">HISTÓRICO DE CORRIDAS & CAMINHADAS (${history.length})</div>
      ${
        history.length === 0
          ? `<div class="card empty-state-card">Nenhuma sessão salva ainda. Escolha <strong>Andar</strong> ou <strong>Correr</strong>, toque em <strong>Iniciar</strong> e finalize com <strong>Stop & Salvar</strong>.</div>`
          : `
            <div class="stack-10">
              ${history
                .slice(0, 12)
                .map((s) => {
                  const mCfg = CARDIO_MODES[s.mode] || CARDIO_MODES.run;
                  const dt = new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                  return `
                    <div class="card cardio-history-row">
                      <div class="cardio-hist-left">
                        <span class="cardio-hist-icon">${mCfg.icon}</span>
                        <div>
                          <strong>${mCfg.label} · ${Number(s.distanceKm).toFixed(2)} km</strong>
                          <span>${dt} · ${escapeHtml(s.durationLabel)} · Pace ${escapeHtml(s.paceLabel)} · ${s.kcal} kcal</span>
                        </div>
                      </div>
                      <button class="icon-mini-del" data-del-cardio="${s.id}" title="Excluir">×</button>
                    </div>
                  `;
                })
                .join('')}
            </div>
          `
      }
    </div>
  `;

  if (cardioState.running && !cardioState.tickInterval) {
    cardioState.tickInterval = setInterval(() => updateLiveCardioDom(weightKg), 500);
  }

  container.querySelector('#btn-back-cardio-home')?.addEventListener('click', () => {
    if (typeof onBack === 'function') onBack();
  });

  container.querySelectorAll('[data-cardio-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (cardioState.running) return;
      cardioState.mode = btn.dataset.cardioMode;
      renderCardioScreen(container, ctx, onBack);
    });
  });

  container.querySelector('#cardio-gps-pill')?.addEventListener('click', () => {
    cardioState.useGps = !cardioState.useGps;
    if (!cardioState.useGps) {
      stopGpsWatch();
      cardioState.gpsStatus = 'indoor';
    } else if (cardioState.running) {
      startGpsWatch();
    } else {
      cardioState.gpsStatus = 'idle';
    }
    renderCardioScreen(container, ctx, onBack);
  });

  container.querySelector('#btn-cardio-start')?.addEventListener('click', () => {
    cardioState.running = true;
    cardioState.paused = false;
    cardioState.accumulatedMs = 0;
    cardioState.startedAtMs = Date.now();
    cardioState.gpsDistanceKm = 0;
    startGpsWatch();
    stopTickInterval();
    cardioState.tickInterval = setInterval(() => updateLiveCardioDom(weightKg), 500);
    renderCardioScreen(container, ctx, onBack);
  });

  container.querySelector('#btn-cardio-pause')?.addEventListener('click', () => {
    if (!cardioState.running) return;
    cardioState.accumulatedMs = getElapsedMs();
    cardioState.startedAtMs = null;
    cardioState.running = false;
    cardioState.paused = true;
    stopTickInterval();
    renderCardioScreen(container, ctx, onBack);
  });

  container.querySelector('#btn-cardio-resume')?.addEventListener('click', () => {
    cardioState.running = true;
    cardioState.paused = false;
    cardioState.startedAtMs = Date.now();
    if (cardioState.useGps && cardioState.watchId === null) startGpsWatch();
    stopTickInterval();
    cardioState.tickInterval = setInterval(() => updateLiveCardioDom(weightKg), 500);
    renderCardioScreen(container, ctx, onBack);
  });

  container.querySelector('#btn-cardio-reset')?.addEventListener('click', () => {
    resetCardioRuntime();
    renderCardioScreen(container, ctx, onBack);
  });

  container.querySelector('#btn-cardio-stop')?.addEventListener('click', () => {
    const finalMetrics = computeLiveMetrics(weightKg);
    const savedMode = cardioState.mode;
    const minSec = Math.floor(finalMetrics.ms / 1000);
    resetCardioRuntime();

    if (minSec < 5) {
      ctx.toast('Sessão muito curta (menos de 5s) descartada.', 'info');
      renderCardioScreen(container, ctx, onBack);
      return;
    }

    ctx.data.cardioSessions.push({
      id: `cardio_${Date.now()}`,
      mode: savedMode,
      date: new Date().toISOString(),
      durationSec: minSec,
      durationLabel: finalMetrics.clock,
      distanceKm: finalMetrics.distanceKm,
      paceLabel: finalMetrics.paceLabel,
      kcal: finalMetrics.kcal,
      steps: finalMetrics.steps,
    });

    if (ctx.data.gamification) {
      ctx.data.gamification.score = (ctx.data.gamification.score || 0) + 40;
    }
    ctx.saveData();
    ctx.toast(`Sessão salva! ${finalMetrics.distanceKm.toFixed(2)} km · +40 pts no Score 🏃`, 'success');
    renderCardioScreen(container, ctx, onBack);
  });

  container.querySelectorAll('[data-del-cardio]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delCardio;
      ctx.data.cardioSessions = (ctx.data.cardioSessions || []).filter((s) => s.id !== id);
      ctx.saveData();
      renderCardioScreen(container, ctx, onBack);
    });
  });
}
