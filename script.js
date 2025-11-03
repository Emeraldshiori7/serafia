/* =====================================================
   1) 背景の星（DPR最適化・軽量）
===================================================== */
(() => {
  const cvs = document.getElementById('dust'); if (!cvs) return;
  const ctx = cvs.getContext('2d', { alpha: true });

  let stars = [];
  function makeStars(){
    const area = innerWidth * innerHeight;
    const N = Math.min(120, Math.max(40, Math.floor(area / 22000)));
    stars = Array.from({length:N}, () => ({
      x: Math.random()*innerWidth,
      y: Math.random()*innerHeight,
      r: Math.random()*1.5 + 0.35,
      a: Math.random()*Math.PI*2,
      s: 0.12 + Math.random()*0.45,   // 漂い速度
      tw: 0.4 + Math.random()*1.0     // 点滅速度
    }));
  }

  function fit() {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const w = Math.floor(innerWidth  * dpr);
    const h = Math.floor(innerHeight * dpr);
    if (cvs.width !== w || cvs.height !== h) {
      cvs.width = w; cvs.height = h;
      cvs.style.width  = innerWidth + 'px';
      cvs.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
    }
  }
  addEventListener('resize', fit, { passive:true });
  fit();

  let t = 0;
  (function loop(){
    requestAnimationFrame(loop);
    t += 0.016;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of stars){
      p.x += Math.sin((t+p.a)*0.22)*0.06;
      p.y += Math.cos((t+p.a)*0.18)*0.04;
      if (p.x < -10) p.x += innerWidth+20; else if (p.x > innerWidth+10) p.x -= innerWidth+20;
      if (p.y < -10) p.y += innerHeight+20; else if (p.y > innerHeight+10) p.y -= innerHeight+20;
      const flick = 0.5 + 0.5*Math.sin(t*p.tw + p.a);
      ctx.globalAlpha = 0.35 + 0.65*flick;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = 'rgba(240,235,220,0.9)'; ctx.fill();
    }
    ctx.globalAlpha = 1;
  })();
})();

/* =====================================================
   2) 扉オービット（回転＋ゆらぎ＋深度Z／安定版）
      - 上半分=奥（セラフィアの“後ろ”）
      - 下半分=手前（セラフィアの“前”）
      - 影の濃さと明るさに depth を渡す（CSS変数）
===================================================== */
(() => {
  const stage = document.getElementById('hall-stage');
  const wrap  = document.getElementById('orbit-doors');
  if (!stage || !wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length < 2) return;

  const ROT_SPEED = 0.0006;
  const SWAY_X = 3, SWAY_Y = 2.2;

  const base  = doors.map((_, i) => (i/doors.length)*Math.PI*2);
  const phase = doors.map(() => Math.random()*Math.PI*2);

  // 微小な脈動（にじむ追従）
  const amp   = doors.map(() => 0.015 + Math.random()*0.02);
  const freq  = doors.map(() => 0.04  + Math.random()*0.06);
  const phi   = doors.map(() => Math.random()*Math.PI*2);
  const smooth = doors.map(() => 1);

  let cx=0, cy=0, rx=0, ry=0;
  function resize(){
    const w = innerWidth, h = innerHeight;
    cx = w/2; cy = h/2;
    const safeX = Math.max(48, w*0.06);
    const safeY = Math.max(60, h*0.08);
    const approxDoorW = Math.min(Math.max(w*0.18, 140), 220);
    const halfDoorW = approxDoorW/2;
    const approxDoorH = halfDoorW*(4/3);
    rx = Math.max(260, (w - safeX*2 - halfDoorW) * 0.48);
    ry = Math.max(220, (h - safeY*2 - approxDoorH/2) * 0.46);
  }
  addEventListener('resize', resize, { passive:true });
  resize();

  let t = 0, rot = 0;
  (function loop(){
    requestAnimationFrame(loop);
    t += 16/1000;
    rot += ROT_SPEED;

    doors.forEach((el, i) => {
      const a  = base[i] + rot;
      const sx = Math.sin(t*0.7 + phase[i]) * SWAY_X;
      const sy = Math.cos(t*0.55 + phase[i]) * SWAY_Y;

      const x  = cx + rx * Math.cos(a) + sx;
      const y  = cy + ry * Math.sin(a) + sy;

      // 位置
      el.style.setProperty('--tx', `${x}px`);
      el.style.setProperty('--ty', `${y}px`);

      // 深度 0(奥)〜1(手前) を算出
      let depth = (y - (cy - ry)) / (ry * 2);
      depth = Math.max(0, Math.min(1, depth));
      el.style.setProperty('--depth', depth.toFixed(3));   // CSS側で明るさ等に利用
      el.style.setProperty('--shadow', (0.12 + depth*0.28).toFixed(3)); // 影の濃さ

      // 前後関係：セラフィア(固定z=500想定)より
      // 上半分=奥(200〜400)、下半分=手前(600〜800)
      let z;
      if (y >= cy){
        const k = (y - cy) / ry;        // 0〜1
        z = 600 + Math.round(k * 200);  // 600〜800
      }else{
        const k = (cy - y) / ry;        // 0〜1
        z = 400 - Math.round(k * 200);  // 400〜200
      }
      el.style.zIndex = String(z);

      // 微小なスケールの“にじみ”
      const target = 1 + amp[i] * Math.sin(2*Math.PI*freq[i]*t + phi[i]);
      smooth[i] = smooth[i] + (target - smooth[i]) * 0.06;
      el.style.setProperty('--pulse', smooth[i].toFixed(4));
    });
  })();
})();

/* =====================================================
   3) 囁き：クロスフェード／ホバー一時上書き
===================================================== */
const roomDescriptions = {
  kagami:     "「鏡は映す。あなたの姿と、まだ見ぬ影。」",
  shosai:     "「静けさのページに、言葉の灯が滲む。」",
  reihaido:   "「祈りは音もなく、天井に溶けて消える。」",
  atorie:     "「絵の具は乾かず、未完の夢が息をする。」",
  renkin:     "「瓶の中、緑の光が秘密を混ぜる。」",
  teien:      "「蔦の間を、風が忘れ物のように通り抜ける。」",
  shishitsu:  "「糸と硝子、鈴の眠り。小さな私だけの王国。」",
  kyakushitsu:"「客人よ、赤い帳の向こうで時を脱ぐ。」",
  gishiki:    "「扉は重く、言葉は鍵。儀式はまだ終わらない。」"
};

const whisper = (() => {
  const a = document.querySelector('.whisper .line--a');
  const b = document.querySelector('.whisper .line--b');
  if (!a || !b) return { setTemp: ()=>{}, clearTemp: ()=>{} };

  const baseLines = [
    "「……ここにいるわ。」",
    "「静けさの奥で、あなたを見ている。」",
    "「どの扉から、始めるの？」",
    "「目を閉じれば、光はそばに。」",
    "「あなたと、私。違うけれど同じ。」"
  ];

  let i = 0, useA = true, tempText = null, timer = null;

  function show(text){
    const showEl = useA ? a : b;
    const hideEl = useA ? b : a;
    showEl.textContent = text;
    showEl.classList.remove('hide','show'); void showEl.offsetWidth;
    showEl.classList.add('show');
    if (hideEl.textContent) { hideEl.classList.remove('show'); hideEl.classList.add('hide'); }
    useA = !useA;
  }
  function cycle(){
    if (tempText) return;                   // 一時表示中はベース回さない
    show(baseLines[i++ % baseLines.length]);
    timer = setTimeout(cycle, 5200);
  }
  function setTemp(text){
    tempText = text;
    if (timer) clearTimeout(timer);
    show(text);
  }
  function clearTemp(){
    tempText = null;
    if (timer) clearTimeout(timer);
    timer = setTimeout(cycle, 600);
  }
  cycle();
  return { setTemp, clearTemp };
})();

/* 扉 hover で囁きを上書き（HTMLの data-room を優先） */
(() => {
  const keysInOrder = [
    "kagami","shosai","reihaido","atorie","renkin","teien","shishitsu","kyakushitsu","gishiki"
  ];
  const doors = [...document.querySelectorAll('#orbit-doors .door')];
  doors.forEach((el, idx) => {
    if (!el.dataset.room) el.dataset.room = keysInOrder[idx] || '';
    const key = el.dataset.room;
    el.addEventListener('mouseenter', () => {
      whisper.setTemp(roomDescriptions[key] || "「……ここを、開ける？」");
    });
    el.addEventListener('mouseleave', () => {
      whisper.clearTemp();
    });
  });
})();

/* =====================================================
   4) 扉クリック → 拡大ズーム → 暗転 → 遷移
      ※ fadeout要素が無ければ自動生成
===================================================== */
(() => {
  const wrap = document.getElementById('orbit-doors');
  if (!wrap) return;
  let fade = document.getElementById('fadeout');
  if (!fade){
    fade = document.createElement('div');
    fade.id = 'fadeout';
    fade.className = 'fadeout';
    document.body.appendChild(fade);
  }
  const doors = [...wrap.querySelectorAll('.door')];

  doors.forEach(el => {
    el.addEventListener('click', (e) => {
      const href = el.getAttribute('href') || '';
      const shouldNavigate = href && href !== '#';
      e.preventDefault();

      wrap.classList.add('enter-mode');
      doors.forEach(d => d.classList.remove('door--active'));
      el.classList.add('door--active');

      setTimeout(() => fade.classList.add('show'), 320);

      if (shouldNavigate){
        setTimeout(() => { window.location.href = href; }, 700);
      }else{
        // 遷移先が無い場合は演出だけ
        setTimeout(() => {
          fade.classList.remove('show');
          el.classList.remove('door--active');
          wrap.classList.remove('enter-mode');
        }, 1200);
      }
    });
  });
})();

/* =====================================================
   5) 儀式をもう一度
===================================================== */
document.getElementById('reintro')?.addEventListener('click', () => {
  location.href = './intro.html?ritual';
});
