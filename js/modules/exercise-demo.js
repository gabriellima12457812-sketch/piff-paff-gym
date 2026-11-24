/**
 * Piff Paff Gym — Motor de Micro-Vídeos Contínuos de Execução (60fps Kinematic Canvas)
 * Animação biomecânica suave em loop contínuo para todos os exercícios do Atlas e do Treino,
 * destacando em verde esmeralda o músculo alvo durante a contração + fase excêntrica/concêntrica.
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

  // Fallback por grupo muscular
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

/**
 * Monta o HTML de um card de micro-vídeo contínuo (Canvas + HUD de fase + botão YouTube)
 */
export function renderExerciseDemoMarkup(exerciseName, muscleName, compact = false) {
  const motion = detectExerciseMotion(exerciseName, muscleName);
  const ytUrl = buildYoutubeSearchUrl(exerciseName);
  const safeName = String(exerciseName).replace(/"/g, '&quot;');
  const safeMuscle = String(muscleName || '').replace(/"/g, '&quot;');

  return `
    <div class="demo-video-stage ${compact ? 'demo-video-compact' : ''}">
      <canvas
        class="demo-video-canvas"
        width="360"
        height="${compact ? 176 : 200}"
        data-demo-motion="${motion}"
        data-demo-muscle="${safeMuscle}"
        aria-label="Demonstração em vídeo contínuo de ${safeName}"
      ></canvas>
      <div class="demo-video-hud-top">
        <span class="demo-live-pill"><span class="demo-rec-dot"></span> EXECUÇÃO</span>
        <span class="demo-phase-badge" data-phase-label>CONTROLADO</span>
      </div>
      <a
        href="${ytUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="demo-yt-link"
        title="Assistir tutorial real no YouTube"
      >▶ YouTube ↗</a>
    </div>
  `;
}

/**
 * Inicia a animação contínua em 60fps para todos os canvases dentro de um container
 */
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
    const startTime = performance.now() - Math.random() * 1200;

    const render = (now) => {
      if (!alive || !canvas.isConnected) {
        if (rafId) cancelAnimationFrame(rafId);
        return;
      }
      const elapsed = (now - startTime) / 1000;
      // Ciclo biomecânico realista: 2.8s (descida controlada + pausa pico + subida firme)
      const cycle = (elapsed % 2.8) / 2.8;
      // Curva suave 0 -> 1 -> 0
      const rep = 0.5 - 0.5 * Math.cos(cycle * Math.PI * 2);

      if (phaseEl) {
        if (cycle < 0.42) phaseEl.textContent = 'CONCÊNTRICA ↑';
        else if (cycle < 0.55) phaseEl.textContent = 'PICO · 1s';
        else phaseEl.textContent = 'EXCÊNTRICA · 2s ↓';
      }

      drawExerciseFrame(ctx, canvas.width, canvas.height, motion, rep);
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    activeAnimations.add(() => {
      alive = false;
      if (rafId) cancelAnimationFrame(rafId);
    });
  });
}

function drawLimb(ctx, x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawGlowSpot(ctx, x, y, r, intensity) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, `rgba(52, 211, 153, ${0.42 + intensity * 0.48})`);
  g.addColorStop(0.55, `rgba(16, 185, 129, ${0.18 + intensity * 0.22})`);
  g.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawBarbell(ctx, x1, y1, x2, y2, plateRadius = 12) {
  drawLimb(ctx, x1, y1, x2, y2, 4, '#d4d4d8');
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(x1, y1, plateRadius, 0, Math.PI * 2);
  ctx.arc(x2, y2, plateRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawExerciseFrame(ctx, W, H, motion, rep) {
  // Fundo estúdio escuro
  ctx.fillStyle = '#0b0b0e';
  ctx.fillRect(0, 0, W, H);

  // Linha de solo sutil
  const floorY = H - 22;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(28, floorY);
  ctx.lineTo(W - 28, floorY);
  ctx.stroke();

  const body = '#d4d4d8';
  const bodyDim = '#71717a';
  const accent = '#10b981';
  const cx = W / 2;

  if (motion === 'bench_press') {
    const benchY = floorY - 36;
    // Banco
    drawLimb(ctx, cx - 72, benchY, cx + 62, benchY, 9, '#27272f');
    drawLimb(ctx, cx - 54, benchY, cx - 54, floorY, 6, '#27272f');
    drawLimb(ctx, cx + 44, benchY, cx + 44, floorY, 6, '#27272f');
    // Atleta deitado
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx - 56, benchY - 14, 11, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, cx - 42, benchY - 10, cx + 22, benchY - 10, 12, body); // tronco
    drawLimb(ctx, cx + 22, benchY - 10, cx + 52, benchY - 4, 9, bodyDim); // coxa
    drawLimb(ctx, cx + 52, benchY - 4, cx + 56, floorY - 2, 8, bodyDim); // canela
    // Braço empurrando barra
    const handY = benchY - 24 - rep * 48;
    const elbowX = cx - 28 - (1 - rep) * 10;
    const elbowY = benchY - 10 - rep * 22;
    drawGlowSpot(ctx, cx - 26, benchY - 14, 26, rep);
    drawLimb(ctx, cx - 30, benchY - 10, elbowX, elbowY, 8, body);
    drawLimb(ctx, elbowX, elbowY, cx - 24, handY, 7, body);
    drawBarbell(ctx, cx - 24, handY, cx - 24, handY, 13);
    return;
  }

  if (motion === 'pushup') {
    const drop = (1 - rep) * 26;
    const shoulderX = cx - 36;
    const shoulderY = floorY - 48 + drop;
    const hipX = cx + 18;
    const hipY = floorY - 32 + drop * 0.55;
    const footX = cx + 76;
    const footY = floorY - 4;
    drawGlowSpot(ctx, shoulderX + 6, shoulderY + 6, 28, rep);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(shoulderX - 18, shoulderY - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 11, body);
    drawLimb(ctx, hipX, hipY, footX, footY, 9, bodyDim);
    const elbowX = shoulderX + 8;
    const elbowY = (shoulderY + floorY) / 2 + (1 - rep) * 8;
    drawLimb(ctx, shoulderX, shoulderY, elbowX, elbowY, 7, body);
    drawLimb(ctx, elbowX, elbowY, shoulderX - 4, floorY - 3, 7, body);
    return;
  }

  if (motion === 'crossover' || motion === 'lateral_raise') {
    const isCross = motion === 'crossover';
    const headY = 48;
    const shY = 74;
    const hipY = 122;
    // Cabeça e tronco frontal
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, headY, 11, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, cx - 18, shY, cx + 18, shY, 11, body);
    drawLimb(ctx, cx, shY, cx, hipY, 18, body);
    drawLimb(ctx, cx - 10, hipY, cx - 14, floorY - 2, 9, bodyDim);
    drawLimb(ctx, cx + 10, hipY, cx + 14, floorY - 2, 9, bodyDim);

    if (isCross) {
      drawGlowSpot(ctx, cx, shY + 14, 30, rep);
      const spread = 66 - rep * 52;
      const hy = shY + 18 + rep * 10;
      drawLimb(ctx, cx - 18, shY, cx - spread, hy, 7, body);
      drawLimb(ctx, cx + 18, shY, cx + spread, hy, 7, body);
      // Cabos
      drawLimb(ctx, 42, 34, cx - spread, hy, 2, accent);
      drawLimb(ctx, W - 42, 34, cx + spread, hy, 2, accent);
    } else {
      drawGlowSpot(ctx, cx - 20, shY, 20, rep);
      drawGlowSpot(ctx, cx + 20, shY, 20, rep);
      const ang = 0.25 + rep * 1.28;
      const ax = Math.sin(ang) * 46;
      const ay = Math.cos(ang) * 46;
      drawLimb(ctx, cx - 18, shY, cx - 18 - ax, shY + ay, 7, body);
      drawLimb(ctx, cx + 18, shY, cx + 18 + ax, shY + ay, 7, body);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx - 18 - ax, shY + ay, 6, 0, Math.PI * 2);
      ctx.arc(cx + 18 + ax, shY + ay, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (motion === 'pulldown') {
    const barY = 34 + rep * 48;
    drawLimb(ctx, cx, 12, cx, barY, 2.5, accent); // cabo
    drawLimb(ctx, cx - 56, barY, cx + 56, barY, 5, '#e4e4e7'); // barra
    const headY = 82;
    const shY = 104;
    const hipY = 148;
    drawGlowSpot(ctx, cx - 16, shY + 18, 22, rep);
    drawGlowSpot(ctx, cx + 16, shY + 18, 22, rep);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, headY, 10, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, cx, shY, cx, hipY, 18, body);
    drawLimb(ctx, cx - 26, hipY + 4, cx + 26, hipY + 4, 8, '#27272f'); // banco
    const elY = shY - 12 + rep * 34;
    const elX = 36 + (1 - rep) * 8;
    drawLimb(ctx, cx - 16, shY, cx - elX, elY, 7, body);
    drawLimb(ctx, cx - elX, elY, cx - 44, barY, 6.5, body);
    drawLimb(ctx, cx + 16, shY, cx + elX, elY, 7, body);
    drawLimb(ctx, cx + elX, elY, cx + 44, barY, 6.5, body);
    return;
  }

  if (motion === 'row') {
    const hipX = cx + 22;
    const hipY = floorY - 62;
    const shX = cx - 24;
    const shY = floorY - 94;
    drawGlowSpot(ctx, (shX + hipX) / 2, (shY + hipY) / 2, 28, rep);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(shX - 14, shY - 10, 10, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, shX, shY, hipX, hipY, 12, body);
    drawLimb(ctx, hipX, hipY, cx + 12, floorY - 30, 10, bodyDim);
    drawLimb(ctx, cx + 12, floorY - 30, cx + 16, floorY - 2, 9, bodyDim);
    const handY = floorY - 24 - rep * 42;
    const handX = shX + rep * 22;
    const elX = shX + 10 + rep * 22;
    const elY = shY + 24 - rep * 28;
    drawLimb(ctx, shX, shY, elX, elY, 7.5, body);
    drawLimb(ctx, elX, elY, handX, handY, 7, body);
    drawBarbell(ctx, handX, handY, handX, handY, 12);
    return;
  }

  if (motion === 'overhead_press') {
    const headY = 66;
    const shY = 90;
    const hipY = 136;
    drawGlowSpot(ctx, cx - 18, shY, 22, rep);
    drawGlowSpot(ctx, cx + 18, shY, 22, rep);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, headY, 10, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, cx, shY, cx, hipY, 16, body);
    drawLimb(ctx, cx - 10, hipY, cx - 12, floorY - 2, 8, bodyDim);
    drawLimb(ctx, cx + 10, hipY, cx + 12, floorY - 2, 8, bodyDim);
    const handY = shY - 8 - rep * 48;
    const elY = shY + 14 - rep * 26;
    drawLimb(ctx, cx - 18, shY, cx - 38, elY, 7, body);
    drawLimb(ctx, cx - 38, elY, cx - 30, handY, 6.5, body);
    drawLimb(ctx, cx + 18, shY, cx + 38, elY, 7, body);
    drawLimb(ctx, cx + 38, elY, cx + 30, handY, 6.5, body);
    drawBarbell(ctx, cx - 38, handY, cx + 38, handY, 9);
    return;
  }

  if (motion === 'biceps_curl' || motion === 'triceps_ext') {
    const isBiceps = motion === 'biceps_curl';
    const shX = cx;
    const shY = 74;
    const hipY = 122;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(shX, 48, 10, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, shX, shY, shX, hipY, 14, body);
    drawLimb(ctx, shX, hipY, shX - 4, floorY - 2, 10, bodyDim);

    const elX = shX + 4;
    const elY = shY + 34;
    drawLimb(ctx, shX, shY, elX, elY, 8, body);

    if (isBiceps) {
      drawGlowSpot(ctx, shX + 6, shY + 18, 22, rep);
      const ang = 1.45 - rep * 2.1; // desce para baixo -> sobe até o ombro
      const hx = elX + Math.cos(ang) * 32;
      const hy = elY + Math.sin(ang) * 32;
      drawLimb(ctx, elX, elY, hx, hy, 7, body);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(hx, hy, 7.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawGlowSpot(ctx, shX - 6, shY + 18, 22, rep);
      const ang = -0.5 + rep * 1.95; // 90° -> extensão completa p/ baixo
      const hx = elX + Math.cos(ang) * 32;
      const hy = elY + Math.sin(ang) * 32;
      drawLimb(ctx, elX + 26, 20, hx, hy, 2, accent);
      drawLimb(ctx, elX, elY, hx, hy, 7, body);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(hx, hy, 6.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (motion === 'hip_thrust') {
    const benchX = cx - 56;
    const benchY = floorY - 34;
    drawLimb(ctx, benchX - 24, benchY, benchX + 8, benchY, 10, '#27272f');
    drawLimb(ctx, benchX - 12, benchY, benchX - 12, floorY, 7, '#27272f');

    const shX = benchX + 6;
    const shY = benchY - 6;
    const hipX = cx + 2;
    const hipY = floorY - 12 - rep * 34;
    const kneeX = cx + 48;
    const kneeY = floorY - 40;
    const footX = cx + 52;
    const footY = floorY - 2;

    drawGlowSpot(ctx, hipX, hipY, 30, rep);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(shX - 14, shY - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, shX, shY, hipX, hipY, 12, body);
    drawLimb(ctx, hipX, hipY, kneeX, kneeY, 10, body);
    drawLimb(ctx, kneeX, kneeY, footX, footY, 9, bodyDim);
    drawBarbell(ctx, hipX, hipY - 8, hipX, hipY - 8, 13);
    return;
  }

  if (motion === 'squat') {
    const drop = (1 - rep) * 40;
    const footX = cx + 4;
    const kneeX = cx - 14 - (1 - rep) * 14;
    const kneeY = floorY - 38 + drop * 0.25;
    const hipX = cx + 10 + (1 - rep) * 20;
    const hipY = floorY - 76 + drop;
    const shX = cx + 4 + (1 - rep) * 6;
    const shY = hipY - 42;

    drawGlowSpot(ctx, (hipX + kneeX) / 2, (hipY + kneeY) / 2, 28, 1 - rep);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(shX - 4, shY - 16, 10, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, shX, shY, hipX, hipY, 12, body);
    drawLimb(ctx, hipX, hipY, kneeX, kneeY, 10, body);
    drawLimb(ctx, kneeX, kneeY, footX, floorY - 2, 9, bodyDim);
    drawBarbell(ctx, shX + 4, shY - 2, shX + 4, shY - 2, 12);
    return;
  }

  if (motion === 'rdl_hinge') {
    const hinge = 1 - rep; // 0 = em pé, 1 = inclinado
    const footX = cx + 4;
    const hipX = cx + 6 + hinge * 22;
    const hipY = floorY - 74 + hinge * 8;
    const shX = hipX - hinge * 44;
    const shY = hipY - (1 - hinge * 0.65) * 44;
    const handX = shX - 4;
    const handY = shY + 42 + hinge * 10;

    drawGlowSpot(ctx, (hipX + footX) / 2 + 4, (hipY + floorY) / 2, 28, hinge);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(shX - hinge * 12, shY - 14 + hinge * 8, 10, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, shX, shY, hipX, hipY, 12, body);
    drawLimb(ctx, hipX, hipY, footX, floorY - 2, 10, bodyDim);
    drawLimb(ctx, shX, shY, handX, handY, 7, body);
    drawBarbell(ctx, handX, handY, handX, handY, 12);
    return;
  }

  if (motion === 'calf_raise') {
    const lift = rep * 18;
    const stepY = floorY - 10;
    drawLimb(ctx, cx - 26, stepY, cx + 26, stepY, 10, '#27272f');
    const ankleY = stepY - 6 - lift;
    const hipY = ankleY - 74;
    const shY = hipY - 44;
    drawGlowSpot(ctx, cx + 6, ankleY - 22, 24, rep);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, shY - 16, 10, 0, Math.PI * 2);
    ctx.fill();
    drawLimb(ctx, cx, shY, cx, hipY, 13, body);
    drawLimb(ctx, cx, hipY, cx, ankleY, 10, body);
    drawLimb(ctx, cx, ankleY, cx - 14, stepY - 4, 7, bodyDim);
    return;
  }

  // abs_core (Crunch controlado)
  const curl = rep * 30;
  const hipX = cx + 8;
  const hipY = floorY - 8;
  const shX = cx - 42 + curl * 0.55;
  const shY = floorY - 14 - curl;
  drawGlowSpot(ctx, (shX + hipX) / 2, hipY - 12, 28, rep);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(shX - 12, shY - 10, 10, 0, Math.PI * 2);
  ctx.fill();
  drawLimb(ctx, shX, shY, hipX, hipY, 11, body);
  drawLimb(ctx, hipX, hipY, cx + 42, floorY - 34, 9, bodyDim);
  drawLimb(ctx, cx + 42, floorY - 34, cx + 66, floorY - 4, 8, bodyDim);
}
