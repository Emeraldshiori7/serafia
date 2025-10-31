// ===== 星屑（軽量Canvas）=====
(() => {
  const cvs = document.getElementById('stars');
  const ctx = cvs.getContext('2d');
  let W, H, stars = [];

  function resize() {
    W = cvs.width = window.innerWidth;
    H = cvs.height = window.innerHeight;
    stars = Array.from({length: Math.min(160, Math.floor(W*H/15000))}, () => ({
      x: Math.random()*W,
      y: Math.random()*H,
      z: Math.random()*0.6 + 0.4,
      a: Math.random()*Math.PI*2,
      s: Math.random()*0.6 + 0.2
    }));
  }

  function tick() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    stars.forEach(st => {
      st.a += 0.002 + st.z*0.002;
      const px = st.x + Math.cos(st.a)*st.z*8;
      const py = st.y + Math.sin(st.a)*st.z*6;
      ctx.globalAlpha = 0.25 + st.z*0.75;
      ctx.fillRect(px, py, st.s, st.s);
    });
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize(); tick();
})();

// ===== サウンド（任意。ファイルが無くても安全に無音）=====
const S = {
  on: false,
  chime: null, pulse: null, door: null,
  tryInit() {
    try {
      this.chime = new Audio('assets/intro/chime.mp3');
      this.pulse = new Audio('assets/intro/pulse.mp3');
      this.door  = new Audio('assets/intro/door.mp3');
      [this.chime, this.pulse, this.door].forEach(a => { if(a){ a.volume = 0.25; } });
    } catch(_) {}
  },
  playSafe(aud) { try { aud && aud.currentTime!==undefined && aud.play(); } catch(_){} }
};

document.getElementById('sound').addEventListener('click', e => {
  S.on = !S.on;
  e.currentTarget.setAttribute('aria-pressed', S.on ? 'true':'false');
  e.currentTarget.textContent = S.on ? '🔊' : '🔇';
  if (S.on && !S.chime) S.tryInit();
  if (S.on) S.playSafe(S.chime);
});

// ===== スキップ =====
document.getElementById('skip').addEventListener('click', () => {
  localStorage.setItem('introSeen','1');
  window.location.replace('index.html');
});

// ===== キーフレームに合わせて軽いSE（任意）=====
setTimeout(()=>{ if(S.on){ S.playSafe(S.pulse); } }, 4200);
setTimeout(()=>{ if(S.on){ S.playSafe(S.pulse); } }, 5200);
setTimeout(()=>{ if(S.on){ S.playSafe(S.door ); } }, 7500);

// ===== 終了→ホームへ遷移 =====
setTimeout(() => {
  localStorage.setItem('introSeen','1');
  window.location.replace('index.html');
}, 11500);
