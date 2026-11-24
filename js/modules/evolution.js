/**
 * Piff Paff Gym — Evolução Física (Estilo Mobile Minimalista)
 * Sub-telas limpas: [Antes vs. Depois & Stories 9:16] | [Minhas Fotos] + Modal Guia Prático
 */

import { APP_CONFIG } from '../config.js';
import {
  generateStoryCardCanvas,
  shareOrDownloadStoryCard,
  downloadCanvasPng,
} from './story-card.js';

let evoView = 'compare'; // 'compare' | 'gallery'
let selectedBeforeId = null;
let selectedAfterId = null;
let compareMode = 'side'; // 'side' | 'slider'
let sliderPercent = 50;

function compressImageFile(file, maxDim = 1080, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler a imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida.'));
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
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
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
    if (!selectedBeforeId || !photos.some((p) => p.id === selectedBeforeId)) selectedBeforeId = photos[0].id;
    if (!selectedAfterId || !photos.some((p) => p.id === selectedAfterId)) selectedAfterId = photos[photos.length - 1].id;
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
      ? Math.max(0, Math.round((new Date(afterPhoto.date) - new Date(beforePhoto.date)) / 86400000))
      : 0;

  container.innerHTML = `
    <div class="segmented-control full-seg mb-12">
      <button class="seg-btn ${evoView === 'compare' ? 'active' : ''}" data-eview="compare">Antes vs. Depois</button>
      <button class="seg-btn ${evoView === 'gallery' ? 'active' : ''}" data-eview="gallery">Fotos (${photos.length})</button>
    </div>

    <div class="action-pair-row mb-16">
      <button class="btn btn-emerald flex-1" id="btn-upload-photo">+ Nova Foto</button>
      <button class="btn btn-ghost" id="btn-open-photo-guide">📷 Guia</button>
    </div>

    ${
      evoView === 'compare'
        ? photos.length < 2
          ? `<div class="card empty-state-card">Envie pelo menos <strong>2 fotos</strong> para comparar Antes vs. Depois e gerar seu Card 9:16.</div>`
          : `
            <div class="compare-delta-banner mb-12">
              <div>
                <span class="mini-eyebrow">DIFERENÇA DE PESO</span>
                <strong class="${deltaKg <= 0 ? 'text-emerald' : 'text-gold'}">${deltaKg > 0 ? '+' : ''}${deltaKg.toFixed(1)} kg</strong>
              </div>
              <div>
                <span class="mini-eyebrow">INTERVALO</span>
                <strong>${daysElapsed} dias</strong>
              </div>
              <button class="pill-btn-mini" id="btn-toggle-cmode">${compareMode === 'side' ? '⇄ Slider' : '◫ Lado a Lado'}</button>
            </div>

            ${
              compareMode === 'side'
                ? `
                  <div class="compare-side-compact mb-12">
                    <div class="compare-frame">
                      <span class="compare-tag">ANTES</span>
                      <img src="${beforePhoto.dataUrl}" alt="Antes" />
                      <div class="compare-caption">
                        <strong>${beforePhoto.weightKg}kg</strong>
                        <span>${formatDateBr(beforePhoto.date)}</span>
                      </div>
                    </div>
                    <div class="compare-frame compare-frame-after">
                      <span class="compare-tag compare-tag-after">DEPOIS</span>
                      <img src="${afterPhoto.dataUrl}" alt="Depois" />
                      <div class="compare-caption">
                        <strong class="text-emerald">${afterPhoto.weightKg}kg</strong>
                        <span>${formatDateBr(afterPhoto.date)}</span>
                      </div>
                    </div>
                  </div>
                `
                : `
                  <div class="slider-compare-wrap mb-12" id="slider-compare-wrap">
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

            <div class="form-grid-2 mb-16">
              <div class="form-field">
                <label>Antes</label>
                <select id="select-before-photo">
                  ${photos
                    .map((p) => `<option value="${p.id}" ${p.id === beforePhoto.id ? 'selected' : ''}>${formatDateBr(p.date)} (${p.weightKg}kg)</option>`)
                    .join('')}
                </select>
              </div>
              <div class="form-field">
                <label>Depois</label>
                <select id="select-after-photo">
                  ${photos
                    .map((p) => `<option value="${p.id}" ${p.id === afterPhoto.id ? 'selected' : ''}>${formatDateBr(p.date)} (${p.weightKg}kg)</option>`)
                    .join('')}
                </select>
              </div>
            </div>

            <button class="btn btn-gold btn-full btn-lg" id="btn-generate-story-card">
              ✨ Gerar Card 9:16 para Stories
            </button>
          `
        : photos.length === 0
          ? `<div class="card empty-state-card">Nenhuma foto enviada ainda.</div>`
          : `
            <div class="gallery-mobile-grid">
              ${photos
                .slice()
                .reverse()
                .map(
                  (p) => `
                  <div class="gallery-card">
                    <img src="${p.dataUrl}" alt="Foto ${formatDateBr(p.date)}" />
                    <div class="gallery-info">
                      <div class="gallery-top">
                        <strong>${p.weightKg} kg</strong>
                        <span class="pill pill-neutral pill-xs">${escapeHtml(p.pose)}</span>
                      </div>
                      <div class="gallery-date">${formatDateBr(p.date)}</div>
                      <button class="btn-link-danger" data-del-photo="${p.id}">Excluir</button>
                    </div>
                  </div>
                `
                )
                .join('')}
            </div>
          `
    }
  `;

  bindEvolutionEvents(container, ctx, beforePhoto, afterPhoto);
}

function bindEvolutionEvents(container, ctx, beforePhoto, afterPhoto) {
  container.querySelectorAll('[data-eview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      evoView = btn.dataset.eview;
      renderEvolutionTab(container, ctx);
    });
  });

  container.querySelector('#btn-toggle-cmode')?.addEventListener('click', () => {
    compareMode = compareMode === 'side' ? 'slider' : 'side';
    renderEvolutionTab(container, ctx);
  });

  container.querySelector('#btn-open-photo-guide')?.addEventListener('click', () => {
    ctx.openModal(
      '📷 Guia Prático de Fotos',
      `
        <div class="stack-10">
          <div class="guide-step">
            <strong>1. Jejum Matinal</strong>
            <p>Tire sempre ao acordar, antes de comer ou beber água, para eliminar retenção.</p>
          </div>
          <div class="guide-step">
            <strong>2. Mesma Iluminação</strong>
            <p>Luz superior/frontal suave no mesmo local. Evite contraluz de janela.</p>
          </div>
          <div class="guide-step">
            <strong>3. Distância & Altura</strong>
            <p>Apoie o celular a ~2m na altura do umbigo usando temporizador de 10s.</p>
          </div>
          <div class="guide-step">
            <strong>4. 3 Ângulos Padrão</strong>
            <p>Frente, Lateral e Costas com a mesma roupa a cada 14 a 30 dias.</p>
          </div>
        </div>
      `
    );
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

  container.querySelectorAll('[data-del-photo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.data.evolutionPhotos = (ctx.data.evolutionPhotos || []).filter((p) => p.id !== btn.dataset.delPhoto);
      ctx.saveData();
      ctx.toast('Foto excluída.');
      renderEvolutionTab(container, ctx);
    });
  });

  container.querySelector('#btn-upload-photo')?.addEventListener('click', () => {
    const today = new Date().toISOString().slice(0, 10);
    const defaultW = ctx.data.bodyProfile?.weightKg || 75;
    const defaultBf = ctx.data.bodyProfile?.bodyFatPct || '';

    ctx.openModal(
      'Nova Foto de Evolução',
      `
        <form id="form-upload-photo" class="modal-form">
          <div class="form-field">
            <label>Foto (Compressão Automática)</label>
            <input type="file" name="photo" accept="image/*" required />
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>Data</label>
              <input type="date" name="date" required value="${today}" />
            </div>
            <div class="form-field">
              <label>Pose</label>
              <select name="pose">
                <option value="Frente">Frente</option>
                <option value="Lateral">Lateral</option>
                <option value="Costas">Costas</option>
                <option value="Duplo Bíceps">Duplo Bíceps</option>
              </select>
            </div>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>Peso (kg)</label>
              <input type="number" step="0.1" name="weightKg" required value="${defaultW}" />
            </div>
            <div class="form-field">
              <label>% Gordura (Opc.)</label>
              <input type="number" step="0.1" name="bodyFatPct" value="${defaultBf}" />
            </div>
          </div>
          <div class="form-field">
            <label>Nota (Opcional)</label>
            <input type="text" name="note" placeholder="Ex: Semana 8 em jejum" />
          </div>
          <button type="submit" class="btn btn-emerald btn-full">Salvar Foto (+40 pts)</button>
        </form>
      `,
      (modalBody) => {
        modalBody.querySelector('#form-upload-photo').addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const file = fd.get('photo');
          if (!file || !file.size) return ctx.toast('Escolha uma foto.', 'error');
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
            ctx.toast('Foto salva! +40 pts!', 'success');
            renderEvolutionTab(container, ctx);
          } catch (err) {
            ctx.toast(err.message || 'Erro ao processar foto.', 'error');
          }
        });
      }
    );
  });

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
        'Card 9:16 — Instagram Stories',
        `
          <div class="story-modal-wrap">
            <img src="${previewUrl}" alt="Card 9:16" class="story-preview-img" />
            <div class="story-modal-actions">
              <button class="btn btn-gold btn-full" id="btn-story-share">📤 Compartilhar nos Stories</button>
              <button class="btn btn-emerald btn-full" id="btn-story-download">⬇ Baixar PNG (1080×1920)</button>
            </div>
          </div>
        `,
        (modalBody) => {
          modalBody.querySelector('#btn-story-share')?.addEventListener('click', async () => {
            const res = await shareOrDownloadStoryCard(canvas);
            if (res.method === 'web_share') ctx.toast('Card enviado!', 'success');
            else if (res.method === 'download') ctx.toast('PNG baixado automaticamente!', 'success');
          });
          modalBody.querySelector('#btn-story-download')?.addEventListener('click', () => {
            downloadCanvasPng(canvas);
            ctx.toast('PNG 1080×1920 baixado!', 'success');
          });
        }
      );
    } catch {
      ctx.toast('Erro ao gerar Card 9:16.', 'error');
    }
  });
}
