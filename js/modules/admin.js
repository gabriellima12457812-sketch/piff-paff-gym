/**
 * Piff Paff Gym — Admin Master CRM (Estilo Mobile Minimalista)
 * Exclusivo para Admin Master (admin / admin123):
 *  - KPIs compactos
 *  - Criar novo usuário isolado por UID
 *  - Botão "Entrar nesta Conta" (Impersonate com barra dourada no topo)
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

  const users = storage.getUsers().map((u) => {
    const uData = storage.getUserData(u.uid, u);
    const gam = uData.gamification || {};
    return {
      ...u,
      score: Number(gam.score) || 0,
      totalWorkouts: Number(gam.totalWorkouts) || 0,
      rank: getRankForScore(gam.score || 0).current,
    };
  });

  const filtered = users.filter((u) => {
    const q = adminSearch.trim().toLowerCase();
    const matchText =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q);
    const matchLevel = adminLevelFilter === 'all' || u.level === adminLevelFilter;
    return matchText && matchLevel;
  });

  container.innerHTML = `
    <div class="kpi-grid-3 mb-12">
      <div class="kpi-card kpi-gold">
        <span class="kpi-label">Contas</span>
        <strong class="kpi-val-sm text-gold">${users.length}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Treinos</span>
        <strong class="kpi-val-sm">${users.reduce((s, u) => s + u.totalWorkouts, 0)}</strong>
      </div>
      <div class="kpi-card kpi-emerald">
        <span class="kpi-label">Pro</span>
        <strong class="kpi-val-sm text-emerald">${users.filter((u) => u.level === 'pro').length}</strong>
      </div>
    </div>

    <button class="btn btn-gold btn-full mb-12" id="btn-admin-create-user">+ Criar Novo Usuário</button>

    <input
      type="search"
      id="admin-search-input"
      class="search-input mb-10"
      placeholder="Buscar nome, @login ou UID..."
      value="${escapeHtml(adminSearch)}"
    />

    <div class="pill-scroll mb-16">
      <button class="filter-pill ${adminLevelFilter === 'all' ? 'active' : ''}" data-alvl="all">Todos</button>
      <button class="filter-pill ${adminLevelFilter === 'beginner' ? 'active' : ''}" data-alvl="beginner">Iniciante</button>
      <button class="filter-pill ${adminLevelFilter === 'intermediate' ? 'active' : ''}" data-alvl="intermediate">Interm.</button>
      <button class="filter-pill ${adminLevelFilter === 'pro' ? 'active' : ''}" data-alvl="pro">Pro</button>
    </div>

    <div class="stack-10">
      ${filtered
        .map((u) => {
          const isSelf = u.uid === ctx.user.uid;
          const lvlLabel = APP_CONFIG.LEVELS[u.level]?.shortLabel || u.level;
          return `
            <article class="card admin-mob-card ${u.role === 'admin' ? 'row-admin' : ''}">
              <div class="admin-mob-top">
                <div class="admin-avatar ${u.role === 'admin' || u.level === 'pro' ? 'avatar-gold' : ''}">
                  ${escapeHtml(u.name.slice(0, 2).toUpperCase())}
                </div>
                <div class="admin-mob-info">
                  <strong>${escapeHtml(u.name)}</strong>
                  <span>@${escapeHtml(u.username)} · ${lvlLabel} · ${u.score.toLocaleString('pt-BR')} pts</span>
                  <code class="uid-tag">${escapeHtml(u.uid)}</code>
                </div>
                ${u.role !== 'admin' ? `<button class="icon-mini-del" data-admin-del="${u.uid}" title="Excluir">×</button>` : ''}
              </div>

              ${
                !isSelf
                  ? `
                    <div class="admin-mob-actions">
                      <button class="btn btn-sm btn-gold flex-1" data-impersonate-uid="${u.uid}">
                        🔑 Entrar nesta Conta
                      </button>
                      <select class="admin-inline-select" data-change-lvl="${u.uid}">
                        <option value="beginner" ${u.level === 'beginner' ? 'selected' : ''}>Iniciante</option>
                        <option value="intermediate" ${u.level === 'intermediate' ? 'selected' : ''}>Interm.</option>
                        <option value="pro" ${u.level === 'pro' ? 'selected' : ''}>Pro</option>
                      </select>
                    </div>
                  `
                  : `<div class="pill pill-gold pill-xs mt-8">Sessão Admin Atual</div>`
              }
            </article>
          `;
        })
        .join('')}
    </div>
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

  container.querySelectorAll('[data-impersonate-uid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const res = auth.impersonate(btn.dataset.impersonateUid);
      if (!res.ok) return ctx.toast(res.error || 'Erro ao entrar.', 'error');
      ctx.toast(`Modo Impersonate: ${res.user.name}`, 'success');
      ctx.onSessionChanged('workouts');
    });
  });

  container.querySelectorAll('[data-change-lvl]').forEach((sel) => {
    sel.addEventListener('change', () => {
      const target = storage.getUserByUid(sel.dataset.changeLvl);
      if (!target) return;
      storage.upsertUser({ ...target, level: sel.value });
      ctx.toast(`Nível de ${target.name} atualizado!`, 'success');
      renderAdminTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-admin-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = storage.getUserByUid(btn.dataset.adminDel);
      if (!target || target.role === 'admin') return;
      storage.deleteUser(target.uid);
      ctx.toast(`@${target.username} removido.`);
      renderAdminTab(container, ctx);
    });
  });

  container.querySelector('#btn-admin-create-user')?.addEventListener('click', () => {
    ctx.openModal(
      'Criar Novo Usuário',
      `
        <form id="form-admin-create-user" class="modal-form">
          <div class="form-field">
            <label>Nome Completo</label>
            <input type="text" name="name" required placeholder="Ex: João Pedro" />
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>Login</label>
              <input type="text" name="username" required placeholder="joaopedro" />
            </div>
            <div class="form-field">
              <label>Senha</label>
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
              <label>Local</label>
              <select name="location">
                <option value="gym" selected>Academia</option>
                <option value="home">Casa</option>
                <option value="hybrid">Híbrido</option>
              </select>
            </div>
          </div>
          <div class="form-grid-3">
            <div class="form-field"><label>Peso</label><input type="number" step="0.1" name="weightKg" value="78" /></div>
            <div class="form-field"><label>Altura</label><input type="number" name="heightCm" value="176" /></div>
            <div class="form-field"><label>Meta</label><input type="number" step="0.1" name="goalWeightKg" value="75" /></div>
          </div>
          <button type="submit" class="btn btn-gold btn-full">Criar Conta Isolada</button>
        </form>
      `,
      (modalBody) => {
        modalBody.querySelector('#form-admin-create-user').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const res = auth.register({
            name: fd.get('name'),
            username: fd.get('username'),
            email: '',
            password: fd.get('password'),
            level: fd.get('level'),
            location: fd.get('location'),
            weightKg: Number(fd.get('weightKg')),
            heightCm: Number(fd.get('heightCm')),
            goalWeightKg: Number(fd.get('goalWeightKg')),
          });
          if (!res.ok) return ctx.toast(res.error, 'error');
          ctx.closeModal();
          ctx.toast(`@${res.user.username} criado!`, 'success');
          renderAdminTab(container, ctx);
        });
      }
    );
  });
}
