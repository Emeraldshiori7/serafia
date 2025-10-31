// 1) introを見たらフラグを立てる（ホームで自動スキップ用）
localStorage.setItem('introSeen', '1');

// 2) 粒子（星屑）
const cvs = document.getElementById('stars');
const ctx = cvs.getContext('2d', { alpha: true });
let W, H, particles = [];

function resize(){
  W = cvs.width = window.innerWidth;
  H = cvs.height = window.innerHeight;
}
window.addEventListener('resize', resize); resize();

function initParticles(){
  const count = Math.floor((W*H)/18000); // 画面サイズに連動
  particles = Array.from({length: count}, ()=>({
    x: Math.random()*W,
    y: Math.random()*H,
    z: Math.random()*1.2 + .3,
    a: Math.random()*0.6 + 0.2
  }));
}
initParticles();

function draw(){
  ctx.clearRect(0,0,W,H);
  for(const p of particles){
    ctx.globalAlpha = p.a;
    ctx.fillStyle = '#ffffff';
    const r = p.z*1.1;
    ctx.fillRect(p.x, p.y, r, r);
    // 奥行き流れ
    p.y -= (0.15 + p.z*0.6);
    p.x += (p.z*0.15);
    if(p.y < -5) p.y = H+5;
    if(p.x > W+5) p.x = -5;
  }
  requestAnimationFrame(draw);
}
draw();

// 3) サウンド（ユーザー操作後のみ）
const seChime = document.getElementById('se-chime');
const sePulse = document.getElementById('se-pulse');
const seDoor  = document.getElementById('se-door');
let soundEnabled = false;

const soundBtn = document.getElementById('sound');
soundBtn.addEventListener('click', async ()=>{
  soundEnabled = !soundEnabled;
  soundBtn.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
  soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
  if(soundEnabled){
    try{
      await seChime.play(); seChime.pause(); seChime.currentTime = 0;
    }catch(e){}
  }
});

// タイムライン（約12秒）
function timeline(){
  // 0.8s 鐘
  setTimeout(()=>{ if(soundEnabled) seChime.play(); }, 800);

  // 4.2s 心音1、5.3s 心音2（円環に合わせる）
  setTimeout(()=>{ if(soundEnabled){ sePulse.currentTime = 0; sePulse.play(); }}, 4200);
  setTimeout(()=>{ if(soundEnabled){ sePulse.currentTime = 0; sePulse.play(); }}, 5300);

  // 7.8s 扉の気配
  setTimeout(()=>{ if(soundEnabled) seDoor.play(); }, 7800);

  // 10.5s 白フェード → 遷移
  setTimeout(()=>{ 
    const w = document.querySelector('.whiteout');
    w.style.opacity = '1';
  }, 10500);

  // 11.5s 大広間へ
  setTimeout(()=>{ window.location.replace('index.html'); }, 11500);
}
timeline();

// 4) スキップ
document.getElementById('skip').addEventListener('click', ()=>{
  window.location.replace('index.html');
});
