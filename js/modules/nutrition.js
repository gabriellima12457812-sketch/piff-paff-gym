/**
 * Piff Paff Gym — Nutrição & Dicas (Estilo Mobile Minimalista)
 * Sub-telas separadas: [Hidratação & Proteína] | [Dicas Casa/Academia]
 */

import { APP_CONFIG } from '../config.js';
import { TIPS_LIBRARY } from '../data/tips.js';

let nutView = 'daily'; // 'daily' | 'tips'
let tipLocationFilter = 'all';
let tipCategoryFilter = 'Todas';
let tipSearchQuery = '';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureDailyNutritionReset(ctx) {
  const today = new Date().toISOString().slice(0, 10);
  if (!ctx.data.nutrition) {
    ctx.data.nutrition = {
      date: today,
      waterMl: 0,
      proteinFactor: 2.0,
      proteinConsumedG: 0,
      hydrationBonusAwardedDate: null,
      proteinBonusAwardedDate: null,
    };
  }
  if (ctx.data.nutrition.date !== today) {
    ctx.data.nutrition.date = today;
    ctx.data.nutrition.waterMl = 0;
    ctx.data.nutrition.proteinConsumedG = 0;
    ctx.saveData();
  }
  return ctx.data.nutrition;
}

export function renderNutritionTab(container, ctx) {
  const nut = ensureDailyNutritionReset(ctx);
  const weightKg = Number(ctx.data.bodyProfile?.weightKg || ctx.user.weightKg || 75);

  const waterTargetMl = Math.round(weightKg * 35);
  const waterPct = Math.min(100, Math.round(((nut.waterMl || 0) / waterTargetMl) * 100));

  const factor = Math.max(1.6, Math.min(2.2, Number(nut.proteinFactor) || 2.0));
  const proteinTargetG = Math.round(weightKg * factor);
  const proteinPct = Math.min(100, Math.round(((nut.proteinConsumedG || 0) / proteinTargetG) * 100));
  const perMeal4 = Math.round(proteinTargetG / 4);

  const categories = ['Todas', 'Execução', 'Hipertrofia', 'Nutrição', 'Recuperação', 'Mindset'];
  const filteredTips = TIPS_LIBRARY.filter((tip) => {
    const locOk = tipLocationFilter === 'all' || tip.location === 'all' || tip.location === tipLocationFilter;
    const catOk = tipCategoryFilter === 'Todas' || tip.category === tipCategoryFilter;
    const q = tipSearchQuery.trim().toLowerCase();
    const searchOk =
      !q ||
      tip.title.toLowerCase().includes(q) ||
      tip.summary.toLowerCase().includes(q) ||
      tip.details.toLowerCase().includes(q);
    return locOk && catOk && searchOk;
  });

  container.innerHTML = `
    <div class="screen-enter">
      <div class="screen-head">
        <h1 class="screen-title">Nutrição & Dicas</h1>
        <p class="screen-sub">Calculado para seu peso atual (${weightKg.toFixed(1)} kg).</p>
      </div>

      <div class="segmented-control full-seg mb-16">
        <button class="seg-btn ${nutView === 'daily' ? 'active' : ''}" data-nview="daily">💧 Água & Proteína</button>
        <button class="seg-btn ${nutView === 'tips' ? 'active' : ''}" data-nview="tips">📚 Dicas (${TIPS_LIBRARY.length})</button>
      </div>

      ${
        nutView === 'daily'
          ? `
            <!-- HIDRATAÇÃO (35 ml/kg) -->
            <section class="card mb-16">
              <div class="card-header-flex">
                <div>
                  <div class="mini-eyebrow">HIDRATAÇÃO (35 ML/KG)</div>
                  <h3 class="card-title">Meta: ${(waterTargetMl / 1000).toFixed(2)} L</h3>
                </div>
                <span class="pill ${waterPct >= 100 ? 'pill-emerald' : 'pill-neutral'}">${waterPct}%</span>
              </div>

              <div class="tracker-big-readout">
                <span class="tracker-big-num text-emerald">${(nut.waterMl || 0).toLocaleString('pt-BR')}</span>
                <span class="tracker-big-unit">/ ${waterTargetMl.toLocaleString('pt-BR')} ml</span>
              </div>

              <div class="progress-bar-track mb-16">
                <div class="progress-bar-fill" style="width:${waterPct}%"></div>
              </div>

              <div class="quick-add-row">
                <button class="btn btn-sm btn-emerald flex-1" data-water-add="250">+250ml</button>
                <button class="btn btn-sm btn-emerald flex-1" data-water-add="500">+500ml</button>
                <button class="btn btn-sm btn-ghost" data-water-add="-250">−250</button>
                <button class="btn btn-sm btn-ghost" id="btn-reset-water">↺</button>
              </div>
            </section>

            <!-- PROTEÍNAS (1.6g a 2.2g/kg) -->
            <section class="card">
              <div class="card-header-flex">
                <div>
                  <div class="mini-eyebrow">PROTEÍNA (${factor.toFixed(1)} G/KG)</div>
                  <h3 class="card-title">Meta: ${proteinTargetG}g (~${perMeal4}g × 4 ref.)</h3>
                </div>
                <span class="pill ${proteinPct >= 100 ? 'pill-gold' : 'pill-neutral'}">${proteinPct}%</span>
              </div>

              <div class="protein-slider-box">
                <div class="progress-label-row">
                  <span>Faixa: <strong>1.6 — 2.2 g/kg</strong></span>
                  <strong class="text-gold">${factor.toFixed(1)} g/kg</strong>
                </div>
                <input type="range" id="protein-factor-slider" min="1.6" max="2.2" step="0.1" value="${factor.toFixed(1)}" />
              </div>

              <div class="tracker-big-readout">
                <span class="tracker-big-num text-gold">${nut.proteinConsumedG || 0}g</span>
                <span class="tracker-big-unit">/ ${proteinTargetG}g</span>
              </div>

              <div class="progress-bar-track mb-16">
                <div class="progress-bar-fill fill-gold" style="width:${proteinPct}%"></div>
              </div>

              <div class="quick-add-row">
                <button class="btn btn-sm btn-gold flex-1" data-protein-add="25">+25g</button>
                <button class="btn btn-sm btn-gold flex-1" data-protein-add="35">+35g</button>
                <button class="btn btn-sm btn-ghost" data-protein-add="-20">−20g</button>
                <button class="btn btn-sm btn-ghost" id="btn-reset-protein">↺</button>
              </div>
            </section>
          `
          : `
            <input type="search" id="tips-search-input" class="search-input mb-12" placeholder="Buscar dica (ex: FST-7, casa, sono)..." value="${escapeHtml(tipSearchQuery)}" />

            <div class="pill-choice-row mb-10">
              <button class="choice-chip ${tipLocationFilter === 'all' ? 'active' : ''}" data-tiploc="all">Todos</button>
              <button class="choice-chip ${tipLocationFilter === 'gym' ? 'active' : ''}" data-tiploc="gym">Academia</button>
              <button class="choice-chip ${tipLocationFilter === 'home' ? 'active' : ''}" data-tiploc="home">Casa</button>
              <button class="choice-chip ${tipLocationFilter === 'hybrid' ? 'active' : ''}" data-tiploc="hybrid">Híbrido</button>
            </div>

            <div class="pill-scroll mb-16">
              ${categories
                .map((c) => `<button class="filter-pill ${tipCategoryFilter === c ? 'active' : ''}" data-tipcat="${c}">${c}</button>`)
                .join('')}
            </div>

            <div class="stack-10">
              ${
                filteredTips.length === 0
                  ? `<div class="card empty-state-card">Nenhuma dica encontrada.</div>`
                  : filteredTips
                      .map(
                        (tip) => `
                      <details class="tip-accordion">
                        <summary>
                          <div class="tip-tags mb-4">
                            <span class="pill pill-emerald pill-xs">${escapeHtml(tip.category)}</span>
                            <span class="pill pill-neutral pill-xs">${tip.location === 'all' ? 'Casa & Academia' : tip.location === 'gym' ? 'Academia' : tip.location === 'home' ? 'Casa' : 'Híbrido'}</span>
                          </div>
                          <strong>${escapeHtml(tip.title)}</strong>
                          <span class="tip-acc-sub">${escapeHtml(tip.summary)}</span>
                        </summary>
                        <p class="tip-acc-body">${escapeHtml(tip.details)}</p>
                      </details>
                    `
                      )
                      .join('')
              }
            </div>
          `
      }
    </div>
  `;

  bindNutritionEvents(container, ctx, waterTargetMl, proteinTargetG);
}

function bindNutritionEvents(container, ctx, waterTargetMl, proteinTargetG) {
  const nut = ctx.data.nutrition;
  const today = new Date().toISOString().slice(0, 10);

  container.querySelectorAll('[data-nview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      nutView = btn.dataset.nview;
      renderNutritionTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-water-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      nut.waterMl = Math.max(0, (Number(nut.waterMl) || 0) + Number(btn.dataset.waterAdd));
      if (nut.waterMl >= waterTargetMl && nut.hydrationBonusAwardedDate !== today) {
        nut.hydrationBonusAwardedDate = today;
        ctx.data.gamification.score =
          (Number(ctx.data.gamification.score) || 0) + APP_CONFIG.SCORING.HYDRATION_100_BONUS;
        const badges = new Set(ctx.data.gamification.badges || []);
        badges.add('hydration_hero');
        ctx.data.gamification.badges = Array.from(badges);
        ctx.refreshHeader();
        ctx.toast(`💧 Hidratação 100%! +${APP_CONFIG.SCORING.HYDRATION_100_BONUS} pts!`, 'success');
      }
      ctx.saveData();
      renderNutritionTab(container, ctx);
    });
  });

  container.querySelector('#btn-reset-water')?.addEventListener('click', () => {
    nut.waterMl = 0;
    ctx.saveData();
    renderNutritionTab(container, ctx);
  });

  container.querySelector('#protein-factor-slider')?.addEventListener('input', (e) => {
    nut.proteinFactor = Number(e.target.value);
    ctx.saveData();
    renderNutritionTab(container, ctx);
  });

  container.querySelectorAll('[data-protein-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      nut.proteinConsumedG = Math.max(0, (Number(nut.proteinConsumedG) || 0) + Number(btn.dataset.proteinAdd));
      if (nut.proteinConsumedG >= proteinTargetG && nut.proteinBonusAwardedDate !== today) {
        nut.proteinBonusAwardedDate = today;
        ctx.data.gamification.score =
          (Number(ctx.data.gamification.score) || 0) + APP_CONFIG.SCORING.PROTEIN_100_BONUS;
        ctx.refreshHeader();
        ctx.toast(`🥩 Proteína 100%! +${APP_CONFIG.SCORING.PROTEIN_100_BONUS} pts!`, 'success');
      }
      ctx.saveData();
      renderNutritionTab(container, ctx);
    });
  });

  container.querySelector('#btn-reset-protein')?.addEventListener('click', () => {
    nut.proteinConsumedG = 0;
    ctx.saveData();
    renderNutritionTab(container, ctx);
  });

  container.querySelectorAll('[data-tiploc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tipLocationFilter = btn.dataset.tiploc;
      renderNutritionTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-tipcat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tipCategoryFilter = btn.dataset.tipcat;
      renderNutritionTab(container, ctx);
    });
  });

  const searchEl = container.querySelector('#tips-search-input');
  searchEl?.addEventListener('input', () => {
    tipSearchQuery = searchEl.value;
    renderNutritionTab(container, ctx);
    const nextSearch = container.querySelector('#tips-search-input');
    if (nextSearch) {
      nextSearch.focus();
      nextSearch.setSelectionRange(nextSearch.value.length, nextSearch.value.length);
    }
  });
}
