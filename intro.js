// ===== 星屑（簡易パーティクル） =====
const cvs = document.getElementById('stars');
const ctx = cvs.getContext('2d', { alpha: true });
let W,H,stars=[];

function resize(){
  W = cvs.width  = window.innerWidth  * devicePixelRatio;
  H = cvs.height = window.innerHeight * devicePixelRatio;
}
function initStars(n=160){
  stars = Array.from({length:n}, () => ({
    x: Math.random()*W,
    y: Math.random()*H,
    r: (Math.random()*1.1+0.2)*devicePixelRatio,
    v: Math.random()*0.15 + 0.02
  }));
}
function tick(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  stars.forEach(s=>{
    s.y -= s.v; if(s.y < -4) s.y = H+4;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
  });
  requestAnimationFrame(tick);
}
resize(); initStars(); tick();
addEventListener('resize', ()=>{ resize(); initStars(stars.length); });

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
