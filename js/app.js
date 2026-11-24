/**
 * Piff Paff Gym — Mobile Minimalist App Controller
 * 5 Abas Limpas na Barra Inferior: Treino · Progresso · Nutrição · Música · Perfil
 * Cada funcionalidade abre em sua própria tela limpa e didática.
 */

import { APP_CONFIG, getRankForScore } from './config.js';
import { storage } from './storage.js';
import { auth } from './auth.js';
import {
  renderWorkoutsTab,
  resetWorkoutRuntime,
  invalidateActiveSession,
} from './modules/workout-engine.js';
import { renderAtlasTab } from './modules/atlas.js';
import { stopAllDemoVideos } from './modules/exercise-demo.js';
import {
  renderProgressTab,
  resetProgressScreen,
  setProgressScreen,
} from './modules/progress-hub.js';
import { renderNutritionTab } from './modules/nutrition.js';
import {
  renderSpotifyTab,
  syncSpotifyMiniPlayer,
  bindGlobalMiniPlayerControls,
} from './modules/spotify.js';
import {
  renderProfileTab,
  resetProfileScreen,
  setProfileScreen,
} from './modules/profile.js';

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
  }, 3000);
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
  if (typeof onMount === 'function') onMount(bodyEl);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

function triggerPwaInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') showToast('Piff Paff Gym instalado!', 'success');
      deferredInstallPrompt = null;
    });
    return;
  }

  openModal(
    'Instalar via Perfil (iPhone / iPad)',
    `
      <div class="pwa-guide-modal">
        <div class="pwa-guide-block">
          <strong>🍎 Instalação Direta por Perfil iOS (.mobileconfig)</strong>
          <ol>
            <li>Toque no botão verde abaixo e selecione <strong>Permitir</strong> para baixar o perfil do Piff Paff Gym.</li>
            <li>Abra <strong>Ajustes</strong> no iPhone → toque em <strong>Perfil Baixado</strong> (no topo).</li>
            <li>Toque em <strong>Instalar</strong> → digite seu código → pronto! O app aparece em tela cheia na tela inicial.</li>
          </ol>
        </div>
        <a
          href="./assets/piff-paff-gym.mobileconfig"
          download="Piff-Paff-Gym.mobileconfig"
          class="btn btn-emerald btn-full btn-lg"
          id="btn-download-ios-profile"
        >
          🍎 Baixar Perfil de Instalação (iOS)
        </a>
        <div class="pwa-guide-block">
          <strong>🤖 Android (Chrome)</strong>
          <p class="hint-line">No Chrome do Android, toque em <strong>⋮ → Instalar aplicativo</strong>.</p>
        </div>
      </div>
    `
  );
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
      renderTopBar();
    },
    setQuickLocation(loc) {
      if (!activeUser) return;
      activeUser = { ...activeUser, location: loc };
      storage.upsertUser(activeUser);
      invalidateActiveSession();
      renderTopBar();
      renderActiveTab();
      showToast(`Local: ${APP_CONFIG.LOCATIONS[loc].label}`, 'success');
    },
    setQuickLevel(lvl) {
      if (!activeUser) return;
      activeUser = { ...activeUser, level: lvl };
      storage.upsertUser(activeUser);
      invalidateActiveSession();
      document.body.classList.toggle('theme-pro', activeUser.level === 'pro' || activeUser.role === 'admin');
      renderTopBar();
      renderBottomNav();
      renderActiveTab();
      showToast(
        lvl === 'pro'
          ? 'Atleta Pro ativo! FST-7, Rest-Pause e Drop-Set liberados.'
          : `Nível: ${APP_CONFIG.LEVELS[lvl].label}`,
        'success'
      );
    },
    refreshHeader() {
      renderTopBar();
    },
    triggerPwaInstall,
    logout() {
      auth.logout();
      resetWorkoutRuntime();
      resetProgressScreen();
      resetProfileScreen();
      showToast('Sessão encerrada.');
      loadActiveSession();
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
      resetProgressScreen();
      resetProfileScreen();
      loadActiveSession(targetTab);
    },
  };
}

function loadActiveSession(preferredTab = null, subScreen = null) {
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

  if (preferredTab) activeTab = preferredTab;
  if (preferredTab === 'profile' && subScreen === 'admin' && activeUser.role === 'admin') {
    setProfileScreen('admin');
  } else if (preferredTab === 'progress' && subScreen) {
    setProgressScreen(subScreen);
  }

  document.body.classList.toggle('theme-pro', activeUser.level === 'pro' || activeUser.role === 'admin');

  syncImpersonateBanner();
  renderTopBar();
  renderBottomNav();
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
      txt.innerHTML = `<strong>IMPERSONATE</strong> · ${activeUser.name} (@${activeUser.username})`;
    }
  } else {
    banner.classList.add('hidden');
    document.body.classList.remove('has-impersonate-bar');
  }
}

function renderTopBar() {
  if (!activeUser || !activeData) return;
  const rank = getRankForScore(activeData.gamification?.score || 0);
  const scoreChip = document.getElementById('header-score-chip');
  if (scoreChip) {
    scoreChip.innerHTML = `
      <span class="score-chip-dot" style="background:${rank.current.color}"></span>
      <strong>${Number(activeData.gamification?.score || 0).toLocaleString('pt-BR')} pts</strong>
    `;
  }
}

function renderBottomNav() {
  const isAdmin = activeUser?.role === 'admin';
  const items = [
    { id: 'workouts', label: 'Treino', icon: '⚡' },
    { id: 'atlas', label: 'Atlas', icon: '🧍' },
    { id: 'progress', label: 'Progresso', icon: '📈' },
    { id: 'nutrition', label: 'Nutrição', icon: '💧' },
    { id: 'profile', label: isAdmin ? 'Admin' : 'Perfil', icon: isAdmin ? '👑' : '👤', isAdmin },
  ];

  const mobileNav = document.getElementById('mobile-bottom-nav');
  if (!mobileNav) return;

  mobileNav.innerHTML = items
    .map(
      (it) => `
      <button class="mob-nav-item ${activeTab === it.id ? 'active' : ''} ${it.isAdmin ? 'mob-nav-admin' : ''}" data-nav="${it.id}">
        <span class="mob-nav-icon">${it.icon}</span>
        <span class="mob-nav-lbl">${it.label}</span>
      </button>
    `
    )
    .join('');

  mobileNav.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      // Ao tocar na aba já ativa, retorna à tela raiz daquela aba (comportamento iOS/Android)
      if (target === activeTab) {
        if (target === 'workouts') resetWorkoutRuntime();
        if (target === 'progress') resetProgressScreen();
        if (target === 'profile') resetProfileScreen();
      }
      activeTab = target;
      renderBottomNav();
      renderActiveTab();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderActiveTab() {
  const container = document.getElementById('main-view');
  if (!container || !activeUser || !activeData) return;

  stopAllDemoVideos();
  const ctx = buildContext();
  const topSpBtn = document.getElementById('topbar-spotify-btn');
  if (topSpBtn) topSpBtn.classList.toggle('active', activeTab === 'spotify');

  switch (activeTab) {
    case 'workouts':
      renderWorkoutsTab(container, ctx);
      break;
    case 'atlas':
      renderAtlasTab(container, ctx);
      break;
    case 'progress':
      renderProgressTab(container, ctx);
      break;
    case 'nutrition':
      renderNutritionTab(container, ctx);
      break;
    case 'spotify':
      renderSpotifyTab(container, ctx);
      break;
    case 'profile':
      renderProfileTab(container, ctx);
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
    authErr.textContent = msg || '';
    authErr.classList.toggle('hidden', !msg);
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
    showToast(`Bem-vindo, ${res.user.name}!`, 'success');
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
    showToast('Conta gratuita criada!', 'success');
    loadActiveSession('workouts');
  });

  document.getElementById('btn-focus-admin-login')?.addEventListener('click', () => {
    tabLogin?.click();
    const idInput = document.getElementById('login-id');
    const passInput = document.getElementById('login-pass');
    if (idInput) {
      idInput.value = '';
      idInput.placeholder = 'Digite o login ou e-mail do Admin';
      idInput.focus();
    }
    if (passInput) passInput.value = '';
    showToast('Acesso restrito: digite e-mail/usuário e senha do Admin.');
  });

  document.querySelectorAll('[data-demo-login]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [u, p] = btn.dataset.demoLogin.split(':');
      const res = auth.login(u, p);
      if (!res.ok) return showAuthErr(res.error);
      showAuthErr('');
      showToast(`Entrou como ${res.user.name}`, 'success');
      loadActiveSession('workouts');
    });
  });
}

function bindGlobalEvents() {
  document.getElementById('btn-exit-impersonate')?.addEventListener('click', () => {
    const res = auth.exitImpersonation();
    if (res.ok) {
      resetWorkoutRuntime();
      resetProgressScreen();
      showToast('Voltou para Admin Master.', 'success');
      loadActiveSession('profile', 'admin');
    }
  });

  document.getElementById('topbar-spotify-btn')?.addEventListener('click', () => {
    if (!activeUser) return;
    activeTab = activeTab === 'spotify' ? 'workouts' : 'spotify';
    renderBottomNav();
    renderActiveTab();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('header-score-chip')?.addEventListener('click', () => {
    if (!activeUser) return;
    activeTab = 'progress';
    setProgressScreen('goals');
    renderBottomNav();
    renderActiveTab();
  });

  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  bindGlobalMiniPlayerControls(() => (activeUser && activeData ? buildContext() : null));
}

function showPwaUpdateBanner() {
  const banner = document.getElementById('pwa-update-banner');
  if (!banner) return;
  banner.classList.remove('hidden');
  requestAnimationFrame(() => banner.classList.add('show'));

  const btn = banner.querySelector('#btn-pwa-reload-now');
  if (btn) {
    btn.onclick = () => {
      window.location.reload();
    };
  }
}

function registerPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });

  if ('serviceWorker' in navigator) {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      showPwaUpdateBanner();
    });

    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('./sw.js');

        // Se já houver nova versão aguardando
        if (reg.waiting && navigator.serviceWorker.controller) {
          showPwaUpdateBanner();
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showPwaUpdateBanner();
            }
          });
        });

        // Verifica atualizações sempre que o usuário voltar para o app instalado
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            reg.update().catch(() => {});
          }
        });
      } catch {
        // SW opcional em ambientes locais sem HTTPS
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  auth.init();
  bindAuthEvents();
  bindGlobalEvents();
  registerPwa();

  const hash = window.location.hash.replace('#', '');
  if (hash === 'evolution') {
    activeTab = 'progress';
    setProgressScreen('evolution');
  } else if (hash === 'nutrition') {
    activeTab = 'nutrition';
  } else if (hash === 'workouts') {
    activeTab = 'workouts';
  }

  loadActiveSession();
});
