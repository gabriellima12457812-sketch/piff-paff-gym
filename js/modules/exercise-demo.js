/**
 * Piff Paff Gym — Motor Fluido 60fps de Execução Anatômica (Estúdio Escuro + Músculo Marcado em Esmeralda)
 * Movimento biomecânico contínuo e fluido em 60fps com figura anatômica esculpida
 * e destaque esmeralda luminoso no músculo trabalhado durante a contração.
 */

let activeAnimations = new Set();

export function stopAllDemoVideos() {
  for (const stopFn of activeAnimations) {
    stopFn();
  }
  activeAnimations.clear();
}

export function detectExerciseMotion(name = '', muscle = '') {
  const n = String(name).toLowerCase();
  const m = String(muscle).toLowerCase();

  if (n.includes('flexão') || n.includes('flexao')) return 'pushup';
  if (n.includes('crossover') || n.includes('crucifixo')) return 'crossover';
  if (n.includes('supino')) return 'bench_press';
  if (n.includes('puxada') || n.includes('barra fixa') || n.includes('pulldown') || n.includes('dead hang')) return 'pulldown';
  if (n.includes('remada') || n.includes('serrote') || n.includes('cavalinho')) return 'row';
  if (n.includes('elevação lateral') || n.includes('elevacao lateral') || n.includes('face pull') || n.includes('y-t-w')) return 'lateral_raise';
  if (n.includes('desenvolvimento') || n.includes('arnold') || n.includes('encolhimento')) return 'overhead_press';
  if (n.includes('rosca') || n.includes('curl')) {
    if (n.includes('hamstring') || n.includes('slider')) return 'rdl_hinge';
    return 'biceps_curl';
  }
  if (n.includes('tríceps') || n.includes('triceps') || n.includes('paralelas') || n.includes('mergulho')) return 'triceps_ext';
  if (n.includes('hip thrust') || n.includes('pélvica') || n.includes('pelvica') || n.includes('ponte') || n.includes('abdutora') || n.includes('coice') || n.includes('frog')) return 'hip_thrust';
  if (n.includes('stiff') || n.includes('rdl') || n.includes('terra') || n.includes('flexora') || n.includes('lombar') || n.includes('superman')) return 'rdl_hinge';
  if (n.includes('panturrilha')) return 'calf_raise';
  if (n.includes('agachamento') || n.includes('leg press') || n.includes('extensora') || n.includes('passada') || n.includes('afundo') || n.includes('step-up')) return 'squat';
  if (n.includes('abdominal') || n.includes('crunch') || n.includes('vacuum') || n.includes('prancha') || n.includes('pernas')) return 'abs_core';

  if (m.includes('peito')) return 'bench_press';
  if (m.includes('costas') || m.includes('trapézio')) return 'pulldown';
  if (m.includes('ombro')) return 'lateral_raise';
  if (m.includes('bíceps') || m.includes('antebraço')) return 'biceps_curl';
  if (m.includes('tríceps')) return 'triceps_ext';
  if (m.includes('glúteo')) return 'hip_thrust';
  if (m.includes('posterior') || m.includes('lombar')) return 'rdl_hinge';
  if (m.includes('panturrilha')) return 'calf_raise';
  if (m.includes('perna') || m.includes('quadríceps')) return 'squat';
  if (m.includes('abd') || m.includes('core')) return 'abs_core';
  return 'bench_press';
}

export function buildYoutubeSearchUrl(exerciseName) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `como fazer ${exerciseName} execucao correta`
  )}`;
}

export function renderExerciseDemoMarkup(exerciseName, muscleName, compact = false) {
  const motion = detectExerciseMotion(exerciseName, muscleName);
  const ytUrl = buildYoutubeSearchUrl(exerciseName);
  const safeName = String(exerciseName).replace(/"/g, '&quot;');
  const safeMuscle = String(muscleName || '').replace(/"/g, '&quot;');

  return `
    <div class="demo-video-stage ${compact ? 'demo-video-compact' : ''}">
      <canvas
        class="demo-video-canvas"
        width="480"
        height="${compact ? 210 : 240}"
        data-demo-motion="${motion}"
        data-demo-muscle="${safeMuscle}"
        aria-label="Execução contínua de ${safeName}"
      ></canvas>
      <div class="demo-video-hud-top">
        <span class="demo-live-pill"><span class="demo-rec-dot"></span> EXECUÇÃO FLUIDA</span>
        <span class="demo-phase-badge" data-phase-label>CONTROLADO</span>
      </div>
      <a
        href="${ytUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="demo-yt-link"
        title="Ver vídeo no YouTube"
      >▶ YouTube ↗</a>
    </div>
  `;
}

export function mountDemoVideos(container) {
  stopAllDemoVideos();
  if (!container) return;

  const canvases = container.querySelectorAll('canvas[data-demo-motion]');
  if (!canvases.length) return;

  canvases.forEach((canvas) => {
    const motion = canvas.dataset.demoMotion || 'bench_press';
    const stage = canvas.closest('.demo-video-stage');
    const phaseEl = stage?.querySelector('[data-phase-label]');
    const ctx = canvas.getContext('2d');
    let rafId = null;
    let alive = true;
    const startTime = performance.now() - Math.random() * 900;

    const render = (now) => {
      if (!alive || !canvas.isConnected) {
        if (rafId) cancelAnimationFrame(rafId);
        return;
      }
      const elapsed = (now - startTime) / 1000;
      const cycle = (elapsed % 2.6) / 2.6;

      // Curva fluida biomecânica: subida firme (0..0.42), pico curto (0.42..0.54), descida controlada (0.54..1.0)
      let rep = 0;
      if (cycle < 0.42) {
        const u = cycle / 0.42;
        rep = 0.5 - 0.5 * Math.cos(u * Math.PI);
      } else if (cycle < 0.54) {
        rep = 1.0;
      } else {
        const u = (cycle - 0.54) / 0.46;
        rep = 0.5 + 0.5 * Math.cos(u * Math.PI);
      }

      if (phaseEl) {
        if (cycle < 0.42) phaseEl.textContent = 'CONCÊNTRICA ↑';
        else if (cycle < 0.54) phaseEl.textContent = 'PICO · CONTRAÇÃO';
        else phaseEl.textContent = 'EXCÊNTRICA · 2s ↓';
      }

      drawSculptedScene(ctx, canvas.width, canvas.height, motion, rep);
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    activeAnimations.add(() => {
      alive = false;
      if (rafId) cancelAnimationFrame(rafId);
    });
  });
}

/* ============================================================================
   PRIMITIVAS ANATÔMICAS ESCULPIDAS (Silhueta Muscular Sombreada + Brilho Esmeralda)
   ============================================================================ */
function drawTaperedSegment(ctx, x1, y1, x2, y2, r1, r2, fill, stroke = null) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  ctx.beginPath();
  ctx.moveTo(x1 + nx * r1, y1 + ny * r1);
  ctx.lineTo(x2 + nx * r2, y2 + ny * r2);
  ctx.arc(x2, y2, r2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), false);
  ctx.lineTo(x1 - nx * r1, y1 - ny * r1);
  ctx.arc(x1, y1, r1, Math.atan2(-ny, -nx), Math.atan2(ny, nx), false);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function drawMuscleHighlight(ctx, x1, y1, x2, y2, r1, r2, intensity) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const glowR = Math.max(r1, r2) * 2.5 + Math.hypot(x2 - x1, y2 - y1) * 0.35;

  // Aura esmeralda luminosa externa
  const aura = ctx.createRadialGradient(mx, my, 2, mx, my, glowR);
  aura.addColorStop(0, `rgba(52, 211, 153, ${0.38 + intensity * 0.42})`);
  aura.addColorStop(0.55, `rgba(16, 185, 129, ${0.16 + intensity * 0.2})`);
  aura.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(mx, my, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Camada anatômica marcada em verde esmeralda sobre o músculo
  drawTaperedSegment(
    ctx,
    x1,
    y1,
    x2,
    y2,
    r1 * 1.04,
    r2 * 1.04,
    `rgba(16, 185, 129, ${0.42 + intensity * 0.42})`,
    `rgba(110, 231, 183, ${0.45 + intensity * 0.45})`
  );
}

function drawHead(ctx, x, y, r = 13) {
  const g = ctx.createRadialGradient(x - 3, y - 4, 2, x, y, r * 1.2);
  g.addColorStop(0, '#c8a58b');
  g.addColorStop(1, '#7a5c47');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // Cabelo escuro atlético
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(x, y - 3, r * 0.96, Math.PI * 1.05, Math.PI * 1.98);
  ctx.fill();
}

function drawEquipmentBar(ctx, x1, y1, x2, y2, plateR = 16) {
  // Barra metálica
  ctx.strokeStyle = '#a1a1aa';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Anilhas dark com aro esmeralda
  const drawPlate = (px, py) => {
    ctx.fillStyle = '#18181d';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, plateR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#52525b';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };
  drawPlate(x1, y1);
  if (Math.hypot(x2 - x1, y2 - y1) > 8) drawPlate(x2, y2);
}

function drawDumbbell(ctx, x, y, r = 8) {
  ctx.fillStyle = '#18181d';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawSculptedScene(ctx, W, H, motion, rep) {
  // Fundo estúdio escuro com vinheta radial suave (mesma estética do Atlas)
  const bgGrad = ctx.createRadialGradient(W / 2, H * 0.42, 20, W / 2, H * 0.5, W * 0.65);
  bgGrad.addColorStop(0, '#16161c');
  bgGrad.addColorStop(1, '#09090b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const floorY = H - 24;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(34, floorY);
  ctx.lineTo(W - 34, floorY);
  ctx.stroke();

  const skin = '#b68f73';
  const skinBack = '#8f6c54';
  const shorts = '#111115';
  const shoe = '#27272f';
  const benchCol = '#1c1c22';
  const cx = W / 2;

  if (motion === 'bench_press') {
    const benchY = floorY - 46;
    // Banco de supino
    drawTaperedSegment(ctx, cx - 94, benchY, cx + 82, benchY, 7, 7, benchCol, '#30303a');
    drawTaperedSegment(ctx, cx - 70, benchY + 4, cx - 70, floorY, 5, 5, '#27272f');
    drawTaperedSegment(ctx, cx + 58, benchY + 4, cx + 58, floorY, 5, 5, '#27272f');

    // Pernas (bermuda preta + pernas esculpidas)
    drawTaperedSegment(ctx, cx + 22, benchY - 12, cx + 68, benchY - 4, 13, 10, shorts);
    drawTaperedSegment(ctx, cx + 68, benchY - 4, cx + 74, floorY - 5, 9, 6, skinBack);
    drawTaperedSegment(ctx, cx + 72, floorY - 4, cx + 88, floorY - 4, 5, 4, shoe);

    // Tronco + Peitoral marcado em esmeralda
    drawHead(ctx, cx - 76, benchY - 16, 12);
    drawTaperedSegment(ctx, cx - 56, benchY - 14, cx + 22, benchY - 12, 16, 13, skin);
    drawMuscleHighlight(ctx, cx - 52, benchY - 19, cx - 22, benchY - 18, 12, 10, rep);

    // Braço empurrando a barra em movimento fluido
    const handX = cx - 34;
    const handY = benchY - 34 - rep * 66;
    const elX = cx - 44 - (1 - rep) * 14;
    const elY = benchY - 10 - rep * 30;
    drawTaperedSegment(ctx, cx - 44, benchY - 14, elX, elY, 9, 7.5, skin);
    drawTaperedSegment(ctx, elX, elY, handX, handY, 7, 5.5, skin);
    drawEquipmentBar(ctx, handX, handY, handX, handY, 17);
    return;
  }

  if (motion === 'pushup') {
    const drop = (1 - rep) * 38;
    const shX = cx - 52;
    const shY = floorY - 68 + drop;
    const hipX = cx + 24;
    const hipY = floorY - 44 + drop * 0.52;
    const footX = cx + 104;
    const footY = floorY - 6;

    // Perna traseira + bermuda + tronco
    drawTaperedSegment(ctx, hipX, hipY, cx + 64, floorY - 24 + drop * 0.25, 13, 10, shorts);
    drawTaperedSegment(ctx, cx + 64, floorY - 24 + drop * 0.25, footX, footY, 9, 5.5, skinBack);
    drawTaperedSegment(ctx, shX, shY, hipX, hipY, 15, 12, skin);
    drawHead(ctx, shX - 22, shY - 10, 12);

    // Peito & ombro frontal marcados em esmeralda
    drawMuscleHighlight(ctx, shX - 2, shY + 6, shX + 26, shY + 12, 11, 9, rep);

    // Braço articulado fluido
    const elX = shX + 12 + (1 - rep) * 16;
    const elY = (shY + floorY) / 2 + (1 - rep) * 10;
    drawTaperedSegment(ctx, shX, shY + 2, elX, elY, 8.5, 7, skin);
    drawTaperedSegment(ctx, elX, elY, shX - 4, floorY - 4, 6.5, 5, skin);
    return;
  }

  if (motion === 'crossover' || motion === 'lateral_raise') {
    const isCross = motion === 'crossover';
    const shY = 74;
    const hipY = 136;

    // Pernas + bermuda preta
    drawTaperedSegment(ctx, cx - 14, hipY, cx - 18, hipY + 34, 13, 11, shorts);
    drawTaperedSegment(ctx, cx + 14, hipY, cx + 18, hipY + 34, 13, 11, shorts);
    drawTaperedSegment(ctx, cx - 18, hipY + 34, cx - 20, floorY - 4, 9.5, 6, skinBack);
    drawTaperedSegment(ctx, cx + 18, hipY + 34, cx + 20, floorY - 4, 9.5, 6, skinBack);

    // Tronco em V esculpido
    drawTaperedSegment(ctx, cx, shY, cx, hipY, 24, 16, skin);
    drawHead(ctx, cx, 46, 13);

    if (isCross) {
      drawMuscleHighlight(ctx, cx - 16, shY + 12, cx - 3, shY + 14, 10, 10, rep);
      drawMuscleHighlight(ctx, cx + 16, shY + 12, cx + 3, shY + 14, 10, 10, rep);
      const spread = 88 - rep * 70;
      const hy = shY + 22 + rep * 14;
      const elX = (24 + spread) * 0.56;
      const elY = shY + 16 + rep * 6;
      // Cabos
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(46, 30);
      ctx.lineTo(cx - spread, hy);
      ctx.moveTo(W - 46, 30);
      ctx.lineTo(cx + spread, hy);
      ctx.stroke();

      drawTaperedSegment(ctx, cx - 22, shY + 4, cx - elX, elY, 8.5, 7, skin);
      drawTaperedSegment(ctx, cx - elX, elY, cx - spread, hy, 6.5, 5, skin);
      drawTaperedSegment(ctx, cx + 22, shY + 4, cx + elX, elY, 8.5, 7, skin);
      drawTaperedSegment(ctx, cx + elX, elY, cx + spread, hy, 6.5, 5, skin);
    } else {
      // Elevação Lateral (Deltoides marcados em esmeralda)
      drawMuscleHighlight(ctx, cx - 25, shY + 3, cx - 20, shY + 10, 9.5, 8.5, rep);
      drawMuscleHighlight(ctx, cx + 25, shY + 3, cx + 20, shY + 10, 9.5, 8.5, rep);
      const ang = 0.2 + rep * 1.32;
      const ax = Math.sin(ang) * 62;
      const ay = Math.cos(ang) * 62;
      drawTaperedSegment(ctx, cx - 23, shY + 4, cx - 23 - ax, shY + 4 + ay, 8, 5.5, skin);
      drawTaperedSegment(ctx, cx + 23, shY + 4, cx + 23 + ax, shY + 4 + ay, 8, 5.5, skin);
      drawDumbbell(ctx, cx - 23 - ax, shY + 4 + ay, 8);
      drawDumbbell(ctx, cx + 23 + ax, shY + 4 + ay, 8);
    }
    return;
  }

  if (motion === 'pulldown') {
    const barY = 30 + rep * 62;
    // Cabo & barra
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, 8);
    ctx.lineTo(cx, barY);
    ctx.stroke();
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 76, barY);
    ctx.lineTo(cx + 76, barY);
    ctx.stroke();

    const shY = 114;
    const hipY = 174;
    // Banco sentado
    drawTaperedSegment(ctx, cx - 34, hipY + 8, cx + 34, hipY + 8, 7, 7, benchCol, '#30303a');
    drawTaperedSegment(ctx, cx - 18, hipY, cx - 26, hipY + 28, 12, 10, shorts);
    drawTaperedSegment(ctx, cx + 18, hipY, cx + 26, hipY + 28, 12, 10, shorts);

    // Costas em V + Dorsais marcadas em esmeralda
    drawTaperedSegment(ctx, cx, shY, cx, hipY, 26, 16, skin);
    drawMuscleHighlight(ctx, cx - 18, shY + 12, cx - 11, shY + 40, 11, 8, rep);
    drawMuscleHighlight(ctx, cx + 18, shY + 12, cx + 11, shY + 40, 11, 8, rep);
    drawHead(ctx, cx, 88, 12);

    // Braços puxando a barra de forma fluida
    const elX = 48 + (1 - rep) * 14;
    const elY = shY - 18 + rep * 46;
    drawTaperedSegment(ctx, cx - 24, shY + 4, cx - elX, elY, 8.5, 7, skin);
    drawTaperedSegment(ctx, cx - elX, elY, cx - 60, barY, 6.5, 5, skin);
    drawTaperedSegment(ctx, cx + 24, shY + 4, cx + elX, elY, 8.5, 7, skin);
    drawTaperedSegment(ctx, cx + elX, elY, cx + 60, barY, 6.5, 5, skin);
    return;
  }

  if (motion === 'row') {
    const hipX = cx + 28;
    const hipY = floorY - 80;
    const shX = cx - 34;
    const shY = floorY - 118;

    // Pernas + bermuda
    drawTaperedSegment(ctx, hipX, hipY, cx + 16, floorY - 40, 14, 11, shorts);
    drawTaperedSegment(ctx, cx + 16, floorY - 40, cx + 22, floorY - 4, 9.5, 6, skinBack);

    // Tronco inclinado + Dorsais marcadas em esmeralda
    drawTaperedSegment(ctx, shX, shY, hipX, hipY, 17, 14, skin);
    drawMuscleHighlight(ctx, shX + 10, shY + 8, hipX - 8, hipY - 4, 12, 9, rep);
    drawHead(ctx, shX - 18, shY - 12, 12);

    // Braço remando barra com movimento contínuo
    const handY = floorY - 26 - rep * 56;
    const handX = shX + 4 + rep * 32;
    const elX = shX + 12 + rep * 36;
    const elY = shY + 32 - rep * 38;
    drawTaperedSegment(ctx, shX, shY + 4, elX, elY, 9, 7.5, skin);
    drawTaperedSegment(ctx, elX, elY, handX, handY, 7, 5.5, skin);
    drawEquipmentBar(ctx, handX, handY, handX, handY, 16);
    return;
  }

  if (motion === 'overhead_press') {
    const shY = 98;
    const hipY = 154;
    drawTaperedSegment(ctx, cx - 13, hipY, cx - 16, hipY + 32, 12, 10, shorts);
    drawTaperedSegment(ctx, cx + 13, hipY, cx + 16, hipY + 32, 12, 10, shorts);
    drawTaperedSegment(ctx, cx - 16, hipY + 32, cx - 18, floorY - 4, 9, 6, skinBack);
    drawTaperedSegment(ctx, cx + 16, hipY + 32, cx + 18, floorY - 4, 9, 6, skinBack);
    drawTaperedSegment(ctx, cx, shY, cx, hipY, 22, 15, skin);
    drawMuscleHighlight(ctx, cx - 22, shY + 2, cx - 16, shY + 8, 9, 8, rep);
    drawMuscleHighlight(ctx, cx + 22, shY + 2, cx + 16, shY + 8, 9, 8, rep);
    drawHead(ctx, cx, 72, 12);

    const handY = shY - 12 - rep * 60;
    const elY = shY + 14 - rep * 32;
    drawTaperedSegment(ctx, cx - 21, shY + 4, cx - 48, elY, 8.5, 7, skin);
    drawTaperedSegment(ctx, cx - 48, elY, cx - 38, handY, 6.5, 5, skin);
    drawTaperedSegment(ctx, cx + 21, shY + 4, cx + 48, elY, 8.5, 7, skin);
    drawTaperedSegment(ctx, cx + 48, elY, cx + 38, handY, 6.5, 5, skin);
    drawEquipmentBar(ctx, cx - 48, handY, cx + 48, handY, 12);
    return;
  }

  if (motion === 'biceps_curl' || motion === 'triceps_ext') {
    const isBiceps = motion === 'biceps_curl';
    const shX = cx - 4;
    const shY = 76;
    const hipY = 138;

    drawTaperedSegment(ctx, shX, hipY, shX - 2, hipY + 36, 15, 12, shorts);
    drawTaperedSegment(ctx, shX - 2, hipY + 36, shX - 6, floorY - 4, 10, 6.5, skinBack);
    drawTaperedSegment(ctx, shX, shY, shX, hipY, 18, 14, skin);
    drawHead(ctx, shX + 2, 48, 13);

    const elX = shX + 6;
    const elY = shY + 44;
    drawTaperedSegment(ctx, shX + 2, shY + 4, elX, elY, 10, 8, skin);

    if (isBiceps) {
      drawMuscleHighlight(ctx, shX + 6, shY + 12, elX + 3, elY - 6, 8.5, 7, rep);
      const ang = 1.48 - rep * 2.15;
      const hx = elX + Math.cos(ang) * 42;
      const hy = elY + Math.sin(ang) * 42;
      drawTaperedSegment(ctx, elX, elY, hx, hy, 7.5, 5.5, skin);
      drawEquipmentBar(ctx, hx, hy, hx, hy, 12);
    } else {
      drawMuscleHighlight(ctx, shX - 4, shY + 12, elX - 5, elY - 6, 8.5, 7, rep);
      const ang = -0.45 + rep * 1.92;
      const hx = elX + Math.cos(ang) * 42;
      const hy = elY + Math.sin(ang) * 42;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(elX + 34, 16);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      drawTaperedSegment(ctx, elX, elY, hx, hy, 7.5, 5.5, skin);
      drawDumbbell(ctx, hx, hy, 7);
    }
    return;
  }

  if (motion === 'hip_thrust') {
    const benchX = cx - 74;
    const benchY = floorY - 46;
    drawTaperedSegment(ctx, benchX - 32, benchY, benchX + 12, benchY, 8, 8, benchCol, '#30303a');
    drawTaperedSegment(ctx, benchX - 16, benchY + 6, benchX - 16, floorY, 6, 6, '#27272f');

    const shX = benchX + 10;
    const shY = benchY - 8;
    const hipX = cx + 6;
    const hipY = floorY - 14 - rep * 46;
    const kneeX = cx + 66;
    const kneeY = floorY - 52;
    const footX = cx + 72;
    const footY = floorY - 4;

    drawHead(ctx, shX - 18, shY - 12, 12);
    drawTaperedSegment(ctx, shX, shY, hipX, hipY, 15, 13, skin);
    drawTaperedSegment(ctx, hipX, hipY, kneeX, kneeY, 14, 11, shorts);
    drawTaperedSegment(ctx, kneeX, kneeY, footX, footY, 9.5, 6.5, skinBack);
    drawMuscleHighlight(ctx, hipX - 10, hipY + 4, hipX + 18, hipY + 2, 13, 12, rep);
    drawEquipmentBar(ctx, hipX + 4, hipY - 12, hipX + 4, hipY - 12, 17);
    return;
  }

  if (motion === 'squat') {
    const depth = 1 - rep;
    const drop = depth * 54;
    const footX = cx + 4;
    const kneeX = cx - 18 - depth * 18;
    const kneeY = floorY - 50 + drop * 0.25;
    const hipX = cx + 12 + depth * 28;
    const hipY = floorY - 102 + drop;
    const shX = cx + 2 + depth * 8;
    const shY = hipY - 54;

    drawTaperedSegment(ctx, kneeX, kneeY, footX, floorY - 4, 10, 6.5, skinBack);
    drawTaperedSegment(ctx, hipX, hipY, kneeX, kneeY, 15, 11.5, shorts);
    drawMuscleHighlight(ctx, (hipX + kneeX) / 2 - 4, (hipY + kneeY) / 2 - 4, kneeX + 6, kneeY - 6, 11, 9, depth);
    drawTaperedSegment(ctx, shX, shY, hipX, hipY, 16, 13, skin);
    drawHead(ctx, shX - 4, shY - 20, 12);
    drawEquipmentBar(ctx, shX + 6, shY - 2, shX + 6, shY - 2, 17);
    return;
  }

  if (motion === 'rdl_hinge') {
    const hinge = 1 - rep;
    const footX = cx + 8;
    const hipX = cx + 10 + hinge * 30;
    const hipY = floorY - 98 + hinge * 10;
    const shX = hipX - hinge * 58;
    const shY = hipY - (1 - hinge * 0.68) * 56;
    const handX = shX - 6;
    const handY = shY + 56 + hinge * 12;

    drawTaperedSegment(ctx, hipX, hipY, footX + 2, floorY - 48, 15, 11.5, shorts);
    drawTaperedSegment(ctx, footX + 2, floorY - 48, footX, floorY - 4, 9.5, 6.5, skinBack);
    drawMuscleHighlight(ctx, hipX + 4, hipY + 12, footX + 8, floorY - 48, 11, 8.5, hinge);
    drawTaperedSegment(ctx, shX, shY, hipX, hipY, 16, 13, skin);
    drawHead(ctx, shX - hinge * 14, shY - 18 + hinge * 10, 12);
    drawTaperedSegment(ctx, shX, shY + 4, handX, handY, 8, 6, skin);
    drawEquipmentBar(ctx, handX, handY, handX, handY, 16);
    return;
  }

  if (motion === 'calf_raise') {
    const lift = rep * 24;
    const stepY = floorY - 14;
    drawTaperedSegment(ctx, cx - 36, stepY, cx + 36, stepY, 8, 8, benchCol, '#30303a');
    const ankleY = stepY - 8 - lift;
    const kneeY = ankleY - 52;
    const hipY = kneeY - 52;
    const shY = hipY - 54;

    drawTaperedSegment(ctx, cx, kneeY, cx, ankleY, 10, 6, skinBack);
    drawMuscleHighlight(ctx, cx + 4, kneeY + 10, cx + 4, kneeY + 34, 9.5, 7, rep);
    drawTaperedSegment(ctx, cx, hipY, cx, kneeY, 15, 11, shorts);
    drawTaperedSegment(ctx, cx, shY, cx, hipY, 17, 14, skin);
    drawHead(ctx, cx, shY - 20, 12);
    drawDumbbell(ctx, cx - 18, hipY + 18, 8);
    drawDumbbell(ctx, cx + 18, hipY + 18, 8);
    return;
  }

  // abs_core (Crunch abdominal fluido)
  const curl = rep * 38;
  const hipX = cx + 12;
  const hipY = floorY - 12;
  const shX = cx - 54 + curl * 0.56;
  const shY = floorY - 18 - curl;
  drawTaperedSegment(ctx, hipX, hipY, cx + 56, floorY - 48, 14, 11, shorts);
  drawTaperedSegment(ctx, cx + 56, floorY - 48, cx + 88, floorY - 6, 9.5, 6, skinBack);
  drawTaperedSegment(ctx, shX, shY, hipX, hipY, 15, 13, skin);
  drawMuscleHighlight(ctx, (shX + hipX) / 2 - 4, (shY + hipY) / 2 - 4, hipX - 8, hipY - 6, 10, 9, rep);
  drawHead(ctx, shX - 16, shY - 12, 12);
}
