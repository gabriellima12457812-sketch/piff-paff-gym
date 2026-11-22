/**
 * Piff Paff Gym — Admin Master CRM
 * Exclusivo para conta Admin Master (admin / admin123):
 *  - KPIs gerais da plataforma
 *  - Diretório de atletas isolados por UID
 *  - Criação de novos usuários direto pelo CRM
 *  - Botão "Entrar nesta Conta" (Modo Impersonate com barra dourada de aviso no topo)
 */

import { APP_CONFIG, getRankForScore } from '../config.js';
import { storage } from '../storage.js';
import { auth } from '../auth.js';

let adminSearch = '';
let adminLevelFilter = 'all';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderAdminTab(container, ctx) {
  if (ctx.user?.role !== 'admin') {
    container.innerHTML = `<div class="card empty-state-card">Acesso restrito ao Admin Master.</div>`;
    return;
  }

  const users = storage.getUsers();
  const enriched = users.map((u) => {
    const uData = storage.getUserData(u.uid, u);
    const gam = uData.gamification || {};
    return {
      ...u,
      score: Number(gam.score) || 0,
      totalWorkouts: Number(gam.totalWorkouts) || 0,
      streakDays: Number(gam.streakDays) || 0,
      photosCount: (uData.evolutionPhotos || []).length,
      goalsCount: (uData.goals || []).length,
      rank: getRankForScore(gam.score || 0).current,
    };
  });

  const totalAthletes = enriched.length;
  const totalWorkoutsAll = enriched.reduce((sum, u) => sum + u.totalWorkouts, 0);
  const avgScore = totalAthletes ? Math.round(enriched.reduce((sum, u) => sum + u.score, 0) / totalAthletes) : 0;
  const proCount = enriched.filter((u) => u.level === 'pro').length;

  const filtered = enriched.filter((u) => {
    const q = adminSearch.trim().toLowerCase();
    const matchText =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q);
    const matchLevel = adminLevelFilter === 'all' || u.level === adminLevelFilter;
    return matchText && matchLevel;
  });

  container.innerHTML = `
    <div class="section-header-row">
      <div>
        <div class="pill pill-gold mb-8">ADMIN MASTER EXCLUSIVO</div>
        <h2 class="section-title">Admin CRM — Gestão de Atletas</h2>
        <p class="section-subtitle">
          Isolamento total por UID · Modo de lançamento: <strong>${APP_CONFIG.MONETIZATION.BILLING_ENABLED ? 'Planos VIP Ativos' : '100% Gratuito (VIP Modular Pronto)'}</strong>
        </p>
      </div>
      <button class="btn btn-gold" id="btn-admin-create-user">+ Criar Novo Usuário</button>
    </div>

    <div class="kpi-grid-4 mb-24">
      <div class="kpi-card kpi-gold">
        <span class="kpi-label">Contas Isoladas (UID)</span>
        <strong class="kpi-val text-gold">${totalAthletes}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Treinos Concluídos</span>
        <strong class="kpi-val">${totalWorkoutsAll}</strong>
      </div>
      <div class="kpi-card kpi-emerald">
        <span class="kpi-label">Score Médio Piff Paff</span>
        <strong class="kpi-val text-emerald">${avgScore.toLocaleString('pt-BR')} pts</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Atletas Nível Pro</span>
        <strong class="kpi-val">${proCount}</strong>
      </div>
    </div>

    <section class="card">
      <div class="admin-toolbar">
        <input
          type="search"
          id="admin-search-input"
          class="search-input"
          placeholder="Buscar por nome, @login, e-mail ou UID..."
          value="${escapeHtml(adminSearch)}"
        />
        <div class="pill-scroll">
          <button class="filter-pill ${adminLevelFilter === 'all' ? 'active' : ''}" data-alvl="all">Todos</button>
          <button class="filter-pill ${adminLevelFilter === 'beginner' ? 'active' : ''}" data-alvl="beginner">Iniciante</button>
          <button class="filter-pill ${adminLevelFilter === 'intermediate' ? 'active' : ''}" data-alvl="intermediate">Intermediário</button>
          <button class="filter-pill ${adminLevelFilter === 'pro' ? 'active' : ''}" data-alvl="pro">Atleta Pro</button>
        </div>
      </div>

      <div class="admin-users-list">
        ${filtered
          .map((u) => {
            const isSelf = u.uid === ctx.user.uid;
            const locLabel = APP_CONFIG.LOCATIONS[u.location]?.shortLabel || u.location;
            const lvlLabel = APP_CONFIG.LEVELS[u.level]?.shortLabel || u.level;
            return `
              <div class="admin-user-row ${u.role === 'admin' ? 'row-admin' : ''}">
                <div class="admin-user-main">
                  <div class="admin-avatar ${u.role === 'admin' || u.level === 'pro' ? 'avatar-gold' : ''}">
                    ${escapeHtml(u.name.slice(0, 2).toUpperCase())}
                  </div>
                  <div>
                    <div class="admin-name-line">
                      <strong>${escapeHtml(u.name)}</strong>
                      <span class="admin-handle">@${escapeHtml(u.username)}</span>
                      ${u.role === 'admin' ? '<span class="pill pill-gold">Admin Master</span>' : ''}
                      <span class="pill ${u.level === 'pro' ? 'pill-gold' : u.level === 'intermediate' ? 'pill-emerald' : 'pill-neutral'}">${lvlLabel}</span>
                      <span class="pill pill-neutral">${locLabel}</span>
                    </div>
                    <div class="admin-meta-line">
                      <span>UID: <code>${escapeHtml(u.uid)}</code></span>
                      <span>· ${u.score.toLocaleString('pt-BR')} pts (${u.rank.name})</span>
                      <span>· ${u.totalWorkouts} treinos</span>
                      <span>· ${u.photosCount} fotos</span>
                      <span>· ${u.goalsCount} metas</span>
                    </div>
                  </div>
                </div>

                <div class="admin-user-actions">
                  ${
                    !isSelf
                      ? `
                        <button class="btn btn-sm btn-gold" data-impersonate-uid="${u.uid}">
                          🔑 Entrar nesta Conta
                        </button>
                        <select class="admin-inline-select" data-change-lvl="${u.uid}" title="Alterar nível">
                          <option value="beginner" ${u.level === 'beginner' ? 'selected' : ''}>Iniciante</option>
                          <option value="intermediate" ${u.level === 'intermediate' ? 'selected' : ''}>Intermediário</option>
                          <option value="pro" ${u.level === 'pro' ? 'selected' : ''}>Atleta Pro</option>
                        </select>
                        ${u.role !== 'admin' ? `<button class="icon-mini-del" data-admin-del="${u.uid}" title="Excluir conta">×</button>` : ''}
                      `
                      : `<span class="pill pill-gold">Sua Sessão Atual</span>`
                  }
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </section>
  `;

  bindAdminEvents(container, ctx);
}

function bindAdminEvents(container, ctx) {
  const searchEl = container.querySelector('#admin-search-input');
  searchEl?.addEventListener('input', () => {
    adminSearch = searchEl.value;
    renderAdminTab(container, ctx);
    const next = container.querySelector('#admin-search-input');
    if (next) {
      next.focus();
      next.setSelectionRange(next.value.length, next.value.length);
    }
  });

  container.querySelectorAll('[data-alvl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      adminLevelFilter = btn.dataset.alvl;
      renderAdminTab(container, ctx);
    });
  });

  // Botão "Entrar nesta Conta" (Modo Impersonate)
  container.querySelectorAll('[data-impersonate-uid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetUid = btn.dataset.impersonateUid;
      const res = auth.impersonate(targetUid);
      if (!res.ok) {
        return ctx.toast(res.error || 'Erro ao entrar na conta.', 'error');
      }
      ctx.toast(`Modo Impersonate ativo: visualizando conta de ${res.user.name}`, 'success');
      ctx.onSessionChanged('workouts');
    });
  });

  // Alterar nível pelo CRM
  container.querySelectorAll('[data-change-lvl]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const uid = sel.dataset.changeLvl;
      const target = storage.getUserByUid(uid);
      if (!target) return;
      storage.upsertUser({ ...target, level: sel.value });
      ctx.toast(`Nível de ${target.name} atualizado para ${APP_CONFIG.LEVELS[sel.value].label}.`, 'success');
      renderAdminTab(container, ctx);
    });
  });

  // Excluir usuário
  container.querySelectorAll('[data-admin-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.adminDel;
      const target = storage.getUserByUid(uid);
      if (!target || target.role === 'admin') return;
      storage.deleteUser(uid);
      ctx.toast(`Conta @${target.username} removida.`);
      renderAdminTab(container, ctx);
    });
  });

  // Criar Novo Usuário pelo CRM
  container.querySelector('#btn-admin-create-user')?.addEventListener('click', () => {
    ctx.openModal(
      'Criar Novo Usuário (Admin CRM)',
      `
        <form id="form-admin-create-user" class="modal-form">
          <div class="form-grid-2">
            <div class="form-field">
              <label>Nome Completo</label>
              <input type="text" name="name" required placeholder="Ex: João Pedro" />
            </div>
            <div class="form-field">
              <label>Login (Username)</label>
              <input type="text" name="username" required placeholder="Ex: joaopedro" />
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>E-mail</label>
              <input type="email" name="email" placeholder="joao@email.com" />
            </div>
            <div class="form-field">
              <label>Senha de Acesso</label>
              <input type="text" name="password" required value="123456" />
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>Nível</label>
              <select name="level">
                <option value="beginner">Iniciante</option>
                <option value="intermediate" selected>Intermediário</option>
                <option value="pro">Atleta Pro</option>
              </select>
            </div>
            <div class="form-field">
              <label>Local Padrão</label>
              <select name="location">
                <option value="gym" selected>Academia Completa</option>
                <option value="home">Treino em Casa</option>
                <option value="hybrid">Híbrido / Viagem</option>
              </select>
            </div>
          </div>
          <div class="form-grid-3">
            <div class="form-field">
              <label>Peso (kg)</label>
              <input type="number" step="0.1" name="weightKg" value="78" />
            </div>
            <div class="form-field">
              <label>Altura (cm)</label>
              <input type="number" name="heightCm" value="176" />
            </div>
            <div class="form-field">
              <label>Meta Peso (kg)</label>
              <input type="number" step="0.1" name="goalWeightKg" value="75" />
            </div>
          </div>
          <button type="submit" class="btn btn-gold btn-full">Criar Conta Isolada por UID</button>
        </form>
      `,
      (modalBody) => {
        modalBody.querySelector('#form-admin-create-user').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const res = auth.register({
            name: fd.get('name'),
            username: fd.get('username'),
            email: fd.get('email'),
            password: fd.get('password'),
            level: fd.get('level'),
            location: fd.get('location'),
            weightKg: Number(fd.get('weightKg')),
            heightCm: Number(fd.get('heightCm')),
            goalWeightKg: Number(fd.get('goalWeightKg')),
          });
          if (!res.ok) {
            return ctx.toast(res.error, 'error');
          }
          ctx.closeModal();
          ctx.toast(`Usuário @${res.user.username} criado com UID ${res.user.uid}!`, 'success');
          renderAdminTab(container, ctx);
        });
      }
    );
  });
}
