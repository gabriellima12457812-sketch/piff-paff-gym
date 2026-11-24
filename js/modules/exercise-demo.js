/**
 * Piff Paff Gym — Motor Individualizado de Execução (Vídeos Reais 30fps + Animações Anatômicas 60fps)
 * Cada exercício mapeia exatamente para a SUA própria mecânica de movimento — sem repetir nem trocar exercício.
 *  - Exercícios principais com vídeo real em estúdio (30fps fluxo óptico): <video autoplay loop muted playsinline>
 *  - Demais variações específicas: animação biomecânica dedicada 60fps no mesmo estúdio escuro + brilho esmeralda.
 */

let activeCleanupFns = new Set();

export function stopAllDemoVideos() {
  for (const fn of activeCleanupFns) {
    fn();
  }
  activeCleanupFns.clear();
}

/**
 * Mapeamento exato por exercício (ordem do mais específico para o mais genérico)
 * Retorna { kind: 'video' | 'anim', id: string }
 */
export function detectExerciseSpec(name = '', muscle = '') {
  const n = String(name).toLowerCase();
  const m = String(muscle).toLowerCase();

  // --- PEITO ---
  if (n.includes('supino inclinado')) return { kind: 'video', id: 'bench_press' };
  if (n.includes('supino reto com barra')) return { kind: 'anim', id: 'flat_bench' };
  if (n.includes('supino') && (n.includes('halter') || n.includes('flexão') || n.includes('flexao'))) return { kind: 'anim', id: 'dumbbell_press' };
  if (n.includes('supino')) return { kind: 'anim', id: 'flat_bench' };
  if (n.includes('crossover') || n.includes('crucifixo')) {
    if (n.includes('inverso')) return { kind: 'anim', id: 'face_pull' };
    return { kind: 'anim', id: 'crossover' };
  }
  if (n.includes('flexão declinada') || n.includes('flexao declinada')) return { kind: 'anim', id: 'decline_pushup' };
  if (n.includes('flexão pike') || n.includes('flexao pike')) return { kind: 'anim', id: 'pike_pushup' };
  if (n.includes('flexão diamante') || n.includes('mergulho') || n.includes('paralelas')) return { kind: 'anim', id: 'dips' };
  if (n.includes('flexão') || n.includes('flexao')) return { kind: 'video', id: 'pushup' };

  // --- COSTAS & TRAPÉZIO ---
  if (n.includes('pulldown')) return { kind: 'anim', id: 'straight_arm_pulldown' };
  if (n.includes('puxada')) return { kind: 'video', id: 'pulldown' };
  if (n.includes('dead hang') || n.includes('sustentação na barra')) return { kind: 'anim', id: 'dead_hang' };
  if (n.includes('elevação de pernas') || n.includes('elevacao de pernas')) return { kind: 'anim', id: 'hanging_leg_raise' };
  if (n.includes('barra fixa') || n.includes('remada invertida')) return { kind: 'anim', id: 'pullup' };
  if (n.includes('cavalinho') || n.includes('t-bar')) return { kind: 'anim', id: 'tbar_row' };
  if (n.includes('peito apoiado')) return { kind: 'anim', id: 'chest_supported_row' };
  if (n.includes('unilateral') && n.includes('remada') || n.includes('serrote')) return { kind: 'anim', id: 'one_arm_row' };
  if (n.includes('remada')) return { kind: 'video', id: 'row' };
  if (n.includes('encolhimento') && n.includes('mochila')) return { kind: 'anim', id: 'db_shrug' };
  if (n.includes('encolhimento')) return { kind: 'anim', id: 'barbell_shrug' };
  if (n.includes('y-t-w')) return { kind: 'anim', id: 'ytw_raise' };

  // --- OMBROS ---
  if (n.includes('face pull')) return { kind: 'anim', id: 'face_pull' };
  if (n.includes('arnold')) return { kind: 'anim', id: 'overhead_press' };
  if (n.includes('desenvolvimento em pé') || n.includes('desenvolvimento em pe')) return { kind: 'anim', id: 'standing_ohp' };
  if (n.includes('desenvolvimento')) return { kind: 'anim', id: 'overhead_press' };
  if (n.includes('elevação lateral') && (n.includes('elástico') || n.includes('elastico') || n.includes('unilateral'))) return { kind: 'anim', id: 'band_lateral' };
  if (n.includes('elevação lateral') || n.includes('elevacao lateral')) return { kind: 'video', id: 'lateral_raise' };

  // --- BÍCEPS & ANTEBRAÇO ---
  if (n.includes('bayesian')) return { kind: 'anim', id: 'bayesian_curl' };
  if (n.includes('rosca inclinada')) return { kind: 'anim', id: 'incline_curl' };
  if (n.includes('rosca inversa')) return { kind: 'anim', id: 'reverse_curl' };
  if (n.includes('martelo')) return { kind: 'anim', id: 'hammer_curl' };
  if (n.includes('rosca direta')) return { kind: 'video', id: 'biceps_curl' };
  if (n.includes('rosca')) return { kind: 'anim', id: 'incline_curl' };

  // --- TRÍCEPS ---
  if (n.includes('francês') || n.includes('frances') || n.includes('acima da cabeça')) return { kind: 'anim', id: 'overhead_triceps' };
  if (n.includes('testa')) return { kind: 'anim', id: 'skull_crusher' };
  if (n.includes('tríceps') || n.includes('triceps')) return { kind: 'video', id: 'triceps_ext' };

  // --- ABDÔMEN & LOMBAR ---
  if (n.includes('crunch na polia')) return { kind: 'anim', id: 'cable_crunch' };
  if (n.includes('vacuum') || n.includes('prancha')) return { kind: 'anim', id: 'plank_vacuum' };
  if (n.includes('canivete') || n.includes('abdominal') || n.includes('crunch')) return { kind: 'anim', id: 'v_up_crunch' };
  if (n.includes('extensão lombar') || n.includes('banco romano')) return { kind: 'anim', id: 'back_extension' };
  if (n.includes('superman') || n.includes('bird-dog')) return { kind: 'anim', id: 'superman' };
  if (n.includes('rack pull') || (n.includes('levantamento terra') && !n.includes('romeno'))) return { kind: 'anim', id: 'deadlift' };

  // --- GLÚTEOS ---
  if (n.includes('abdutora') || n.includes('abdução') || n.includes('clamshell')) return { kind: 'anim', id: 'hip_abduction' };
  if (n.includes('coice') || n.includes('kickback')) return { kind: 'anim', id: 'glute_kickback' };
  if (n.includes('ponte de glúteo') || n.includes('frog pump')) return { kind: 'anim', id: 'single_leg_bridge' };
  if (n.includes('hip thrust') || n.includes('pélvica') || n.includes('pelvica')) return { kind: 'video', id: 'hip_thrust' };

  // --- PANTURRILHA (verificar antes de Leg Press!) ---
  if (n.includes('panturrilha') && n.includes('halter')) return { kind: 'anim', id: 'weighted_calf' };
  if (n.includes('panturrilha') && n.includes('degrau')) return { kind: 'anim', id: 'single_calf' };
  if (n.includes('panturrilha')) return { kind: 'video', id: 'calf_raise' };

  // --- QUADRÍCEPS & POSTERIORES ---
  if (n.includes('extensora')) return { kind: 'anim', id: 'leg_extension' };
  if (n.includes('leg press')) return { kind: 'anim', id: 'leg_press' };
  if (n.includes('búlgaro') || n.includes('bulgaro') || n.includes('afundo') || n.includes('passada') || n.includes('step-up')) return { kind: 'anim', id: 'bulgarian_squat' };
  if (n.includes('goblet') || n.includes('sumô') || n.includes('sissy')) return { kind: 'anim', id: 'goblet_squat' };
  if (n.includes('agachamento')) return { kind: 'video', id: 'squat' };
  if (n.includes('slider') || n.includes('nórdica')) return { kind: 'anim', id: 'slider_curl' };
  if (n.includes('flexora')) return { kind: 'anim', id: 'leg_curl' };
  if ((n.includes('rdl') || n.includes('stiff')) && n.includes('unilateral')) return { kind: 'anim', id: 'single_leg_rdl' };
  if (n.includes('rdl') || n.includes('stiff') || n.includes('terra romeno')) return { kind: 'video', id: 'rdl_hinge' };

  // --- CARDIO ---
  if (n.includes('hiit') || n.includes('burpee') || n.includes('cardio')) return { kind: 'anim', id: 'hiit_cardio' };

  // Fallbacks por grupo muscular
  if (m.includes('peito')) return { kind: 'video', id: 'bench_press' };
  if (m.includes('costas')) return { kind: 'video', id: 'pulldown' };
  if (m.includes('ombro')) return { kind: 'video', id: 'lateral_raise' };
  if (m.includes('bíceps')) return { kind: 'video', id: 'biceps_curl' };
  if (m.includes('tríceps')) return { kind: 'video', id: 'triceps_ext' };
  if (m.includes('glúteo')) return { kind: 'video', id: 'hip_thrust' };
  if (m.includes('posterior')) return { kind: 'video', id: 'rdl_hinge' };
  if (m.includes('panturrilha')) return { kind: 'video', id: 'calf_raise' };
  if (m.includes('perna') || m.includes('quadríceps')) return { kind: 'video', id: 'squat' };
  return { kind: 'anim', id: 'v_up_crunch' };
}

export function detectExerciseMotion(name = '', muscle = '') {
  return detectExerciseSpec(name, muscle).id;
}

export function buildYoutubeSearchUrl(exerciseName) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `como fazer ${exerciseName} execucao correta`
  )}`;
}

export function renderExerciseDemoMarkup(exerciseName, muscleName, compact = false) {
  const spec = detectExerciseSpec(exerciseName, muscleName);
  const ytUrl = buildYoutubeSearchUrl(exerciseName);
  const safeName = String(exerciseName).replace(/"/g, '&quot;');

  if (spec.kind === 'video') {
    const videoSrc = `./assets/videos/${spec.id}.mp4?v=2`;
    return `
      <div class="demo-video-stage ${compact ? 'demo-video-compact' : ''}">
        <video
          class="demo-real-video"
          src="${videoSrc}"
          autoplay
          loop
          muted
          playsinline
          preload="auto"
          aria-label="Execução de ${safeName}"
        ></video>
        <div class="demo-video-hud-top">
          <span class="demo-live-pill"><span class="demo-rec-dot"></span> EXECUÇÃO</span>
          <span class="demo-phase-badge" data-phase-label>CONTROLADO</span>
        </div>
        <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" class="demo-yt-link">▶ YouTube ↗</a>
      </div>
    `;
  }

  return `
    <div class="demo-video-stage ${compact ? 'demo-video-compact' : ''}">
      <canvas
        class="demo-video-canvas"
        width="480"
        height="${compact ? 210 : 240}"
        data-demo-anim="${spec.id}"
        aria-label="Execução de ${safeName}"
      ></canvas>
      <div class="demo-video-hud-top">
        <span class="demo-live-pill"><span class="demo-rec-dot"></span> EXECUÇÃO</span>
        <span class="demo-phase-badge" data-phase-label>CONTROLADO</span>
      </div>
      <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" class="demo-yt-link">▶ YouTube ↗</a>
    </div>
  `;
}

export function mountDemoVideos(container) {
  stopAllDemoVideos();
  if (!container) return;

  // 1. Vídeos MP4 reais em estúdio (30fps fluxo óptico)
  container.querySelectorAll('video.demo-real-video').forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});

    const phaseEl = video.closest('.demo-video-stage')?.querySelector('[data-phase-label]');
    const onTimeUpdate = () => {
      if (!phaseEl || !video.duration) return;
      const p = video.currentTime / video.duration;
      if (p < 0.36) phaseEl.textContent = 'CONCÊNTRICA ↑';
      else if (p < 0.62) phaseEl.textContent = 'PICO · CONTRAÇÃO';
      else phaseEl.textContent = 'EXCÊNTRICA ↓';
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    activeCleanupFns.add(() => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.pause();
    });
  });

  // 2. Animações biomecânicas dedicadas 60fps para cada variação específica
  container.querySelectorAll('canvas[data-demo-anim]').forEach((canvas) => {
    const animId = canvas.dataset.demoAnim;
    const phaseEl = canvas.closest('.demo-video-stage')?.querySelector('[data-phase-label]');
    const ctx = canvas.getContext('2d');
    let rafId = null;
    let alive = true;
    const startTime = performance.now() - Math.random() * 800;

    const render = (now) => {
      if (!alive || !canvas.isConnected) {
        if (rafId) cancelAnimationFrame(rafId);
        return;
      }
      const elapsed = (now - startTime) / 1000;
      const cycle = (elapsed % 2.6) / 2.6;

      let rep = 0;
      if (cycle < 0.42) rep = 0.5 - 0.5 * Math.cos((cycle / 0.42) * Math.PI);
      else if (cycle < 0.56) rep = 1.0;
      else rep = 0.5 + 0.5 * Math.cos(((cycle - 0.56) / 0.44) * Math.PI);

      if (phaseEl) {
        if (animId === 'plank_vacuum' || animId === 'dead_hang') phaseEl.textContent = 'ISOMETRIA · FOCO';
        else if (cycle < 0.42) phaseEl.textContent = 'CONCÊNTRICA ↑';
        else if (cycle < 0.56) phaseEl.textContent = 'PICO · CONTRAÇÃO';
        else phaseEl.textContent = 'EXCÊNTRICA ↓';
      }

      drawExerciseAnim(ctx, canvas.width, canvas.height, animId, rep, elapsed);
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    activeCleanupFns.add(() => {
      alive = false;
      if (rafId) cancelAnimationFrame(rafId);
    });
  });
}

/* ============================================================================
   ENGINE BIOMECÂNICA ESCULPIDA 60FPS (Estúdio Escuro + Destaque Esmeralda)
   ============================================================================ */
function seg(ctx, x1, y1, x2, y2, r1, r2, fill, stroke = null) {
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

function glowMuscle(ctx, x1, y1, x2, y2, r1, r2, intensity) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const gr = Math.max(r1, r2) * 2.4 + Math.hypot(x2 - x1, y2 - y1) * 0.35;
  const g = ctx.createRadialGradient(mx, my, 2, mx, my, gr);
  g.addColorStop(0, `rgba(52, 211, 153, ${0.4 + intensity * 0.42})`);
  g.addColorStop(0.55, `rgba(16, 185, 129, ${0.15 + intensity * 0.2})`);
  g.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(mx, my, gr, 0, Math.PI * 2);
  ctx.fill();
  seg(ctx, x1, y1, x2, y2, r1 * 1.04, r2 * 1.04, `rgba(16, 185, 129, ${0.42 + intensity * 0.4})`, `rgba(110, 231, 183, ${0.45 + intensity * 0.45})`);
}

function head(ctx, x, y, r = 12) {
  const g = ctx.createRadialGradient(x - 3, y - 4, 2, x, y, r * 1.2);
  g.addColorStop(0, '#c8a58b');
  g.addColorStop(1, '#7a5c47');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.arc(x, y - 3, r * 0.96, Math.PI * 1.05, Math.PI * 1.98);
  ctx.fill();
}

function bar(ctx, x1, y1, x2, y2, pr = 15) {
  ctx.strokeStyle = '#a1a1aa';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const plate = (px, py) => {
    ctx.fillStyle = '#18181d';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  plate(x1, y1);
  if (Math.hypot(x2 - x1, y2 - y1) > 8) plate(x2, y2);
}

function db(ctx, x, y, r = 8) {
  ctx.fillStyle = '#18181d';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function cable(ctx, x1, y1, x2, y2) {
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawExerciseAnim(ctx, W, H, id, rep, elapsed) {
  const bg = ctx.createRadialGradient(W / 2, H * 0.42, 20, W / 2, H * 0.5, W * 0.65);
  bg.addColorStop(0, '#16161c');
  bg.addColorStop(1, '#09090b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const floorY = H - 22;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, floorY);
  ctx.lineTo(W - 30, floorY);
  ctx.stroke();

  const skin = '#b68f73';
  const skinB = '#8f6c54';
  const shorts = '#111115';
  const bench = '#1d1d24';
  const cx = W / 2;

  switch (id) {
    case 'flat_bench':
    case 'dumbbell_press': {
      const by = floorY - 46;
      seg(ctx, cx - 94, by, cx + 82, by, 7, 7, bench, '#32323d');
      seg(ctx, cx - 70, by + 4, cx - 70, floorY, 5, 5, '#27272f');
      seg(ctx, cx + 58, by + 4, cx + 58, floorY, 5, 5, '#27272f');
      seg(ctx, cx + 22, by - 12, cx + 68, by - 4, 13, 10, shorts);
      seg(ctx, cx + 68, by - 4, cx + 74, floorY - 4, 9, 6, skinB);
      head(ctx, cx - 76, by - 16, 12);
      seg(ctx, cx - 56, by - 14, cx + 22, by - 12, 16, 13, skin);
      glowMuscle(ctx, cx - 52, by - 19, cx - 22, by - 18, 12, 10, rep);
      const hy = by - 32 - rep * 66;
      const hx = cx - 34 + (id === 'dumbbell_press' ? (1 - rep) * 14 : 0);
      const ex = cx - 44 - (1 - rep) * 14;
      const ey = by - 10 - rep * 30;
      seg(ctx, cx - 44, by - 14, ex, ey, 9, 7.5, skin);
      seg(ctx, ex, ey, hx, hy, 7, 5.5, skin);
      if (id === 'dumbbell_press') db(ctx, hx, hy, 11);
      else bar(ctx, hx, hy, hx, hy, 17);
      break;
    }

    case 'crossover': {
      const shY = 72;
      const hipY = 136;
      seg(ctx, cx - 14, hipY, cx - 18, hipY + 34, 13, 11, shorts);
      seg(ctx, cx + 14, hipY, cx + 18, hipY + 34, 13, 11, shorts);
      seg(ctx, cx - 18, hipY + 34, cx - 20, floorY - 4, 9.5, 6, skinB);
      seg(ctx, cx + 18, hipY + 34, cx + 20, floorY - 4, 9.5, 6, skinB);
      seg(ctx, cx, shY, cx, hipY, 24, 16, skin);
      head(ctx, cx, 45, 13);
      glowMuscle(ctx, cx - 16, shY + 12, cx - 3, shY + 14, 10, 10, rep);
      glowMuscle(ctx, cx + 16, shY + 12, cx + 3, shY + 14, 10, 10, rep);
      const sp = 92 - rep * 76;
      const hy = shY + 24 + rep * 14;
      cable(ctx, 44, 28, cx - sp, hy);
      cable(ctx, W - 44, 28, cx + sp, hy);
      seg(ctx, cx - 22, shY + 4, cx - sp, hy, 8, 5.5, skin);
      seg(ctx, cx + 22, shY + 4, cx + sp, hy, 8, 5.5, skin);
      break;
    }

    case 'decline_pushup': {
      // Pés elevados no banco
      seg(ctx, cx + 64, floorY - 44, cx + 122, floorY - 44, 7, 7, bench, '#32323d');
      seg(ctx, cx + 92, floorY - 40, cx + 92, floorY, 6, 6, '#27272f');
      const drop = (1 - rep) * 34;
      const shX = cx - 64;
      const shY = floorY - 58 + drop;
      const hipX = cx + 12;
      const hipY = floorY - 54 + drop * 0.4;
      seg(ctx, hipX, hipY, cx + 82, floorY - 52, 13, 8, shorts);
      seg(ctx, shX, shY, hipX, hipY, 15, 12, skin);
      head(ctx, shX - 20, shY - 8, 12);
      glowMuscle(ctx, shX, shY + 4, shX + 26, shY + 6, 11, 9, rep);
      const ex = shX + 12 + (1 - rep) * 14;
      const ey = (shY + floorY) / 2 + (1 - rep) * 8;
      seg(ctx, shX, shY + 2, ex, ey, 8.5, 7, skin);
      seg(ctx, ex, ey, shX - 4, floorY - 4, 6.5, 5, skin);
      break;
    }

    case 'pike_pushup': {
      const drop = (1 - rep) * 32;
      const hipX = cx + 12;
      const hipY = floorY - 122 + drop * 0.25;
      const shX = cx - 44;
      const shY = floorY - 62 + drop;
      const footX = cx + 76;
      seg(ctx, hipX, hipY, cx + 48, floorY - 60, 13, 10, shorts);
      seg(ctx, cx + 48, floorY - 60, footX, floorY - 4, 9, 6, skinB);
      seg(ctx, shX, shY, hipX, hipY, 15, 12, skin);
      head(ctx, shX - 14, shY + 14, 12);
      glowMuscle(ctx, shX - 6, shY - 6, shX + 8, shY - 12, 11, 10, rep);
      seg(ctx, shX, shY, shX - 2, floorY - 4, 7.5, 5.5, skin);
      break;
    }

    case 'overhead_press':
    case 'standing_ohp': {
      const seated = id === 'overhead_press';
      const shY = seated ? 104 : 96;
      const hipY = seated ? 158 : 150;
      if (seated) {
        seg(ctx, cx - 32, hipY + 8, cx + 32, hipY + 8, 7, 7, bench, '#32323d');
      } else {
        seg(ctx, cx - 14, hipY, cx - 16, hipY + 34, 12, 10, shorts);
        seg(ctx, cx + 14, hipY, cx + 16, hipY + 34, 12, 10, shorts);
        seg(ctx, cx - 16, hipY + 34, cx - 18, floorY - 4, 9, 6, skinB);
        seg(ctx, cx + 16, hipY + 34, cx + 18, floorY - 4, 9, 6, skinB);
      }
      seg(ctx, cx, shY, cx, hipY, 23, 15, skin);
      glowMuscle(ctx, cx - 23, shY + 2, cx - 16, shY + 9, 9.5, 8.5, rep);
      glowMuscle(ctx, cx + 23, shY + 2, cx + 16, shY + 9, 9.5, 8.5, rep);
      head(ctx, cx, shY - 26, 12);
      const hy = shY - 10 - rep * 62;
      const ey = shY + 16 - rep * 34;
      seg(ctx, cx - 22, shY + 4, cx - 48, ey, 8.5, 7, skin);
      seg(ctx, cx - 48, ey, cx - 36, hy, 6.5, 5, skin);
      seg(ctx, cx + 22, shY + 4, cx + 48, ey, 8.5, 7, skin);
      seg(ctx, cx + 48, ey, cx + 36, hy, 6.5, 5, skin);
      db(ctx, cx - 36, hy, 9);
      db(ctx, cx + 36, hy, 9);
      break;
    }

    case 'face_pull': {
      const shX = cx + 24;
      const shY = 82;
      const hipY = 142;
      seg(ctx, shX, hipY, shX + 4, hipY + 34, 14, 11, shorts);
      seg(ctx, shX + 4, hipY + 34, shX + 8, floorY - 4, 9.5, 6, skinB);
      seg(ctx, shX, shY, shX, hipY, 17, 13, skin);
      head(ctx, shX - 2, 54, 12);
      glowMuscle(ctx, shX - 2, shY + 2, shX + 12, shY + 8, 10, 9, rep);
      const hx = shX - 76 + rep * 62;
      const hy = shY - 12;
      const ex = shX - 38 + rep * 48;
      const ey = shY - 6 - rep * 12;
      cable(ctx, 48, 66, hx, hy);
      seg(ctx, shX - 4, shY + 2, ex, ey, 8, 6.5, skin);
      seg(ctx, ex, ey, hx, hy, 6.5, 5, skin);
      db(ctx, hx, hy, 6);
      break;
    }

    case 'band_lateral': {
      const shY = 74;
      const hipY = 136;
      seg(ctx, cx - 14, hipY, cx - 18, hipY + 34, 13, 11, shorts);
      seg(ctx, cx + 14, hipY, cx + 18, hipY + 34, 13, 11, shorts);
      seg(ctx, cx - 18, hipY + 34, cx - 20, floorY - 4, 9, 6, skinB);
      seg(ctx, cx + 18, hipY + 34, cx + 20, floorY - 4, 9, 6, skinB);
      seg(ctx, cx, shY, cx, hipY, 23, 15, skin);
      head(ctx, cx, 46, 12);
      glowMuscle(ctx, cx - 24, shY + 3, cx - 18, shY + 10, 9.5, 8.5, rep);
      glowMuscle(ctx, cx + 24, shY + 3, cx + 18, shY + 10, 9.5, 8.5, rep);
      const ang = 0.25 + rep * 1.3;
      const ax = Math.sin(ang) * 62;
      const ay = Math.cos(ang) * 62;
      // Elástico saindo dos pés
      cable(ctx, cx - 20, floorY - 4, cx - 22 - ax, shY + 4 + ay);
      cable(ctx, cx + 20, floorY - 4, cx + 22 + ax, shY + 4 + ay);
      seg(ctx, cx - 22, shY + 4, cx - 22 - ax, shY + 4 + ay, 8, 5.5, skin);
      seg(ctx, cx + 22, shY + 4, cx + 22 + ax, shY + 4 + ay, 8, 5.5, skin);
      break;
    }

    case 'straight_arm_pulldown': {
      const shX = cx + 24;
      const shY = 86;
      const hipX = cx + 42;
      const hipY = 144;
      seg(ctx, hipX, hipY, hipX - 6, floorY - 4, 11, 7, skinB);
      seg(ctx, shX, shY, hipX, hipY, 16, 13, skin);
      glowMuscle(ctx, shX + 6, shY + 14, hipX - 2, hipY - 12, 11, 8, rep);
      head(ctx, shX - 10, shY - 22, 12);
      const ang = -0.35 + rep * 1.55;
      const hx = shX - Math.cos(ang) * 62;
      const hy = shY + Math.sin(ang) * 62;
      cable(ctx, 74, 18, hx, hy);
      seg(ctx, shX, shY + 4, hx, hy, 8, 5.5, skin);
      db(ctx, hx, hy, 6);
      break;
    }

    case 'pullup':
    case 'dead_hang': {
      const barY = 30;
      seg(ctx, cx - 86, barY, cx + 86, barY, 4, 4, '#a1a1aa');
      const lift = id === 'dead_hang' ? Math.sin(elapsed * 2) * 3 : rep * 56;
      const shY = 104 - lift;
      const hipY = shY + 58;
      seg(ctx, cx - 12, hipY, cx - 14, hipY + 34, 12, 10, shorts);
      seg(ctx, cx + 12, hipY, cx + 14, hipY + 34, 12, 10, shorts);
      seg(ctx, cx - 14, hipY + 34, cx - 16, hipY + 62, 8.5, 6, skinB);
      seg(ctx, cx + 14, hipY + 34, cx + 16, hipY + 62, 8.5, 6, skinB);
      seg(ctx, cx, shY, cx, hipY, 24, 15, skin);
      if (id === 'dead_hang') {
        glowMuscle(ctx, cx - 42, barY + 20, cx - 34, barY + 46, 7, 6, 0.8);
        glowMuscle(ctx, cx + 42, barY + 20, cx + 34, barY + 46, 7, 6, 0.8);
      } else {
        glowMuscle(ctx, cx - 18, shY + 12, cx - 10, shY + 40, 11, 8, rep);
        glowMuscle(ctx, cx + 18, shY + 12, cx + 10, shY + 40, 11, 8, rep);
      }
      head(ctx, cx, shY - 22, 12);
      const ex = 44 + rep * 10;
      const ey = (barY + shY) / 2 + rep * 22;
      seg(ctx, cx - 22, shY + 4, cx - ex, ey, 8, 6.5, skin);
      seg(ctx, cx - ex, ey, cx - 44, barY, 6.5, 5, skin);
      seg(ctx, cx + 22, shY + 4, cx + ex, ey, 8, 6.5, skin);
      seg(ctx, cx + ex, ey, cx + 44, barY, 6.5, 5, skin);
      break;
    }

    case 'one_arm_row':
    case 'chest_supported_row':
    case 'tbar_row': {
      const by = floorY - 56;
      if (id !== 'tbar_row') {
        seg(ctx, cx - 80, by, cx + 70, by, 7, 7, bench, '#32323d');
        seg(ctx, cx - 58, by + 6, cx - 58, floorY, 5, 5, '#27272f');
        seg(ctx, cx + 48, by + 6, cx + 48, floorY, 5, 5, '#27272f');
      }
      const shX = cx - 40;
      const shY = id === 'chest_supported_row' ? by - 44 : by - 30;
      const hipX = cx + 32;
      const hipY = by - 14;
      seg(ctx, hipX, hipY, cx + 44, floorY - 4, 12, 7, skinB);
      seg(ctx, shX, shY, hipX, hipY, 16, 13, skin);
      glowMuscle(ctx, shX + 10, shY + 6, hipX - 10, hipY - 2, 12, 9, rep);
      head(ctx, shX - 18, shY - 12, 12);
      const hy = floorY - 18 - rep * 54;
      const hx = shX + 6 + rep * 26;
      const ex = shX + 16 + rep * 32;
      const ey = shY + 26 - rep * 34;
      seg(ctx, shX, shY + 4, ex, ey, 8.5, 7, skin);
      seg(ctx, ex, ey, hx, hy, 6.5, 5, skin);
      if (id === 'tbar_row') bar(ctx, hx, hy, hx, hy, 17);
      else db(ctx, hx, hy, 10);
      break;
    }

    case 'barbell_shrug':
    case 'db_shrug': {
      const lift = rep * 16;
      const shY = 82 - lift;
      const hipY = 148;
      seg(ctx, cx - 14, hipY, cx - 16, floorY - 4, 11, 7, skinB);
      seg(ctx, cx + 14, hipY, cx + 16, floorY - 4, 11, 7, skinB);
      seg(ctx, cx, shY, cx, hipY, 24, 16, skin);
      glowMuscle(ctx, cx - 22, shY - 4, cx, shY - 14, 9, 9, rep);
      glowMuscle(ctx, cx + 22, shY - 4, cx, shY - 14, 9, 9, rep);
      head(ctx, cx, 50, 13);
      seg(ctx, cx - 24, shY + 4, cx - 28, hipY + 14 - lift, 8, 6, skin);
      seg(ctx, cx + 24, shY + 4, cx + 28, hipY + 14 - lift, 8, 6, skin);
      if (id === 'barbell_shrug') bar(ctx, cx - 54, hipY + 14 - lift, cx + 54, hipY + 14 - lift, 14);
      else {
        db(ctx, cx - 28, hipY + 16 - lift, 10);
        db(ctx, cx + 28, hipY + 16 - lift, 10);
      }
      break;
    }

    case 'ytw_raise': {
      const shY = 110;
      const hipY = 156;
      seg(ctx, cx - 14, hipY, cx - 16, floorY - 4, 10, 7, skinB);
      seg(ctx, cx + 14, hipY, cx + 16, floorY - 4, 10, 7, skinB);
      seg(ctx, cx, shY, cx, hipY, 22, 15, skin);
      glowMuscle(ctx, cx - 14, shY + 4, cx + 14, shY + 16, 10, 10, rep);
      head(ctx, cx, shY - 22, 12);
      const ang = 0.35 + rep * 1.9;
      const ax = Math.sin(ang) * 58;
      const ay = Math.cos(ang) * 58;
      seg(ctx, cx - 20, shY + 2, cx - 20 - ax, shY + ay, 7.5, 5.5, skin);
      seg(ctx, cx + 20, shY + 2, cx + 20 + ax, shY + ay, 7.5, 5.5, skin);
      break;
    }

    case 'bayesian_curl':
    case 'incline_curl':
    case 'hammer_curl':
    case 'reverse_curl': {
      const shX = cx;
      const shY = 76;
      const hipY = 138;
      if (id === 'incline_curl') {
        seg(ctx, cx - 44, floorY - 40, cx - 10, 74, 7, 7, bench, '#32323d');
      }
      seg(ctx, shX, hipY, shX - 4, floorY - 4, 12, 7, skinB);
      seg(ctx, shX, shY, shX, hipY, 17, 13, skin);
      head(ctx, shX + 2, 48, 12);
      const backOffset = id === 'bayesian_curl' || id === 'incline_curl' ? -14 : 4;
      const elX = shX + backOffset;
      const elY = shY + 44;
      seg(ctx, shX, shY + 4, elX, elY, 9.5, 7.5, skin);
      const ang = 1.48 - rep * 2.15;
      const hx = elX + Math.cos(ang) * 44;
      const hy = elY + Math.sin(ang) * 44;
      if (id === 'bayesian_curl') cable(ctx, 56, floorY - 30, hx, hy);
      if (id === 'hammer_curl' || id === 'reverse_curl') {
        glowMuscle(ctx, elX, elY, hx, hy, 8, 6.5, rep);
      } else {
        glowMuscle(ctx, shX + backOffset * 0.5, shY + 14, elX + 2, elY - 4, 8.5, 7, rep);
      }
      seg(ctx, elX, elY, hx, hy, 7.5, 5.5, skin);
      db(ctx, hx, hy, 9);
      break;
    }

    case 'overhead_triceps': {
      const shX = cx + 6;
      const shY = 86;
      const hipY = 144;
      seg(ctx, shX, hipY, shX + 2, floorY - 4, 12, 7, skinB);
      seg(ctx, shX, shY, shX, hipY, 17, 13, skin);
      head(ctx, shX + 2, 58, 12);
      const elX = shX - 6;
      const elY = shY - 38;
      seg(ctx, shX, shY, elX, elY, 9, 7.5, skin);
      glowMuscle(ctx, shX - 4, shY - 8, elX - 3, elY + 6, 8.5, 7, rep);
      const ang = 2.5 - rep * 1.45;
      const hx = elX + Math.cos(ang) * 40;
      const hy = elY + Math.sin(ang) * 40;
      cable(ctx, 56, floorY - 40, hx, hy);
      seg(ctx, elX, elY, hx, hy, 7, 5.5, skin);
      db(ctx, hx, hy, 7);
      break;
    }

    case 'skull_crusher': {
      const by = floorY - 46;
      seg(ctx, cx - 94, by, cx + 82, by, 7, 7, bench, '#32323d');
      seg(ctx, cx + 22, by - 12, cx + 70, by - 4, 13, 10, shorts);
      seg(ctx, cx + 70, by - 4, cx + 74, floorY - 4, 9, 6, skinB);
      head(ctx, cx - 76, by - 16, 12);
      seg(ctx, cx - 56, by - 14, cx + 22, by - 12, 15, 13, skin);
      const elX = cx - 44;
      const elY = by - 54;
      seg(ctx, cx - 44, by - 14, elX, elY, 8.5, 7, skin);
      glowMuscle(ctx, cx - 48, by - 22, elX - 4, elY + 8, 8, 6.5, rep);
      const ang = Math.PI - 0.35 - rep * 1.4;
      const hx = elX + Math.cos(ang) * 40;
      const hy = elY + Math.sin(ang) * 40;
      seg(ctx, elX, elY, hx, hy, 7, 5.5, skin);
      bar(ctx, hx, hy, hx, hy, 12);
      break;
    }

    case 'dips': {
      const by = floorY - 64;
      seg(ctx, cx - 84, by, cx - 32, by, 8, 8, bench, '#32323d');
      const drop = (1 - rep) * 32;
      const shX = cx - 32;
      const shY = by - 40 + drop;
      const hipX = cx - 6;
      const hipY = by + 4 + drop;
      seg(ctx, hipX, hipY, cx + 74, floorY - 6, 13, 7, shorts);
      seg(ctx, shX, shY, hipX, hipY, 15, 12, skin);
      head(ctx, shX + 6, shY - 20, 12);
      const elX = shX - 24;
      const elY = shY + 18 - rep * 10;
      glowMuscle(ctx, shX - 6, shY + 4, elX, elY, 8.5, 7, rep);
      seg(ctx, shX, shY + 2, elX, elY, 8, 7, skin);
      seg(ctx, elX, elY, cx - 38, by, 7, 5.5, skin);
      break;
    }

    case 'hanging_leg_raise': {
      const barY = 26;
      seg(ctx, cx - 60, barY, cx + 60, barY, 4, 4, '#a1a1aa');
      const shY = 74;
      const hipY = 128;
      seg(ctx, cx, barY, cx, shY, 7.5, 6, skin);
      seg(ctx, cx, shY, cx, hipY, 16, 13, skin);
      head(ctx, cx + 6, shY - 12, 11);
      glowMuscle(ctx, cx + 2, shY + 20, cx + 4, hipY - 4, 11, 10, rep);
      const ang = 1.52 - rep * 1.58;
      const kx = cx + Math.cos(ang) * 44;
      const ky = hipY + Math.sin(ang) * 44;
      const fx = kx + Math.cos(ang + 0.15) * 42;
      const fy = ky + Math.sin(ang + 0.15) * 42;
      seg(ctx, cx, hipY, kx, ky, 13, 10, shorts);
      seg(ctx, kx, ky, fx, fy, 9, 6, skinB);
      break;
    }

    case 'cable_crunch': {
      const hipX = cx + 24;
      const hipY = floorY - 46;
      seg(ctx, hipX, hipY, cx + 52, floorY - 6, 13, 9, shorts);
      const bend = rep * 48;
      const shX = hipX - 26 - bend * 0.45;
      const shY = hipY - 56 + bend * 0.78;
      seg(ctx, shX, shY, hipX, hipY, 15, 13, skin);
      glowMuscle(ctx, (shX + hipX) / 2 - 4, (shY + hipY) / 2 + 4, hipX - 6, hipY - 6, 11, 10, rep);
      head(ctx, shX - 12, shY - 14, 11);
      cable(ctx, cx - 64, 14, shX - 10, shY - 6);
      break;
    }

    case 'plank_vacuum': {
      const breath = 0.65 + 0.35 * Math.sin(elapsed * 3.5);
      const shX = cx - 64;
      const shY = floorY - 38;
      const hipX = cx + 18;
      const hipY = floorY - 34;
      seg(ctx, hipX, hipY, cx + 104, floorY - 6, 13, 7, shorts);
      seg(ctx, shX, shY, hipX, hipY, 14, 12, skin);
      glowMuscle(ctx, shX + 18, shY + 6, hipX - 6, hipY + 6, 10, 9, breath);
      head(ctx, shX - 20, shY - 8, 11);
      seg(ctx, shX, shY + 2, shX - 6, floorY - 5, 7.5, 6, skin);
      seg(ctx, shX - 6, floorY - 5, shX - 26, floorY - 5, 6, 5, skin);
      break;
    }

    case 'v_up_crunch': {
      const fold = rep;
      const hipX = cx;
      const hipY = floorY - 12;
      const shX = hipX - 58 + fold * 30;
      const shY = hipY - 10 - fold * 48;
      const fx = hipX + 76 - fold * 36;
      const fy = hipY - 8 - fold * 56;
      seg(ctx, shX, shY, hipX, hipY, 14, 12, skin);
      seg(ctx, hipX, hipY, fx, fy, 13, 7, shorts);
      glowMuscle(ctx, hipX - 18, hipY - 12, hipX + 12, hipY - 12, 11, 10, fold);
      head(ctx, shX - 14, shY - 10, 11);
      break;
    }

    case 'back_extension': {
      // Banco romano 45°
      seg(ctx, cx - 6, floorY - 58, cx + 64, floorY - 4, 7, 7, bench, '#32323d');
      const hipX = cx - 2;
      const hipY = floorY - 66;
      seg(ctx, hipX, hipY, cx + 52, floorY - 12, 13, 8, shorts);
      const lift = rep;
      const shX = hipX - 50 * Math.cos((1 - lift) * 1.15);
      const shY = hipY - 42 + (1 - lift) * 58;
      seg(ctx, shX, shY, hipX, hipY, 15, 13, skin);
      glowMuscle(ctx, (shX + hipX) / 2 + 4, (shY + hipY) / 2 - 4, hipX - 6, hipY - 6, 11, 9, lift);
      head(ctx, shX - 14, shY - 10, 11);
      break;
    }

    case 'deadlift': {
      const hinge = 1 - rep;
      const footX = cx;
      const kneeX = cx - 14 * hinge;
      const kneeY = floorY - 46 + hinge * 8;
      const hipX = cx + 10 + hinge * 30;
      const hipY = floorY - 94 + hinge * 36;
      const shX = cx + 2 - hinge * 28;
      const shY = hipY - 54 + hinge * 26;
      seg(ctx, kneeX, kneeY, footX, floorY - 4, 10, 6.5, skinB);
      seg(ctx, hipX, hipY, kneeX, kneeY, 15, 11, shorts);
      seg(ctx, shX, shY, hipX, hipY, 16, 13, skin);
      glowMuscle(ctx, (shX + hipX) / 2 + 6, (shY + hipY) / 2, hipX, hipY, 12, 10, rep);
      head(ctx, shX - 8, shY - 18, 12);
      const handY = shY + 56;
      seg(ctx, shX, shY + 4, cx - 10, handY, 8, 6, skin);
      bar(ctx, cx - 10, handY, cx - 10, handY, 18);
      break;
    }

    case 'superman': {
      const lift = rep * 24;
      const hipX = cx;
      const hipY = floorY - 12;
      seg(ctx, cx - 64, floorY - 14 - lift, hipX, hipY, 13, 12, skin);
      seg(ctx, hipX, hipY, cx + 72, floorY - 12 - lift * 0.9, 12, 7, shorts);
      glowMuscle(ctx, cx - 22, floorY - 18 - lift * 0.4, cx + 14, floorY - 16 - lift * 0.3, 11, 9, rep);
      head(ctx, cx - 78, floorY - 22 - lift, 11);
      break;
    }

    case 'hip_abduction': {
      // Vista frontal sentado na abdutora
      seg(ctx, cx - 44, floorY - 52, cx + 44, floorY - 52, 8, 8, bench, '#32323d');
      seg(ctx, cx, 78, cx, 138, 22, 16, skin);
      head(ctx, cx, 52, 12);
      const spread = 24 + rep * 48;
      glowMuscle(ctx, cx - 16, 134, cx - 22 - rep * 10, 146, 12, 10, rep);
      glowMuscle(ctx, cx + 16, 134, cx + 22 + rep * 10, 146, 12, 10, rep);
      seg(ctx, cx - 12, 138, cx - spread, 162, 13, 10, shorts);
      seg(ctx, cx + 12, 138, cx + spread, 162, 13, 10, shorts);
      seg(ctx, cx - spread, 162, cx - spread, floorY - 6, 9, 6, skinB);
      seg(ctx, cx + spread, 162, cx + spread, floorY - 6, 9, 6, skinB);
      break;
    }

    case 'glute_kickback': {
      const shX = cx - 36;
      const shY = 92;
      const hipX = cx + 8;
      const hipY = 122;
      seg(ctx, hipX, hipY, hipX - 4, floorY - 4, 11, 7, skinB);
      seg(ctx, shX, shY, hipX, hipY, 15, 13, skin);
      head(ctx, shX - 16, shY - 10, 11);
      glowMuscle(ctx, hipX - 2, hipY, hipX + 16, hipY + 4, 13, 11, rep);
      const kick = rep * 1.25;
      const fx = hipX + Math.sin(kick) * 76;
      const fy = hipY + Math.cos(kick) * 76;
      seg(ctx, hipX, hipY, fx, fy, 12, 7, shorts);
      cable(ctx, cx - 80, floorY - 16, fx, fy);
      break;
    }

    case 'single_leg_bridge': {
      const shX = cx - 64;
      const shY = floorY - 12;
      const hipX = cx - 4;
      const hipY = floorY - 14 - rep * 42;
      const kx = cx + 52;
      const ky = floorY - 46;
      head(ctx, shX - 18, shY - 6, 11);
      seg(ctx, shX, shY, hipX, hipY, 14, 12, skin);
      seg(ctx, hipX, hipY, kx, ky, 13, 10, shorts);
      seg(ctx, kx, ky, cx + 58, floorY - 4, 9, 6, skinB);
      // Perna elevada unilateral
      seg(ctx, hipX, hipY, hipX + 42, hipY - 48, 11, 6, skinB);
      glowMuscle(ctx, hipX - 8, hipY + 4, hipX + 14, hipY + 2, 12, 11, rep);
      break;
    }

    case 'bulgarian_squat': {
      seg(ctx, cx + 58, floorY - 44, cx + 114, floorY - 44, 7, 7, bench, '#32323d');
      const depth = 1 - rep;
      const drop = depth * 44;
      const hipX = cx + 4;
      const hipY = floorY - 94 + drop;
      const shX = cx - 6;
      const shY = hipY - 52;
      // Perna traseira no banco
      seg(ctx, hipX, hipY, cx + 42, floorY - 44 + drop * 0.5, 12, 9, shorts);
      seg(ctx, cx + 42, floorY - 44 + drop * 0.5, cx + 76, floorY - 48, 8.5, 6, skinB);
      // Perna frontal trabalhando
      const fkx = cx - 44 - depth * 8;
      const fky = floorY - 46 + drop * 0.3;
      seg(ctx, hipX, hipY, fkx, fky, 14, 11, shorts);
      seg(ctx, fkx, fky, cx - 38, floorY - 4, 9.5, 6, skinB);
      glowMuscle(ctx, (hipX + fkx) / 2, (hipY + fky) / 2, fkx + 6, fky, 12, 10, depth);
      seg(ctx, shX, shY, hipX, hipY, 15, 13, skin);
      head(ctx, shX - 2, shY - 20, 12);
      db(ctx, shX - 6, hipY + 12, 9);
      break;
    }

    case 'goblet_squat': {
      const depth = 1 - rep;
      const drop = depth * 52;
      const kx = cx - 18 - depth * 18;
      const ky = floorY - 48 + drop * 0.25;
      const hipX = cx + 12 + depth * 26;
      const hipY = floorY - 98 + drop;
      const shX = cx + 2 + depth * 4;
      const shY = hipY - 52;
      seg(ctx, kx, ky, cx + 4, floorY - 4, 10, 6.5, skinB);
      seg(ctx, hipX, hipY, kx, ky, 15, 11, shorts);
      glowMuscle(ctx, (hipX + kx) / 2 - 4, (hipY + ky) / 2 - 4, kx + 6, ky - 4, 11, 9, depth);
      seg(ctx, shX, shY, hipX, hipY, 16, 13, skin);
      head(ctx, shX - 2, shY - 20, 12);
      seg(ctx, shX, shY + 8, shX - 24, shY + 20, 8, 6, skin);
      db(ctx, shX - 28, shY + 20, 11);
      break;
    }

    case 'leg_extension': {
      const seatY = floorY - 62;
      seg(ctx, cx - 54, seatY, cx + 12, seatY, 8, 8, bench, '#32323d');
      seg(ctx, cx - 48, seatY, cx - 58, seatY - 58, 7, 7, bench, '#32323d');
      seg(ctx, cx - 42, seatY - 52, cx - 32, seatY - 8, 15, 13, skin);
      head(ctx, cx - 44, seatY - 72, 12);
      const kx = cx + 12;
      const ky = seatY - 6;
      seg(ctx, cx - 32, seatY - 8, kx, ky, 14, 11, shorts);
      glowMuscle(ctx, cx - 22, seatY - 12, kx - 4, ky - 6, 11, 9, rep);
      const ang = 1.45 - rep * 1.42;
      const fx = kx + Math.cos(ang) * 52;
      const fy = ky + Math.sin(ang) * 52;
      seg(ctx, kx, ky, fx, fy, 9.5, 6.5, skinB);
      db(ctx, fx, fy, 7);
      break;
    }

    case 'leg_press': {
      seg(ctx, cx - 84, floorY - 26, cx - 22, floorY - 56, 8, 8, bench, '#32323d');
      const hipX = cx - 24;
      const hipY = floorY - 46;
      seg(ctx, cx - 72, floorY - 78, hipX, hipY, 15, 13, skin);
      head(ctx, cx - 86, floorY - 94, 12);
      const push = rep * 48;
      const fx = cx + 44 + push * 0.72;
      const fy = floorY - 98 - push * 0.65;
      const kx = (hipX + fx) / 2 - (1 - rep) * 26;
      const ky = (hipY + fy) / 2 - (1 - rep) * 22;
      seg(ctx, hipX, hipY, kx, ky, 15, 11, shorts);
      glowMuscle(ctx, (hipX + kx) / 2, (hipY + ky) / 2, kx, ky, 12, 10, rep);
      seg(ctx, kx, ky, fx, fy, 9.5, 6.5, skinB);
      // Plataforma do Leg Press
      seg(ctx, fx - 8, fy - 28, fx + 18, fy + 22, 7, 7, '#10b981');
      break;
    }

    case 'leg_curl': {
      const seatY = floorY - 62;
      seg(ctx, cx - 44, seatY, cx + 22, seatY, 8, 8, bench, '#32323d');
      seg(ctx, cx - 36, seatY - 54, cx - 28, seatY - 8, 15, 13, skin);
      head(ctx, cx - 38, seatY - 74, 12);
      const kx = cx + 22;
      const ky = seatY - 6;
      seg(ctx, cx - 28, seatY - 8, kx, ky, 14, 11, shorts);
      glowMuscle(ctx, cx - 18, seatY - 2, kx - 4, ky + 4, 10, 9, rep);
      const ang = 0.08 + rep * 1.48;
      const fx = kx + Math.cos(ang) * 52;
      const fy = ky + Math.sin(ang) * 52;
      seg(ctx, kx, ky, fx, fy, 9.5, 6.5, skinB);
      db(ctx, fx, fy, 7);
      break;
    }

    case 'slider_curl': {
      const shX = cx - 72;
      const shY = floorY - 12;
      const hipX = cx - 14;
      const hipY = floorY - 26 - rep * 14;
      const fx = cx + 88 - rep * 48;
      const kx = (hipX + fx) / 2;
      const ky = hipY - rep * 34;
      head(ctx, shX - 18, shY - 6, 11);
      seg(ctx, shX, shY, hipX, hipY, 14, 12, skin);
      seg(ctx, hipX, hipY, kx, ky, 13, 10, shorts);
      glowMuscle(ctx, hipX + 6, hipY + 4, kx, ky + 6, 10, 9, rep);
      seg(ctx, kx, ky, fx, floorY - 5, 9, 6, skinB);
      seg(ctx, fx - 12, floorY - 2, fx + 12, floorY - 2, 3, 3, '#10b981');
      break;
    }

    case 'single_leg_rdl': {
      const hinge = 1 - rep;
      const hipX = cx + 6;
      const hipY = floorY - 94;
      const shX = hipX - 58 * Math.sin(hinge * 1.45);
      const shY = hipY - 56 * Math.cos(hinge * 1.45);
      seg(ctx, hipX, hipY, cx + 4, floorY - 4, 12, 7, skinB);
      // Perna de trás estendida no ar
      const bx = hipX + 74 * Math.sin(hinge * 1.45);
      const by = hipY + 74 * Math.cos(hinge * 1.45);
      seg(ctx, hipX, hipY, bx, by, 12, 6.5, shorts);
      glowMuscle(ctx, hipX + 4, hipY + 12, cx + 6, floorY - 44, 11, 8.5, hinge);
      seg(ctx, shX, shY, hipX, hipY, 15, 13, skin);
      head(ctx, shX - hinge * 14, shY - 16 + hinge * 8, 12);
      seg(ctx, shX, shY + 6, shX - 4, shY + 56, 7.5, 5.5, skin);
      db(ctx, shX - 4, shY + 58, 9);
      break;
    }

    case 'single_calf':
    case 'weighted_calf': {
      const lift = rep * 24;
      const stepY = floorY - 14;
      seg(ctx, cx - 36, stepY, cx + 36, stepY, 8, 8, bench, '#32323d');
      const ay = stepY - 8 - lift;
      const ky = ay - 52;
      const hy = ky - 52;
      const sy = hy - 54;
      seg(ctx, cx, ky, cx, ay, 10, 6, skinB);
      glowMuscle(ctx, cx + 5, ky + 10, cx + 5, ky + 34, 9.5, 7, rep);
      seg(ctx, cx, hy, cx, ky, 15, 11, shorts);
      seg(ctx, cx, sy, cx, hy, 17, 14, skin);
      head(ctx, cx, sy - 20, 12);
      if (id === 'weighted_calf') {
        db(ctx, cx - 22, hy + 18, 9);
        db(ctx, cx + 22, hy + 18, 9);
      } else {
        // Outra perna dobrada (unilateral)
        seg(ctx, cx + 8, hy, cx + 26, ky - 8, 11, 7, shorts);
      }
      break;
    }

    default: {
      // hiit_cardio
      const bounce = Math.abs(Math.sin(elapsed * 7)) * 22;
      const hy = floorY - 86 - bounce;
      const sy = hy - 50;
      seg(ctx, cx, hy, cx - 22 + rep * 44, floorY - 6 - bounce * 0.4, 11, 7, shorts);
      seg(ctx, cx, hy, cx + 22 - rep * 44, floorY - 6, 11, 7, skinB);
      seg(ctx, cx, sy, cx, hy, 16, 13, skin);
      glowMuscle(ctx, cx, sy + 16, cx, hy - 8, 13, 11, rep);
      head(ctx, cx, sy - 18, 12);
      break;
    }
  }
}
