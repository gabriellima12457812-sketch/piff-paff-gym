/**
 * Piff Paff Gym — Atlas Muscular Interativo (Pessoa Real: Frente & Costas)
 * Toque diretamente em cada grupo muscular sobre a foto real do atleta
 * para destacar a anatomia e filtrar exercícios por ambiente e nível.
 */

let activeSide = 'front'; // 'front' | 'back'
let selectedMuscleId = 'peito';
let envFilter = 'all'; // 'all' | 'home' | 'gym' | 'hybrid'
let levelFilter = 'all'; // 'all' | 'beginner' | 'intermediate' | 'pro'

export const ATLAS_MUSCLES = [
  {
    id: 'peito',
    name: 'Peito',
    icon: '🛡️',
    side: 'front',
    anatomy: 'Peitoral maior, porção clavicular e esternal',
    paths: [
      'M 149 92 C 138 89 124 91 116 99 C 114 111 119 123 132 125 C 142 126 149 121 149 112 Z',
      'M 151 92 C 162 89 176 91 184 99 C 186 111 181 123 168 125 C 158 126 151 121 151 112 Z',
    ],
    dots: [{ x: 133, y: 108 }, { x: 167, y: 108 }],
    exercises: [
      { name: 'Supino Inclinado com Halteres (30°)', env: 'gym', level: 'all', reps: '4×8–12', cue: 'Escápulas retraídas, desça 2s até alongar o peitoral superior.' },
      { name: 'Supino Reto com Barra Olímpica', env: 'gym', level: 'intermediate', reps: '4×6–10', cue: 'Cotovelos em 45° (não abertos a 90°), controle total no peito.' },
      { name: 'Crossover na Polia (FST-7)', env: 'gym', level: 'pro', reps: '7×12 (35s)', cue: 'Aperte o peitoral por 1s no centro com leve inclinação à frente.' },
      { name: 'Flexão Declinada (Pés Elevados)', env: 'home', level: 'all', reps: '4×10–15', cue: 'Foco na porção superior; adicione mochila para progredir carga.' },
      { name: 'Flexão com Déficit (Apoios)', env: 'home', level: 'intermediate', reps: '4×10–12', cue: 'Desça além da linha das mãos para máximo alongamento das fibras.' },
      { name: 'Supino Reto com Halteres + Flexão', env: 'hybrid', level: 'all', reps: '4×10–12', cue: 'Ideal em academia de hotel: amplitude profunda sem travar cotovelos.' },
    ],
  },
  {
    id: 'ombros',
    name: 'Ombros',
    icon: '🎯',
    side: 'both',
    anatomy: 'Deltoide anterior, lateral e posterior (ombro 3D)',
    pathsFront: [
      'M 118 85 C 107 88 100 97 100 112 C 105 117 113 115 117 104 Z',
      'M 182 85 C 193 88 200 97 200 112 C 195 117 187 115 183 104 Z',
    ],
    pathsBack: [
      'M 118 82 C 106 86 99 95 99 109 C 106 113 114 110 119 98 Z',
      'M 182 82 C 194 86 201 95 201 109 C 194 113 186 110 181 98 Z',
    ],
    dotsFront: [{ x: 108, y: 100 }, { x: 192, y: 100 }],
    dotsBack: [{ x: 108, y: 96 }, { x: 192, y: 96 }],
    exercises: [
      { name: 'Elevação Lateral na Polia / Halteres', env: 'gym', level: 'all', reps: '4×12–15', cue: 'Eleve no plano escapular (30° à frente) sem subir o trapézio.' },
      { name: 'Desenvolvimento Arnold com Halteres', env: 'gym', level: 'intermediate', reps: '4×8–10', cue: 'Rotação suave recrutando deltoide anterior e lateral.' },
      { name: 'Face Pull com Rotação Externa', env: 'gym', level: 'all', reps: '4×15–20', cue: 'Puxe a corda na altura da testa abrindo os cotovelos.' },
      { name: 'Flexão Pike (Foco Ombros)', env: 'home', level: 'all', reps: '4×8–12', cue: 'Quadril alto em V invertido; leve o topo da cabeça à frente das mãos.' },
      { name: 'Elevação Lateral com Elástico', env: 'home', level: 'beginner', reps: '4×15–20', cue: 'Pise no elástico e mantenha tensão constante no topo.' },
      { name: 'Desenvolvimento em Pé com Halteres', env: 'hybrid', level: 'all', reps: '4×10–12', cue: 'Core travado e glúteos contraídos para proteger a lombar.' },
    ],
  },
  {
    id: 'costas',
    name: 'Costas',
    icon: '🦅',
    side: 'back',
    anatomy: 'Latíssimo do dorso (largura em V) e redondo maior',
    paths: [
      'M 116 100 C 114 118 119 136 125 148 L 148 144 L 148 112 C 138 106 126 101 116 100 Z',
      'M 184 100 C 186 118 181 136 175 148 L 152 144 L 152 112 C 162 106 174 101 184 100 Z',
    ],
    dots: [{ x: 131, y: 124 }, { x: 169, y: 124 }],
    exercises: [
      { name: 'Puxada Alta Pegada Aberta', env: 'gym', level: 'all', reps: '4×8–12', cue: 'Puxe os cotovelos para baixo em direção aos bolsos, não para trás.' },
      { name: 'Remada Curvada Supinada (Yates Row)', env: 'gym', level: 'pro', reps: '4×6–10', cue: 'Tronco a ~60°, puxe a barra rente às coxas esmagando as dorsais.' },
      { name: 'Pulldown Corda na Polia (FST-7)', env: 'gym', level: 'pro', reps: '7×12 (35s)', cue: 'Braços semi-estendidos, máxima extensão do latíssimo no topo.' },
      { name: 'Remada Unilateral com Mochila / Halter', env: 'home', level: 'all', reps: '4×10–12', cue: 'Conduza o cotovelo na direção do quadril sem girar o tronco.' },
      { name: 'Barra Fixa / Remada Invertida na Mesa', env: 'home', level: 'intermediate', reps: '4×8–12', cue: 'Peito em direção à barra, descida controlada de 2 segundos.' },
      { name: 'Remada Peito Apoiado no Banco', env: 'hybrid', level: 'all', reps: '4×10–12', cue: 'Zero roubo lombar; foco 100% na contração das dorsais.' },
    ],
  },
  {
    id: 'trapezio',
    name: 'Trapézio',
    icon: '⛰️',
    side: 'back',
    anatomy: 'Trapézio superior, médio, inferior e romboides',
    paths: [
      'M 136 68 C 145 64 155 64 164 68 L 182 82 C 176 92 162 114 150 122 C 138 114 124 92 118 82 Z',
    ],
    dots: [{ x: 150, y: 88 }],
    exercises: [
      { name: 'Encolhimento com Barra / Halteres', env: 'gym', level: 'all', reps: '4×12–15', cue: 'Suba os ombros em direção às orelhas e segure 2s no topo.' },
      { name: 'Remada Cavalinho (T-Bar Row)', env: 'gym', level: 'intermediate', reps: '4×8–10', cue: 'Aproxime as escápulas no pico para construir espessura central.' },
      { name: 'Encolhimento com Mochilas Carregadas', env: 'home', level: 'beginner', reps: '4×15–20', cue: 'Sem girar os ombros — movimento puramente vertical e lento.' },
      { name: 'Y-T-W no Solo / Elástico', env: 'hybrid', level: 'all', reps: '3×12 cada', cue: 'Fortalece trapézio médio/inferior e melhora postura escapular.' },
    ],
  },
  {
    id: 'biceps',
    name: 'Bíceps',
    icon: '💪',
    side: 'front',
    anatomy: 'Bíceps braquial (cabeça longa e curta) e braquial',
    paths: [
      'M 101 114 C 95 124 95 141 101 150 C 109 151 115 140 117 122 C 114 116 107 113 101 114 Z',
      'M 199 114 C 205 124 205 141 199 150 C 191 151 185 140 183 122 C 186 116 193 113 199 114 Z',
    ],
    dots: [{ x: 106, y: 132 }, { x: 194, y: 132 }],
    exercises: [
      { name: 'Rosca Direta na Barra W', env: 'gym', level: 'all', reps: '4×8–12', cue: 'Cotovelos fixos ao lado do corpo; excêntrica controlada de 3s.' },
      { name: 'Bayesian Curl (Polia atrás do corpo)', env: 'gym', level: 'pro', reps: '3×10–12', cue: 'Ombro em extensão gera tensão máxima na faixa alongada.' },
      { name: 'Rosca Inclinada 45° com Halteres', env: 'hybrid', level: 'intermediate', reps: '3×10–12', cue: 'Deixe os braços pendendo atrás do tronco sem balançar.' },
      { name: 'Rosca Direta / Martelo com Elástico', env: 'home', level: 'all', reps: '4×12–15', cue: 'Mantenha o punho neutro e segure 1s no pico da contração.' },
    ],
  },
  {
    id: 'triceps',
    name: 'Tríceps',
    icon: '⚡',
    side: 'back',
    anatomy: 'Tríceps braquial (cabeça longa, lateral e medial)',
    paths: [
      'M 100 110 C 93 122 94 139 99 149 C 108 149 113 138 115 119 C 112 113 105 110 100 110 Z',
      'M 200 110 C 207 122 206 139 201 149 C 192 149 187 138 185 119 C 188 113 195 110 200 110 Z',
    ],
    dots: [{ x: 105, y: 130 }, { x: 195, y: 130 }],
    exercises: [
      { name: 'Tríceps Francês na Polia (Acima da Cabeça)', env: 'gym', level: 'all', reps: '4×10–12', cue: 'Braços elevados maximizam o alongamento da cabeça longa.' },
      { name: 'Tríceps Pulley Corda (Drop-Set)', env: 'gym', level: 'pro', reps: '4×12–15', cue: 'Afaste a corda no final travando totalmente a extensão.' },
      { name: 'Flexão Diamante / Mergulho no Banco', env: 'home', level: 'all', reps: '4×10–15', cue: 'Cotovelos rentes ao tronco para concentrar toda carga no tríceps.' },
      { name: 'Tríceps Testa com Halteres', env: 'hybrid', level: 'intermediate', reps: '4×10–12', cue: 'Leve os halteres atrás da cabeça mantendo cotovelos estáveis.' },
    ],
  },
  {
    id: 'antebracos',
    name: 'Antebraço',
    icon: '✊',
    side: 'front',
    anatomy: 'Braquiorradial, flexores e extensores do punho',
    paths: [
      'M 98 152 C 91 165 91 184 94 198 L 104 198 C 108 184 111 167 111 152 Z',
      'M 202 152 C 209 165 209 184 206 198 L 196 198 C 192 184 189 167 189 152 Z',
    ],
    dots: [{ x: 101, y: 174 }, { x: 199, y: 174 }],
    exercises: [
      { name: 'Rosca Martelo Pesada', env: 'gym', level: 'all', reps: '4×10–12', cue: 'Pegada neutra (polegar para cima) para volume de braquiorradial.' },
      { name: 'Rosca Inversa na Barra W / Polia', env: 'gym', level: 'intermediate', reps: '3×12–15', cue: 'Pegada pronada firme sem dobrar o punho para trás.' },
      { name: 'Sustentação na Barra (Dead Hang) / Toalha', env: 'home', level: 'all', reps: '3×40–60s', cue: 'Fortalece pegada e densidade do antebraço sem equipamento.' },
    ],
  },
  {
    id: 'abdomen',
    name: 'Abdômen',
    icon: '🧱',
    side: 'front',
    anatomy: 'Reto abdominal, oblíquos externos e transverso',
    paths: [
      'M 122 126 C 134 128 166 128 178 126 L 176 172 C 165 178 135 178 124 172 Z',
    ],
    dots: [{ x: 150, y: 148 }],
    exercises: [
      { name: 'Abdominal Crunch na Polia Alta', env: 'gym', level: 'all', reps: '4×12–15', cue: 'Flexione a coluna enrolando as costelas até o quadril — sem puxar com braços.' },
      { name: 'Elevação de Pernas na Barra Fixa', env: 'gym', level: 'intermediate', reps: '4×10–15', cue: 'Eleve a pelve no topo sem balanço de quadril.' },
      { name: 'Stomach Vacuum + Prancha RKC', env: 'home', level: 'all', reps: '4×40s', cue: 'Fortalece o transverso abdominal e afina a linha de cintura.' },
      { name: 'Abdominal Canivete Controlado', env: 'hybrid', level: 'all', reps: '4×12–15', cue: 'Expire todo o ar na contração máxima.' },
    ],
  },
  {
    id: 'lombar',
    name: 'Lombar',
    icon: '🦴',
    side: 'back',
    anatomy: 'Eretores da espinha e estabilizadores lombares',
    paths: [
      'M 127 146 L 173 146 L 175 170 C 164 173 136 173 125 170 Z',
    ],
    dots: [{ x: 150, y: 158 }],
    exercises: [
      { name: 'Extensão Lombar no Banco Romano 45°', env: 'gym', level: 'all', reps: '3×12–15', cue: 'Suba até alinhar a coluna neutra sem hiperestender.' },
      { name: 'Levantamento Terra / Rack Pull', env: 'gym', level: 'pro', reps: '3×5–8', cue: 'Bracing abdominal máximo antes de tirar a barra do chão.' },
      { name: 'Superman Isométrico + Bird-Dog', env: 'home', level: 'beginner', reps: '3×12 cada', cue: 'Movimento lento fortalecendo toda cadeia estabilizadora.' },
    ],
  },
  {
    id: 'gluteos',
    name: 'Glúteos',
    icon: '🍑',
    side: 'back',
    anatomy: 'Glúteo máximo, médio e mínimo (3 planos)',
    paths: [
      'M 120 176 C 114 190 114 212 124 220 C 136 222 148 214 149 198 L 149 176 Z',
      'M 180 176 C 186 190 186 212 176 220 C 164 222 152 214 151 198 L 151 176 Z',
    ],
    dots: [{ x: 133, y: 198 }, { x: 167, y: 198 }],
    exercises: [
      { name: 'Elevação Pélvica (Hip Thrust) com Barra', env: 'gym', level: 'all', reps: '4×8–12', cue: 'Queixo no peito, canelas verticais e pausa de 2s no topo.' },
      { name: 'Cadeira Abdutora Inclinada (FST-7)', env: 'gym', level: 'pro', reps: '7×15 (30s)', cue: 'Tronco levemente à frente para máxima ativação do glúteo médio.' },
      { name: 'Ponte de Glúteo Unilateral + Mini-Band', env: 'home', level: 'all', reps: '4×12–15', cue: 'Empurre pelo calcanhar mantendo quadril nivelado.' },
      { name: 'Agachamento Búlgaro Inclinado', env: 'hybrid', level: 'intermediate', reps: '4×10–12', cue: 'Passo mais longo e tronco inclinado aumentam recrutamento glúteo.' },
    ],
  },
  {
    id: 'quadriceps',
    name: 'Quadríceps',
    icon: '🦵',
    side: 'front',
    anatomy: 'Reto femoral, vasto lateral, medial e intermédio',
    paths: [
      'M 116 218 C 114 238 117 258 122 272 C 132 276 141 268 144 252 C 146 238 146 225 144 218 Z',
      'M 184 218 C 186 238 183 258 178 272 C 168 276 159 268 156 252 C 154 238 154 225 156 218 Z',
    ],
    dots: [{ x: 131, y: 248 }, { x: 169, y: 248 }],
    exercises: [
      { name: 'Agachamento Livre / Hack Squat Profundo', env: 'gym', level: 'all', reps: '4×8–10', cue: 'Desça com controle mantendo joelhos alinhados aos pés.' },
      { name: 'Cadeira Extensora (FST-7)', env: 'gym', level: 'pro', reps: '7×12 (35s)', cue: 'Segure 1s com joelhos estendidos para detalhar o reto femoral.' },
      { name: 'Agachamento Búlgaro com Carga', env: 'home', level: 'all', reps: '4×10–12', cue: 'Tronco mais ereto foca diretamente no quadríceps.' },
      { name: 'Agachamento Goblet Calcanhar Elevado', env: 'hybrid', level: 'beginner', reps: '4×12–15', cue: 'Calcanhar elevado permite máxima flexão de joelho.' },
    ],
  },
  {
    id: 'posteriores',
    name: 'Posteriores',
    icon: '🔥',
    side: 'back',
    anatomy: 'Isquiotibiais (bíceps femoral, semitendíneo e semimembranoso)',
    paths: [
      'M 116 226 C 115 246 118 265 123 276 C 133 278 140 268 143 248 L 144 226 Z',
      'M 184 226 C 185 246 182 265 177 276 C 167 278 160 268 157 248 L 156 226 Z',
    ],
    dots: [{ x: 130, y: 252 }, { x: 170, y: 252 }],
    exercises: [
      { name: 'Stiff / Terra Romeno (RDL) com Barra', env: 'gym', level: 'all', reps: '4×8–10', cue: 'Empurre o quadril para trás mantendo a barra rente às pernas.' },
      { name: 'Cadeira Flexora Sentada', env: 'gym', level: 'intermediate', reps: '4×10–12', cue: 'Quadril flexionado aumenta hipertrofia por alongamento.' },
      { name: 'Slider Hamstring Curl no Solo', env: 'home', level: 'all', reps: '4×10–12', cue: 'Deslize os calcanhares no pano mantendo o quadril elevado.' },
      { name: 'RDL Unilateral com Halteres', env: 'hybrid', level: 'intermediate', reps: '3×10–12', cue: 'Alongue o posterior em 3s mantendo coluna perfeitamente neutra.' },
    ],
  },
  {
    id: 'panturrilha',
    name: 'Panturrilha',
    icon: '🦶',
    side: 'both',
    anatomy: 'Gastrocnêmio (cabeça medial e lateral) e sóleo',
    pathsFront: [
      'M 121 290 C 115 304 116 322 122 336 C 128 338 135 326 138 308 C 138 296 133 290 121 290 Z',
      'M 179 290 C 185 304 184 322 178 336 C 172 338 165 326 162 308 C 162 296 167 290 179 290 Z',
    ],
    pathsBack: [
      'M 118 288 C 111 304 112 325 120 340 C 128 340 135 325 137 306 C 137 294 130 288 118 288 Z',
      'M 182 288 C 189 304 188 325 180 340 C 172 340 165 325 163 306 C 163 294 170 288 182 288 Z',
    ],
    dotsFront: [{ x: 127, y: 312 }, { x: 173, y: 312 }],
    dotsBack: [{ x: 125, y: 312 }, { x: 175, y: 312 }],
    exercises: [
      { name: 'Panturrilha em Pé na Máquina / Leg Press', env: 'gym', level: 'all', reps: '4×12–20', cue: 'Pausa de 2s no alongamento máximo no fundo para anular rebote elástico.' },
      { name: 'Panturrilha Unilateral no Degrau', env: 'home', level: 'all', reps: '4×15–20', cue: 'Amplitude total subindo até a ponta dos dedos.' },
      { name: 'Panturrilha Unilateral com Halter', env: 'hybrid', level: 'intermediate', reps: '4×15', cue: 'Faça parciais alongadas após a falha técnica.' },
    ],
  },
];

function getPathsForSide(muscle, side) {
  if (muscle.side === 'both') {
    return side === 'front' ? muscle.pathsFront : muscle.pathsBack;
  }
  return muscle.side === side ? muscle.paths : [];
}

function getDotsForSide(muscle, side) {
  if (muscle.side === 'both') {
    return side === 'front' ? muscle.dotsFront : muscle.dotsBack;
  }
  return muscle.side === side ? muscle.dots : [];
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderAtlasTab(container, ctx) {
  const isPro = ctx.user?.level === 'pro';
  const activeMuscle = ATLAS_MUSCLES.find((m) => m.id === selectedMuscleId) || ATLAS_MUSCLES[0];

  const visibleMusclesOnSide = ATLAS_MUSCLES.filter(
    (m) => m.side === 'both' || m.side === activeSide
  );

  const filteredExercises = (activeMuscle.exercises || []).filter((ex) => {
    const envOk = envFilter === 'all' || ex.env === envFilter;
    const lvlOk = levelFilter === 'all' || ex.level === 'all' || ex.level === levelFilter;
    return envOk && lvlOk;
  });

  const svgZones = visibleMusclesOnSide
    .map((m) => {
      const paths = getPathsForSide(m, activeSide);
      const dots = getDotsForSide(m, activeSide);
      const isSelected = m.id === activeMuscle.id;
      return `
        <g class="atlas-muscle-group ${isSelected ? 'selected' : ''}" data-atlas-muscle="${m.id}" role="button" tabindex="0" aria-label="${escapeHtml(m.name)}">
          ${paths
            .map(
              (d) => `<path class="atlas-muscle-path" d="${d}" />`
            )
            .join('')}
          ${dots
            .map(
              (pt) => `
              ${isSelected ? `<circle class="atlas-pulse-ring" cx="${pt.x}" cy="${pt.y}" r="9" />` : ''}
              <circle class="atlas-pin-dot" cx="${pt.x}" cy="${pt.y}" r="${isSelected ? 4.5 : 3.4}" />
            `
            )
            .join('')}
        </g>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="screen-enter">
      <div class="screen-head">
        <h1 class="screen-title">Atlas Muscular</h1>
        <p class="screen-sub">Toque diretamente em qualquer parte do corpo para explorar.</p>
      </div>

      <!-- Cartão Principal: Pessoa Real Interativa -->
      <section class="atlas-stage-card ${isPro ? 'atlas-pro' : ''} mb-16">
        <div class="atlas-stage-header">
          <span class="pill ${isPro ? 'pill-gold' : 'pill-emerald'} pill-xs">🧍 ATLAS INTERATIVO</span>
          <div class="atlas-side-toggle">
            <button class="atlas-side-btn ${activeSide === 'front' ? 'active' : ''}" data-atlas-side="front">Frente</button>
            <button class="atlas-side-btn ${activeSide === 'back' ? 'active' : ''}" data-atlas-side="back">Costas</button>
          </div>
        </div>

        <div class="atlas-photo-viewport">
          <img
            src="/assets/atlas-${activeSide}.jpg"
            alt="Atleta real vista ${activeSide === 'front' ? 'frontal' : 'posterior'}"
            class="atlas-real-photo"
            draggable="false"
          />
          <svg
            class="atlas-svg-overlay"
            viewBox="0 0 300 400"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Mapa muscular interativo"
          >
            <defs>
              <filter id="atlasGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            ${svgZones}
          </svg>
        </div>

        <!-- Rodapé Anatômico do Músculo Selecionado -->
        <div class="atlas-selected-callout">
          <span class="atlas-callout-dot"></span>
          <div>
            <strong>${escapeHtml(activeMuscle.name)} selecionado</strong>
            <span>${escapeHtml(activeMuscle.anatomy)}</span>
          </div>
        </div>
      </section>

      <!-- Chips Rápidos de Todos os Músculos -->
      <div class="pill-scroll mb-14">
        ${ATLAS_MUSCLES.map(
          (m) => `
          <button class="atlas-muscle-pill ${m.id === activeMuscle.id ? 'active' : ''}" data-pick-muscle="${m.id}">
            <span>${m.icon}</span> ${escapeHtml(m.name)}
          </button>
        `
        ).join('')}
      </div>

      <!-- Filtros Limpos de Ambiente & Nível -->
      <div class="atlas-filters-box mb-14">
        <div class="pill-choice-row mb-8">
          <button class="choice-chip ${envFilter === 'all' ? 'active' : ''}" data-aenv="all">Todos</button>
          <button class="choice-chip ${envFilter === 'home' ? 'active' : ''}" data-aenv="home">🏠 Casa</button>
          <button class="choice-chip ${envFilter === 'gym' ? 'active' : ''}" data-aenv="gym">🏋️ Academia</button>
          <button class="choice-chip ${envFilter === 'hybrid' ? 'active' : ''}" data-aenv="hybrid">✈️ Híbrido</button>
        </div>
        <div class="pill-choice-row">
          <button class="choice-chip ${levelFilter === 'all' ? 'active' : ''}" data-alvl="all">Todos</button>
          <button class="choice-chip ${levelFilter === 'beginner' ? 'active' : ''}" data-alvl="beginner">Iniciante</button>
          <button class="choice-chip ${levelFilter === 'intermediate' ? 'active' : ''}" data-alvl="intermediate">Interm.</button>
          <button class="choice-chip ${levelFilter === 'pro' ? 'active-gold' : ''}" data-alvl="pro">Pro</button>
        </div>
      </div>

      <!-- Exercícios Filtrados para o Músculo Tocado -->
      <div class="mini-eyebrow mb-8">
        EXERCÍCIOS PARA ${escapeHtml(activeMuscle.name.toUpperCase())} (${filteredExercises.length})
      </div>

      <div class="stack-10">
        ${
          filteredExercises.length === 0
            ? `<div class="card empty-state-card">Nenhum exercício neste filtro. Toque em <strong>Todos</strong> para ver todas as opções de ${escapeHtml(activeMuscle.name)}.</div>`
            : filteredExercises
                .map(
                  (ex, idx) => `
                <article class="card atlas-ex-card">
                  <div class="atlas-ex-top">
                    <div class="goal-tags">
                      <span class="pill pill-emerald pill-xs">${ex.env === 'gym' ? 'Academia' : ex.env === 'home' ? 'Em Casa' : 'Híbrido'}</span>
                      <span class="pill pill-neutral pill-xs">${escapeHtml(ex.reps)}</span>
                      ${ex.level === 'pro' ? '<span class="pill pill-gold pill-xs">Pro</span>' : ''}
                    </div>
                  </div>
                  <h3 class="atlas-ex-name">${escapeHtml(ex.name)}</h3>
                  <p class="atlas-ex-cue">${escapeHtml(ex.cue)}</p>
                  <button class="btn btn-xs btn-ghost mt-8" data-save-atlas-ex="${idx}">+ Salvar no Meu Treino Personalizado</button>
                </article>
              `
                )
                .join('')
        }
      </div>
    </div>
  `;

  bindAtlasEvents(container, ctx, activeMuscle, filteredExercises);
}

function bindAtlasEvents(container, ctx, activeMuscle, filteredExercises) {
  container.querySelectorAll('[data-atlas-side]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeSide = btn.dataset.atlasSide;
      // Se o músculo atual só existe do outro lado, seleciona o principal do novo lado
      const cur = ATLAS_MUSCLES.find((m) => m.id === selectedMuscleId);
      if (cur && cur.side !== 'both' && cur.side !== activeSide) {
        selectedMuscleId = activeSide === 'front' ? 'peito' : 'costas';
      }
      renderAtlasTab(container, ctx);
    });
  });

  // Toque direto nos músculos sobre a foto da pessoa real
  container.querySelectorAll('[data-atlas-muscle]').forEach((el) => {
    el.addEventListener('click', () => {
      selectedMuscleId = el.dataset.atlasMuscle;
      renderAtlasTab(container, ctx);
    });
  });

  // Toque nos chips horizontais (vira automaticamente Frente/Costas quando necessário!)
  container.querySelectorAll('[data-pick-muscle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.pickMuscle;
      const target = ATLAS_MUSCLES.find((m) => m.id === id);
      if (!target) return;
      selectedMuscleId = id;
      if (target.side !== 'both') {
        activeSide = target.side;
      }
      renderAtlasTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-aenv]').forEach((btn) => {
    btn.addEventListener('click', () => {
      envFilter = btn.dataset.aenv;
      renderAtlasTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-alvl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      levelFilter = btn.dataset.alvl;
      renderAtlasTab(container, ctx);
    });
  });

  // Salvar exercício direto no Treino Personalizado do usuário (UID isolado)
  container.querySelectorAll('[data-save-atlas-ex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ex = filteredExercises[Number(btn.dataset.saveAtlasEx)];
      if (!ex) return;

      const list = ctx.data.customWorkouts || [];
      let atlasWorkout = list.find((cw) => cw.id === 'cw_atlas_favoritos');
      if (!atlasWorkout) {
        atlasWorkout = {
          id: 'cw_atlas_favoritos',
          name: 'Meus Exercícios do Atlas',
          focus: 'Montado pelo Atlas Interativo',
          location: ctx.user.location || 'gym',
          exercises: [],
        };
        list.unshift(atlasWorkout);
      }

      if (!atlasWorkout.exercises.some((e) => e.name === ex.name)) {
        atlasWorkout.exercises.push({
          id: `atlas_${Date.now()}`,
          name: ex.name,
          muscle: activeMuscle.name,
          sets: ex.reps.startsWith('7') ? 7 : 4,
          reps: ex.reps.includes('×') ? ex.reps.split('×')[1] : '10–12',
          loadKg: ex.env === 'home' ? 10 : 30,
          restSec: ex.reps.includes('35s') ? 35 : 75,
          technique: ex.level === 'pro' ? 'FST-7 / RPE 9–10' : '',
        });
        ctx.data.customWorkouts = list;
        ctx.saveData();
        ctx.toast(`"${ex.name}" adicionado a "Meus Exercícios do Atlas"!`, 'success');
      } else {
        ctx.toast('Este exercício já está no seu treino do Atlas.');
      }
    });
  });
}
