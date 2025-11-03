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
(() => {
  const a = document.querySelector('.whisper .line--a');
  const b = document.querySelector('.whisper .line--b');
  if (!a || !b) return;

  // ふだんのセリフ（ゆっくり交代）
  const defaultLines = [
    "「……ここにいるわ。」",
    "「静けさの奥で、あなたを見ている。」",
    "「どの扉から、始めるの？」",
    "「目を閉じれば、光はそばに。」",
    "「あなたと、私。違うけれど同じ。」"
  ];

  // 扉ごとの説明（必要に応じて好きに編集）
  const desc = {
    'door--1': "古の水銀が曇る鏡。映るのは過去、それとも意図？",
    'door--2': "羽根ペンとインクの匂い。言葉はここで錬られる。",
    'door--3': "色硝子の祈りが床へ落ちる。静けさは鐘の前触れ。",
    'door--4': "絵具と石膏がまだ乾かない。未完成だけが息をする。",
    'door--5': "坩堝の底で光る緑。混ぜるほど真実は沈む。",
    'door--6': "蔓と薔薇が鍵を抱く。庭は境界、境界は迷路。",
    'door--7': "人形のまぶたは重い。秘密は桟の内側で眠る。",
    'door--8': "赤いカーテンの向こう側。よそゆきの夢が用意されている。",
    'door--9': "封蝋のように固い鉄扉。儀式は終わらないためにある。"
  };

  // タイミング
  const FADE_IN  = 1200;
  const HOLD     = 5200;   // ← 少し長めに
  const FADE_OUT = 1000;
  const GAP      = 300;

  let i = 0, useA = true;
  let cycleTimer = null, fadeTimer = null, resumeTimer = null;
  let paused = false;

  function setText(el, text){
    el.textContent = text;
    el.classList.remove('hide','show');
    void el.offsetWidth;    // reflow
    el.classList.add('show');
  }
  function fadeOut(el){
    el.classList.remove('show');
    el.classList.add('hide');
  }
  function nextCycle(){
    if (paused) return;
    const showEl = useA ? a : b;
    const hideEl = useA ? b : a;

    setText(showEl, defaultLines[i % defaultLines.length]);
    if (hideEl.textContent) fadeTimer = setTimeout(() => fadeOut(hideEl), 200);

    cycleTimer = setTimeout(() => {
      fadeOut(showEl);
      useA = !useA;
      i++;
      cycleTimer = setTimeout(nextCycle, GAP);
    }, HOLD + FADE_IN);
  }
  function pauseAndShow(text){
    // 走っているタイマーを止める（“一気に変わる”のを防ぐ）
    [cycleTimer, fadeTimer, resumeTimer].forEach(t => { if (t) clearTimeout(t); });
    paused = true;

    const showEl = useA ? a : b;
    const hideEl = useA ? b : a;
    setText(showEl, text);
    if (hideEl.textContent) setTimeout(() => fadeOut(hideEl), 200);
  }
  function resumeLater(ms = 1200){
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      paused = false;
      nextCycle();     // 静かに再開（最初から“全部”切り替えない）
    }, ms);
  }

  // 初回起動
  nextCycle();

  // 扉のホバーで説明を表示
  const doors = document.querySelectorAll('.doors--orbit .door');
  doors.forEach(el => {
    // 最初にmatchする door--N クラス名を拾う
    const key = [...el.classList].find(c => /^door--\d+$/.test(c));
    const text = desc[key] || "……開ける？";

    el.addEventListener('mouseenter', () => {
      pauseAndShow(text);
    });
    el.addEventListener('mouseleave', () => {
      resumeLater(1200); // 少し間を置いて再開（ガクッと戻らない）
    });
  });
})();



// 儀式をもう一度
document.getElementById('reintro')?.addEventListener('click', () => {
  location.href = './intro.html?ritual';
});


