// ===== 星屑アニメーション =====
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");
let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const stars = Array.from({ length: 140 }, () => ({
  x: Math.random() * w,
  y: Math.random() * h,
  size: Math.random() * 1.2 + 0.2,
  speed: Math.random() * 0.2 + 0.05,
  alpha: Math.random() * 0.8 + 0.2
}));

function drawStars() {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  for (const s of stars) {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    s.y += s.speed;
    if (s.y > h) s.y = 0;
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawStars);
}
drawStars();

// ===== UI：スキップ & サウンド =====
const skipBtn  = document.getElementById('skipBtn');
const soundBtn = document.getElementById('soundBtn');

skipBtn.addEventListener('click', gotoHome);

// ブラウザの自動再生規制に配慮して“クリック後”にだけ鳴らす設計
let audioCtx, pulse;
function ensureAudio(){
  if(audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // 低い心音みたいな2発（簡易合成）
  pulse = (freq=60, t=0)=> {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    o.type = 'sine';
    o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06, audioCtx.currentTime+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime+0.23);
    o.start(); o.stop(audioCtx.currentTime+0.25);
  };
}
soundBtn.addEventListener('click', ()=>{
  ensureAudio();
  const pressed = soundBtn.getAttribute('aria-pressed') === 'true';
  soundBtn.setAttribute('aria-pressed', String(!pressed));
  soundBtn.textContent = pressed ? '🔇' : '🔊';
  if(!pressed){
    // 2回だけ心音
    setTimeout(()=>pulse(56), 4000);
    setTimeout(()=>pulse(56), 5200);
  }
});

// ===== タイムライン（フル儀式 ≒11–12秒） =====
// 11.5秒で白フェード→ホーム
function gotoHome(){
  localStorage.setItem('introSeen','1');
  window.location.replace('index.html');
}
setTimeout(gotoHome, 11500);
// ===== サウンドの解禁と制御 =====
const btnSound = document.getElementById('soundBtn');
const seChime  = document.getElementById('seChime');
const sePulse  = document.getElementById('sePulse');
const seCreak  = document.getElementById('seCreak');
const bgDrone  = document.getElementById('bgDrone');

let soundEnabled = false;
[seChime, sePulse, seCreak, bgDrone].forEach(a => a.volume = 0.22);

function enableSound() {
  if (soundEnabled) return;
  soundEnabled = true;
  btnSound.setAttribute('aria-pressed','true');
  btnSound.textContent = '🔊';
  try {
    // 一度だけユーザー操作時に再生を初期化
    seChime.play().then(()=> seChime.pause());
    sePulse.play().then(()=> sePulse.pause());
    seCreak.play().then(()=> seCreak.pause());
    bgDrone.play().then(()=> bgDrone.pause());
  } catch(e){}
}
btnSound.addEventListener('click', () => {
  if (!soundEnabled) { enableSound(); }
  else {
    soundEnabled = false;
    btnSound.setAttribute('aria-pressed','false');
    btnSound.textContent = '🔇';
    [seChime, sePulse, seCreak, bgDrone].forEach(a => { a.pause(); a.currentTime = 0; });
  }
});
// クリックやキー押下の最初の操作でも解禁
window.addEventListener('pointerdown', enableSound, { once:true });
window.addEventListener('keydown',     enableSound, { once:true });

// ===== 演出タイミング =====
const whisper = document.querySelector('.whisper');

// 0.8s：鈴
setTimeout(()=> { if(soundEnabled) { seChime.currentTime=0; seChime.play(); } }, 800);

// 4.2s/5.0s：パルス二回（輪と同期）
setTimeout(()=> { if(soundEnabled) { sePulse.currentTime=0; sePulse.play(); } }, 4200);
setTimeout(()=> { if(soundEnabled) { sePulse.currentTime=0; sePulse.play(); } }, 5000);

// 6.7s：扉の“気配”
setTimeout(()=> { if(soundEnabled) { seCreak.currentTime=0; seCreak.play(); } }, 6700);

// 9.2s：囁き表示
setTimeout(()=>{
  whisper.textContent = "……来たのね、しおり。";
  whisper.classList.add('show');
}, 9200);

// 10.5s～：白転 → 大広間、BGMは遷移後にフェードイン
setTimeout(()=>{
  if (soundEnabled) {
    bgDrone.volume = 0;
    bgDrone.play().catch(()=>{});
    const fade = setInterval(()=>{
      bgDrone.volume = Math.min(bgDrone.volume + 0.04, 0.2);
      if (bgDrone.volume >= 0.2) clearInterval(fade);
    }, 120);
  }
}, 10800);

// Skip
document.getElementById('skipBtn').addEventListener('click', ()=>{
  window.location.replace('index.html');
});
