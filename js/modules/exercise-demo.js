/**
 * Piff Paff Gym — Vídeos Reais de Execução (100% Pessoa Real em Estúdio Escuro + Músculo Marcado em Esmeralda)
 * Todos os exercícios reproduzem micro-vídeos reais MP4 (30fps fluxo óptico) na mesma temática do Atlas Real.
 */

let activeCleanupFns = new Set();

export function stopAllDemoVideos() {
  for (const fn of activeCleanupFns) {
    fn();
  }
  activeCleanupFns.clear();
}

export function detectExerciseMotion(name = '', muscle = '') {
  const n = String(name).toLowerCase();
  const m = String(muscle).toLowerCase();

  // Casos específicos que contêm palavras de outros grupos (checar primeiro)
  if (n.includes('panturrilha')) return 'calf_raise';
  if (n.includes('elevação de pernas') || n.includes('elevacao de pernas')) return 'abs_core';
  if (n.includes('flexão pike') || n.includes('flexao pike')) return 'lateral_raise';
  if (n.includes('flexão diamante') || n.includes('mergulho') || n.includes('paralelas')) return 'triceps_ext';
  if (n.includes('crucifixo inverso') || n.includes('face pull')) return 'lateral_raise';
  if (n.includes('slider') || n.includes('hamstring') || n.includes('nórdica') || n.includes('flexora')) return 'rdl_hinge';

  // Mapeamento direto para os 12 vídeos reais de estúdio
  if (n.includes('flexão') || n.includes('flexao')) return 'pushup';
  if (n.includes('supino') || n.includes('crossover') || n.includes('crucifixo')) return 'bench_press';
  if (n.includes('puxada') || n.includes('barra fixa') || n.includes('pulldown') || n.includes('dead hang')) return 'pulldown';
  if (n.includes('remada') || n.includes('serrote') || n.includes('cavalinho') || n.includes('encolhimento')) return 'row';
  if (n.includes('elevação lateral') || n.includes('elevacao lateral') || n.includes('desenvolvimento') || n.includes('arnold') || n.includes('y-t-w')) return 'lateral_raise';
  if (n.includes('rosca') || n.includes('curl')) return 'biceps_curl';
  if (n.includes('tríceps') || n.includes('triceps')) return 'triceps_ext';
  if (n.includes('hip thrust') || n.includes('pélvica') || n.includes('pelvica') || n.includes('ponte') || n.includes('abdutora') || n.includes('abdução') || n.includes('coice') || n.includes('frog')) return 'hip_thrust';
  if (n.includes('stiff') || n.includes('rdl') || n.includes('terra') || n.includes('lombar') || n.includes('superman') || n.includes('rack pull')) return 'rdl_hinge';
  if (n.includes('agachamento') || n.includes('leg press') || n.includes('extensora') || n.includes('passada') || n.includes('afundo') || n.includes('step-up')) return 'squat';
  if (n.includes('abdominal') || n.includes('crunch') || n.includes('vacuum') || n.includes('prancha') || n.includes('canivete')) return 'abs_core';

  // Fallback por músculo alvo
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
  const videoSrc = `./assets/videos/${motion}.mp4?v=2`;

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
        aria-label="Vídeo real de execução de ${safeName}"
      ></video>
      <div class="demo-video-hud-top">
        <span class="demo-live-pill"><span class="demo-rec-dot"></span> EXECUÇÃO REAL</span>
        <span class="demo-phase-badge" data-phase-label>CONTROLADO</span>
      </div>
      <a
        href="${ytUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="demo-yt-link"
        title="Ver vídeo completo no YouTube"
      >▶ YouTube ↗</a>
    </div>
  `;
}

export function mountDemoVideos(container) {
  stopAllDemoVideos();
  if (!container) return;

  const videos = container.querySelectorAll('video.demo-real-video');
  videos.forEach((video) => {
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
}
