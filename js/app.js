/**
 * Piff Paff Gym — Main Application Controller
 */

import { APP_CONFIG, getRankForScore } from './config.js';
import { storage } from './storage.js';
import { auth } from './auth.js';
import { getUserPlanBadge } from './modules/entitlements.js';
import { renderWorkoutsTab, resetWorkoutRuntime } from './modules/workout-engine.js';
import { renderGoalsTab } from './modules/goals.js';
import { renderEvolutionTab } from './modules/evolution.js';
import { renderChartsTab } from './modules/charts.js';
import { renderNutritionTab } from './modules/nutrition.js';
import {
  renderSpotifyTab,
  syncSpotifyMiniPlayer,
  bindGlobalMiniPlayerControls,
} from './modules/spotify.js';
import { renderAdminTab } from './modules/admin.js';

let activeTab = 'workouts';
let activeUser = null;
let activeData = null;
let deferredInstallPrompt = null;

function showToast(message, type = 'info') {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 260);
  }, 3400);
}

function openModal(title, htmlContent, onMount) {
  const overlay = document.getElementById('modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title;
  bodyEl.innerHTML = htmlContent;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (typeof onMount === 'function') {
    onMount(bodyEl);
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

function buildContext() {
  return {
    user: activeUser,
    data: activeData,
    saveData() {
      if (!activeUser || !activeData) return;
      try {
        storage.saveUserData(activeUser.uid, activeData);
      } catch (err) {
        showToast(err.message || 'Erro ao salvar dados.', 'error');
      }
    },
    updateUserProfile(partial) {
      if (!activeUser) return;
      activeUser = { ...activeUser, ...partial };
      storage.upsertUser(activeUser);
      renderHeaderAndControls();
    },
    refreshHeader() {
      renderHeaderAndControls();
    },
    openModal,
    closeModal,
    toast: showToast,
    openSpotifyMiniPlayer() {
      if (!activeData) return;
      activeData.spotify.miniPlayerOpen = true;
      storage.saveUserData(activeUser.uid, activeData);
      syncSpotifyMiniPlayer(buildContext());
    },
    onSessionChanged(targetTab = 'workouts') {
      resetWorkoutRuntime();
      loadActiveSession(targetTab);
    },
  };
}

function loadActiveSession(preferredTab = null) {
  activeUser = auth.getActiveUser();
  const authScreen = document.getElementById('auth-screen');
  const appShell = document.getElementById('app-shell');

  if (!activeUser) {
    activeData = null;
    authScreen.classList.remove('hidden');
    appShell.classList.add('hidden');
    syncImpersonateBanner();
    syncSpotifyMiniPlayer(null);
    return;
  }

  activeData = storage.getUserData(activeUser.uid, activeUser);
  authScreen.classList.add('hidden');
  appShell.classList.remove('hidden');

  if (preferredTab) {
    activeTab = preferredTab;
  } else if (activeTab === 'admin' && activeUser.role !== 'admin') {
    activeTab = 'workouts';
  }

  // Tema visual dourado para Atleta Pro / Admin Master
  document.body.classList.toggle('theme-pro', activeUser.level === 'pro' || activeUser.role === 'admin');

  syncImpersonateBanner();
  renderNavigation();
  renderHeaderAndControls();
  renderActiveTab();
  syncSpotifyMiniPlayer(buildContext());
}

function syncImpersonateBanner() {
  const banner = document.getElementById('impersonate-banner');
  if (!banner) return;

  if (auth.isImpersonating() && activeUser) {
    banner.classList.remove('hidden');
    document.body.classList.add('has-impersonate-bar');
    const txt = banner.querySelector('#impersonate-banner-text');
    if (txt) {
      txt.innerHTML = `<strong>MODO ADMIN IMPERSONATE</strong> — Visualizando conta de <strong>${activeUser.name}</strong> (@${activeUser.username} · UID: ${activeUser.uid})`;
    }
  } else {
    banner.classList.add('hidden');
    document.body.classList.remove('has-impersonate-bar');
  }
}

function getNavItems() {
  const items = [
    { id: 'workouts', label: 'Treinos', icon: '⚡' },
    { id: 'goals', label: 'Metas & Score', icon: '🏆' },
    { id: 'evolution', label: 'Evolução', icon: '📸' },
    { id: 'charts', label: 'Gráficos', icon: '📈' },
    { id: 'nutrition', label: 'Nutrição & Dicas', icon: '💧' },
    { id: 'spotify', label: 'Spotify', icon: '🎵' },
  ];

  if (activeUser?.role === 'admin') {
    items.push({ id: 'admin', label: 'Admin CRM', icon: '👑', isAdmin: true });
  }
  return items;
}

function renderNavigation() {
  const items = getNavItems();
  const sidebarNav = document.getElementById('sidebar-nav');
  const mobileNav = document.getElementById('mobile-bottom-nav');

  if (sidebarNav) {
    sidebarNav.innerHTML = items
      .map(
        (it) => `
        <button class="nav-item ${activeTab === it.id ? 'active' : ''} ${it.isAdmin ? 'nav-item-admin' : ''}" data-nav="${it.id}">
          <span class="nav-icon">${it.icon}</span>
          <span>${it.label}</span>
        </button>
      `
      )
      .join('');
  }

  if (mobileNav) {
    mobileNav.innerHTML = items
      .map(
        (it) => `
        <button class="mob-nav-item ${activeTab === it.id ? 'active' : ''} ${it.isAdmin ? 'mob-nav-admin' : ''}" data-nav="${it.id}">
          <span class="mob-nav-icon">${it.icon}</span>
          <span class="mob-nav-lbl">${it.label.split(' ')[0]}</span>
        </button>
      `
      )
      .join('');
  }

  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.nav;
      renderNavigation();
      renderActiveTab();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderHeaderAndControls() {
  if (!activeUser || !activeData) return;
  const rankInfo = getRankForScore(activeData.gamification?.score || 0);
  const planBadge = getUserPlanBadge(activeUser);

  // Sidebar profile block
  const sideProfile = document.getElementById('sidebar-user-card');
  if (sideProfile) {
    sideProfile.innerHTML = `
      <div class="user-avatar ${activeUser.role === 'admin' || activeUser.level === 'pro' ? 'avatar-gold' : ''}">
        ${activeUser.name.slice(0, 2).toUpperCase()}
      </div>
      <div class="user-card-meta">
        <strong>${activeUser.name}</strong>
        <span>@${activeUser.username} · ${rankInfo.current.name}</span>
        <span class="pill ${planBadge.tone === 'gold' ? 'pill-gold' : 'pill-emerald'} pill-xs">${planBadge.label}</span>
      </div>
    `;
  }

  // Score pill no header
  const scoreChip = document.getElementById('header-score-chip');
  if (scoreChip) {
    scoreChip.innerHTML = `
      <span class="score-chip-dot" style="background:${rankInfo.current.color}"></span>
      <strong>${Number(activeData.gamification?.score || 0).toLocaleString('pt-BR')} pts</strong>
      <span class="score-chip-rank">${rankInfo.current.name}</span>
    `;
  }

  // Seletor 1 clique de Local
  document.querySelectorAll('[data-quick-loc]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.quickLoc === (activeUser.location || 'gym'));
  });

  // Seletor 1 clique de Nível Dinâmico
  document.querySelectorAll('[data-quick-lvl]').forEach((btn) => {
    const isAct = btn.dataset.quickLvl === (activeUser.level || 'intermediate');
    btn.classList.toggle('active', isAct);
    btn.classList.toggle('active-gold', isAct && btn.dataset.quickLvl === 'pro');
  });
}

function renderActiveTab() {
  const container = document.getElementById('main-view');
  if (!container || !activeUser || !activeData) return;

  const ctx = buildContext();

  switch (activeTab) {
    case 'workouts':
      renderWorkoutsTab(container, ctx);
      break;
    case 'goals':
      renderGoalsTab(container, ctx);
      break;
    case 'evolution':
      renderEvolutionTab(container, ctx);
      break;
    case 'charts':
      renderChartsTab(container, ctx);
      break;
    case 'nutrition':
      renderNutritionTab(container, ctx);
      break;
    case 'spotify':
      renderSpotifyTab(container, ctx);
      break;
    case 'admin':
      renderAdminTab(container, ctx);
      break;
    default:
      renderWorkoutsTab(container, ctx);
  }
}

function bindAuthEvents() {
  const tabLogin = document.getElementById('auth-tab-login');
  const tabReg = document.getElementById('auth-tab-register');
  const formLogin = document.getElementById('form-login');
  const formReg = document.getElementById('form-register');
  const authErr = document.getElementById('auth-error');

  const showAuthErr = (msg) => {
    if (!authErr) return;
    if (!msg) {
      authErr.classList.add('hidden');
      authErr.textContent = '';
    } else {
      authErr.textContent = msg;
      authErr.classList.remove('hidden');
    }
  };

  tabLogin?.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    formLogin.classList.remove('hidden');
    formReg.classList.add('hidden');
    showAuthErr('');
  });

  tabReg?.addEventListener('click', () => {
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
    formReg.classList.remove('hidden');
    formLogin.classList.add('hidden');
    showAuthErr('');
  });

  formLogin?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(formLogin);
    const res = auth.login(fd.get('identifier'), fd.get('password'));
    if (!res.ok) return showAuthErr(res.error);
    showAuthErr('');
    showToast(`Bem-vindo de volta, ${res.user.name}!`, 'success');
    loadActiveSession('workouts');
  });

  formReg?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(formReg);
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
    if (!res.ok) return showAuthErr(res.error);
    showAuthErr('');
    auth.startSessionForUser(res.user.uid);
    showToast(`Conta criada gratuitamente! Isolamento UID ativo.`, 'success');
    loadActiveSession('workouts');
  });

  // Botões 1-clique das Contas Demo
  document.querySelectorAll('[data-demo-login]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [u, p] = btn.dataset.demoLogin.split(':');
      const res = auth.login(u, p);
      if (!res.ok) return showAuthErr(res.error);
      showAuthErr('');
      showToast(`Entrou como ${res.user.name}`, 'success');
      loadActiveSession(res.user.role === 'admin' ? 'admin' : 'workouts');
    });
  });
}

function bindGlobalAppEvents() {
  // 1-clique Local
  document.querySelectorAll('[data-quick-loc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!activeUser) return;
      const loc = btn.dataset.quickLoc;
      activeUser = { ...activeUser, location: loc };
      storage.upsertUser(activeUser);
      renderHeaderAndControls();
      renderActiveTab();
      showToast(`Local alterado para ${APP_CONFIG.LOCATIONS[loc].label}`);
    });
  });

  // 1-clique Nível Dinâmico
  document.querySelectorAll('[data-quick-lvl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!activeUser) return;
      const lvl = btn.dataset.quickLvl;
      activeUser = { ...activeUser, level: lvl };
      storage.upsertUser(activeUser);
      document.body.classList.toggle('theme-pro', activeUser.level === 'pro' || activeUser.role === 'admin');
      renderHeaderAndControls();
      renderActiveTab();
      showToast(
        lvl === 'pro'
          ? 'Modo Atleta Pro ativado! FST-7, Rest-Pause, Drop-Set e RPE 9–10 liberados.'
          : `Nível alterado para ${APP_CONFIG.LEVELS[lvl].label}`
      );
    });
  });

  // Sair do Modo Impersonate
  document.getElementById('btn-exit-impersonate')?.addEventListener('click', () => {
    const res = auth.exitImpersonation();
    if (res.ok) {
      resetWorkoutRuntime();
      showToast('Retornou para sua sessão Admin Master.', 'success');
      loadActiveSession('admin');
    }
  });

  // Logout
  document.querySelectorAll('[data-logout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      auth.logout();
      resetWorkoutRuntime();
      showToast('Sessão encerrada com segurança.');
      loadActiveSession();
    });
  });

  // Modal close
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  // PWA Install button
  document.getElementById('btn-pwa-install')?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('Piff Paff Gym instalado como App!', 'success');
      }
      deferredInstallPrompt = null;
      return;
    }

    openModal(
      'Instalar Piff Paff Gym (iOS & Android)',
      `
        <div class="pwa-guide-modal">
          <div class="pwa-guide-block">
            <strong>📱 No iPhone / iPad (Safari iOS)</strong>
            <ol>
              <li>Toque no ícone <strong>Compartilhar</strong> (quadrado com seta para cima) na barra inferior do Safari.</li>
              <li>Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.</li>
              <li>Toque em <strong>Adicionar</strong> — pronto! Abre em tela cheia como app nativo.</li>
            </ol>
          </div>
          <div class="pwa-guide-block">
            <strong>🤖 No Android (Chrome / Edge)</strong>
            <ol>
              <li>Toque no menu <strong>⋮</strong> (três pontinhos) no canto superior direito.</li>
              <li>Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
            </ol>
          </div>
        </div>
      `
    );
  });

  bindGlobalMiniPlayerControls(() => (activeUser && activeData ? buildContext() : null));
}

function registerPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[PWA] Service Worker registration skipped:', err);
      });
    });
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  auth.init();
  bindAuthEvents();
  bindGlobalAppEvents();
  registerPwa();

  // Hash shortcut support from manifest.json shortcuts
  const hashTab = window.location.hash.replace('#', '');
  const validTabs = new Set(['workouts', 'goals', 'evolution', 'charts', 'nutrition', 'spotify', 'admin']);
  if (validTabs.has(hashTab)) {
    activeTab = hashTab;
  }

  loadActiveSession();
});
