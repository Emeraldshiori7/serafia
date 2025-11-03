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

// ☆ 楕円リング（ゆっくり回転＋やわらか脈動）
(() => {
  const stage = document.getElementById('hall-stage');
  const wrap  = document.getElementById('orbit-doors');
  if (!stage || !wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length < 2) return;

  // 回転はゆっくり
  const ROT_SPEED = 0.0006;
  const SWAY_X = 3, SWAY_Y = 2.2;

  const base  = doors.map((_, i) => (i/doors.length)*Math.PI*2);
  const phase = doors.map(() => Math.random()*Math.PI*2);

  // ★ 脈動を落ち着かせる（小さめの振幅・低周波）
  const amp   = doors.map(() => 0.015 + Math.random()*0.02); // 1.5%〜3.5%
  const freq  = doors.map(() => 0.04  + Math.random()*0.06); // 0.04〜0.10Hz（=10〜25秒周期）
  const phi   = doors.map(() => Math.random()*Math.PI*2);

  // ★ “にじむように”追従するためのスムージング用バッファ
  const smooth = doors.map(() => 1);

  let cx=0, cy=0, rx=0, ry=0;
  const resize = () => {
    const r = stage.getBoundingClientRect();
    const w = Math.max(800, r.width  || innerWidth*0.9);
    const h = Math.max(600, r.height || innerHeight*0.7);
    cx = w/2; cy = h/2;
    rx = Math.max(360, w*0.50);
    ry = Math.max(300, h*0.48);
  };
  addEventListener('resize', resize, {passive:true}); resize();

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

      el.style.setProperty('--tx', `${x}px`);
      el.style.setProperty('--ty', `${y}px`);

      const depth = (y - (cy - ry)) / (ry*2);
      el.style.zIndex = String(100 + Math.round(depth*100));

      // 目標スケール（遅いサイン波）→ 緩やかに追従（LERP）
      const target = 1 + amp[i] * Math.sin(2*Math.PI*freq[i]*t + phi[i]);
      smooth[i] = smooth[i] + (target - smooth[i]) * 0.06; // 0.03〜0.1で好み
      el.style.setProperty('--pulse', smooth[i].toFixed(4));
    });
  })();
})();



// 囁き：初期テキスト＋切替

// === 囁きコントローラ（クロスフェード＋ホバー一時停止） ===
/* === 部屋ごとの説明テキスト === */
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

/* === 囁き（ホバーで一時的に上書き／離れたら自動で再開） === */
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
    if (hideEl.textContent) {
      hideEl.classList.remove('show'); hideEl.classList.add('hide');
    }
    useA = !useA;
  }

  function cycle(){
    if (tempText) return;                     // 一時表示中は回さない
    show(baseLines[i++ % baseLines.length]);
    timer = setTimeout(cycle, 5200);          // ← 点滅/切替の間隔（ゆっくり）
  }

  function setTemp(text){
    tempText = text;
    if (timer) clearTimeout(timer);
    show(text);
  }
  function clearTemp(){
    tempText = null;
    if (timer) clearTimeout(timer);
    timer = setTimeout(cycle, 600);           // 少し間を置いて再開
  }

  // 初回起動
  cycle();
  return { setTemp, clearTemp };
})();

/* === 扉要素に “data-room” を自動で割り当て（HTMLを触らない版） === */
(() => {
  const keysInOrder = [
    "kagami","shosai","reihaido","atorie","renkin","teien","shishitsu","kyakushitsu","gishiki"
  ];
  const doors = [...document.querySelectorAll('#orbit-doors .door')];

  doors.forEach((el, idx) => {
    // 既に data-room があれば尊重、無ければ順番で割当
    if (!el.dataset.room) el.dataset.room = keysInOrder[idx] || '';
    const key = el.dataset.room;

    // ホバーで囁きを一時上書き
    el.addEventListener('mouseenter', () => {
      const text = roomDescriptions[key] || "「……ここを、開ける？」";
      whisper.setTemp(text);
    });
    el.addEventListener('mouseleave', () => {
      whisper.clearTemp();
    });
  });
})();




// 儀式をもう一度
document.getElementById('reintro')?.addEventListener('click', () => {
  location.href = './intro.html?ritual';
});


