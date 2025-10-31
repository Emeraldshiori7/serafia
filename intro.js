// イントロ再生 → 白フェード後にトップへ
const white = document.getElementById('whiteout');
const skipBtn = document.getElementById('skipBtn');
const soundBtn = document.getElementById('soundBtn');

// 粒子（星屑）だけ軽量で描く
(() => {
  const c = document.getElementById('stars');
  const x = c.getContext('2d');
  let w, h, ps=[];
  const init = () => {
    w = c.width = innerWidth; h = c.height = innerHeight;
    ps = Array.from({length: 90}, () => ({
      x: Math.random()*w, y: Math.random()*h,
      z: Math.random()*0.7+0.3, v: Math.random()*0.15+0.05
    }));
  };
  const draw = () => {
    x.clearRect(0,0,w,h);
    ps.forEach(p=>{
      p.y += p.v; if(p.y>h) p.y = -2;
      x.globalAlpha = p.z*0.9;
      x.fillStyle = '#ffffff';
      x.fillRect(p.x, p.y, 1, 1);
    });
    requestAnimationFrame(draw);
  };
  addEventListener('resize', init);
  init(); draw();
})();

// 効果音（ユーザー操作後のみ鳴らす）
let audioEnabled = false;
const se = {
  chime: new Audio('assets/intro/se_chime.mp3'),
  pulse: new Audio('assets/intro/se_pulse.mp3'),
  door:  new Audio('assets/intro/se_door.mp3')
};
Object.values(se).forEach(a => { a.volume = 0.18; a.preload = 'auto'; });

soundBtn.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  soundBtn.setAttribute('aria-pressed', audioEnabled ? 'true' : 'false');
  soundBtn.textContent = audioEnabled ? '🔊' : '🔇';
  if(audioEnabled){
    se.chime.currentTime = 0; se.chime.play().catch(()=>{});
    setTimeout(()=>{ se.pulse.play().catch(()=>{}); }, 2800);
    setTimeout(()=>{ se.door.play().catch(()=>{}); }, 7000);
  }
});

// スキップ
skipBtn.addEventListener('click', () => {
  localStorage.setItem('introSeen','1');
  location.replace('index.html');
});

// 自動遷移（白抜けアニメ完了後に）
setTimeout(()=>{
  localStorage.setItem('introSeen','1');
  location.replace('index.html');
}, 11500);

