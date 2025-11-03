/* ============================
   1) 背景の星（DPR最適化）
   ============================ */
(() => {
  const cvs = document.getElementById('dust'); if (!cvs) return;
  const ctx = cvs.getContext('2d', { alpha: true });

  function fit() {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const w = Math.floor(innerWidth  * dpr);
    const h = Math.floor(innerHeight * dpr);
    if (cvs.width !== w || cvs.height !== h) {
      cvs.width = w; cvs.height = h;
      cvs.style.width  = innerWidth + 'px';
      cvs.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars(); // サイズ変わったら再生成
    }
  }

  let stars = [];
  function makeStars(){
    const area = innerWidth * innerHeight;
    const N = Math.min(120, Math.max(40, Math.floor(area / 22000))); // 画面に応じて軽量化
    stars = Array.from({length:N}, () => ({
      x: Math.random()*innerWidth,
      y: Math.random()*innerHeight,
      r: Math.random()*1.5 + 0.35,
      a: Math.random()*Math.PI*2,
      s: 0.12 + Math.random()*0.45,     // 漂い速度
      tw: 0.4 + Math.random()*1.0       // 点滅速度
    }));
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

/* ==========================================
   2) 扉オービット（回転＋ゆらぎ／軽量・安定版）
      transform のみ更新。scale脈動は無し。
   ========================================== */
(() => {
  const stage = document.getElementById('hall-stage');
  const wrap  = document.getElementById('orbit-doors');
  if (!stage || !wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length < 2) return;

  const ROT_SPEED = 0.0006;          // ゆっくり回る
  const SWAY_X = 3, SWAY_Y = 2.2;    // 個別ゆらぎ

  const base  = doors.map((_, i) => (i/doors.length)*Math.PI*2);
  const phase = doors.map(() => Math.random()*Math.PI*2);

  let cx=0, cy=0, rx=0, ry=0;
  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(800, r.width  || innerWidth*0.9);
    const h = Math.max(600, r.height || innerHeight*0.7);
    cx = w/2; cy = h/2;
    rx = Math.max(360, w*0.50);
    ry = Math.max(300, h*0.48);
  }
  addEventListener('resize', resize, { passive:true }); resize();

  let t = 0, rot = 0;
  (function loop(){
    requestAnimationFrame(loop);
    t += 16/1000;
    rot += ROT_SPEED;

    for (let i=0;i<doors.length;i++){
      const el = doors[i];
      const a  = base[i] + rot;
      const sx = Math.sin(t*0.70 + phase[i]) * SWAY_X;
      const sy = Math.cos(t*0.55 + phase[i]) * SWAY_Y;
      const x  = cx + rx * Math.cos(a) + sx;
      const y  = cy + ry * Math.sin(a) + sy;

      el.style.setProperty('--tx', `${x}px`);
      el.style.setProperty('--ty', `${y}px`);

      // 手前に来たものほど前面に
   // 扉オービットループ内 ↓ この部分だけ書き換え
const depth = (y - (cy - ry)) / (ry*2);  // 0〜1の奥行き値
// セラフィアちゃんを基準に前後へ
if (depth > 0.5) {
  // 下（手前）にあるとき：セラフィアより前
  el.style.zIndex = '3';
} else {
  // 上（奥）にあるとき：セラフィアより後
  el.style.zIndex = '1';
}

    }
  })();

  /* ── たまに“ふっと暗くなる”演出（hoverで停止） ── */
  (function dimScheduler(){
    const timers = new WeakMap();

    function schedule(el){
      // 次の暗転まで 3〜10秒
      const delay = 3000 + Math.random()*7000;
      const id = setTimeout(() => {
        el.classList.add('door--dim');
        // 暗転の長さ 220〜600ms
        const hold = 220 + Math.random()*380;
        const id2 = setTimeout(() => {
          el.classList.remove('door--dim');
          schedule(el);
        }, hold);
        timers.set(el, id2);
      }, delay);
      timers.set(el, id);
    }
    function clear(el){
      const id = timers.get(el);
      if (id) clearTimeout(id);
      el.classList.remove('door--dim');
    }
    doors.forEach(el => {
      schedule(el);
      el.addEventListener('mouseenter', () => clear(el));
      el.addEventListener('mouseleave', () => schedule(el));
    });
  })();
})();

/* ==========================================
   3) 囁き：クロスフェード／ホバー一時上書き
   ========================================== */
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
    showEl.classList.remove('hide','show'); void showEl.offsetWidth; // reflowでアニメ再適用
    showEl.classList.add('show');
    if (hideEl.textContent) { hideEl.classList.remove('show'); hideEl.classList.add('hide'); }
    useA = !useA;
  }

  function cycle(){
    if (tempText) return;                      // 一時表示中はベース回さない
    show(baseLines[i++ % baseLines.length]);
    timer = setTimeout(cycle, 5200);           // ゆっくり切替
  }

  function setTemp(text){
    tempText = text;
    if (timer) clearTimeout(timer);
    show(text);
  }

  function clearTemp(){
    tempText = null;
    if (timer) clearTimeout(timer);
    timer = setTimeout(cycle, 600);            // 少し置いて再開
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

/* ==========================================
   4) 儀式をもう一度
   ========================================== */
document.getElementById('reintro')?.addEventListener('click', () => {
  location.href = './intro.html?ritual';
});



