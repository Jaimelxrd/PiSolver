'use strict';
/* ═══════════════════════════════════════════════════
   π MathLab — script.js
   Módulos:
   1. Canvas background
   2. Slot-machine countdown (2026 → 3.14 em 60s)
   3. Dashboard navigation
   4. Operações básicas
   5. Equações
   6. Cálculo simbólico
   7. Gráficos Plotly
   8. Utilidades
   ═══════════════════════════════════════════════════ */


/* ══════════════════════════════════════════
   1. CANVAS BACKGROUND — partículas flutuantes
   ══════════════════════════════════════════ */
(function bgCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  const PI_CHARS = '3.14159265358979323846'.split('');
  const particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 40; i++) {
    particles.push({
      x:  Math.random() * 1200,
      y:  Math.random() * 900,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      size:  Math.random() * 18 + 6,
      alpha: Math.random() * .1 + .02,
      char:  PI_CHARS[Math.floor(Math.random() * PI_CHARS.length)],
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -30) p.x = W + 30;
      if (p.x > W + 30) p.x = -30;
      if (p.y < -30) p.y = H + 30;
      if (p.y > H + 30) p.y = -30;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#f97316';
      ctx.font = `900 ${p.size}px 'Bebas Neue', sans-serif`;
      ctx.fillText(p.char, p.x, p.y);
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();


/* ══════════════════════════════════════════
   2. COUNTDOWN — SLOT MACHINE 2026 → 3.14
   ══════════════════════════════════════════ */
(function Countdown() {
  const DURATION = 10; // seconds total

  // Build the sequence: 2026, 2025, ..., 4, 3.14
  // We need meaningful "stops" spread over 60 seconds.
  // Total numbers from 2026 down to 4 = 2023 numbers, plus final 3.14
  // We'll display a subset, animating smoothly:
  //  - Start at 2026
  //  - End at 3.14
  //  - Step decreases as we approach the end (like a slot machine slowing down)

  const track   = document.getElementById('slot-track');
  const barEl   = document.getElementById('cd-bar');
  const timerEl = document.getElementById('cd-timer');

  // Build visible sequence items to slot through
  // We show numbers from 2026 down with step sizes that compress over time
  const sequence = buildSequence();

  // Populate DOM
  sequence.forEach((val, i) => {
    const el = document.createElement('div');
    el.className = 'slot-num' + (i === 0 ? ' current' : '');
    el.textContent = val;
    track.appendChild(el);
  });

  function buildSequence() {
    const seq = [];
    // Phase 1: fast (2026 → 1000): step ~200
    for (let n = 2026; n >= 1000; n -= 2) seq.push(n);
    // Phase 2: (1000 → 100): step ~100
    for (let n = 900; n >= 100; n -= 10) seq.push(n);
    // Phase 3: (100 → 10): step ~10
    for (let n = 90; n >= 10; n -= 1) seq.push(n);
    // Phase 4: (10 → 4): step 1
    for (let n = 9; n >= 4; n--) seq.push(n);
    // Final
    seq.push('3.14');
    return seq;
  }

  const TOTAL_STEPS = sequence.length - 1; // steps to go from index 0 to last
  let currentIndex = 0;
  let secondsLeft  = DURATION;
  let startTime    = Date.now();
  let launched     = false;

  // Item height: read from CSS (slot mask height)
  function getItemH() {
    const mask = document.querySelector('.cd-slot-mask');
    return mask ? mask.offsetHeight : 140;
  }

  function setSlotIndex(idx) {
    if (idx >= sequence.length) idx = sequence.length - 1;
    const h = getItemH();
    track.style.transform = `translateY(-${idx * h}px)`;

    // Highlight current
    track.querySelectorAll('.slot-num').forEach((el, i) => {
      el.className = 'slot-num';
      if (i === idx) el.classList.add('current');
      else if (Math.abs(i - idx) > 2) el.classList.add('dim');
    });
  }

  // Special: 3.14 gets amber3 color
  function highlightPiDay(el) {
    if (el) el.style.color = 'var(--amber3)';
  }

  function tick() {
    if (launched) return;

    const elapsed   = (Date.now() - startTime) / 1000;
    secondsLeft     = Math.max(0, DURATION - Math.floor(elapsed));
    timerEl.textContent = secondsLeft;

    // Progress bar
    const pct = Math.min(100, (elapsed / DURATION) * 100);
    barEl.style.width = pct + '%';

    // Which slot index to show?
    // Map elapsed (0..60) → index (0..TOTAL_STEPS)
    // Use easeInQuart so it starts slow and speeds up, then slows down at the end
    const t         = Math.min(1, elapsed / DURATION);
    const eased     = easeInOutCubic(t);
    const targetIdx = Math.round(eased * TOTAL_STEPS);

    if (targetIdx !== currentIndex) {
      currentIndex = targetIdx;
      setSlotIndex(currentIndex);
    }

    if (elapsed >= DURATION) {
      // Make sure we're on 3.14
      setSlotIndex(sequence.length - 1);
      const lastEl = track.querySelectorAll('.slot-num')[sequence.length - 1];
      highlightPiDay(lastEl);
      launched = true;
      setTimeout(launchDashboard, 1200);
      return;
    }

    requestAnimationFrame(tick);
  }

  // Easing: slow start, fast middle, slow end
  function easeInOutCubic(t) {
    return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Start
  setSlotIndex(0);
  requestAnimationFrame(tick);

  /* ── LAUNCH ── */
  function launchDashboard() {
    const cd   = document.getElementById('screen-countdown');
    const dash = document.getElementById('screen-dashboard');

    cd.style.transition = 'opacity .7s ease';
    cd.style.opacity    = '0';

    setTimeout(() => {
      cd.classList.add('hidden');
      dash.classList.remove('hidden');
      dash.style.opacity    = '0';
      dash.style.transition = 'opacity .6s ease';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        dash.style.opacity = '1';
        initDashboard();
      }));
    }, 720);
  }
})();


/* ══════════════════════════════════════════
   3. DASHBOARD
   ══════════════════════════════════════════ */
const PAGE_NAMES = {
  'overview':   'Visão Geral',
  'basic':      'Operações Básicas',
  'equations':  'Equações',
  'calculus':   'Cálculo Simbólico',
  'graph':      'Gráficos',
};

// Map screen id suffix → display name
const SCREEN_MAP = {
  's-overview':  'overview',
  's-basic':     'basic',
  's-equations': 'equations',
  's-calculus':  'calculus',
  's-graph':     'graph',
};

function initDashboard() {
  initNav();
  initSubTabs();
  initHamburger();
  loadFact();
  // Default graph
  setTimeout(() => {
    document.getElementById('gfn1').value = 'sin(x)';
    plotMain();
  }, 500);
}

/* ── NAV ── */
function goTo(screenId) {
  // screenId = 's-basic' etc
  activateScreen(screenId);
}

function activateScreen(screenId) {
  document.querySelectorAll('.dash-screen').forEach(s => {
    s.classList.toggle('active', s.id === screenId);
    s.classList.toggle('hidden', s.id !== screenId);
  });
  document.querySelectorAll('.sb-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === screenId);
  });
  const key = SCREEN_MAP[screenId] || 'overview';
  document.getElementById('tb-page').textContent = PAGE_NAMES[key] || screenId;

  // Auto-plot on graph
  if (screenId === 's-graph' && document.getElementById('gfn1').value) {
    setTimeout(plotMain, 200);
  }
  // Close mobile menu
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mob-overlay').classList.add('hidden');
}

function initNav() {
  document.querySelectorAll('.sb-btn').forEach(btn => {
    btn.addEventListener('click', () => activateScreen(btn.dataset.screen));
  });
  activateScreen('s-overview');
}

/* ── HAMBURGER (mobile) ── */
function initHamburger() {
  const btn     = document.getElementById('hbg-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mob-overlay');
  if (!btn) return;
  btn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden', !sidebar.classList.contains('open'));
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.add('hidden');
  });
}

/* ── SUB TABS (equations) ── */
function initSubTabs() {
  document.querySelectorAll('.stab').forEach(tab => {
    tab.addEventListener('click', () => {
      const parent = tab.closest('.dash-screen');
      parent.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
      parent.querySelectorAll('.sub-panel').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.target);
      if (target) { target.classList.remove('hidden'); target.classList.add('active'); }
    });
  });
}

/* ── PI FACTS ── */
const FACTS = [
  'π é irracional e transcendente — não é raiz de nenhum polinômio com coeficientes inteiros.',
  'Com 39 dígitos de π é possível calcular a circunferência do universo observável com precisão atômica.',
  'O símbolo π foi popularizado por Leonhard Euler em 1737.',
  'Leibniz descobriu: π/4 = 1 − 1/3 + 1/5 − 1/7 + …',
  'Arquimedes calculou 223/71 < π < 22/7, usando polígonos de 96 lados.',
  'A Fórmula de Euler: e^(iπ) + 1 = 0 é considerada a mais bela da matemática.',
  'Pi Day é celebrado em 14/03 (3.14) em todo o mundo.',
  'O recorde de dígitos de π calculados ultrapassa 100 trilhões.',
];
function loadFact() {
  document.getElementById('pi-fact').textContent = FACTS[Math.floor(Math.random() * FACTS.length)];
}


/* ══════════════════════════════════════════
   4. OPERAÇÕES BÁSICAS
   ══════════════════════════════════════════ */
function calcBasic() {
  const expr = document.getElementById('basic-expr').value.trim();
  const out  = document.getElementById('basic-result');
  if (!expr) { showR(out, 'Digite uma expressão.', 'err'); return; }
  try {
    const res = math.evaluate(expr);
    showR(out, `${expr}  =  ${fmt(res)}`, 'ok');
  } catch (e) {
    showR(out, 'Expressão inválida: ' + e.message, 'err');
  }
}

let curOp = '+';
function autoQ() {
  const a = parseFloat(document.getElementById('q-a').value);
  const b = parseFloat(document.getElementById('q-b').value);
  if (isNaN(a) || isNaN(b)) return;
  const out = document.getElementById('quick-result');
  const sym = {'+':'+', '-':'−', '*':'×', '/':'÷'}[curOp];
  let res;
  switch (curOp) {
    case '+': res = a + b; break;
    case '-': res = a - b; break;
    case '*': res = a * b; break;
    case '/':
      if (b === 0) { showR(out, 'Divisão por zero!', 'err'); return; }
      res = a / b; break;
  }
  showR(out, `${a}  ${sym}  ${b}  =  ${fmt(res)}`, 'ok');
}
function pickOp(op) {
  curOp = op;
  const map = {'+':'add', '-':'sub', '*':'mul', '/':'div'};
  document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('opbtn-' + map[op])?.classList.add('active');
  autoQ();
}

// Overview calc
function ovCalc() {
  const expr = document.getElementById('ov-expr').value.trim();
  const out  = document.getElementById('ov-result');
  if (!expr) { out.textContent = '—'; return; }
  try { out.textContent = '= ' + fmt(math.evaluate(expr)); }
  catch { out.textContent = 'Inválido'; }
}

// Overview mini graph
function ovGraph() {
  const fn = document.getElementById('ov-fn').value.trim();
  if (!fn) return;
  try {
    const expr = math.parse(fn);
    const f = x => { try { return expr.evaluate({x}); } catch { return NaN; } };
    const {xs, ys} = buildPts(f, -7, 7, 200);
    const layout = { ...BASE_LAYOUT, height: 140, margin: {l:30,r:10,t:10,b:28} };
    Plotly.newPlot('ov-graph',
      [{x:xs, y:ys, mode:'lines', line:{color:'#f97316', width:2}, connectgaps:false}],
      layout, PLOT_CFG);
  } catch { /* ignore */ }
}


/* ══════════════════════════════════════════
   5. EQUAÇÕES
   ══════════════════════════════════════════ */

/* 1º Grau */
function solveLinear() {
  const a = v('lin-a'), b = v('lin-b');
  const out = document.getElementById('lin-result');
  if (isNaN(a)||isNaN(b)) { showR(out,'Preencha os coeficientes.','err'); return; }
  if (a === 0) {
    showR(out, b === 0 ? 'Identidade: infinitas soluções.' : 'Sem solução.', b===0?'ok':'err');
    return;
  }
  const x   = -b / a;
  const sgn = b >= 0 ? '+' : '';
  showR(out,
    `Equação: ${a}x ${sgn}${b} = 0\n` +
    `x = ${fmt(x)}\n` +
    `Verificação: ${fmt(a*x + b)} ≈ 0`, 'ok');
  drawSingle('lin-graph', xv => a*xv + b,
    `f(x) = ${a}x ${sgn}${b}`, 'Equação 1º Grau', [x], '#f97316');
}

/* Quadrática */
function solveQuad() {
  const a = v('qa-a'), b = v('qa-b'), c = v('qa-c');
  const out = document.getElementById('quad-result');
  if (isNaN(a)||isNaN(b)||isNaN(c)) { showR(out,'Preencha os coeficientes.','err'); return; }
  if (a === 0) { showR(out,'Coeficiente a deve ser ≠ 0.','err'); return; }

  const d = b*b - 4*a*c;
  const sa = n => n >= 0 ? `+${n}` : `${n}`;
  let txt = `Equação: ${a}x² ${sa(b)}x ${sa(c)} = 0\nΔ = ${fmt(d)}\n\n`;
  let roots = [];

  if (d > 0) {
    const x1 = (-b + Math.sqrt(d)) / (2*a);
    const x2 = (-b - Math.sqrt(d)) / (2*a);
    roots = [x1, x2];
    txt += `Duas raízes reais:\nx₁ = ${fmt(x1)}\nx₂ = ${fmt(x2)}\n\nForma fatorada:\n${a}(x − ${fmt(x1)})(x − ${fmt(x2)})`;
  } else if (d === 0) {
    const x = -b/(2*a);
    roots = [x];
    txt += `Raiz dupla:\nx = ${fmt(x)}`;
  } else {
    const re = -b/(2*a), im = Math.sqrt(-d)/(2*a);
    txt += `Raízes complexas:\nx₁ = ${fmt(re)} + ${fmt(im)}i\nx₂ = ${fmt(re)} − ${fmt(im)}i`;
  }
  showR(out, txt, 'ok');
  drawSingle('quad-graph', xv => a*xv*xv + b*xv + c,
    `f(x) = ${a}x² ${sa(b)}x ${sa(c)}`, 'Equação Quadrática', roots, '#a855f7');
}

/* Sistema 2×2 */
function solveSystem() {
  const [a1,b1,c1,a2,b2,c2] = ['s-a1','s-b1','s-c1','s-a2','s-b2','s-c2'].map(v);
  const out = document.getElementById('sys-result');
  if ([a1,b1,c1,a2,b2,c2].some(isNaN)) { showR(out,'Preencha todos os campos.','err'); return; }
  const det = a1*b2 - a2*b1;
  if (det === 0) { showR(out,'Sistema indeterminado ou impossível (det = 0).','err'); return; }
  const x = (c1*b2 - c2*b1) / det;
  const y = (a1*c2 - a2*c1) / det;
  showR(out,
    `Sistema:\n  ${a1}x + ${b1}y = ${c1}\n  ${a2}x − ${b2}y = ${c2}\n\n` +
    `Solução:\n  x = ${fmt(x)}\n  y = ${fmt(y)}\n\n` +
    `Verificação:\n  Eq1: ${fmt(a1*x + b1*y)}\n  Eq2: ${fmt(a2*x - b2*y)}`, 'ok');
}


/* ══════════════════════════════════════════
   6. CÁLCULO SIMBÓLICO
   ══════════════════════════════════════════ */

function calcDeriv() {
  const fn  = document.getElementById('deriv-fn').value.trim();
  const out = document.getElementById('deriv-result');
  if (!fn) { showR(out,'Digite uma função.','err'); return; }
  try {
    const expr  = math.parse(fn);
    const dexpr = math.derivative(expr, 'x');
    const dstr  = dexpr.toString();
    showR(out, `f(x)  = ${fn}\nf'(x) = ${dstr}\n\nf'(2) = ${fmt(dexpr.evaluate({x:2}))}`, 'ok');
    drawDouble('deriv-graph',
      x => { try{return expr.evaluate({x});}catch{return NaN;} },
      x => { try{return dexpr.evaluate({x});}catch{return NaN;} },
      `f(x)`, `f'(x)`, 'Função e Derivada');
  } catch(e) { showR(out,'Erro: '+e.message,'err'); }
}

function calcInteg() {
  const fn  = document.getElementById('integ-fn').value.trim();
  const out = document.getElementById('integ-result');
  if (!fn) { showR(out,'Digite uma função.','err'); return; }
  try {
    const expr = math.parse(fn);
    const prim = symPrim(fn);
    showR(out, `f(x) = ${fn}\n∫ f(x) dx = ${prim} + C`, 'ok');
    drawSingle('integ-graph',
      x => { try{return expr.evaluate({x});}catch{return NaN;} },
      `f(x) = ${fn}`, 'Integral — Função Original', [], '#22d3ee');
  } catch(e) { showR(out,'Erro: '+e.message,'err'); }
}

function calcDefinite() {
  const fn = document.getElementById('integ-fn').value.trim();
  const a  = parseFloat(document.getElementById('int-a').value);
  const b  = parseFloat(document.getElementById('int-b').value);
  const out = document.getElementById('def-result');
  if (!fn) { showR(out,'Integre uma função primeiro.','err'); return; }
  if (isNaN(a)||isNaN(b)) { showR(out,'Defina os limites a e b.','err'); return; }
  try {
    const expr = math.parse(fn);
    const f    = x => { try{return expr.evaluate({x});}catch{return NaN;} };
    const val  = simpson(f, a, b);
    showR(out, `∫(${a} → ${b}) ${fn} dx ≈ ${fmt(val)}  [Simpson, n=1000]`, 'ok');
  } catch(e) { showR(out,'Erro: '+e.message,'err'); }
}

function simpson(fn, a, b, n=1000) {
  if (n%2!==0) n++;
  const h = (b-a)/n;
  let s = fn(a) + fn(b);
  for (let i=1; i<n; i++) s += fn(a+i*h) * (i%2===0 ? 2 : 4);
  return (h/3)*s;
}

function symPrim(str) {
  try { return primNode(math.parse(str)); }
  catch { return `∫(${str})dx`; }
}
function primNode(n) {
  if (!n) return '?';
  switch(n.type) {
    case 'ConstantNode': return `${n.value}x`;
    case 'SymbolNode':
      if (n.name==='x') return 'x²/2';
      return `${n.name}·x`;
    case 'OperatorNode':
      if (n.op==='+') return `${primNode(n.args[0])} + ${primNode(n.args[1])}`;
      if (n.op==='-') return `${primNode(n.args[0])} − ${primNode(n.args[1])}`;
      if (n.op==='unaryMinus') return `−(${primNode(n.args[0])})`;
      if (n.op==='*' && n.args[0].type==='ConstantNode')
        return `${n.args[0].value}·(${primNode(n.args[1])})`;
      if (n.op==='*' && n.args[1].type==='ConstantNode')
        return `${n.args[1].value}·(${primNode(n.args[0])})`;
      if (n.op==='^' && n.args[0].type==='SymbolNode' && n.args[0].name==='x') {
        const e = parseFloat(n.args[1].value);
        if (!isNaN(e) && e!==-1) return `x^${e+1}/${e+1}`;
        if (e===-1) return 'ln|x|';
      }
      break;
    case 'FunctionNode':
      switch(n.name) {
        case 'sin':  return '−cos(x)';
        case 'cos':  return 'sin(x)';
        case 'tan':  return '−ln|cos(x)|';
        case 'exp':  return 'e^x';
        case 'log':
        case 'ln':   return 'x·ln(x) − x';
        case 'sqrt': return '(2/3)·x^(3/2)';
      }
      break;
  }
  return `∫(${n.toString()})dx`;
}


/* ══════════════════════════════════════════
   7. GRÁFICOS (Plotly)
   ══════════════════════════════════════════ */

const BASE_LAYOUT = {
  paper_bgcolor: '#0f0f1c',
  plot_bgcolor:  '#080810',
  font: { family: 'DM Mono, monospace', color: '#7878a0', size: 11 },
  xaxis: {
    gridcolor: '#2a2a42', zerolinecolor: '#3a3a58',
    color: '#7878a0', zeroline: true, showgrid: true,
    tickfont: { color: '#3a3a58' }
  },
  yaxis: {
    gridcolor: '#2a2a42', zerolinecolor: '#3a3a58',
    color: '#7878a0', zeroline: true, showgrid: true,
    tickfont: { color: '#3a3a58' }
  },
  margin: { l:50, r:20, t:40, b:40 },
  showlegend: true,
  legend: { x:0, y:1, bgcolor:'rgba(0,0,0,0)', font:{color:'#7878a0',size:11} },
  hovermode: 'x unified',
};

const PLOT_CFG = {
  displayModeBar: true,
  modeBarButtonsToRemove: ['sendDataToCloud','lasso2d','select2d'],
  displaylogo: false,
  responsive: true,
  scrollZoom: true,
};

const COLORS = ['#f97316','#22d3ee','#a855f7','#10b981','#fbbf24','#ef4444'];

function buildPts(fn, xMin=-10, xMax=10, n=500) {
  const xs=[], ys=[];
  const step=(xMax-xMin)/n;
  for (let x=xMin; x<=xMax; x+=step) {
    xs.push(+x.toFixed(6));
    const y=fn(x);
    ys.push(isFinite(y) ? +y.toFixed(8) : null);
  }
  return {xs,ys};
}

function drawSingle(elId, fn, name, title, roots=[], color='#f97316', xR=[-10,10]) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.remove('hidden');
  const {xs,ys} = buildPts(fn, xR[0], xR[1]);
  const traces = [{x:xs, y:ys, mode:'lines', name,
    line:{color, width:2.5, shape:'spline'}, connectgaps:false}];
  if (roots.length) traces.push({
    x: roots, y: roots.map(()=>0),
    mode:'markers+text', name:'Raízes',
    text: roots.map(r=>`x=${fmt(r)}`),
    textposition:'top center',
    textfont:{color:'#10b981',size:11},
    marker:{color:'#10b981', size:10, symbol:'circle', line:{color:'#fff',width:1.5}}
  });
  const layout = {...BASE_LAYOUT, title:{text:title, font:{color:'#e2e2f0',size:13,family:'Syne,sans-serif'}}};
  Plotly.newPlot(el, traces, layout, PLOT_CFG);
}

function drawDouble(elId, fn1, fn2, name1, name2, title) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.remove('hidden');
  const {xs:x1,ys:y1} = buildPts(fn1);
  const {xs:x2,ys:y2} = buildPts(fn2);
  const layout = {...BASE_LAYOUT, title:{text:title, font:{color:'#e2e2f0',size:13,family:'Syne,sans-serif'}}};
  Plotly.newPlot(el, [
    {x:x1,y:y1,mode:'lines',name:name1,line:{color:'#f97316',width:2.5},connectgaps:false},
    {x:x2,y:y2,mode:'lines',name:name2,line:{color:'#22d3ee',width:2,dash:'dash'},connectgaps:false},
  ], layout, PLOT_CFG);
}

/* Main graph — up to 3 functions */
function plotMain() {
  const fns = [
    document.getElementById('gfn1').value.trim(),
    document.getElementById('gfn2').value.trim(),
    document.getElementById('gfn3').value.trim(),
  ].filter(Boolean);
  const xMin = parseFloat(document.getElementById('x-min').value) || -10;
  const xMax = parseFloat(document.getElementById('x-max').value) ||  10;
  const el   = document.getElementById('main-graph');
  if (!fns.length) { toast('Digite ao menos uma função.'); return; }

  const traces = [];
  fns.forEach((fnStr, i) => {
    try {
      const expr = math.parse(fnStr);
      const f = x => { try{return expr.evaluate({x});}catch{return NaN;} };
      const {xs,ys} = buildPts(f, xMin, xMax, 600);
      const labels = ['f','g','h'];
      traces.push({
        x:xs, y:ys, mode:'lines',
        name:`${labels[i]}(x) = ${fnStr}`,
        line:{color: COLORS[i % COLORS.length], width:2.5, shape:'spline'},
        connectgaps:false
      });
    } catch(e) { toast(`Erro em função ${i+1}: ${e.message}`); }
  });
  if (!traces.length) return;
  const layout = {...BASE_LAYOUT, height:460,
    title:{text:'Visualização de Funções', font:{color:'#e2e2f0',size:13,family:'Syne,sans-serif'}}};
  Plotly.newPlot(el, traces, layout, PLOT_CFG);
}

function qp(fn) {
  document.getElementById('gfn1').value = fn;
  document.getElementById('gfn2').value = '';
  document.getElementById('gfn3').value = '';
  plotMain();
}


/* ══════════════════════════════════════════
   8. UTILIDADES
   ══════════════════════════════════════════ */
function v(id)   { return parseFloat(document.getElementById(id).value); }
function fmt(n)  {
  if (typeof n !== 'number') return String(n);
  if (!isFinite(n)) return String(n);
  return String(Math.round(n * 1e10) / 1e10);
}
function showR(el, txt, cls='') {
  el.textContent = txt;
  el.className   = 'result' + (cls ? ' '+cls : '');
  el.classList.remove('hidden');
}
function toast(msg, ms=3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.add('hidden'), ms);
}
function qi(id, val, fn) {
  document.getElementById(id).value = val;
  fn();
}
/* ══════════════════════════════════════════
   LÓGICA DE TEMA (DARK/LIGHT)
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('theme-toggle');
  const body = document.body;

  // Verificar se o usuário já tem uma preferência salva
  if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-mode');
  }

  themeBtn.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    
    // Salvar preferência
    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    // ATUALIZAR GRÁFICOS EXISTENTES
    updateAllCharts(isLight);
  });
});

// Função para adaptar as cores do Plotly dinamicamente
function updateAllCharts(isLight) {
  const textColor = isLight ? '#1e293b' : '#e8e8f0';
  const gridColor = isLight ? '#e2e8f0' : '#2a2a3a';
  
  const update = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: textColor },
    xaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
    yaxis: { gridcolor: gridColor, zerolinecolor: gridColor }
  };

  // Aplica a todos os containers de gráficos do Plotly
  const charts = document.querySelectorAll('.js-plotly-plot');
  charts.forEach(chart => {
    Plotly.relayout(chart, update);
  });
}
