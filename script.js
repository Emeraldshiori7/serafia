/* 星の微粒子（ゆるい点滅＋漂い） */
(() => {
  const cvs = document.getElementById('dust');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  function resize(){ cvs.width = innerWidth; cvs.height = innerHeight }
  addEventListener('resize', resize, {passive:true}); resize();

  const N = Math.min(140, Math.floor((innerWidth*innerHeight)/18000));
  const stars = Array.from({length:N}, () => ({
    x: Math.random()*cvs.width,
    y: Math.random()*cvs.height*0.95,
    r: Math.random()*1.6 + 0.3,
    a: Math.random()*Math.PI*2,
    s: 0.2 + Math.random()*0.7,   // 漂い速度
    tw: 0.5 + Math.random()*1.2    // 点滅速度
  }));

  let t = 0;
  (function loop(){
    requestAnimationFrame(loop);
    t += 0.016;
    ctx.clearRect(0,0,cvs.width,cvs.height);
    for (const p of stars){
      p.x += Math.sin((t+p.a)*0.2)*0.06;
      p.y -= p.s*0.02; if (p.y < -10) p.y = cvs.height+10;
      const flicker = 0.5 + 0.5*Math.sin(t*p.tw + p.a);
      ctx.globalAlpha = 0.35 + 0.65*flicker;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = 'rgba(240,235,220,0.9)'; ctx.fill();
    }
    ctx.globalAlpha = 1;
  })();
})();

/* 囁き（薄れても消えない：差し替えだけ） */
(() => {
  const el = document.querySelector('.whisper .line');
  if (!el) return;
  const lines = [
    "「……ここにいるわ。」",
    "「静けさの奥で、あなたを見ている。」",
    "「どの扉から、始めるの？」"
  ];
  let i = 0;
  function show(){
    el.textContent = lines[i % lines.length];
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; // “湧き直し”
    i++;
  }
  show();
  setInterval(show, 9000);
})();

/* 「儀式をもう一度」 */
document.getElementById('reintro')?.addEventListener('click', () => {
  // 消す必要はないけれど、残っていてもritualで無視されます
  // localStorage.removeItem('introSeen');
  location.href = './intro.html?ritual';   // ← ここがポイント（相対パス＋?ritual）
});
// ===== 楕円リング配置（祭壇＋浮遊） =====
(() => {
  const wrap = document.querySelector('.doors--orbit');
  if (!wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length === 0) return;

  // 配置パラメータ（好みで調整OK）
  let ROT_SPEED = 0.0009;   // 全体回転の速さ（小さいほどゆっくり）
  let SWAY_X    = 6;        // 個別ゆらぎ（px）
  let SWAY_Y    = 4;

  let cx = 0, cy = 0, rx = 0, ry = 0;
  const base = doors.map((_, i) => (i / doors.length) * Math.PI * 2);
  const phase = doors.map((_, i) => Math.random() * Math.PI * 2);

  function resize(){
    const r = wrap.getBoundingClientRect();
    cx = r.width  / 2;
    cy = r.height / 2;
    // 楕円の半径：画面に合わせて自動
    rx = Math.min(r.width  * 0.38, 360);  // 横方向の半径
    ry = Math.min(r.height * 0.42, 260);  // 縦方向の半径
  }
  addEventListener('resize', resize, {passive:true});
  resize();

  let t = 0, rot = 0;
  function loop(){
    t += 16/1000;              // 時間（秒相当）
    rot += ROT_SPEED;          // ゆっくり回転

    doors.forEach((el, i) => {
      const a  = base[i] + rot;                      // 角度（全体回転）
      const sx = Math.sin(t*0.8 + phase[i]) * SWAY_X; // 個別ゆらぎX
      const sy = Math.cos(t*0.6 + phase[i]) * SWAY_Y; // 個別ゆらぎY

      const x = cx + rx * Math.cos(a) + sx;
      const y = cy + ry * Math.sin(a) + sy;

      // 前後関係：手前に来たものほどZを高く
      const depth = (y - (cy - ry)) / (ry*2); // 0〜1
      const z = 100 + Math.round(depth * 100);
      el.style.zIndex = z;
      el.dataset.front = depth > 0.62 ? '1' : '';

      // 実配置
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
    });

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

