/**
 * Piff Paff Gym — Aba Perfil (Tela Minimalista de Conta, Preferências & Acesso Admin CRM)
 */

import { APP_CONFIG, getRankForScore } from '../config.js';
import { getUserPlanBadge } from './entitlements.js';
import { renderAdminTab } from './admin.js';

let profileScreen = 'main'; // 'main' | 'admin'

export function resetProfileScreen() {
  profileScreen = 'main';
}

export function setProfileScreen(screen) {
  profileScreen = screen;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderProfileTab(container, ctx) {
  if (profileScreen === 'admin' && ctx.user?.role === 'admin') {
    container.innerHTML = `
      <div class="screen-enter">
        <div class="subscreen-topbar">
          <button class="back-btn" id="profile-back-btn">← Perfil</button>
          <span class="subscreen-title text-gold">Admin CRM</span>
          <span class="subscreen-spacer"></span>
        </div>
        <div id="admin-subscreen-body"></div>
      </div>
    `;
    container.querySelector('#profile-back-btn').addEventListener('click', () => {
      profileScreen = 'main';
      renderProfileTab(container, ctx);
    });
    renderAdminTab(container.querySelector('#admin-subscreen-body'), ctx);
    return;
  }

  profileScreen = 'main';
  const { user, data } = ctx;
  const rank = getRankForScore(data.gamification?.score || 0);
  const plan = getUserPlanBadge(user);
  const isPro = user.level === 'pro' || user.role === 'admin';

  container.innerHTML = `
    <div class="screen-enter">
      <div class="screen-head">
        <h1 class="screen-title">Perfil</h1>
      </div>

      <!-- Cartão do Atleta -->
      <section class="profile-hero-card mb-16">
        <div class="profile-avatar-lg ${isPro ? 'avatar-gold' : ''}">
          ${escapeHtml(user.name.slice(0, 2).toUpperCase())}
        </div>
        <div class="profile-hero-info">
          <div class="pill ${plan.tone === 'gold' ? 'pill-gold' : 'pill-emerald'} pill-xs mb-4">${plan.label}</div>
          <h2>${escapeHtml(user.name)}</h2>
          <p>@${escapeHtml(user.username)} · ${rank.current.name} (${Number(data.gamification?.score || 0).toLocaleString('pt-BR')} pts)</p>
          <code class="uid-tag">UID: ${escapeHtml(user.uid)}</code>
        </div>
      </section>

      <!-- Seletor 1 Clique de Local -->
      <section class="card mb-12">
        <div class="mini-eyebrow mb-8">LOCAL DE TREINO (1 CLIQUE)</div>
        <div class="pill-choice-row">
          ${Object.values(APP_CONFIG.LOCATIONS)
            .map(
              (loc) => `
              <button class="choice-chip ${user.location === loc.id ? 'active' : ''}" data-prof-loc="${loc.id}">
                ${loc.id === 'gym' ? '🏋️ ' : loc.id === 'home' ? '🏠 ' : '✈️ '}${loc.shortLabel}
              </button>
            `
            )
            .join('')}
        </div>
      </section>

      <!-- Seletor 1 Clique de Nível -->
      <section class="card mb-16">
        <div class="mini-eyebrow mb-8">NÍVEL DINÂMICO (1 CLIQUE)</div>
        <div class="pill-choice-row">
          ${Object.values(APP_CONFIG.LEVELS)
            .map(
              (lvl) => `
              <button class="choice-chip ${user.level === lvl.id ? (lvl.id === 'pro' ? 'active-gold' : 'active') : ''}" data-prof-lvl="${lvl.id}">
                ${lvl.id === 'pro' ? '⚡ ' : ''}${lvl.shortLabel}
              </button>
            `
            )
            .join('')}
        </div>
        <p class="hint-line mt-8">${escapeHtml(APP_CONFIG.LEVELS[user.level || 'intermediate'].summary)}</p>
      </section>

      <!-- Ações & Admin CRM -->
      <div class="nav-list-group">
        ${
          user.role === 'admin'
            ? `
              <button class="nav-row-card nav-row-gold" id="btn-open-admin-crm">
                <div class="nav-row-icon icon-gold">👑</div>
                <div class="nav-row-body">
                  <strong>Admin CRM</strong>
                  <span>Gerenciar contas, criar usuários e modo Impersonate</span>
                </div>
                <span class="nav-row-chevron">›</span>
              </button>
            `
            : ''
        }

        <button class="nav-row-card" id="btn-prof-install-pwa">
          <div class="nav-row-icon icon-emerald">📲</div>
          <div class="nav-row-body">
            <strong>Instalar Piff Paff Gym</strong>
            <span>Adicionar à tela inicial (iOS & Android)</span>
          </div>
          <span class="nav-row-chevron">›</span>
        </button>

        <button class="nav-row-card" id="btn-prof-logout">
          <div class="nav-row-icon icon-danger">🚪</div>
          <div class="nav-row-body">
            <strong>Sair da Conta</strong>
            <span>Trocar de usuário ou entrar em conta demo</span>
          </div>
          <span class="nav-row-chevron">›</span>
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-prof-loc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.setQuickLocation(btn.dataset.profLoc);
      renderProfileTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-prof-lvl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.setQuickLevel(btn.dataset.profLvl);
      renderProfileTab(container, ctx);
    });
  });

  container.querySelector('#btn-open-admin-crm')?.addEventListener('click', () => {
    profileScreen = 'admin';
    renderProfileTab(container, ctx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  container.querySelector('#btn-prof-install-pwa')?.addEventListener('click', () => {
    ctx.triggerPwaInstall();
  });

  container.querySelector('#btn-prof-logout')?.addEventListener('click', () => {
    ctx.logout();
  });
}
