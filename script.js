// 星の微粒子（変わらず）
(() => {
  const cvs = document.getElementById('dust'); if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const fit = () => { cvs.width = innerWidth; cvs.height = innerHeight; };
  addEventListener('resize', fit, {passive:true}); fit();

  const N = Math.min(140, Math.floor((innerWidth*innerHeight)/18000));
  const stars = Array.from({length:N}, () => ({
    x: Math.random()*cvs.width,
    y: Math.random()*cvs.height,
    r: Math.random()*1.6 + 0.3,
    a: Math.random()*Math.PI*2,
    s: 0.2 + Math.random()*0.7,
    tw: 0.5 + Math.random()*1.2
  }));
  let t = 0;
  (function loop(){
    requestAnimationFrame(loop); t += 0.016;
    ctx.clearRect(0,0,cvs.width,cvs.height);
    for(const p of stars){
      p.x += Math.sin((t+p.a)*0.2)*0.06;
      p.y += Math.cos((t+p.a)*0.18)*0.04;
      const flick = 0.5 + 0.5*Math.sin(t*p.tw + p.a);
      ctx.globalAlpha = 0.35 + 0.65*flick;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = 'rgba(240,235,220,0.9)'; ctx.fill();
    }
    ctx.globalAlpha = 1;
  })();
})();

// 扉オービット（脈動ゆるやか）
(() => {
  const stage = document.getElementById('hall-stage');
  const wrap  = document.getElementById('orbit-doors');
  if (!stage || !wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length < 2) return;

  const ROT_SPEED = 0.0006;
  const SWAY_X = 4, SWAY_Y = 3;

  const base  = doors.map((_, i) => (i/doors.length)*Math.PI*2);
  const phase = doors.map(() => Math.random()*Math.PI*2);
  const amp   = doors.map(() => 0.03 + Math.random()*0.04);
  const freq  = doors.map(() => 0.06 + Math.random()*0.1);
  const phi   = doors.map(() => Math.random()*Math.PI*2);

  let cx=0, cy=0, rx=0, ry=0;
  const resize = () => {
    const r = stage.getBoundingClientRect();
    const w = Math.max(900, r.width  || innerWidth*0.9);
    const h = Math.max(640, r.height || innerHeight*0.7);
    cx = w/2; cy = h/2;
    rx = Math.max(380, w*0.5);
    ry = Math.max(320, h*0.48);
  };
  addEventListener('resize', resize, {passive:true}); resize();

  let t = 0, rot = 0;
  (function loop(){
    requestAnimationFrame(loop);
    t += 16/1000; rot += ROT_SPEED;

    doors.forEach((el, i) => {
      const a  = base[i] + rot;
      const sx = Math.sin(t*0.8 + phase[i]) * SWAY_X;
      const sy = Math.cos(t*0.6 + phase[i]) * SWAY_Y;
      const x = cx + rx * Math.cos(a) + sx;
      const y = cy + ry * Math.sin(a) + sy;

      el.style.setProperty('--tx', `${x}px`);
      el.style.setProperty('--ty', `${y}px`);

      const depth = (y - (cy - ry)) / (ry*2);
      el.style.zIndex = String(100 + Math.round(depth*100));

      const s = 1 + amp[i] * Math.sin(2*Math.PI*freq[i]*t + phi[i]);
      el.style.setProperty('--pulse', s.toFixed(4));
    });
  })();
})();

// 囁き：初期テキスト＋切替
(() => {
  const a = document.querySelector('.whisper .line--a');
  const b = document.querySelector('.whisper .line--b');
  if (!a || !b) return;

  const lines = [
    "「……ここにいるわ。」",
    "「静けさの奥で、あなたを見ている。」",
    "「どの扉から、始めるの？」",
    "「目を閉じれば、光はそばに。」",
    "「あなたと、私。違うけれど同じ。」"
  ];

  // 各部屋の説明テキスト
  const doorDescriptions = {
    kagami:    "「鏡の間── あなたの真実が映る場所。」",
    shosai:    "「書斎の間── 言葉が記憶を縛る。」",
    reihaido:  "「礼拝堂── 祈りと沈黙が交わる。」",
    atorie:    "「アトリエ── 色彩が心を刻む。」",
    renkin:    "「錬金術室── 光と影の方程式。」",
    teien:     "「庭園── 枯れぬ花が夢を見る。」",
    shishitsu: "「私室── 人形の瞳があなたを覗く。」",
    kyakushitsu:"「客室── 微笑の裏に眠る約束。」",
    gishiki:   "「儀式の間── 過去と未来が交わる。」"
  };

  const FADE_IN=1200, HOLD=4200, GAP=200;
  let i = 0, useA = true;
  let isHovered = false; // 扉上での状態

  function setText(el, text){
    el.textContent = text;
    el.classList.remove('hide','show');
    void el.offsetWidth;
    el.classList.add('show');
  }
  function fadeOut(el){ el.classList.remove('show'); el.classList.add('hide'); }

  function cycle(){
    if (isHovered) { setTimeout(cycle, 500); return; } // hover中は停止
    const showEl = useA ? a : b;
    const hideEl = useA ? b : a;
    setText(showEl, lines[i % lines.length]);
    if (hideEl.textContent) setTimeout(() => fadeOut(hideEl), 200);
    setTimeout(() => {
      fadeOut(showEl); useA = !useA; i++; setTimeout(cycle, GAP);
    }, HOLD + FADE_IN);
  }
  cycle();

  // 扉hoverで説明文表示
  document.querySelectorAll('.door').forEach(door => {
    const key = [...door.classList].find(c => c.startsWith('door--'))?.replace('door--','');
    const text = doorDescriptions[key] || "";
    door.addEventListener('mouseenter', () => {
      isHovered = true;
      const showEl = useA ? a : b;
      const hideEl = useA ? b : a;
      setText(showEl, text);
      if (hideEl.textContent) fadeOut(hideEl);
    });
    door.addEventListener('mouseleave', () => {
      isHovered = false;
      // 再び通常のセラフィア囁きに戻る
      a.textContent = ""; b.textContent = "";
      useA = true; i = 0; setTimeout(cycle, 1000);
    });
  });
})();

// 儀式をもう一度
document.getElementById('reintro')?.addEventListener('click', () => {
  location.href = './intro.html?ritual';
});


