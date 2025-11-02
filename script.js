// --- 1) 星の微粒子（ゆるい点滅 + 漂い） ---
const cvs = document.getElementById('dust');
if (cvs) {
  const ctx = cvs.getContext('2d');
  function resize(){ cvs.width = innerWidth; cvs.height = innerHeight }
  addEventListener('resize', resize); resize();

  const N = 120; // 粒の数
  const stars = Array.from({length:N}, () => ({
    x: Math.random()*cvs.width,
    y: Math.random()*cvs.height*0.9,
    r: Math.random()*1.6 + 0.3,
    a: Math.random()*Math.PI*2,
    s: 0.2 + Math.random()*0.7,  // 漂い速度
    tw: 0.5 + Math.random()*1.2  // 点滅速度
  }));

  let t = 0;
  (function loop(){
    requestAnimationFrame(loop);
    t += 0.016;
    ctx.clearRect(0,0,cvs.width,cvs.height);

    for (const p of stars){
      p.x += (Math.sin((t+p.a)*0.2))*0.06;
      p.y -= p.s*0.02; if (p.y < -10) p.y = cvs.height+10;
      const flicker = 0.5 + 0.5*Math.sin(t*p.tw + p.a);
      ctx.globalAlpha = 0.35 + 0.65*flicker;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = 'rgba(240,235,220,0.9)';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  })();
}

// --- 2) セラフィアの囁き（ローテーション） ---
const lines = [
  "「……ここにいるわ。」",
  "「静けさの奥で、あなたを見ている。」",
  "「どの扉から、始めるの？」"
];
const el = document.querySelector('.whisper .line');
if (el){
  let i = 0;
  setInterval(()=>{ el.textContent = lines[(++i)%lines.length] }, 6500);
}

// --- 3) 儀式をもう一度（Introへ） ---
const re = document.getElementById('reintro');
if (re){
  re.addEventListener('click', ()=>{
    localStorage.removeItem('introSeen');
    location.href = 'intro.html';
  });
}

