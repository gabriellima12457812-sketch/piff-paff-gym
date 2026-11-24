/**
 * Piff Paff Gym — Execução Real de Estúdio (100% Atleta Real em Estúdio Escuro + Músculo Esmeralda)
 * Renderização nítida em 60fps via GPU (dupla foto de estúdio Start -> Pico de Contração),
 * eliminando 100% as distorções de morphing/minterpolate e falhas de <video> no iOS Safari/PWA.
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

const MOTION_VECTORS = {
  bench_press: { dy: '-5px', dx: '0px' },
  chest_fly: { dy: '0px', dx: '0px' },
  pushup: { dy: '-6px', dx: '0px' },
  pulldown: { dy: '6px', dx: '0px' },
  row: { dy: '-4px', dx: '-3px' },
  lateral_raise: { dy: '-4px', dx: '0px' },
  shoulder_press: { dy: '-6px', dx: '0px' },
  biceps_curl: { dy: '-4px', dx: '0px' },
  triceps_ext: { dy: '5px', dx: '0px' },
  squat: { dy: '6px', dx: '0px' },
  hip_thrust: { dy: '-6px', dx: '0px' },
  rdl_hinge: { dy: '5px', dx: '0px' },
  abs_core: { dy: '5px', dx: '0px' },
  calf_raise: { dy: '-7px', dx: '0px' },
};

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
  if (n.includes('pular corda') || (n.includes('corda') && m.includes('cardio')) || n.includes('corrida')) return 'calf_raise';
  if (n.includes('bike') || n.includes('esteira') || n.includes('hiit') || n.includes('eliptico')) return 'squat';

  // 3. Mapeamento direto para os 14 pares reais de estúdio
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
  const vec = MOTION_VECTORS[motion] || { dy: '-4px', dx: '0px' };
  const ytUrl = buildYoutubeSearchUrl(exerciseName);
  const safeName = String(exerciseName).replace(/"/g, '&quot;');
  const srcA = `./assets/demos/${motion}_a.jpg?v=4`;
  const srcB = `./assets/demos/${motion}_b.jpg?v=4`;

  return `
    <div
      class="demo-video-stage demo-studio-player ${compact ? 'demo-video-compact' : ''}"
      data-demo-stage
      data-motion="${motion}"
      style="--demo-dx:${vec.dx};--demo-dy:${vec.dy};"
      role="region"
      aria-label="Demonstração real de execução de ${safeName}"
    >
      <div class="demo-frames-wrap">
        <img
          class="demo-frame-img demo-frame-a"
          src="${srcA}"
          alt="Posição inicial — ${safeName}"
          loading="eager"
          decoding="async"
        />
        <img
          class="demo-frame-img demo-frame-b"
          src="${srcB}"
          alt="Pico de contração — ${safeName}"
          loading="eager"
          decoding="async"
        />
      </div>

      <div class="demo-video-hud-top">
        <span class="demo-live-pill"><span class="demo-rec-dot"></span> EXECUÇÃO REAL</span>
        <span class="demo-phase-badge" data-phase-label>POSIÇÃO INICIAL</span>
      </div>

      <a
        href="${ytUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="demo-yt-link"
        title="Ver vídeo completo no YouTube"
      >▶ YouTube ↗</a>

      <div class="demo-cadence-bar" aria-hidden="true">
        <div class="demo-cadence-fill" data-cadence-fill></div>
      </div>
    </div>
  `;
}

export function mountDemoVideos(container) {
  stopAllDemoVideos();
  if (!container) return;

  const stages = Array.from(container.querySelectorAll('[data-demo-stage]'));
  if (!stages.length) return;

  // Ciclo rítmico limpo (2.4s): Início nítido -> Contratação Máxima esmeralda nítida
  const CYCLE_MS = 2400;
  let rafId = null;
  const startTime = performance.now();

  // Permite tocar na imagem para alternar manualmente (pausar/retomar) sem interferir no link YouTube
  stages.forEach((stage) => {
    const onTap = (e) => {
      if (e.target.closest('a')) return;
      const isManual = stage.classList.toggle('is-peak-locked');
      const badge = stage.querySelector('[data-phase-label]');
      if (badge) {
        badge.textContent = isManual ? 'PICO · CONTRAÇÃO' : 'POSIÇÃO INICIAL';
        badge.classList.toggle('is-peak', isManual);
      }
    };
    stage.addEventListener('click', onTap);
    activeCleanupFns.add(() => stage.removeEventListener('click', onTap));
  });

  const tick = (now) => {
    const elapsed = (now - startTime) % CYCLE_MS;
    const p = elapsed / CYCLE_MS;
    const inPeak = p >= 0.42 && p < 0.90;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      if (stage.classList.contains('is-peak-locked')) continue;

      const phaseEl = stage.querySelector('[data-phase-label]');
      const fillEl = stage.querySelector('[data-cadence-fill]');

      stage.classList.toggle('is-peak', inPeak);

      if (phaseEl) {
        const nextText = inPeak ? 'PICO · CONTRAÇÃO' : 'POSIÇÃO INICIAL';
        if (phaseEl.textContent !== nextText) {
          phaseEl.textContent = nextText;
          phaseEl.classList.toggle('is-peak', inPeak);
        }
      }
      if (fillEl) {
        fillEl.style.width = `${(p * 100).toFixed(1)}%`;
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  activeCleanupFns.add(() => {
    if (rafId !== null) cancelAnimationFrame(rafId);
  });
}
