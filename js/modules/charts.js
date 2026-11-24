/**
 * Piff Paff Gym — Gráficos Interativos (Chart.js — Estilo Mobile Minimalista)
 * Sub-telas separadas: [Histórico de Cargas] | [Peso, IMC & BF%] (SEM balanças inteligentes)
 */

let chartView = 'loads'; // 'loads' | 'weight'
let loadChartInstance = null;
let weightChartInstance = null;
let selectedExerciseName = '';

function destroyCharts() {
  if (loadChartInstance) {
    loadChartInstance.destroy();
    loadChartInstance = null;
  }
  if (weightChartInstance) {
    weightChartInstance.destroy();
    weightChartInstance = null;
  }
}

function formatDateShort(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function calculateBmi(weightKg, heightCm) {
  const w = Number(weightKg) || 0;
  const h = (Number(heightCm) || 0) / 100;
  if (w <= 0 || h <= 0) return { value: 0, label: '—', tone: 'neutral' };
  const bmi = Math.round((w / (h * h)) * 10) / 10;

  let label = 'Faixa Saudável';
  let tone = 'emerald';
  if (bmi < 18.5) {
    label = 'Abaixo do Peso';
    tone = 'gold';
  } else if (bmi >= 25 && bmi < 30) {
    label = 'Sobrepeso / Massa Atlética';
    tone = 'gold';
  } else if (bmi >= 30) {
    label = 'Atenção';
    tone = 'danger';
  }
  return { value: bmi, label, tone };
}

export function calculateUsNavyBf({ gender, heightCm, neckCm, waistCm, hipCm }) {
  const h = Number(heightCm);
  const n = Number(neckCm);
  const w = Number(waistCm);
  const hip = Number(hipCm);
  if (!h || !n || !w) return null;

  if (gender === 'female') {
    if (!hip || w + hip <= n) return null;
    const bf = 163.205 * Math.log10(w + hip - n) - 97.684 * Math.log10(h) - 78.387;
    return Math.max(5, Math.min(55, Math.round(bf * 10) / 10));
  } else {
    if (w <= n) return null;
    const bf = 86.01 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
    return Math.max(3, Math.min(50, Math.round(bf * 10) / 10));
  }
}

export function renderChartsTab(container, ctx) {
  destroyCharts();
  const { data } = ctx;
  const loadHistory = data.loadHistory || {};
  const exerciseNames = Object.keys(loadHistory);

  if (!selectedExerciseName || !loadHistory[selectedExerciseName]) {
    selectedExerciseName = exerciseNames[0] || '';
  }

  const activeSeries = selectedExerciseName ? loadHistory[selectedExerciseName] || [] : [];
  const initialLoad = activeSeries.length ? Number(activeSeries[0].weightKg) : 0;
  const prLoad = activeSeries.length ? Math.max(...activeSeries.map((e) => Number(e.weightKg) || 0)) : 0;
  const gainPct =
    initialLoad > 0 ? Math.round(((prLoad - initialLoad) / initialLoad) * 1000) / 10 : prLoad > 0 ? 100 : 0;

  const body = data.bodyProfile || { weightKg: 75, heightCm: 175, goalWeightKg: 75, bodyFatPct: null, gender: 'male' };
  const weightHist = [...(data.weightHistory || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestWeight = weightHist.length ? Number(weightHist[weightHist.length - 1].weightKg) : Number(body.weightKg);
  const bmi = calculateBmi(latestWeight, body.heightCm);

  container.innerHTML = `
    <div class="segmented-control full-seg mb-16">
      <button class="seg-btn ${chartView === 'loads' ? 'active' : ''}" data-chview="loads">Cargas & PR</button>
      <button class="seg-btn ${chartView === 'weight' ? 'active' : ''}" data-chview="weight">Peso, IMC & BF%</button>
    </div>

    ${
      chartView === 'loads'
        ? `
          <button class="btn btn-emerald btn-full mb-16" id="btn-log-load-manual">+ Registrar Carga</button>
          ${
            exerciseNames.length === 0
              ? `<div class="card empty-state-card">Conclua um treino ou registre uma carga para ver o gráfico.</div>`
              : `
                <div class="form-field mb-12">
                  <label>Exercício</label>
                  <select id="chart-exercise-select">
                    ${exerciseNames
                      .map((name) => `<option value="${escapeHtml(name)}" ${name === selectedExerciseName ? 'selected' : ''}>${escapeHtml(name)}</option>`)
                      .join('')}
                  </select>
                </div>

                <div class="kpi-grid-3 mb-16">
                  <div class="kpi-card">
                    <span class="kpi-label">Inicial</span>
                    <strong class="kpi-val-sm">${initialLoad} kg</strong>
                  </div>
                  <div class="kpi-card kpi-gold">
                    <span class="kpi-label">PR Atual</span>
                    <strong class="kpi-val-sm text-gold">${prLoad} kg</strong>
                  </div>
                  <div class="kpi-card kpi-emerald">
                    <span class="kpi-label">Ganho</span>
                    <strong class="kpi-val-sm text-emerald">${gainPct >= 0 ? '+' : ''}${gainPct}%</strong>
                  </div>
                </div>

                <section class="card">
                  <div class="chart-canvas-box">
                    <canvas id="canvas-load-chart"></canvas>
                  </div>
                </section>
              `
          }
        `
        : `
          <div class="action-pair-row mb-16">
            <button class="btn btn-emerald flex-1" id="btn-log-weight">+ Registrar Peso</button>
            <button class="btn btn-ghost" id="btn-bf-calculator">📏 Fita BF%</button>
          </div>

          <div class="kpi-grid-2 mb-16">
            <div class="kpi-card">
              <span class="kpi-label">Peso Atual</span>
              <strong class="kpi-val-sm">${latestWeight.toFixed(1)} kg</strong>
              <span class="kpi-note">Meta: ${Number(body.goalWeightKg || latestWeight).toFixed(1)} kg</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">IMC (${body.heightCm}cm)</span>
              <strong class="kpi-val-sm">${bmi.value}</strong>
              <span class="kpi-note ${bmi.tone === 'emerald' ? 'text-emerald' : 'text-gold'}">${bmi.label}</span>
            </div>
            <div class="kpi-card kpi-gold" style="grid-column: span 2;">
              <span class="kpi-label">% de Gordura Corporal (Manual / US Navy)</span>
              <strong class="kpi-val-sm text-gold">${body.bodyFatPct ? `${body.bodyFatPct}%` : 'Não informado'}</strong>
            </div>
          </div>

          <section class="card">
            <div class="chart-canvas-box">
              <canvas id="canvas-weight-chart"></canvas>
            </div>
          </section>
        `
    }
  `;

  if (typeof window.Chart !== 'undefined') {
    if (chartView === 'loads' && activeSeries.length > 0) renderLoadChart(activeSeries);
    if (chartView === 'weight' && weightHist.length > 0) renderWeightChart(weightHist, Number(body.goalWeightKg || latestWeight));
  }

  bindChartsEvents(container, ctx);
}

function renderLoadChart(series) {
  const el = document.getElementById('canvas-load-chart');
  if (!el) return;
  const ctx2d = el.getContext('2d');
  const grad = ctx2d.createLinearGradient(0, 0, 0, 240);
  grad.addColorStop(0, 'rgba(16, 185, 129, 0.34)');
  grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  loadChartInstance = new window.Chart(ctx2d, {
    type: 'line',
    data: {
      labels: series.map((s) => formatDateShort(s.date)),
      datasets: [
        {
          label: 'Carga (kg)',
          data: series.map((s) => Number(s.weightKg)),
          borderColor: '#10b981',
          backgroundColor: grad,
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#09090b',
          pointBorderWidth: 2,
          pointRadius: 5,
          fill: true,
          tension: 0.32,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa' } },
        y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#a1a1aa', callback: (v) => `${v}kg` } },
      },
    },
  });
}

function renderWeightChart(weightHist, goalWeight) {
  const el = document.getElementById('canvas-weight-chart');
  if (!el) return;
  const ctx2d = el.getContext('2d');
  const grad = ctx2d.createLinearGradient(0, 0, 0, 240);
  grad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
  grad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

  weightChartInstance = new window.Chart(ctx2d, {
    type: 'line',
    data: {
      labels: weightHist.map((w) => formatDateShort(w.date)),
      datasets: [
        {
          label: 'Peso (kg)',
          data: weightHist.map((w) => Number(w.weightKg)),
          borderColor: '#f59e0b',
          backgroundColor: grad,
          borderWidth: 3,
          pointBackgroundColor: '#f59e0b',
          pointRadius: 5,
          fill: true,
          tension: 0.3,
        },
        {
          label: `Meta (${goalWeight}kg)`,
          data: weightHist.map(() => goalWeight),
          borderColor: '#10b981',
          borderWidth: 2,
          borderDash: [7, 5],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: '#d4d4d8', boxWidth: 12 } },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa' } },
        y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#a1a1aa', callback: (v) => `${v}kg` } },
      },
    },
  });
}

function bindChartsEvents(container, ctx) {
  container.querySelectorAll('[data-chview]').forEach((btn) => {
    btn.addEventListener('click', () => {
      chartView = btn.dataset.chview;
      renderChartsTab(container, ctx);
    });
  });

  container.querySelector('#chart-exercise-select')?.addEventListener('change', (e) => {
    selectedExerciseName = e.target.value;
    renderChartsTab(container, ctx);
  });

  container.querySelector('#btn-log-load-manual')?.addEventListener('click', () => {
    const today = new Date().toISOString().slice(0, 10);
    const existingNames = Object.keys(ctx.data.loadHistory || {});
    ctx.openModal(
      'Registrar Carga',
      `
        <form id="form-manual-load" class="modal-form">
          <div class="form-field">
            <label>Exercício</label>
            <input type="text" name="exercise" list="datalist-exercises" required value="${escapeHtml(selectedExerciseName)}" />
            <datalist id="datalist-exercises">
              ${existingNames.map((n) => `<option value="${escapeHtml(n)}"></option>`).join('')}
            </datalist>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label>Carga (kg)</label>
              <input type="number" step="0.5" min="0" name="weightKg" required placeholder="80" />
            </div>
            <div class="form-field">
              <label>Data</label>
              <input type="date" name="date" required value="${today}" />
            </div>
          </div>
          <button type="submit" class="btn btn-emerald btn-full">Salvar</button>
        </form>
      `,
      (modalBody) => {
        modalBody.querySelector('#form-manual-load').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const exName = String(fd.get('exercise')).trim();
          if (!exName) return;
          if (!ctx.data.loadHistory) ctx.data.loadHistory = {};
          if (!ctx.data.loadHistory[exName]) ctx.data.loadHistory[exName] = [];
          ctx.data.loadHistory[exName].push({ date: fd.get('date'), weightKg: Number(fd.get('weightKg')) });
          ctx.data.loadHistory[exName].sort((a, b) => a.date.localeCompare(b.date));
          selectedExerciseName = exName;
          ctx.saveData();
          ctx.closeModal();
          ctx.toast('Carga registrada!', 'success');
          renderChartsTab(container, ctx);
        });
      }
    );
  });

  container.querySelector('#btn-log-weight')?.addEventListener('click', () => {
    const today = new Date().toISOString().slice(0, 10);
    const body = ctx.data.bodyProfile || {};
    ctx.openModal(
      'Registrar Peso & Meta',
      `
        <form id="form-log-weight" class="modal-form">
          <div class="form-grid-2">
            <div class="form-field">
              <label>Peso Atual (kg)</label>
              <input type="number" step="0.1" name="weightKg" required value="${body.weightKg || 75}" />
            </div>
            <div class="form-field">
              <label>Data</label>
              <input type="date" name="date" required value="${today}" />
            </div>
          </div>
          <div class="form-grid-3">
            <div class="form-field">
              <label>Meta (kg)</label>
              <input type="number" step="0.1" name="goalWeightKg" required value="${body.goalWeightKg || 75}" />
            </div>
            <div class="form-field">
              <label>Altura (cm)</label>
              <input type="number" name="heightCm" required value="${body.heightCm || 175}" />
            </div>
            <div class="form-field">
              <label>BF% (Opc.)</label>
              <input type="number" step="0.1" name="bodyFatPct" value="${body.bodyFatPct ?? ''}" />
            </div>
          </div>
          <button type="submit" class="btn btn-emerald btn-full">Salvar</button>
        </form>
      `,
      (modalBody) => {
        modalBody.querySelector('#form-log-weight').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const w = Number(fd.get('weightKg'));
          const gw = Number(fd.get('goalWeightKg'));
          const h = Number(fd.get('heightCm'));
          const bf = fd.get('bodyFatPct') ? Number(fd.get('bodyFatPct')) : ctx.data.bodyProfile.bodyFatPct;
          ctx.data.bodyProfile.weightKg = w;
          ctx.data.bodyProfile.goalWeightKg = gw;
          ctx.data.bodyProfile.heightCm = h;
          ctx.data.bodyProfile.bodyFatPct = bf;
          ctx.data.weightHistory = [
            ...(ctx.data.weightHistory || []),
            { id: `wh_${Date.now()}`, date: fd.get('date'), weightKg: w, bodyFatPct: bf, note: 'Check-in' },
          ].sort((a, b) => a.date.localeCompare(b.date));
          for (const g of ctx.data.goals || []) {
            if (!g.completed && g.category === 'peso' && g.unit === 'kg') g.currentValue = w;
          }
          ctx.updateUserProfile({ weightKg: w, heightCm: h, goalWeightKg: gw });
          ctx.saveData();
          ctx.closeModal();
          ctx.toast('Peso atualizado!', 'success');
          renderChartsTab(container, ctx);
        });
      }
    );
  });

  container.querySelector('#btn-bf-calculator')?.addEventListener('click', () => {
    const body = ctx.data.bodyProfile || {};
    ctx.openModal(
      'Calcular BF% (Fita Métrica US Navy)',
      `
        <form id="form-bf-navy" class="modal-form">
          <div class="form-grid-2">
            <div class="form-field">
              <label>Sexo</label>
              <select name="gender" id="bf-gender-select">
                <option value="male" ${body.gender !== 'female' ? 'selected' : ''}>Masculino</option>
                <option value="female" ${body.gender === 'female' ? 'selected' : ''}>Feminino</option>
              </select>
            </div>
            <div class="form-field">
              <label>Altura (cm)</label>
              <input type="number" step="0.5" name="heightCm" required value="${body.heightCm || 175}" />
            </div>
          </div>
          <div class="form-grid-3">
            <div class="form-field">
              <label>Pescoço</label>
              <input type="number" step="0.5" name="neckCm" required value="${body.neckCm || 38}" />
            </div>
            <div class="form-field">
              <label>Cintura</label>
              <input type="number" step="0.5" name="waistCm" required value="${body.waistCm || 82}" />
            </div>
            <div class="form-field" id="bf-hip-field" style="${body.gender === 'female' ? '' : 'opacity:0.45'}">
              <label>Quadril</label>
              <input type="number" step="0.5" name="hipCm" value="${body.hipCm || 96}" />
            </div>
          </div>
          <button type="submit" class="btn btn-gold btn-full">Calcular & Salvar</button>
        </form>
      `,
      (modalBody) => {
        const gSel = modalBody.querySelector('#bf-gender-select');
        const hipBox = modalBody.querySelector('#bf-hip-field');
        gSel.addEventListener('change', () => (hipBox.style.opacity = gSel.value === 'female' ? '1' : '0.45'));
        modalBody.querySelector('#form-bf-navy').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const payload = {
            gender: fd.get('gender'),
            heightCm: Number(fd.get('heightCm')),
            neckCm: Number(fd.get('neckCm')),
            waistCm: Number(fd.get('waistCm')),
            hipCm: Number(fd.get('hipCm')),
          };
          const res = calculateUsNavyBf(payload);
          if (res === null) return ctx.toast('Verifique as medidas informadas.', 'error');
          Object.assign(ctx.data.bodyProfile, payload, { bodyFatPct: res });
          ctx.saveData();
          ctx.closeModal();
          ctx.toast(`BF% estimado: ${res}%`, 'success');
          renderChartsTab(container, ctx);
        });
      }
    );
  });
}
