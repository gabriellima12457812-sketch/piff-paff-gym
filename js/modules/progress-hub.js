/**
 * Piff Paff Gym — Aba Progresso (Hub Minimalista com Telas Separadas)
 * Cada ferramenta abre em sua própria tela limpa com botão "← Progresso":
 *  - Metas & Score
 *  - Evolução Física & Card 9:16
 *  - Gráficos (Cargas & Peso/IMC/BF%)
 */

import { getRankForScore } from '../config.js';
import { renderGoalsTab } from './goals.js';
import { renderEvolutionTab } from './evolution.js';
import { renderChartsTab, calculateBmi } from './charts.js';

let progressScreen = 'hub'; // 'hub' | 'goals' | 'evolution' | 'charts'

export function resetProgressScreen() {
  progressScreen = 'hub';
}

export function setProgressScreen(screen) {
  progressScreen = screen;
}

export function renderProgressTab(container, ctx) {
  if (progressScreen === 'goals') {
    renderSubScreenShell(container, 'Metas & Score', () => {
      progressScreen = 'hub';
      renderProgressTab(container, ctx);
    }, (body) => renderGoalsTab(body, ctx));
    return;
  }

  if (progressScreen === 'evolution') {
    renderSubScreenShell(container, 'Evolução Física', () => {
      progressScreen = 'hub';
      renderProgressTab(container, ctx);
    }, (body) => renderEvolutionTab(body, ctx));
    return;
  }

  if (progressScreen === 'charts') {
    renderSubScreenShell(container, 'Gráficos & Corpo', () => {
      progressScreen = 'hub';
      renderProgressTab(container, ctx);
    }, (body) => renderChartsTab(body, ctx));
    return;
  }

  // Tela Principal Minimalista do Hub de Progresso
  const gam = ctx.data.gamification || { score: 0, streakDays: 0, totalWorkouts: 0 };
  const rank = getRankForScore(gam.score || 0);
  const goals = ctx.data.goals || [];
  const activeGoals = goals.filter((g) => !g.completed).length;
  const photos = ctx.data.evolutionPhotos || [];
  const body = ctx.data.bodyProfile || { weightKg: 75, heightCm: 175, goalWeightKg: 75 };
  const bmi = calculateBmi(body.weightKg, body.heightCm);
  const loadCount = Object.keys(ctx.data.loadHistory || {}).length;

  container.innerHTML = `
    <div class="screen-enter">
      <div class="screen-head">
        <h1 class="screen-title">Progresso</h1>
        <p class="screen-sub">Escolha o que deseja acompanhar hoje.</p>
      </div>

      <!-- Resumo Minimalista de Score -->
      <div class="minimal-stat-banner mb-16">
        <div class="stat-banner-left">
          <div class="rank-pill-circle" style="border-color:${rank.current.color}; color:${rank.current.color}">${rank.current.badge}</div>
          <div>
            <div class="mini-eyebrow">${rank.current.name}</div>
            <div class="mini-big-num">${Number(gam.score || 0).toLocaleString('pt-BR')} <span>pts</span></div>
          </div>
        </div>
        <div class="stat-banner-right">
          <div><strong>${gam.streakDays || 0}d</strong><span>Streak</span></div>
          <div><strong>${gam.totalWorkouts || 0}</strong><span>Treinos</span></div>
        </div>
      </div>

      <!-- Menu Limpo: Cada Funcionalidade é uma Tela Própria -->
      <div class="nav-list-group">
        <button class="nav-row-card" data-open-prog="goals">
          <div class="nav-row-icon icon-gold">🏆</div>
          <div class="nav-row-body">
            <strong>Metas & Gamificação</strong>
            <span>${activeGoals} metas ativas · Patentes & Conquistas</span>
          </div>
          <span class="nav-row-chevron">›</span>
        </button>

        <button class="nav-row-card" data-open-prog="evolution">
          <div class="nav-row-icon icon-emerald">📸</div>
          <div class="nav-row-body">
            <strong>Evolução & Fotos</strong>
            <span>${photos.length} fotos · Antes vs. Depois & Card 9:16</span>
          </div>
          <span class="nav-row-chevron">›</span>
        </button>

        <button class="nav-row-card" data-open-prog="charts">
          <div class="nav-row-icon icon-neutral">📈</div>
          <div class="nav-row-body">
            <strong>Gráficos & Métricas</strong>
            <span>${loadCount} exercícios · ${Number(body.weightKg).toFixed(1)}kg · IMC ${bmi.value}</span>
          </div>
          <span class="nav-row-chevron">›</span>
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-open-prog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      progressScreen = btn.dataset.openProg;
      renderProgressTab(container, ctx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderSubScreenShell(container, title, onBack, mountFn) {
  container.innerHTML = `
    <div class="screen-enter">
      <div class="subscreen-topbar">
        <button class="back-btn" id="subscreen-back-btn">← Progresso</button>
        <span class="subscreen-title">${title}</span>
        <span class="subscreen-spacer"></span>
      </div>
      <div id="subscreen-body"></div>
    </div>
  `;
  container.querySelector('#subscreen-back-btn').addEventListener('click', onBack);
  mountFn(container.querySelector('#subscreen-body'));
}
