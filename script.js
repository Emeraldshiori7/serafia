// ☆ 星の微粒子（簡略版）
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

// ☆ 楕円リング（ステージ中心に完全同期）
(() => {
  const stage = document.getElementById('hall-stage');
  const wrap  = document.getElementById('orbit-doors');
  if (!stage || !wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length < 2) return;

  // 回転・揺らぎ
  const ROT_SPEED = 0.0007;
  const SWAY_X = 4, SWAY_Y = 3;

  // 均等角度 & 揺らぎ位相
  const base  = doors.map((_, i) => (i/doors.length)*Math.PI*2);
  const phase = doors.map(() => Math.random()*Math.PI*2);

  // ステージ基準の中心＆半径
  let cx=0, cy=0, rx=0, ry=0;

  const resize = () => {
    const r = stage.getBoundingClientRect();
    // 失敗保険
    const w = Math.max(800, r.width  || innerWidth*0.9);
    const h = Math.max(600, r.height || innerHeight*0.7);
    cx = w/2;  cy = h/2;
    // 半径（広めに）
    rx = Math.max(320, w*0.48);
    ry = Math.max(260, h*0.46);
  };
  addEventListener('resize', resize, {passive:true}); resize(); // ← 初回に必ず呼ぶ

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

      // 位置は transform を直接書かず、CSS変数に流す
      el.style.setProperty('--tx', `${x}px`);
      el.style.setProperty('--ty', `${y}px`);

      // 手前に来たものを少し明るくしたい時の z（任意）
      const depth = (y - (cy - ry)) / (ry*2);
      el.style.zIndex = String(100 + Math.round(depth*100));
    });
  })();
})();
