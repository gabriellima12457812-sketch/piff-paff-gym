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

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function detectExerciseMotion(name = '', muscle = '') {
  const n = normalizeText(name);
  const m = normalizeText(muscle);

  // 1. Regras prioritárias (exercícios compostos ou nomes que citam palavras de outros grupos)
  if (n.includes('panturrilha')) return 'calf_raise';
  if (n.includes('elevacao de pernas')) return 'abs_core';
  if (n.includes('crucifixo inverso') || n.includes('face pull') || n.includes('y-t-w')) return 'lateral_raise';
  if (n.includes('supino')) return 'bench_press';
  if (n.includes('crossover') || n.includes('crucifixo') || n.includes('voador') || n.includes('peck deck') || n.includes('fly')) return 'chest_fly';
  if (n.includes('desenvolvimento') || n.includes('arnold') || n.includes('flexao pike') || n.includes('militar')) return 'shoulder_press';
  if (n.includes('flexao diamante') || n.includes('mergulho') || (n.includes('paralelas') && !m.includes('peito'))) return 'triceps_ext';
  if (n.includes('slider') || n.includes('hamstring') || n.includes('nordica') || n.includes('flexora')) return 'rdl_hinge';

  // 2. Cardio / Finishers metabólicos (nunca cair em supino)
  if (n.includes('burpee') || n.includes('mountain climber')) return 'pushup';
  if (n.includes('pular corda') || n.includes('corda') && m.includes('cardio') || n.includes('corrida')) return 'calf_raise';
  if (n.includes('bike') || n.includes('esteira') || n.includes('hiit') || n.includes('eliptico')) return 'squat';

  // 3. Mapeamento direto para os 14 vídeos reais de estúdio
  if (n.includes('flexao')) return 'pushup';
  if (n.includes('puxada') || n.includes('barra fixa') || n.includes('pulldown') || n.includes('pullover') || n.includes('dead hang')) return 'pulldown';
  if (n.includes('remada') || n.includes('serrote') || n.includes('cavalinho') || n.includes('encolhimento')) return 'row';
  if (n.includes('elevacao lateral') || n.includes('elevacao frontal')) return 'lateral_raise';
  if (n.includes('rosca') || n.includes('curl')) return 'biceps_curl';
  if (n.includes('triceps')) return 'triceps_ext';
  if (
    n.includes('hip thrust') ||
    n.includes('pelvica') ||
    n.includes('ponte') ||
    n.includes('abdutora') ||
    n.includes('abducao') ||
    n.includes('coice') ||
    n.includes('frog') ||
    n.includes('clamshell') ||
    n.includes('monster walk')
  ) return 'hip_thrust';
  if (
    n.includes('stiff') ||
    n.includes('rdl') ||
    n.includes('terra') ||
    n.includes('lombar') ||
    n.includes('superman') ||
    n.includes('bird-dog') ||
    n.includes('rack pull') ||
    n.includes('good morning') ||
    n.includes('hiperextensao')
  ) return 'rdl_hinge';
  if (
    n.includes('agachamento') ||
    n.includes('leg press') ||
    n.includes('extensora') ||
    n.includes('extensao de joelho') ||
    n.includes('wall sit') ||
    n.includes('passada') ||
    n.includes('afundo') ||
    n.includes('avanco') ||
    n.includes('lunge') ||
    n.includes('step-up') ||
    n.includes('subida no caixote') ||
    n.includes('sissy') ||
    n.includes('hack') ||
    n.includes('pistol')
  ) return 'squat';
  if (
    n.includes('abdominal') ||
    n.includes('crunch') ||
    n.includes('vacuum') ||
    n.includes('prancha') ||
    n.includes('canivete') ||
    n.includes('dead bug') ||
    n.includes('twist')
  ) return 'abs_core';

  // 4. Fallback por grupo muscular alvo
  if (m.includes('peito')) return 'bench_press';
  if (m.includes('costas')) return 'pulldown';
  if (m.includes('trapezio')) return 'row';
  if (m.includes('ombro')) return 'lateral_raise';
  if (m.includes('biceps') || m.includes('antebraco') || m.includes('braco')) return 'biceps_curl';
  if (m.includes('triceps')) return 'triceps_ext';
  if (m.includes('gluteo')) return 'hip_thrust';
  if (m.includes('posterior') || m.includes('lombar')) return 'rdl_hinge';
  if (m.includes('panturrilha')) return 'calf_raise';
  if (m.includes('perna') || m.includes('quadriceps') || m.includes('cardio')) return 'squat';
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
  const videoSrc = `./assets/videos/${motion}.mp4?v=3`;

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
