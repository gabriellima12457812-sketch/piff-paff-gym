/**
 * Piff Paff Gym — Gerador de Card 9:16 (1080x1920) em HTML5 Canvas
 * Pronto para compartilhar direto nos Stories do Instagram (Web Share API + Download PNG).
 */

import { getRankForScore } from '../config.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawImageCover(ctx, img, x, y, w, h, radius = 28) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.clip();

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;
  let offsetX = x;
  let offsetY = y;

  if (imgRatio > boxRatio) {
    drawH = h;
    drawW = h * imgRatio;
    offsetX = x - (drawW - w) / 2;
  } else {
    drawW = w;
    drawH = w / imgRatio;
    offsetY = y - (drawH - h) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

  // Vinheta inferior sutil para legibilidade do rodapé da foto
  const grad = ctx.createLinearGradient(0, y + h - 220, 0, y + h);
  grad.addColorStop(0, 'rgba(9,9,11,0)');
  grad.addColorStop(1, 'rgba(9,9,11,0.88)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y + h - 220, w, 220);

  ctx.restore();
}

function formatDateBr(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export async function generateStoryCardCanvas({ beforePhoto, afterPhoto, user, gamification }) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const isPro = user?.level === 'pro' || user?.role === 'admin';
  const primary = isPro ? '#f59e0b' : '#10b981';
  const secondary = '#10b981';
  const rankInfo = getRankForScore(gamification?.score || 0);

  // 1. Fundo Dark Premium (#09090b)
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, W, H);

  // Glow radial superior sutil
  const topGlow = ctx.createRadialGradient(W / 2, 160, 40, W / 2, 160, 620);
  topGlow.addColorStop(0, isPro ? 'rgba(245,158,11,0.18)' : 'rgba(16,185,129,0.18)');
  topGlow.addColorStop(1, 'rgba(9,9,11,0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 900);

  // 2. Cabeçalho Marca Piff Paff Gym
  ctx.fillStyle = primary;
  ctx.font = '800 32px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ PIFF PAFF GYM', W / 2, 118);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 66px Inter, system-ui, sans-serif';
  ctx.fillText('EVOLUÇÃO REAL', W / 2, 198);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 30px Inter, system-ui, sans-serif';
  ctx.fillText(`${user?.name || 'Atleta'} · Patente ${rankInfo.current.name}`, W / 2, 248);

  // 3. Carregar e desenhar Fotos Antes vs Depois lado a lado
  const [imgBefore, imgAfter] = await Promise.all([
    loadImage(beforePhoto.dataUrl),
    loadImage(afterPhoto.dataUrl),
  ]);

  const cardY = 305;
  const cardH = 980;
  const gap = 28;
  const padX = 52;
  const cardW = (W - padX * 2 - gap) / 2;

  // Foto ANTES
  drawImageCover(ctx, imgBefore, padX, cardY, cardW, cardH, 32);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, padX, cardY, cardW, cardH, 32);
  ctx.stroke();

  // Foto DEPOIS
  const rightX = padX + cardW + gap;
  drawImageCover(ctx, imgAfter, rightX, cardY, cardW, cardH, 32);
  ctx.strokeStyle = primary;
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, rightX, cardY, cardW, cardH, 32);
  ctx.stroke();

  // Badges ANTES / DEPOIS no topo das fotos
  const drawPill = (x, y, text, bg, textColor) => {
    ctx.save();
    ctx.font = '800 26px Inter, system-ui, sans-serif';
    const tw = ctx.measureText(text).width + 48;
    drawRoundedRect(ctx, x, y, tw, 54, 27);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(text, x + 24, y + 36);
    ctx.restore();
  };

  drawPill(padX + 24, cardY + 24, 'ANTES', 'rgba(9,9,11,0.82)', '#e4e4e7');
  drawPill(rightX + 24, cardY + 24, 'DEPOIS', primary, '#09090b');

  // Metadados no rodapé de cada foto
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px Inter, system-ui, sans-serif';
  ctx.fillText(`${Number(beforePhoto.weightKg).toFixed(1)} kg`, padX + 28, cardY + cardH - 72);
  ctx.fillStyle = '#d4d4d8';
  ctx.font = '600 26px Inter, system-ui, sans-serif';
  ctx.fillText(formatDateBr(beforePhoto.date), padX + 28, cardY + cardH - 32);

  ctx.fillStyle = primary;
  ctx.font = '800 42px Inter, system-ui, sans-serif';
  ctx.fillText(`${Number(afterPhoto.weightKg).toFixed(1)} kg`, rightX + 28, cardY + cardH - 72);
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 26px Inter, system-ui, sans-serif';
  ctx.fillText(formatDateBr(afterPhoto.date), rightX + 28, cardY + cardH - 32);

  // 4. Painel de Métricas / Diferença de Peso
  const deltaKg = Number(afterPhoto.weightKg) - Number(beforePhoto.weightKg);
  const deltaSign = deltaKg > 0 ? '+' : '';
  const daysElapsed = Math.max(
    1,
    Math.round(
      (new Date(afterPhoto.date).getTime() - new Date(beforePhoto.date).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const statsY = 1335;
  const statsH = 310;
  drawRoundedRect(ctx, padX, statsY, W - padX * 2, statsH, 34);
  ctx.fillStyle = '#121215';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 3 Colunas de Resultado
  const colW = (W - padX * 2) / 3;
  const cols = [
    {
      label: 'VARIAÇÃO DE PESO',
      value: `${deltaSign}${deltaKg.toFixed(1)} kg`,
      color: deltaKg <= 0 ? secondary : primary,
    },
    {
      label: 'TEMPO DE FOCO',
      value: `${daysElapsed} dias`,
      color: '#ffffff',
    },
    {
      label: 'SCORE PIFF PAFF',
      value: `${Number(gamification?.score || 0).toLocaleString('pt-BR')} pts`,
      color: '#f59e0b',
    },
  ];

  cols.forEach((col, i) => {
    const cx = padX + colW * i + colW / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '700 22px Inter, system-ui, sans-serif';
    ctx.fillText(col.label, cx, statsY + 94);

    ctx.fillStyle = col.color;
    ctx.font = '900 50px Inter, system-ui, sans-serif';
    ctx.fillText(col.value, cx, statsY + 170);

    if (i < 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(padX + colW * (i + 1), statsY + 52);
      ctx.lineTo(padX + colW * (i + 1), statsY + statsH - 52);
      ctx.stroke();
    }
  });

  // Linha de BF% ou Streak no rodapé do card de métricas
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d4d4d8';
  ctx.font = '600 26px Inter, system-ui, sans-serif';
  const bfText =
    beforePhoto.bodyFatPct && afterPhoto.bodyFatPct
      ? `Gordura Corporal: ${beforePhoto.bodyFatPct}% → ${afterPhoto.bodyFatPct}%   ·   `
      : '';
  ctx.fillText(
    `${bfText}Constância: ${gamification?.streakDays || 0} dias ativos · ${gamification?.totalWorkouts || 0} treinos`,
    W / 2,
    statsY + 258
  );

  // 5. Rodapé Oficial
  ctx.fillStyle = '#71717a';
  ctx.font = '600 26px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Treinando com protocolo profissional no', W / 2, 1745);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 38px Inter, system-ui, sans-serif';
  ctx.fillText('PIFF PAFF GYM  ·  100% GRATUITO', W / 2, 1802);

  // Barra de acento inferior
  drawRoundedRect(ctx, W / 2 - 140, 1846, 280, 8, 4);
  ctx.fillStyle = primary;
  ctx.fill();

  return canvas;
}

export async function shareOrDownloadStoryCard(canvas, filename = 'piff-paff-gym-evolucao-9x16.png') {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return resolve({ method: 'error' });

      const file = new File([blob], filename, { type: 'image/png' });

      // Tentar Web Share API nativa (iOS Safari / Android Chrome direto p/ Stories)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Minha Evolução — Piff Paff Gym',
            text: 'Evolução física registrada no Piff Paff Gym ⚡',
            files: [file],
          });
          return resolve({ method: 'web_share' });
        } catch (err) {
          if (err?.name === 'AbortError') {
            return resolve({ method: 'cancelled' });
          }
          // Fallback para download abaixo
        }
      }

      downloadCanvasPng(canvas, filename);
      resolve({ method: 'download' });
    }, 'image/png', 0.95);
  });
}

export function downloadCanvasPng(canvas, filename = 'piff-paff-gym-evolucao-9x16.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 0.95);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
