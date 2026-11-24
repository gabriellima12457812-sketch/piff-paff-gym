/**
 * Piff Paff Gym — Vídeos Reais de Execução (Atleta Real em Estúdio Escuro + Brilho Esmeralda)
 * Reproduz micro-vídeos MP4 contínuos (<video autoplay loop muted playsinline>)
 * na mesma temática do Atlas Muscular Real, com indicador de fase sincronizado.
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

  if (n.includes('flexão') || n.includes('flexao')) return 'pushup';
  if (n.includes('supino') || n.includes('crossover') || n.includes('crucifixo')) return 'bench_press';
  if (n.includes('puxada') || n.includes('barra fixa') || n.includes('pulldown') || n.includes('dead hang')) return 'pulldown';
  if (n.includes('remada') || n.includes('serrote') || n.includes('cavalinho')) return 'row';
  if (n.includes('elevação lateral') || n.includes('elevacao lateral') || n.includes('desenvolvimento') || n.includes('arnold') || n.includes('encolhimento') || n.includes('face pull') || n.includes('y-t-w')) return 'lateral_raise';
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

/**
 * Renderiza o micro-vídeo MP4 contínuo com pessoa real + destaque esmeralda
 */
export function renderExerciseDemoMarkup(exerciseName, muscleName, compact = false) {
  const motion = detectExerciseMotion(exerciseName, muscleName);
  const ytUrl = buildYoutubeSearchUrl(exerciseName);
  const safeName = String(exerciseName).replace(/"/g, '&quot;');
  const videoSrc = `./assets/videos/${motion}.mp4`;

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
        aria-label="Vídeo de execução de ${safeName}"
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

/**
 * Garante autoplay inline no iOS/Android e sincroniza o indicador de fase com o vídeo real
 */
export function mountDemoVideos(container) {
  stopAllDemoVideos();
  if (!container) return;

  const videos = container.querySelectorAll('video.demo-real-video');
  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});

    const stage = video.closest('.demo-video-stage');
    const phaseEl = stage?.querySelector('[data-phase-label]');

    const onTimeUpdate = () => {
      if (!phaseEl || !video.duration) return;
      const p = video.currentTime / video.duration;
      if (p < 0.14) phaseEl.textContent = 'POSIÇÃO INICIAL';
      else if (p < 0.44) phaseEl.textContent = 'CONCÊNTRICA ↑';
      else if (p < 0.65) phaseEl.textContent = 'PICO · CONTRAÇÃO';
      else phaseEl.textContent = 'EXCÊNTRICA ↓';
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    activeCleanupFns.add(() => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.pause();
    });
  });
}
