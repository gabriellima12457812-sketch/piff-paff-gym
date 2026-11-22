/**
 * Piff Paff Gym — Evolução Física
 * - Upload gratuito de fotos com compressão Canvas automática
 * - Guia Prático de Fotos
 * - Comparador Antes vs. Depois (Lado a Lado + Slider) com diferença de peso
 * - Gerador de Card 9:16 (1080x1920) para Instagram Stories
 */

import { APP_CONFIG } from '../config.js';
import {
  generateStoryCardCanvas,
  shareOrDownloadStoryCard,
  downloadCanvasPng,
} from './story-card.js';

let selectedBeforeId = null;
let selectedAfterId = null;
let compareMode = 'side'; // 'side' | 'slider'
let sliderPercent = 50;
let showGuide = false;

function compressImageFile(file, maxDim = 1080, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo não é uma imagem válida.'));
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const c = canvas.getContext('2d');
        c.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateBr(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function renderEvolutionTab(container, ctx) {
  const photos = [...(ctx.data.evolutionPhotos || [])].sort((a, b) => a.date.localeCompare(b.date));

  if (photos.length >= 2) {
    if (!selectedBeforeId || !photos.some((p) => p.id === selectedBeforeId)) {
      selectedBeforeId = photos[0].id;
    }
    if (!selectedAfterId || !photos.some((p) => p.id === selectedAfterId)) {
      selectedAfterId = photos[photos.length - 1].id;
    }
  } else {
    selectedBeforeId = photos[0]?.id || null;
    selectedAfterId = photos[0]?.id || null;
  }

  const beforePhoto = photos.find((p) => p.id === selectedBeforeId) || photos[0] || null;
  const afterPhoto = photos.find((p) => p.id === selectedAfterId) || photos[photos.length - 1] || null;

  const deltaKg =
    beforePhoto && afterPhoto
      ? Math.round((Number(afterPhoto.weightKg) - Number(beforePhoto.weightKg)) * 10) / 10
      : 0;
  const daysElapsed =
    beforePhoto && afterPhoto
      ? Math.max(
          0,
          Math.round(
            (new Date(afterPhoto.date).getTime() - new Date(beforePhoto.date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  container.innerHTML = `
    <div class="section-header-row">
      <div>
        <h2 class="section-title">Evolução Física</h2>
        <p class="section-subtitle">Upload gratuito com compressão inteligente, comparador Antes vs. Depois e Card 9:16 para Instagram Stories.</p>
      </div>
      <div class="header-action-group">
        <button class="btn btn-ghost" id="btn-toggle-photo-guide">
          ${showGuide ? 'Ocultar Guia de Fotos' : '📷 Guia Prático de Fotos'}
        </button>
        <button class="btn btn-emerald" id="btn-upload-photo">+ Nova Foto</button>
      </div>
    </div>

    ${showGuide ? renderPhotoGuideCard() : ''}

    <!-- Comparador Antes vs. Depois -->
    <section class="card mb-24">
      <div class="card-header-flex">
        <div>
          <h3 class="card-title">Comparador Antes vs. Depois</h3>
          <p class="card-sub">Selecione dois registros para ver a diferença real de peso e gerar seu card 9:16.</p>
        </div>
        <div class="segmented-control">
          <button class="seg-btn ${compareMode === 'side' ? 'active' : ''}" data-cmode="side">Lado a Lado</button>
          <button class="seg-btn ${compareMode === 'slider' ? 'active' : ''}" data-cmode="slider">Slider</button>
        </div>
      </div>

      ${
        photos.length < 2
          ? `<div class="empty-inline">Adicione pelo menos <strong>2 fotos de evolução</strong> para ativar o comparador Antes vs. Depois e o gerador de Card 9:16.</div>`
          : `
            <div class="compare-selectors">
              <div class="form-field">
                <label>Foto ANTES</label>
                <select id="select-before-photo">
                  ${photos
                    .map(
                      (p) =>
                        `<option value="${p.id}" ${p.id === beforePhoto.id ? 'selected' : ''}>${formatDateBr(p.date)} — ${p.weightKg}kg (${escapeHtml(p.pose)})</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div class="form-field">
                <label>Foto DEPOIS</label>
                <select id="select-after-photo">
                  ${photos
                    .map(
                      (p) =>
                        `<option value="${p.id}" ${p.id === afterPhoto.id ? 'selected' : ''}>${formatDateBr(p.date)} — ${p.weightKg}kg (${escapeHtml(p.pose)})</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>

            <div class="compare-delta-strip">
              <div class="delta-pill ${deltaKg <= 0 ? 'delta-emerald' : 'delta-gold'}">
                Diferença de Peso: <strong>${deltaKg > 0 ? '+' : ''}${deltaKg.toFixed(1)} kg</strong>
              </div>
              <div class="delta-pill">Intervalo: <strong>${daysElapsed} dias</strong></div>
              ${
                beforePhoto.bodyFatPct && afterPhoto.bodyFatPct
                  ? `<div class="delta-pill">BF%: <strong>${beforePhoto.bodyFatPct}% → ${afterPhoto.bodyFatPct}%</strong></div>`
                  : ''
              }
              <button class="btn btn-gold btn-sm ml-auto" id="btn-generate-story-card">
                ✨ Gerar Card 9:16 (Stories)
              </button>
            </div>

            ${
              compareMode === 'side'
                ? `
                  <div class="compare-side-grid">
                    <div class="compare-frame">
                      <span class="compare-tag">ANTES · ${formatDateBr(beforePhoto.date)}</span>
                      <img src="${beforePhoto.dataUrl}" alt="Foto Antes" />
                      <div class="compare-caption">
                        <strong>${beforePhoto.weightKg} kg</strong>
                        <span>${escapeHtml(beforePhoto.note || beforePhoto.pose)}</span>
                      </div>
                    </div>
                    <div class="compare-frame compare-frame-after">
                      <span class="compare-tag compare-tag-after">DEPOIS · ${formatDateBr(afterPhoto.date)}</span>
                      <img src="${afterPhoto.dataUrl}" alt="Foto Depois" />
                      <div class="compare-caption">
                        <strong class="text-emerald">${afterPhoto.weightKg} kg</strong>
                        <span>${escapeHtml(afterPhoto.note || afterPhoto.pose)}</span>
                      </div>
                    </div>
                  </div>
                `
                : `
                  <div class="slider-compare-wrap" id="slider-compare-wrap">
                    <img class="slider-img-base" src="${afterPhoto.dataUrl}" alt="Depois" />
                    <img
                      class="slider-img-before-clip"
                      id="slider-img-overlay"
                      src="${beforePhoto.dataUrl}"
                      alt="Antes"
                      style="clip-path: inset(0 ${100 - sliderPercent}% 0 0)"
                    />
                    <div class="slider-divider" id="slider-divider" style="left:${sliderPercent}%">
                      <div class="slider-knob">⇄</div>
                    </div>
                    <span class="compare-tag">ANTES (${beforePhoto.weightKg}kg)</span>
                    <span class="compare-tag compare-tag-after" style="left:auto;right:12px;">DEPOIS (${afterPhoto.weightKg}kg)</span>
                    <input type="range" min="5" max="95" value="${sliderPercent}" id="compare-range-input" class="slider-range-overlay" />
                  </div>
                `
            }
          `
      }
    </section>

    <!-- Galeria de Check-ins -->
    <section class="card">
      <div class="card-header-flex">
        <h3 class="card-title">Linha do Tempo de Fotos (${photos.length})</h3>
        <span class="badge-sub">Armazenamento isolado por UID · Compressão automática</span>
      </div>

      ${
        photos.length === 0
          ? `<div class="empty-inline">Nenhuma foto enviada ainda. Clique em <strong>+ Nova Foto</strong> para iniciar sua linha do tempo.</div>`
          : `<div class="photo-gallery-grid">
              ${photos
                .slice()
                .reverse()
                .map(
                  (p) => `
                  <div class="gallery-card">
                    <img src="${p.dataUrl}" alt="Check-in ${formatDateBr(p.date)}" />
                    <div class="gallery-info">
                      <div class="gallery-top">
                        <strong>${p.weightKg} kg</strong>
                        <span class="pill pill-neutral">${escapeHtml(p.pose)}</span>
                      </div>
                      <div class="gallery-date">${formatDateBr(p.date)}${p.bodyFatPct ? ` · ${p.bodyFatPct}% BF` : ''}</div>
                      ${p.note ? `<p class="gallery-note">${escapeHtml(p.note)}</p>` : ''}
                      <button class="btn-link-danger" data-del-photo="${p.id}">Excluir</button>
                    </div>
                  </div>
                `
                )
                .join('')}
            </div>`
      }
    </section>
  `;

  bindEvolutionEvents(container, ctx, beforePhoto, afterPhoto);
}

function renderPhotoGuideCard() {
  return `
    <section class="card guide-card mb-24">
      <h3 class="card-title">📷 Guia Prático de Fotos de Evolução (Padrão Profissional)</h3>
      <div class="guide-grid">
        <div class="guide-step">
          <strong>1. Mesmo Horário (Jejum Matinal)</strong>
          <p>Tire as fotos ao acordar, após ir ao banheiro e antes de comer/beber. Elimina variação de retenção hídrica.</p>
        </div>
        <div class="guide-step">
          <strong>2. Iluminação Consistente</strong>
          <p>Use luz superior ou frontal suave no mesmo cômodo. Evite contraluz de janela que escurece a definição muscular.</p>
        </div>
        <div class="guide-step">
          <strong>3. Distância & Altura da Câmera</strong>
          <p>Apoie o celular a cerca de 2 metros na altura do umbigo (ou use temporizador de 10s). Sem ângulos de cima/baixo.</p>
        </div>
        <div class="guide-step">
          <strong>4. 3 Ângulos Padrão + Mesma Roupa</strong>
          <p>Registre <strong>Frente</strong>, <strong>Lateral</strong> e <strong>Costas</strong> relaxado e contraído usando a mesma roupa a cada 14–30 dias.</p>
        </div>
      </div>
    </section>
  `;
}

function bindEvolutionEvents(container, ctx, beforePhoto, afterPhoto) {
  container.querySelector('#btn-toggle-photo-guide')?.addEventListener('click', () => {
    showGuide = !showGuide;
    renderEvolutionTab(container, ctx);
  });

  container.querySelectorAll('[data-cmode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      compareMode = btn.dataset.cmode;
      renderEvolutionTab(container, ctx);
    });
  });

  container.querySelector('#select-before-photo')?.addEventListener('change', (e) => {
    selectedBeforeId = e.target.value;
    renderEvolutionTab(container, ctx);
  });

  container.querySelector('#select-after-photo')?.addEventListener('change', (e) => {
    selectedAfterId = e.target.value;
    renderEvolutionTab(container, ctx);
  });

  const range = container.querySelector('#compare-range-input');
  if (range) {
    range.addEventListener('input', () => {
      sliderPercent = Number(range.value);
      const ov = container.querySelector('#slider-img-overlay');
      const div = container.querySelector('#slider-divider');
      if (ov) ov.style.clipPath = `inset(0 ${100 - sliderPercent}% 0 0)`;
      if (div) div.style.left = `${sliderPercent}%`;
    });
  }

  // Excluir foto
  container.querySelectorAll('[data-del-photo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delPhoto;
      ctx.data.evolutionPhotos = (ctx.data.evolutionPhotos || []).filter((p) => p.id !== id);
      ctx.saveData();
      ctx.toast('Foto removida da linha do tempo.');
      renderEvolutionTab(container, ctx);
    });
  });

  // Upload nova foto com compressão Canvas
  container.querySelector('#btn-upload-photo')?.addEventListener('click', () => {
    const today = new Date().toISOString().slice(0, 10);
    const defaultW = ctx.data.bodyProfile?.weightKg || 75;
    const defaultBf = ctx.data.bodyProfile?.bodyFatPct || '';

    ctx.openModal(
      'Novo Check-in de Evolução Física',
      `
        <form id="form-upload-photo" class="modal-form">
          <div class="form-field">
            <label>Selecionar Foto (Compressão Automática)</label>
            <input type="file" name="photo" accept="image/*" required />
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>Data da Foto</label>
              <input type="date" name="date" required value="${today}" />
            </div>
            <div class="form-field">
              <label>Pose / Ângulo</label>
              <select name="pose">
                <option value="Frente">Frente</option>
                <option value="Lateral">Lateral</option>
                <option value="Costas">Costas</option>
                <option value="Duplo Bíceps">Duplo Bíceps</option>
                <option value="Livre">Livre</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>Peso no Dia (kg)</label>
              <input type="number" step="0.1" name="weightKg" required value="${defaultW}" />
            </div>
            <div class="form-field">
              <label>% Gordura (Opcional)</label>
              <input type="number" step="0.1" name="bodyFatPct" placeholder="Ex: 14.5" value="${defaultBf}" />
            </div>
          </div>
          <div class="form-field">
            <label>Observação (Opcional)</label>
            <input type="text" name="note" placeholder="Ex: Semana 8 — Jejum matinal" />
          </div>
          <button type="submit" class="btn btn-emerald btn-full">Comprimir & Salvar Foto (+40 pts)</button>
        </form>
      `,
      (modalBody) => {
        modalBody.querySelector('#form-upload-photo').addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const file = fd.get('photo');
          if (!file || !file.size) return ctx.toast('Selecione uma imagem.', 'error');

          try {
            const dataUrl = await compressImageFile(file, 1080, 0.78);
            const newPhoto = {
              id: `ph_${Date.now()}`,
              date: fd.get('date'),
              pose: fd.get('pose'),
              weightKg: Number(fd.get('weightKg')),
              bodyFatPct: fd.get('bodyFatPct') ? Number(fd.get('bodyFatPct')) : null,
              note: String(fd.get('note') || '').trim(),
              dataUrl,
            };
            ctx.data.evolutionPhotos = [...(ctx.data.evolutionPhotos || []), newPhoto];
            ctx.data.gamification.score =
              (Number(ctx.data.gamification.score) || 0) + APP_CONFIG.SCORING.PHOTO_CHECKIN;
            ctx.saveData();
            selectedAfterId = newPhoto.id;
            ctx.closeModal();
            ctx.refreshHeader();
            ctx.toast('Foto comprimida e salva! +40 pts no Score!', 'success');
            renderEvolutionTab(container, ctx);
          } catch (err) {
            ctx.toast(err.message || 'Erro ao processar imagem.', 'error');
          }
        });
      }
    );
  });

  // Gerar Card 9:16 (1080x1920) em Canvas
  container.querySelector('#btn-generate-story-card')?.addEventListener('click', async () => {
    if (!beforePhoto || !afterPhoto) return;
    try {
      const canvas = await generateStoryCardCanvas({
        beforePhoto,
        afterPhoto,
        user: ctx.user,
        gamification: ctx.data.gamification,
      });
      const previewUrl = canvas.toDataURL('image/png', 0.92);

      ctx.openModal(
        'Card 9:16 (1080×1920) — Instagram Stories',
        `
          <div class="story-modal-wrap">
            <img src="${previewUrl}" alt="Preview Card 9:16" class="story-preview-img" />
            <div class="story-modal-actions">
              <button class="btn btn-gold btn-full" id="btn-story-share">
                📤 Compartilhar nos Stories (Web Share)
              </button>
              <button class="btn btn-emerald btn-full" id="btn-story-download">
                ⬇ Baixar PNG Alta Resolução (1080×1920)
              </button>
            </div>
          </div>
        `,
        (modalBody) => {
          modalBody.querySelector('#btn-story-share')?.addEventListener('click', async () => {
            const res = await shareOrDownloadStoryCard(canvas);
            if (res.method === 'web_share') {
              ctx.toast('Card enviado para compartilhamento!', 'success');
            } else if (res.method === 'download') {
              ctx.toast('Navegador sem Web Share de arquivos: PNG baixado automaticamente!', 'success');
            }
          });
          modalBody.querySelector('#btn-story-download')?.addEventListener('click', () => {
            downloadCanvasPng(canvas);
            ctx.toast('PNG 1080×1920 baixado!', 'success');
          });
        }
      );
    } catch (err) {
      console.error(err);
      ctx.toast('Não foi possível gerar o Card 9:16.', 'error');
    }
  });
}
