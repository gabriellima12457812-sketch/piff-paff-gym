/**
 * Piff Paff Gym — Integração Oficial Spotify + Mini-Player Flutuante
 * Visual oficial Spotify (#1DB954), playlists curadas, link pessoal e abertura direta no App Spotify.
 */

import { APP_CONFIG } from '../config.js';

let spView = 'playlists'; // 'playlists' | 'link'
let currentIframeSrc = '';

const SPOTIFY_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.713 1.115a.623.623 0 0 1 .206.857zm1.224-2.723a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.452-1.493c3.632-1.102 8.147-.568 11.234 1.329a.78.78 0 0 1 .255 1.073zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 1 1-.543-1.794c3.532-1.072 9.404-.865 13.115 1.338a.937.937 0 0 1-.954 1.612z"/></svg>`;

export function parseSpotifyLink(rawUrl) {
  const input = String(rawUrl || '').trim();
  if (!input) return null;

  const uriMatch = input.match(/^spotify:(playlist|album|track|episode):([a-zA-Z0-9]+)/);
  if (uriMatch) return { type: uriMatch[1], spotifyId: uriMatch[2] };

  const urlMatch = input.match(
    /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|track|episode)\/([a-zA-Z0-9]+)/i
  );
  if (urlMatch) return { type: urlMatch[1].toLowerCase(), spotifyId: urlMatch[2] };
  return null;
}

function getAllPlaylists(ctx) {
  return [...APP_CONFIG.SPOTIFY_PRESETS, ...(ctx.data.spotify?.customPlaylists || [])];
}

function getActivePlaylist(ctx) {
  const all = getAllPlaylists(ctx);
  return all.find((p) => p.id === (ctx.data.spotify?.activePlaylistId || 'beast_mode')) || all[0];
}

function buildEmbedUrl(playlist) {
  return `https://open.spotify.com/embed/${playlist.type || 'playlist'}/${playlist.spotifyId}?utm_source=generator&theme=0`;
}

function buildOpenUrl(playlist) {
  return playlist.url || `https://open.spotify.com/${playlist.type || 'playlist'}/${playlist.spotifyId}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function syncSpotifyMiniPlayer(ctx) {
  const wrap = document.getElementById('spotify-mini-player');
  if (!wrap) return;

  if (!ctx?.user || !ctx?.data?.spotify?.miniPlayerOpen) {
    wrap.classList.add('hidden');
    return;
  }

  const sp = ctx.data.spotify;
  const active = getActivePlaylist(ctx);
  const embedUrl = buildEmbedUrl(active);
  const openUrl = buildOpenUrl(active);

  wrap.classList.remove('hidden');
  wrap.classList.toggle('expanded', Boolean(sp.miniPlayerExpanded));

  const titleEl = wrap.querySelector('#mini-sp-title');
  const subEl = wrap.querySelector('#mini-sp-sub');
  const expandBtn = wrap.querySelector('#mini-sp-expand');
  const openAppLink = wrap.querySelector('#mini-sp-open-app');
  const iframe = wrap.querySelector('#mini-sp-iframe');

  if (titleEl) titleEl.textContent = active.name;
  if (subEl) subEl.textContent = active.vibe || 'Spotify Oficial';
  if (expandBtn) expandBtn.textContent = sp.miniPlayerExpanded ? '▼' : '▲';
  if (openAppLink) openAppLink.href = openUrl;

  if (iframe && currentIframeSrc !== embedUrl) {
    iframe.src = embedUrl;
    currentIframeSrc = embedUrl;
  }
}

export function bindGlobalMiniPlayerControls(getCtx) {
  const wrap = document.getElementById('spotify-mini-player');
  if (!wrap || wrap.dataset.bound === '1') return;
  wrap.dataset.bound = '1';

  wrap.querySelector('#mini-sp-expand')?.addEventListener('click', () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.data.spotify.miniPlayerExpanded = !ctx.data.spotify.miniPlayerExpanded;
    ctx.saveData();
    syncSpotifyMiniPlayer(ctx);
  });

  wrap.querySelector('#mini-sp-close')?.addEventListener('click', () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.data.spotify.miniPlayerOpen = false;
    ctx.saveData();
    syncSpotifyMiniPlayer(ctx);
  });
}

export function renderSpotifyTab(container, ctx) {
  const sp = ctx.data.spotify || { activePlaylistId: 'beast_mode', customPlaylists: [], miniPlayerOpen: false };
  const allPlaylists = getAllPlaylists(ctx);
  const active = getActivePlaylist(ctx);
  const embedUrl = buildEmbedUrl(active);
  const openUrl = buildOpenUrl(active);

  container.innerHTML = `
    <div class="screen-enter">
      <div class="spotify-brand-head mb-16">
        <div class="spotify-logo-badge">${SPOTIFY_SVG}</div>
        <div>
          <h1 class="screen-title">Spotify</h1>
          <p class="screen-sub">Player oficial do Spotify com playlists de treino e link pessoal.</p>
        </div>
      </div>

      <div class="action-pair-row mb-12">
        <button class="btn ${sp.miniPlayerOpen ? 'btn-gold' : 'btn-spotify'} flex-1" id="btn-toggle-mini-player">
          ${sp.miniPlayerOpen ? '✓ Mini-Player Ativo' : 'Fixar Mini-Player no Treino'}
        </button>
        <a href="${escapeHtml(openUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost">
          App ↗
        </a>
      </div>

      <div class="segmented-control full-seg mb-16">
        <button class="seg-btn ${spView === 'playlists' ? 'active' : ''}" data-spview="playlists">Playlists Spotify</button>
        <button class="seg-btn ${spView === 'link' ? 'active' : ''}" data-spview="link">+ Minha Playlist</button>
      </div>

      ${
        spView === 'playlists'
          ? `
            <!-- Player Oficial Completo do Spotify -->
            <section class="spotify-embed-card mb-16">
              <div class="spotify-embed-top">
                <span class="spotify-live-tag">${SPOTIFY_SVG} ${escapeHtml(active.name)}</span>
                <a href="${escapeHtml(openUrl)}" target="_blank" rel="noopener noreferrer" class="spotify-ext-link">Abrir no App Spotify ↗</a>
              </div>
              <iframe
                style="border-radius:14px"
                src="${embedUrl}"
                width="100%"
                height="352"
                frameborder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
              <p class="hint-line mt-8">Para tocar faixas inteiras sem prévia de 30s no celular, mantenha login ativo no Spotify ou toque em <strong>Abrir no App Spotify ↗</strong>.</p>
            </section>

            <div class="mini-eyebrow mb-8">ESCOLHER PLAYLIST</div>
            <div class="stack-8">
              ${allPlaylists
                .map((pl) => {
                  const isActive = pl.id === active.id;
                  const isCustom = !APP_CONFIG.SPOTIFY_PRESETS.some((p) => p.id === pl.id);
                  return `
                    <div class="sp-row-item ${isActive ? 'active' : ''}" data-select-sp="${pl.id}">
                      <div class="sp-row-left">
                        <span class="sp-brand-icon">${SPOTIFY_SVG}</span>
                        <div>
                          <strong>${escapeHtml(pl.name)}</strong>
                          <span>${escapeHtml(pl.vibe || 'Playlist Pessoal do Spotify')}</span>
                        </div>
                      </div>
                      ${isCustom ? `<button class="icon-mini-del" data-del-sp="${pl.id}">×</button>` : `<span class="nav-row-chevron">›</span>`}
                    </div>
                  `;
                })
                .join('')}
            </div>
          `
          : `
            <section class="card">
              <h3 class="card-title mb-4">Conectar Sua Playlist do Spotify</h3>
              <p class="card-sub mb-16">No app Spotify, toque em <strong>Compartilhar → Copiar link</strong> da sua playlist, álbum ou música e cole abaixo.</p>
              <form id="form-add-spotify" class="modal-form">
                <div class="form-field">
                  <label>Nome da Playlist</label>
                  <input type="text" name="name" required placeholder="Ex: Meu Treino Insano" />
                </div>
                <div class="form-field">
                  <label>Link Oficial do Spotify</label>
                  <input type="url" name="url" required placeholder="https://open.spotify.com/playlist/..." />
                </div>
                <button type="submit" class="btn btn-spotify btn-full btn-lg">Conectar & Tocar no Spotify</button>
              </form>
            </section>
          `
      }
    </div>
  `;

  container.querySelectorAll('[data-spview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      spView = btn.dataset.spview;
      renderSpotifyTab(container, ctx);
    });
  });

  container.querySelector('#btn-toggle-mini-player')?.addEventListener('click', () => {
    ctx.data.spotify.miniPlayerOpen = !ctx.data.spotify.miniPlayerOpen;
    ctx.saveData();
    syncSpotifyMiniPlayer(ctx);
    renderSpotifyTab(container, ctx);
  });

  container.querySelectorAll('[data-select-sp]').forEach((card) => {
    card.addEventListener('click', () => {
      ctx.data.spotify.activePlaylistId = card.dataset.selectSp;
      ctx.saveData();
      syncSpotifyMiniPlayer(ctx);
      renderSpotifyTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-del-sp]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.delSp;
      ctx.data.spotify.customPlaylists = (ctx.data.spotify.customPlaylists || []).filter((p) => p.id !== id);
      if (ctx.data.spotify.activePlaylistId === id) ctx.data.spotify.activePlaylistId = 'beast_mode';
      ctx.saveData();
      syncSpotifyMiniPlayer(ctx);
      ctx.toast('Playlist removida.');
      renderSpotifyTab(container, ctx);
    });
  });

  container.querySelector('#form-add-spotify')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const parsed = parseSpotifyLink(fd.get('url'));
    if (!parsed) return ctx.toast('Cole um link válido do Spotify (open.spotify.com/...).', 'error');

    const newPl = {
      id: `sp_custom_${Date.now()}`,
      name: String(fd.get('name')).trim(),
      vibe: 'Playlist Pessoal do Spotify',
      type: parsed.type,
      spotifyId: parsed.spotifyId,
      url: String(fd.get('url')).trim(),
    };
    ctx.data.spotify.customPlaylists = [newPl, ...(ctx.data.spotify.customPlaylists || [])];
    ctx.data.spotify.activePlaylistId = newPl.id;
    ctx.data.spotify.miniPlayerOpen = true;
    ctx.saveData();
    spView = 'playlists';
    syncSpotifyMiniPlayer(ctx);
    ctx.toast('Playlist do Spotify conectada!', 'success');
    renderSpotifyTab(container, ctx);
  });
}
