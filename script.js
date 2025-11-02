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
// ☆ 楕円リング（…省略…）
(() => {
  const stage = document.getElementById('hall-stage');
  const wrap  = document.getElementById('orbit-doors');
  if (!stage || !wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length < 2) return;

  const ROT_SPEED = 0.0007;
  const SWAY_X = 4, SWAY_Y = 3;

  const base  = doors.map((_, i) => (i/doors.length)*Math.PI*2);
  const phase = doors.map(() => Math.random()*Math.PI*2);

// ★ 扉ごとの“脈動”パラメータ（振幅・速度・初期位相）
const amp   = doors.map(() => 0.04 + Math.random()*0.05);   // 4%〜9% → やや大きく
const freq  = doors.map(() => 0.12 + Math.random()*0.22);   // 0.12〜0.34Hz → ゆったり遅め
    // 0.3〜0.8 Hz

  const phi   = doors.map(() => Math.random()*Math.PI*2);

  let cx=0, cy=0, rx=0, ry=0;
  const resize = () => {
    const r = stage.getBoundingClientRect();
    const w = Math.max(800, r.width  || innerWidth*0.9);
    const h = Math.max(600, r.height || innerHeight*0.7);
    cx = w/2; cy = h/2;
    rx = Math.max(320, w*0.48);
    ry = Math.max(260, h*0.46);
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

      // ★ ゆっくり脈動（1 ± amp）：sin波で個体差あり
      const s = 1 + amp[i] * Math.sin(2*Math.PI*freq[i]*t + phi[i]);
      el.style.setProperty('--pulse', s.toFixed(4));
    });
  })();
})();
// === セラフィアの囁き：クロスフェードで順番に表示 ===
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

  // タイミング（好みで調整）
  const FADE_IN  = 1200;   // 出る時間
  const HOLD     = 4200;   // 浮かんで留まる
  const FADE_OUT = 1000;   // 消える時間
  const GAP      = 200;    // 次の文へ切替の間

  let i = 0, useA = true;

  function setText(el, text){
    el.textContent = text;
    el.classList.remove('hide','show'); // 状態リセット
    // レイアウトをリセットしてからアニメ付与（強制reflow）
    void el.offsetWidth;
    el.classList.add('show');
  }

  function fadeOut(el){
    el.classList.remove('show');
    el.classList.add('hide');
  }

  function cycle(){
    const showEl = useA ? a : b;
    const hideEl = useA ? b : a;

    // 次に出すテキストをセット → 浮かせる
    setText(showEl, lines[i % lines.length]);

    // 現在表示中の反対側があれば、少し遅れて消す（クロスフェード）
    if (hideEl.textContent) {
      setTimeout(() => fadeOut(hideEl), 200); // 200ms重ねて滑らかに
    }

    // 表示時間が終わったら、このレイヤーも消して次へ
    setTimeout(() => {
      fadeOut(showEl);
      useA = !useA;
      i++;
      setTimeout(cycle, GAP);
    }, HOLD + FADE_IN);
  }

  cycle();
})();
