/**
 * Piff Paff Gym — Hidratação Diária (35ml/kg), Meta de Proteínas (1.6g–2.2g/kg)
 * e Biblioteca Filtrável de Dicas (Casa / Academia / Híbrido).
 */

import { APP_CONFIG } from '../config.js';
import { TIPS_LIBRARY } from '../data/tips.js';

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

  // Hidratação: 35 ml / kg
  const waterTargetMl = Math.round(weightKg * 35);
  const waterPct = Math.min(100, Math.round(((nut.waterMl || 0) / waterTargetMl) * 100));

  // Proteínas: 1.6g a 2.2g / kg
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
    <div class="section-header-row">
      <div>
        <h2 class="section-title">Nutrição, Hidratação & Dicas</h2>
        <p class="section-subtitle">Cálculo automático baseado no seu peso atual (<strong>${weightKg.toFixed(1)} kg</strong>) + biblioteca prática para Casa e Academia.</p>
      </div>
    </div>

    <div class="two-col-grid mb-24">
      <!-- HIDRATAÇÃO DIÁRIA (35ml/kg) -->
      <section class="card">
        <div class="card-header-flex">
          <div>
            <h3 class="card-title">💧 Hidratação Diária</h3>
            <p class="card-sub">Fórmula: 35 ml × ${weightKg.toFixed(1)} kg = <strong>${(waterTargetMl / 1000).toFixed(2)} L</strong></p>
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
          <button class="btn btn-sm btn-emerald" data-water-add="250">+250 ml</button>
          <button class="btn btn-sm btn-emerald" data-water-add="500">+500 ml</button>
          <button class="btn btn-sm btn-emerald" data-water-add="750">+750 ml</button>
          <button class="btn btn-sm btn-ghost" data-water-add="-250">−250</button>
          <button class="btn btn-sm btn-ghost" id="btn-reset-water">Zerar</button>
        </div>
        <p class="hint-line mt-12">Bater 100% da hidratação rende <strong>+${APP_CONFIG.SCORING.HYDRATION_100_BONUS} pts</strong> no Score Piff Paff Gym.</p>
      </section>

      <!-- META DE PROTEÍNAS (1.6g a 2.2g/kg) -->
      <section class="card">
        <div class="card-header-flex">
          <div>
            <h3 class="card-title">🥩 Meta Diária de Proteínas</h3>
            <p class="card-sub">Faixa científica: 1.6g a 2.2g/kg · ~${perMeal4}g em 4 refeições</p>
          </div>
          <span class="pill ${proteinPct >= 100 ? 'pill-gold' : 'pill-neutral'}">${proteinPct}%</span>
        </div>

        <div class="protein-slider-box">
          <div class="progress-label-row">
            <span>Multiplicador: <strong class="text-gold">${factor.toFixed(1)} g/kg</strong></span>
            <span>${factor <= 1.7 ? 'Manutenção' : factor <= 1.9 ? 'Hipertrofia Base' : factor <= 2.1 ? 'Recomposição' : 'Cutting / Pro'}</span>
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
          <button class="btn btn-sm btn-gold" data-protein-add="25">+25g</button>
          <button class="btn btn-sm btn-gold" data-protein-add="35">+35g</button>
          <button class="btn btn-sm btn-gold" data-protein-add="45">+45g</button>
          <button class="btn btn-sm btn-ghost" data-protein-add="-20">−20g</button>
          <button class="btn btn-sm btn-ghost" id="btn-reset-protein">Zerar</button>
        </div>
      </section>
    </div>

    <!-- BIBLIOTECA FILTRÁVEL DE DICAS -->
    <section class="card">
      <div class="card-header-flex">
        <div>
          <h3 class="card-title">📚 Biblioteca de Dicas (Academia & Casa)</h3>
          <p class="card-sub">Filtre por ambiente de treino, categoria ou pesquise um tema específico.</p>
        </div>
        <div class="segmented-control">
          <button class="seg-btn ${tipLocationFilter === 'all' ? 'active' : ''}" data-tiploc="all">Todos</button>
          <button class="seg-btn ${tipLocationFilter === 'gym' ? 'active' : ''}" data-tiploc="gym">Academia</button>
          <button class="seg-btn ${tipLocationFilter === 'home' ? 'active' : ''}" data-tiploc="home">Casa</button>
          <button class="seg-btn ${tipLocationFilter === 'hybrid' ? 'active' : ''}" data-tiploc="hybrid">Híbrido</button>
        </div>
      </div>

      <div class="tips-toolbar">
        <div class="pill-scroll">
          ${categories
            .map(
              (c) =>
                `<button class="filter-pill ${tipCategoryFilter === c ? 'active' : ''}" data-tipcat="${c}">${c}</button>`
            )
            .join('')}
        </div>
        <input type="search" id="tips-search-input" class="search-input" placeholder="Buscar dica (ex: FST-7, sono, casa...)" value="${escapeHtml(tipSearchQuery)}" />
      </div>

      <div class="tips-grid">
        ${
          filteredTips.length === 0
            ? `<div class="empty-inline">Nenhuma dica encontrada com esses filtros.</div>`
            : filteredTips
                .map(
                  (tip) => `
                <article class="tip-card">
                  <div class="tip-tags">
                    <span class="pill pill-emerald">${escapeHtml(tip.category)}</span>
                    <span class="pill pill-neutral">${tip.location === 'all' ? 'Casa & Academia' : tip.location === 'gym' ? 'Academia' : tip.location === 'home' ? 'Casa' : 'Híbrido'}</span>
                    ${tip.level === 'Atleta Pro' ? '<span class="pill pill-gold">Pro</span>' : ''}
                  </div>
                  <h4 class="tip-title">${escapeHtml(tip.title)}</h4>
                  <p class="tip-summary">${escapeHtml(tip.summary)}</p>
                  <p class="tip-details">${escapeHtml(tip.details)}</p>
                </article>
              `
                )
                .join('')
        }
      </div>
    </section>
  `;

  bindNutritionEvents(container, ctx, waterTargetMl, proteinTargetG);
}

function bindNutritionEvents(container, ctx, waterTargetMl, proteinTargetG) {
  const nut = ctx.data.nutrition;
  const today = new Date().toISOString().slice(0, 10);

  container.querySelectorAll('[data-water-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const delta = Number(btn.dataset.waterAdd);
      nut.waterMl = Math.max(0, (Number(nut.waterMl) || 0) + delta);
      if (nut.waterMl >= waterTargetMl && nut.hydrationBonusAwardedDate !== today) {
        nut.hydrationBonusAwardedDate = today;
        ctx.data.gamification.score =
          (Number(ctx.data.gamification.score) || 0) + APP_CONFIG.SCORING.HYDRATION_100_BONUS;
        const badges = new Set(ctx.data.gamification.badges || []);
        badges.add('hydration_hero');
        ctx.data.gamification.badges = Array.from(badges);
        ctx.refreshHeader();
        ctx.toast(`💧 Meta de hidratação 100%! +${APP_CONFIG.SCORING.HYDRATION_100_BONUS} pts!`, 'success');
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
      const delta = Number(btn.dataset.proteinAdd);
      nut.proteinConsumedG = Math.max(0, (Number(nut.proteinConsumedG) || 0) + delta);
      if (nut.proteinConsumedG >= proteinTargetG && nut.proteinBonusAwardedDate !== today) {
        nut.proteinBonusAwardedDate = today;
        ctx.data.gamification.score =
          (Number(ctx.data.gamification.score) || 0) + APP_CONFIG.SCORING.PROTEIN_100_BONUS;
        ctx.refreshHeader();
        ctx.toast(`🥩 Meta de proteína 100%! +${APP_CONFIG.SCORING.PROTEIN_100_BONUS} pts!`, 'success');
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
    // Restaurar foco após re-render
    const nextSearch = container.querySelector('#tips-search-input');
    if (nextSearch) {
      nextSearch.focus();
      nextSearch.setSelectionRange(nextSearch.value.length, nextSearch.value.length);
    }
  });
}
