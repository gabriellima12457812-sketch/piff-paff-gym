/**
 * Piff Paff Gym — Spotify Integrado + Mini-Player Flutuante (Estilo Mobile Minimalista)
 * Sub-telas limpas: [Playlists] | [Colar Link Pessoal]
 */

import { APP_CONFIG } from '../config.js';

let spView = 'playlists'; // 'playlists' | 'link'
let currentIframeSrc = '';

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

  wrap.classList.remove('hidden');
  wrap.classList.toggle('expanded', Boolean(sp.miniPlayerExpanded));

  const titleEl = wrap.querySelector('#mini-sp-title');
  const subEl = wrap.querySelector('#mini-sp-sub');
  const expandBtn = wrap.querySelector('#mini-sp-expand');
  const iframe = wrap.querySelector('#mini-sp-iframe');

  if (titleEl) titleEl.textContent = active.name;
  if (subEl) subEl.textContent = active.vibe || 'Spotify';
  if (expandBtn) expandBtn.textContent = sp.miniPlayerExpanded ? '▼' : '▲';

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

  container.innerHTML = `
    <div class="screen-enter">
      <div class="screen-head">
        <h1 class="screen-title">Música</h1>
        <p class="screen-sub">Trilha do treino com Mini-Player flutuante.</p>
      </div>

      <button class="btn ${sp.miniPlayerOpen ? 'btn-gold' : 'btn-emerald'} btn-full mb-12" id="btn-toggle-mini-player">
        ${sp.miniPlayerOpen ? '✓ Mini-Player Ativo Durante Treinos' : '🎧 Fixar Mini-Player Flutuante'}
      </button>

      <div class="segmented-control full-seg mb-16">
        <button class="seg-btn ${spView === 'playlists' ? 'active' : ''}" data-spview="playlists">Playlists</button>
        <button class="seg-btn ${spView === 'link' ? 'active' : ''}" data-spview="link">+ Link Pessoal</button>
      </div>

      ${
        spView === 'playlists'
          ? `
            <div class="stack-8 mb-16">
              ${allPlaylists
                .map((pl) => {
                  const isActive = pl.id === active.id;
                  const isCustom = !APP_CONFIG.SPOTIFY_PRESETS.some((p) => p.id === pl.id);
                  return `
                    <div class="sp-row-item ${isActive ? 'active' : ''}" data-select-sp="${pl.id}">
                      <div class="sp-row-left">
                        <span class="sp-play-dot">${isActive ? '●' : '♪'}</span>
                        <div>
                          <strong>${escapeHtml(pl.name)}</strong>
                          <span>${escapeHtml(pl.vibe || 'Playlist Pessoal')}</span>
                        </div>
                      </div>
                      ${isCustom ? `<button class="icon-mini-del" data-del-sp="${pl.id}">×</button>` : `<span class="nav-row-chevron">›</span>`}
                    </div>
                  `;
                })
                .join('')}
            </div>

            <section class="card">
              <div class="mini-eyebrow mb-8">TOCANDO AGORA · ${escapeHtml(active.name)}</div>
              <iframe
                style="border-radius:12px"
                src="${embedUrl}"
                width="100%"
                height="240"
                frameborder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            </section>
          `
          : `
            <section class="card">
              <h3 class="card-title mb-4">Colar Link do Spotify</h3>
              <p class="card-sub mb-16">Cole o link da sua playlist, álbum ou faixa. Salvo isoladamente no seu UID.</p>
              <form id="form-add-spotify" class="modal-form">
                <div class="form-field">
                  <label>Nome</label>
                  <input type="text" name="name" required placeholder="Ex: Meu Treino Pesado" />
                </div>
                <div class="form-field">
                  <label>Link do Spotify</label>
                  <input type="url" name="url" required placeholder="https://open.spotify.com/playlist/..." />
                </div>
                <button type="submit" class="btn btn-emerald btn-full btn-lg">Salvar & Ouvir</button>
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
    if (!parsed) return ctx.toast('Link do Spotify inválido.', 'error');

    const newPl = {
      id: `sp_custom_${Date.now()}`,
      name: String(fd.get('name')).trim(),
      vibe: 'Playlist Pessoal',
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
    ctx.toast('Playlist pessoal salva!', 'success');
    renderSpotifyTab(container, ctx);
  });
}
