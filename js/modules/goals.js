/**
 * Piff Paff Gym — Aba de Metas & Gamificação
 * Categorias: Força, Peso/Estética (incl. Metas Inversas de Perda de Peso), Constância e Performance Pro
 * Score Piff Paff Gym + Patentes + Conquistas
 */

import { APP_CONFIG, getRankForScore } from '../config.js';

let categoryFilter = 'all';

const CATEGORY_META = {
  forca: { label: 'Força', color: 'emerald' },
  peso: { label: 'Peso & Estética', color: 'emerald' },
  constancia: { label: 'Constância', color: 'neutral' },
  pro: { label: 'Performance Pro', color: 'gold' },
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
    // Meta Inversa (ex: 94kg -> 82kg)
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
    <div class="section-header-row">
      <div>
        <h2 class="section-title">Metas & Gamificação</h2>
        <p class="section-subtitle">Evolua seu Score Piff Paff Gym, conquiste patentes e acompanhe metas diretas ou inversas (perda de peso).</p>
      </div>
      <button class="btn btn-emerald" id="btn-new-goal">+ Nova Meta</button>
    </div>

    <!-- Score & Patente Hero -->
    <section class="score-hero-card">
      <div class="score-hero-main">
        <div class="rank-emblem" style="border-color:${rankInfo.current.color}; color:${rankInfo.current.color}">
          ${rankInfo.current.badge}
        </div>
        <div>
          <div class="score-eyebrow">PATENTE ATUAL</div>
          <h3 class="rank-name" style="color:${rankInfo.current.color}">${rankInfo.current.name}</h3>
          <div class="score-big-val">${Number(gam.score || 0).toLocaleString('pt-BR')} <span>pts Piff Paff</span></div>
        </div>
      </div>

      <div class="score-hero-progress">
        <div class="progress-label-row">
          <span>${rankInfo.next ? `Próxima Patente: <strong>${rankInfo.next.name}</strong> (${rankInfo.next.minScore.toLocaleString('pt-BR')} pts)` : 'Patente Máxima Alcançada!'}</span>
          <strong>${rankInfo.progress}%</strong>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${rankInfo.progress}%; background:${rankInfo.current.color}"></div>
        </div>
      </div>

      <div class="score-kpi-strip">
        <div class="kpi-mini">
          <span class="kpi-mini-val">${gam.streakDays || 0} dias</span>
          <span class="kpi-mini-lbl">Streak Ativo</span>
        </div>
        <div class="kpi-mini">
          <span class="kpi-mini-val">${gam.totalWorkouts || 0}</span>
          <span class="kpi-mini-lbl">Treinos Feitos</span>
        </div>
        <div class="kpi-mini">
          <span class="kpi-mini-val">${gam.prsBroken || 0}</span>
          <span class="kpi-mini-lbl">PRs Quebrados</span>
        </div>
        <div class="kpi-mini">
          <span class="kpi-mini-val">${goals.filter((g) => g.completed).length}/${goals.length}</span>
          <span class="kpi-mini-lbl">Metas Batidas</span>
        </div>
      </div>
    </section>

    <!-- Filtros de Metas -->
    <div class="pill-scroll mb-16">
      <button class="filter-pill ${categoryFilter === 'all' ? 'active' : ''}" data-gcat="all">Todas (${goals.length})</button>
      <button class="filter-pill ${categoryFilter === 'forca' ? 'active' : ''}" data-gcat="forca">Força</button>
      <button class="filter-pill ${categoryFilter === 'peso' ? 'active' : ''}" data-gcat="peso">Peso & Estética</button>
      <button class="filter-pill ${categoryFilter === 'constancia' ? 'active' : ''}" data-gcat="constancia">Constância</button>
      <button class="filter-pill ${categoryFilter === 'pro' ? 'active' : ''}" data-gcat="pro">Performance Pro</button>
    </div>

    <!-- Lista de Metas -->
    <div class="goals-grid">
      ${
        filtered.length === 0
          ? `<div class="card empty-state-card">Nenhuma meta nesta categoria. Clique em <strong>+ Nova Meta</strong> para criar uma agora.</div>`
          : filtered.map((g) => renderGoalCard(g)).join('')
      }
    </div>

    <!-- Patentes & Conquistas -->
    <div class="two-col-grid mt-24">
      <div class="card">
        <h3 class="card-title">Escada de Patentes Piff Paff</h3>
        <div class="rank-ladder">
          ${APP_CONFIG.RANKS.map((r) => {
            const reached = (gam.score || 0) >= r.minScore;
            return `
              <div class="rank-step ${reached ? 'reached' : ''}">
                <span class="rank-step-badge" style="color:${r.color}; border-color:${r.color}">${r.badge}</span>
                <div class="rank-step-info">
                  <strong>${r.name}</strong>
                  <span>${r.minScore.toLocaleString('pt-BR')}+ pontos</span>
                </div>
                <span class="rank-step-status">${reached ? '✓ Desbloqueada' : 'Bloqueada'}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Conquistas do Atleta</h3>
        <div class="badges-grid">
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
      </div>
    </div>
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
          <span class="pill ${isGold ? 'pill-gold' : 'pill-emerald'}">${meta.label}</span>
          ${prog.isInverse ? '<span class="pill pill-neutral">↓ Meta Inversa</span>' : ''}
          ${goal.completed ? '<span class="pill pill-gold">✓ Concluída</span>' : ''}
        </div>
        <button class="icon-mini-del" data-del-goal="${goal.id}" title="Excluir meta">×</button>
      </div>

      <h3 class="goal-title">${escapeHtml(goal.title)}</h3>

      <div class="goal-numbers-row">
        <span>Início: <strong>${goal.startValue} ${escapeHtml(goal.unit)}</strong></span>
        <span>Atual: <strong class="${isGold ? 'text-gold' : 'text-emerald'}">${goal.currentValue} ${escapeHtml(goal.unit)}</strong></span>
        <span>Alvo: <strong>${goal.targetValue} ${escapeHtml(goal.unit)}</strong></span>
      </div>

      <div class="progress-bar-track">
        <div class="progress-bar-fill ${isGold ? 'fill-gold' : ''}" style="width:${prog.pct}%"></div>
      </div>

      <div class="goal-footer-row">
        <span class="goal-status-text">
          ${
            goal.completed
              ? 'Meta atingida! +150 pts garantidos.'
              : prog.isInverse
                ? `${prog.pct}% · Eliminou ${prog.achieved} ${escapeHtml(goal.unit)} (faltam ${prog.remaining} ${escapeHtml(goal.unit)})`
                : `${prog.pct}% · Faltam ${prog.remaining} ${escapeHtml(goal.unit)}`
          }
        </span>

        ${
          !goal.completed
            ? `
            <div class="goal-actions-inline">
              <input type="number" step="0.1" class="goal-quick-input" value="${goal.currentValue}" data-goal-val="${goal.id}" />
              <button class="btn btn-sm btn-ghost" data-update-goal="${goal.id}">Atualizar</button>
              <button class="btn btn-sm btn-emerald" data-complete-goal="${goal.id}">Concluir</button>
            </div>
          `
            : ''
        }
      </div>
    </article>
  `;
}

function bindGoalsEvents(container, ctx) {
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
            <input type="text" name="title" required placeholder="Ex: Secar até 78kg ou Supino Reto 100kg" />
          </div>
          <div class="form-grid-2">
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
              <label>Direção da Meta</label>
              <select name="direction">
                <option value="down">↓ Reduzir (Meta Inversa — Perda de Peso / BF%)</option>
                <option value="up">↑ Aumentar (Carga, Massa, Treinos)</option>
              </select>
            </div>
          </div>
          <div class="form-grid-3">
            <div class="form-field">
              <label>Valor Inicial</label>
              <input type="number" step="0.1" name="startValue" required value="${currentW}" />
            </div>
            <div class="form-field">
              <label>Valor Atual</label>
              <input type="number" step="0.1" name="currentValue" required value="${currentW}" />
            </div>
            <div class="form-field">
              <label>Alvo Final</label>
              <input type="number" step="0.1" name="targetValue" required value="${Math.max(40, currentW - 5)}" />
            </div>
          </div>
          <div class="form-field">
            <label>Unidade</label>
            <input type="text" name="unit" required value="kg" placeholder="kg, %, treinos, dias..." />
          </div>
          <button type="submit" class="btn btn-emerald btn-full">Salvar Meta</button>
        </form>
      `,
      (modalBody) => {
        modalBody.querySelector('#form-create-goal').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const startValue = Number(fd.get('startValue'));
          const currentValue = Number(fd.get('currentValue'));
          const targetValue = Number(fd.get('targetValue'));
          const direction = fd.get('direction');

          ctx.data.goals = [
            {
              id: `g_${Date.now()}`,
              title: String(fd.get('title')).trim(),
              category: fd.get('category'),
              direction,
              startValue,
              currentValue,
              targetValue,
              unit: String(fd.get('unit')).trim() || 'kg',
              completed: false,
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...(ctx.data.goals || []),
          ];
          ctx.saveData();
          ctx.closeModal();
          ctx.toast('Nova meta adicionada!', 'success');
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
        ctx.toast('Progresso da meta atualizado!');
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
  ctx.toast(`Meta concluída! +${APP_CONFIG.SCORING.GOAL_COMPLETED} pts no Score Piff Paff Gym!`, 'success');
}
