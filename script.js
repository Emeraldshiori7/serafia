// ───────── 星の微粒子（点滅＋漂い） ─────────
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
    s: 0.2 + Math.random()*0.7,
    tw: 0.5 + Math.random()*1.2
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

// ───────── 囁きのローテーション ─────────
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
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    i++;
  }
  show();
  setInterval(show, 9000);
})();

// ───────── 儀式をもう一度 ─────────
document.getElementById('reintro')?.addEventListener('click', () => {
  location.href = './intro.html?ritual';
});

// ───────── 楕円リング配置（祭壇＋浮遊） 安定版 ─────────
(() => {
  const wrap = document.querySelector('.hall-stage .doors--orbit');
  if (!wrap) return;
  let doors = [...wrap.querySelectorAll('.door')];

  // 万一1枚以下なら、何もせず終了（重なり続けるのを防ぐ）
  if (doors.length <= 1) {
    console.warn('扉が1枚以下です。HTMLに複数の<a class="door">があるか確認してください。');
    return;
  }

  // パラメータ（お好みで）
  let ROT_SPEED = 0.0008;   // 全体の回転速度（小さいほどゆっくり）
  let SWAY_X    = 6;        // 個別ゆらぎX
  let SWAY_Y    = 4;        // 個別ゆらぎY

  // 角度の初期配置（均等割）
  const base  = doors.map((_, i) => (i / doors.length) * Math.PI * 2);
  const phase = doors.map(() => Math.random() * Math.PI * 2);

  // 中心と半径
  let cx = 0, cy = 0, rx = 0, ry = 0;

function resize(){
  // 画面中央に固定されたステージの実サイズを取得
  const r = wrap.getBoundingClientRect();

  // ステージを大きく使う（最低サイズも大きめに）
  const w = Math.max(800, r.width);
  const h = Math.max(600, r.height);

  // 中心はステージの中央
  cx = w / 2;
  cy = h / 2;

  // ★ 半径は“比率”でしっかり広めに確保（扉サイズに依存しない）
  //    大きくしたければ係数を上げてOK（例：0.50, 0.48）
  rx = Math.max(260, w * 0.46);  // 横半径
  ry = Math.max(220, h * 0.44);  // 縦半径
}




  let t = 0, rot = 0;
  function loop(){
    t += 16/1000;
    rot += ROT_SPEED;

    doors.forEach((el, i) => {
      const a  = base[i] + rot;
      const sx = Math.sin(t*0.8 + phase[i]) * SWAY_X;
      const sy = Math.cos(t*0.6 + phase[i]) * SWAY_Y;

      const x = cx + rx * Math.cos(a) + sx;
      const y = cy + ry * Math.sin(a) + sy;

      // 深度 → z-index（手前に来たものを少し明るく）
      const depth = (y - (cy - ry)) / (ry * 2); // 0〜1
      el.style.zIndex = String(100 + Math.round(depth * 100));
      el.dataset.front = depth > 0.62 ? '1' : '';

      // translateは必ず最後に
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      el.style.opacity = '1';
      el.style.visibility = 'visible';
    });

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
