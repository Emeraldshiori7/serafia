/* =========================================================
   星の微粒子（簡略版）
========================================================= */
(() => {
  const cvs = document.getElementById('dust'); if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const fit = () => { cvs.width = innerWidth; cvs.height = innerHeight; };
  addEventListener('resize', fit, {passive:true}); fit();

  const N = Math.min(160, Math.floor((innerWidth*innerHeight)/16000));
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
    for (const p of stars){
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

/* =========================================================
   楕円リング配置（ステージ中心に同期）＋ゆったり脈動
========================================================= */
(() => {
  const stage = document.getElementById('hall-stage');
  const wrap  = document.getElementById('orbit-doors');
  if (!stage || !wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length < 2) return;

  const ROT_SPEED = 0.0007;       // ゆっくり回転
  const SWAY_X = 4, SWAY_Y = 3;   // 個別ゆらぎ

  // 均等角度 & 個体差
  const base  = doors.map((_, i) => (i/doors.length)*Math.PI*2);
  const phase = doors.map(() => Math.random()*Math.PI*2);

  // 脈動（大きく・ゆったり）
  const amp   = doors.map(() => 0.04 + Math.random()*0.05);   // 4%〜9%
  const freq  = doors.map(() => 0.18 + Math.random()*0.08);   // 0.18〜0.26Hz（統一感）
  const phi   = doors.map(() => Math.random()*Math.PI*2);

  let cx=0, cy=0, rx=0, ry=0;
  const resize = () => {
    const r = stage.getBoundingClientRect();
    const w = Math.max(800, r.width  || innerWidth*0.9);
    const h = Math.max(600, r.height || innerHeight*0.7);
    cx = w/2; cy = h/2;
    rx = Math.max(360, w*0.48);
    ry = Math.max(280, h*0.46);
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
      const x  = cx + rx * Math.cos(a) + sx;
      const y  = cy + ry * Math.sin(a) + sy;

      // CSS変数で座標更新
      el.style.setProperty('--tx', `${x}px`);
      el.style.setProperty('--ty', `${y}px`);

      // 手前ほど z を高く
      const depth = (y - (cy - ry)) / (ry*2); // 0〜1
      el.style.zIndex = String(100 + Math.round(depth*100));

      // 脈動：1 ± amp
      const s = 1 + amp[i] * Math.sin(2*Math.PI*freq[i]*t + phi[i]);
      el.style.setProperty('--pulse', s.toFixed(4));
    });
  })();
})();

/* =========================================================
   囁き：クロスフェード回し
========================================================= */
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

  const FADE_IN  = 1200;
  const HOLD     = 4200;
  const GAP      = 200;

  let i = 0, useA = true;

  function setText(el, text){
    el.textContent = text;
    el.classList.remove('hide','show');
    void el.offsetWidth;          // reflowでアニメ再適用
    el.classList.add('show');
  }
  function fadeOut(el){
    el.classList.remove('show');
    el.classList.add('hide');
  }
  function cycle(){
    const showEl = useA ? a : b;
    const hideEl = useA ? b : a;

    setText(showEl, lines[i % lines.length]);
    if (hideEl.textContent){
      setTimeout(() => fadeOut(hideEl), 200); // クロスフェード重ね
    }
    setTimeout(() => {
      fadeOut(showEl);
      useA = !useA; i++;
      setTimeout(cycle, GAP);
    }, HOLD + FADE_IN);
  }
  cycle();
})();

/* =========================================================
   儀式をもう一度（白フェード→ intro.html?ritual）
========================================================= */
(() => {
  const btn  = document.getElementById('reintro');
  const veil = document.querySelector('.whiteout');
  if (!btn || !veil) return;

  function goRitual(){
    try { localStorage.setItem('introSeen', '0'); } catch(e){}
    veil.classList.add('show');
    setTimeout(() => { location.href = 'intro.html?ritual'; }, 500);
  }
  btn.addEventListener('click', goRitual);
})();

/* =========================================================
   扉クリック：白フェード遷移（# は除外）
========================================================= */
(() => {
  const veil = document.querySelector('.whiteout');
  if (!veil) return;
  document.querySelectorAll('.doors--orbit .door[href]:not([href="#"])').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const url = a.getAttribute('href');
      veil.classList.add('show');
      setTimeout(()=>{ location.href = url; }, 400);
    });
  });
})();
