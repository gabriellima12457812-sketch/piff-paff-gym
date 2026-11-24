/**
 * Piff Paff Gym — Metas & Gamificação (Estilo Mobile Minimalista)
 * Sub-telas limpas: [Minhas Metas] | [Patentes & Conquistas]
 */

import { APP_CONFIG, getRankForScore } from '../config.js';

let goalsView = 'list'; // 'list' | 'ranks'
let categoryFilter = 'all';

const CATEGORY_META = {
  forca: { label: 'Força' },
  peso: { label: 'Peso & Estética' },
  constancia: { label: 'Constância' },
  pro: { label: 'Performance Pro' },
};

const BADGE_CATALOG = [
  { id: 'first_workout', name: 'Primeiro Passo', desc: 'Completou o 1º treino no app' },
  { id: 'streak_7', name: 'Fogo de 7 Dias', desc: 'Atingiu 7+ dias de constância' },
  { id: 'pro_master', name: 'Mestre Pro / FST-7', desc: '5+ sessões em nível Atleta Pro' },
  { id: 'pr_breaker', name: 'Quebrador de PR', desc: 'Superou 3+ recordes pessoais' },
  { id: 'hydration_hero', name: 'Hidratação 100%', desc: 'Bateu meta diária de 35ml/kg' },
  { id: 'goal_crusher', name: 'Caçador de Metas', desc: 'Concluiu uma meta oficial' },
];

export function computeGoalProgress(goal) {
  const start = Number(goal.startValue) || 0;
  const current = Number(goal.currentValue) || 0;
  const target = Number(goal.targetValue) || 0;
  const isInverse = goal.direction === 'down' || target < start;

  if (goal.completed) {
    return { pct: 100, isInverse, remaining: 0, achieved: Math.abs(target - start) };
  }

  let pct = 0;
  let remaining = 0;
  let achieved = 0;

  if (isInverse) {
    const totalToLose = start - target;
    const lostSoFar = start - current;
    achieved = Math.max(0, lostSoFar);
    remaining = Math.max(0, current - target);
    pct = totalToLose > 0 ? Math.round((lostSoFar / totalToLose) * 100) : 0;
  } else {
    const totalToGain = target - start;
    const gainedSoFar = current - start;
    achieved = Math.max(0, gainedSoFar);
    remaining = Math.max(0, target - current);
    pct = totalToGain > 0 ? Math.round((gainedSoFar / totalToGain) * 100) : 0;
  }

  return {
    pct: Math.max(0, Math.min(100, pct)),
    isInverse,
    remaining: Math.round(remaining * 10) / 10,
    achieved: Math.round(achieved * 10) / 10,
  };
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderGoalsTab(container, ctx) {
  const { data } = ctx;
  const gam = data.gamification || { score: 0, streakDays: 0, totalWorkouts: 0, prsBroken: 0, badges: [] };
  const rankInfo = getRankForScore(gam.score);
  const goals = data.goals || [];
  const filtered = goals.filter((g) => categoryFilter === 'all' || g.category === categoryFilter);
  const unlockedSet = new Set(gam.badges || []);

  container.innerHTML = `
    <div class="segmented-control full-seg mb-16">
      <button class="seg-btn ${goalsView === 'list' ? 'active' : ''}" data-gview="list">Metas (${goals.length})</button>
      <button class="seg-btn ${goalsView === 'ranks' ? 'active' : ''}" data-gview="ranks">Patentes & Score</button>
    </div>

    ${
      goalsView === 'list'
        ? `
          <div class="pill-scroll mb-12">
            <button class="filter-pill ${categoryFilter === 'all' ? 'active' : ''}" data-gcat="all">Todas</button>
            <button class="filter-pill ${categoryFilter === 'forca' ? 'active' : ''}" data-gcat="forca">Força</button>
            <button class="filter-pill ${categoryFilter === 'peso' ? 'active' : ''}" data-gcat="peso">Peso</button>
            <button class="filter-pill ${categoryFilter === 'constancia' ? 'active' : ''}" data-gcat="constancia">Constância</button>
            <button class="filter-pill ${categoryFilter === 'pro' ? 'active' : ''}" data-gcat="pro">Pro</button>
          </div>

          <button class="btn btn-emerald btn-full mb-16" id="btn-new-goal">+ Criar Nova Meta</button>

          <div class="stack-12">
            ${
              filtered.length === 0
                ? `<div class="card empty-state-card">Nenhuma meta nesta categoria.</div>`
                : filtered.map((g) => renderGoalCard(g)).join('')
            }
          </div>
        `
        : `
          <section class="score-hero-card mb-16">
            <div class="score-hero-main">
              <div class="rank-emblem" style="border-color:${rankInfo.current.color}; color:${rankInfo.current.color}">
                ${rankInfo.current.badge}
              </div>
              <div>
                <div class="mini-eyebrow">PATENTE ATUAL</div>
                <h3 class="rank-name" style="color:${rankInfo.current.color}">${rankInfo.current.name}</h3>
                <div class="score-big-val">${Number(gam.score || 0).toLocaleString('pt-BR')} <span>pts</span></div>
              </div>
            </div>
            <div>
              <div class="progress-label-row">
                <span>${rankInfo.next ? `Próxima: ${rankInfo.next.name}` : 'Patente Máxima'}</span>
                <strong>${rankInfo.progress}%</strong>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width:${rankInfo.progress}%; background:${rankInfo.current.color}"></div>
              </div>
            </div>
          </section>

          <section class="card mb-16">
            <h3 class="card-title mb-12">Escada de Patentes</h3>
            <div class="rank-ladder">
              ${APP_CONFIG.RANKS.map((r) => {
                const reached = (gam.score || 0) >= r.minScore;
                return `
                  <div class="rank-step ${reached ? 'reached' : ''}">
                    <span class="rank-step-badge" style="color:${r.color}; border-color:${r.color}">${r.badge}</span>
                    <div class="rank-step-info">
                      <strong>${r.name}</strong>
                      <span>${r.minScore.toLocaleString('pt-BR')}+ pts</span>
                    </div>
                    <span class="rank-step-status">${reached ? '✓' : '—'}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </section>

          <section class="card">
            <h3 class="card-title mb-12">Conquistas</h3>
            <div class="stack-8">
              ${BADGE_CATALOG.map((b) => {
                const unlocked = unlockedSet.has(b.id);
                return `
                  <div class="badge-tile ${unlocked ? 'unlocked' : ''}">
                    <div class="badge-tile-icon">${unlocked ? '★' : '○'}</div>
                    <div>
                      <strong>${b.name}</strong>
                      <p>${b.desc}</p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </section>
        `
    }
  `;

  bindGoalsEvents(container, ctx);
}

function renderGoalCard(goal) {
  const meta = CATEGORY_META[goal.category] || CATEGORY_META.forca;
  const prog = computeGoalProgress(goal);
  const isGold = goal.category === 'pro';

  return `
    <article class="card goal-card ${goal.completed ? 'goal-completed' : ''}">
      <div class="goal-card-top">
        <div class="goal-tags">
          <span class="pill ${isGold ? 'pill-gold' : 'pill-emerald'} pill-xs">${meta.label}</span>
          ${prog.isInverse ? '<span class="pill pill-neutral pill-xs">↓ Meta Inversa</span>' : ''}
          ${goal.completed ? '<span class="pill pill-gold pill-xs">✓ Batida</span>' : ''}
        </div>
        <button class="icon-mini-del" data-del-goal="${goal.id}" title="Excluir meta">×</button>
      </div>

      <h3 class="goal-title">${escapeHtml(goal.title)}</h3>

      <div class="goal-numbers-row">
        <span>Início: <strong>${goal.startValue}${escapeHtml(goal.unit)}</strong></span>
        <span>Atual: <strong class="${isGold ? 'text-gold' : 'text-emerald'}">${goal.currentValue}${escapeHtml(goal.unit)}</strong></span>
        <span>Alvo: <strong>${goal.targetValue}${escapeHtml(goal.unit)}</strong></span>
      </div>

      <div class="progress-bar-track">
        <div class="progress-bar-fill ${isGold ? 'fill-gold' : ''}" style="width:${prog.pct}%"></div>
      </div>

      <div class="goal-footer-row">
        <span class="goal-status-text">
          ${
            goal.completed
              ? 'Concluída · +150 pts'
              : prog.isInverse
                ? `${prog.pct}% · -${prog.achieved}${escapeHtml(goal.unit)} (faltam ${prog.remaining}${escapeHtml(goal.unit)})`
                : `${prog.pct}% · faltam ${prog.remaining}${escapeHtml(goal.unit)}`
          }
        </span>

        ${
          !goal.completed
            ? `
            <div class="goal-actions-inline">
              <input type="number" step="0.1" class="goal-quick-input" value="${goal.currentValue}" data-goal-val="${goal.id}" />
              <button class="btn btn-xs btn-ghost" data-update-goal="${goal.id}">Salvar</button>
              <button class="btn btn-xs btn-emerald" data-complete-goal="${goal.id}">✓</button>
            </div>
          `
            : ''
        }
      </div>
    </article>
  `;
}

function bindGoalsEvents(container, ctx) {
  container.querySelectorAll('[data-gview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      goalsView = btn.dataset.gview;
      renderGoalsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-gcat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryFilter = btn.dataset.gcat;
      renderGoalsTab(container, ctx);
    });
  });

  container.querySelector('#btn-new-goal')?.addEventListener('click', () => {
    const currentW = ctx.data.bodyProfile?.weightKg || 75;
    ctx.openModal(
      'Criar Nova Meta',
      `
        <form id="form-create-goal" class="modal-form">
          <div class="form-field">
            <label>Título da Meta</label>
            <input type="text" name="title" required placeholder="Ex: Secar até 78kg ou Supino 100kg" />
          </div>
          <div class="form-field">
            <label>Categoria</label>
            <select name="category">
              <option value="forca">Força</option>
              <option value="peso" selected>Peso / Estética</option>
              <option value="constancia">Constância</option>
              <option value="pro">Performance Pro</option>
            </select>
          </div>
          <div class="form-field">
            <label>Direção</label>
            <select name="direction">
              <option value="down">↓ Reduzir (Meta Inversa — Perda de Peso / BF%)</option>
              <option value="up">↑ Aumentar (Carga, Massa, Treinos)</option>
            </select>
          </div>
          <div class="form-grid-3">
            <div class="form-field">
              <label>Início</label>
              <input type="number" step="0.1" name="startValue" required value="${currentW}" />
            </div>
            <div class="form-field">
              <label>Atual</label>
              <input type="number" step="0.1" name="currentValue" required value="${currentW}" />
            </div>
            <div class="form-field">
              <label>Alvo</label>
              <input type="number" step="0.1" name="targetValue" required value="${Math.max(40, currentW - 5)}" />
            </div>
          </div>
          <div class="form-field">
            <label>Unidade</label>
            <input type="text" name="unit" required value="kg" />
          </div>
          <button type="submit" class="btn btn-emerald btn-full">Salvar Meta</button>
        </form>
      `,
      (modalBody) => {
        modalBody.querySelector('#form-create-goal').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          ctx.data.goals = [
            {
              id: `g_${Date.now()}`,
              title: String(fd.get('title')).trim(),
              category: fd.get('category'),
              direction: fd.get('direction'),
              startValue: Number(fd.get('startValue')),
              currentValue: Number(fd.get('currentValue')),
              targetValue: Number(fd.get('targetValue')),
              unit: String(fd.get('unit')).trim() || 'kg',
              completed: false,
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...(ctx.data.goals || []),
          ];
          ctx.saveData();
          ctx.closeModal();
          ctx.toast('Meta adicionada!', 'success');
          renderGoalsTab(container, ctx);
        });
      }
    );
  });

  container.querySelectorAll('[data-update-goal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.updateGoal;
      const input = container.querySelector(`[data-goal-val="${id}"]`);
      const goal = (ctx.data.goals || []).find((g) => g.id === id);
      if (!goal || !input) return;
      goal.currentValue = Number(input.value);
      const prog = computeGoalProgress(goal);
      if (prog.pct >= 100 && !goal.completed) {
        completeGoal(goal, ctx);
      } else {
        ctx.saveData();
        ctx.toast('Progresso salvo!');
      }
      renderGoalsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-complete-goal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const goal = (ctx.data.goals || []).find((g) => g.id === btn.dataset.completeGoal);
      if (!goal || goal.completed) return;
      completeGoal(goal, ctx);
      renderGoalsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-del-goal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.data.goals = (ctx.data.goals || []).filter((g) => g.id !== btn.dataset.delGoal);
      ctx.saveData();
      ctx.toast('Meta removida.');
      renderGoalsTab(container, ctx);
    });
  });
}

function completeGoal(goal, ctx) {
  goal.completed = true;
  goal.currentValue = goal.targetValue;
  ctx.data.gamification.score = (Number(ctx.data.gamification.score) || 0) + APP_CONFIG.SCORING.GOAL_COMPLETED;
  const badges = new Set(ctx.data.gamification.badges || []);
  badges.add('goal_crusher');
  ctx.data.gamification.badges = Array.from(badges);
  ctx.saveData();
  ctx.refreshHeader();
  ctx.toast(`Meta batida! +${APP_CONFIG.SCORING.GOAL_COMPLETED} pts!`, 'success');
}
