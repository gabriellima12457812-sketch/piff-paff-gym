/**
 * Piff Paff Gym — Spotify Integrado + Mini-Player Flutuante Persistente
 * Playlists prontas: Beast Mode, Gym Phonk, Eletrônica, Heavy Workout + Link Pessoal do Spotify.
 */

import { APP_CONFIG } from '../config.js';

let currentIframeSrc = '';

export function parseSpotifyLink(rawUrl) {
  const input = String(rawUrl || '').trim();
  if (!input) return null;

  // Formato URI: spotify:playlist:ID
  const uriMatch = input.match(/^spotify:(playlist|album|track|episode):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return { type: uriMatch[1], spotifyId: uriMatch[2] };
  }

  // Formato URL: https://open.spotify.com/playlist/ID?... (ou /intl-pt/playlist/ID)
  const urlMatch = input.match(
    /open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|track|episode)\/([a-zA-Z0-9]+)/i
  );
  if (urlMatch) {
    return { type: urlMatch[1].toLowerCase(), spotifyId: urlMatch[2] };
  }

  return null;
}

function getAllPlaylists(ctx) {
  const custom = ctx.data.spotify?.customPlaylists || [];
  return [...APP_CONFIG.SPOTIFY_PRESETS, ...custom];
}

function getActivePlaylist(ctx) {
  const all = getAllPlaylists(ctx);
  const activeId = ctx.data.spotify?.activePlaylistId || 'beast_mode';
  return all.find((p) => p.id === activeId) || all[0];
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
  if (subEl) subEl.textContent = active.vibe || 'Playlist Spotify';
  if (expandBtn) expandBtn.textContent = sp.miniPlayerExpanded ? 'Compactar' : 'Expandir';

  // Só troca o src se mudou de playlist (mantém reprodução contínua entre abas!)
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

  wrap.querySelectorAll('[data-mini-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ctx = getCtx();
      if (!ctx) return;
      ctx.data.spotify.activePlaylistId = btn.dataset.miniPreset;
      ctx.saveData();
      syncSpotifyMiniPlayer(ctx);
    });
  });
}

export function renderSpotifyTab(container, ctx) {
  const sp = ctx.data.spotify || { activePlaylistId: 'beast_mode', customPlaylists: [], miniPlayerOpen: false };
  const allPlaylists = getAllPlaylists(ctx);
  const active = getActivePlaylist(ctx);
  const embedUrl = buildEmbedUrl(active);

  container.innerHTML = `
    <div class="section-header-row">
      <div>
        <h2 class="section-title">Spotify Workout Hub</h2>
        <p class="section-subtitle">Escolha uma playlist curada ou cole seu link pessoal do Spotify. Ative o Mini-Player Flutuante para treinar sem parar a música.</p>
      </div>
      <button class="btn ${sp.miniPlayerOpen ? 'btn-gold' : 'btn-emerald'}" id="btn-toggle-mini-player">
        ${sp.miniPlayerOpen ? '✓ Mini-Player Ativo no Treino' : '🎧 Fixar Mini-Player Flutuante'}
      </button>
    </div>

    <div class="spotify-presets-grid mb-24">
      ${allPlaylists
        .map((pl) => {
          const isActive = pl.id === active.id;
          const isCustom = !APP_CONFIG.SPOTIFY_PRESETS.some((p) => p.id === pl.id);
          return `
            <div class="spotify-card ${isActive ? 'active' : ''}" data-select-sp="${pl.id}">
              <div class="spotify-card-top">
                <span class="pill ${isActive ? 'pill-emerald' : 'pill-neutral'}">${isCustom ? 'Pessoal' : 'Curada'}</span>
                ${isCustom ? `<button class="icon-mini-del" data-del-sp="${pl.id}" title="Remover playlist">×</button>` : ''}
              </div>
              <h3 class="spotify-name">${escapeHtml(pl.name)}</h3>
              <p class="spotify-vibe">${escapeHtml(pl.vibe || 'Link pessoal do Spotify')}</p>
              <span class="spotify-cta">${isActive ? '● Tocando / Selecionada' : 'Carregar no Player →'}</span>
            </div>
          `;
        })
        .join('')}
    </div>

    <div class="two-col-grid">
      <section class="card">
        <div class="card-header-flex">
          <div>
            <h3 class="card-title">🎵 Player Ativo: ${escapeHtml(active.name)}</h3>
            <p class="card-sub">Dica: clique em <strong>Fixar Mini-Player Flutuante</strong> para continuar ouvindo enquanto marca suas séries.</p>
          </div>
          <a href="${escapeHtml(active.url || `https://open.spotify.com/${active.type}/${active.spotifyId}`)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-ghost">Abrir no App ↗</a>
        </div>
        <div class="spotify-embed-box">
          <iframe
            style="border-radius:14px"
            src="${embedUrl}"
            width="100%"
            height="352"
            frameborder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
        </div>
      </section>

      <section class="card">
        <h3 class="card-title">🔗 Colar Link Pessoal do Spotify</h3>
        <p class="card-sub mb-16">Cole qualquer URL de playlist, álbum ou música do Spotify. Fica salvo exclusivamente no seu UID.</p>

        <form id="form-add-spotify" class="modal-form">
          <div class="form-field">
            <label>Nome da Playlist</label>
            <input type="text" name="name" required placeholder="Ex: Meu Treino de Pernas Insano" />
          </div>
          <div class="form-field">
            <label>Link do Spotify</label>
            <input type="url" name="url" required placeholder="https://open.spotify.com/playlist/..." />
          </div>
          <button type="submit" class="btn btn-emerald btn-full">Salvar & Tocar Playlist</button>
        </form>

        <div class="divider"></div>
        <div class="mini-info-box">
          <strong>Como usar durante o treino:</strong>
          <p>Ative o <strong>Mini-Player Flutuante</strong> no topo desta página ou pelo botão <em>🎵 Spotify</em> dentro da tela de Treinos. Ele acompanha você em todas as abas!</p>
        </div>
      </section>
    </div>
  `;

  // Eventos
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
      if (ctx.data.spotify.activePlaylistId === id) {
        ctx.data.spotify.activePlaylistId = 'beast_mode';
      }
      ctx.saveData();
      syncSpotifyMiniPlayer(ctx);
      ctx.toast('Playlist pessoal removida.');
      renderSpotifyTab(container, ctx);
    });
  });

  container.querySelector('#form-add-spotify')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = String(fd.get('name')).trim();
    const url = String(fd.get('url')).trim();
    const parsed = parseSpotifyLink(url);

    if (!parsed) {
      return ctx.toast('Link inválido. Cole um link completo do Spotify (open.spotify.com/playlist/...).', 'error');
    }

    const newPl = {
      id: `sp_custom_${Date.now()}`,
      name,
      vibe: 'Playlist Pessoal',
      type: parsed.type,
      spotifyId: parsed.spotifyId,
      url,
    };

    ctx.data.spotify.customPlaylists = [newPl, ...(ctx.data.spotify.customPlaylists || [])];
    ctx.data.spotify.activePlaylistId = newPl.id;
    ctx.data.spotify.miniPlayerOpen = true;
    ctx.saveData();
    syncSpotifyMiniPlayer(ctx);
    ctx.toast('Playlist pessoal conectada e carregada!', 'success');
    renderSpotifyTab(container, ctx);
  });
}
