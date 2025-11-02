/* ========= 星屑（呼吸する光） ========= */
(() => {
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  let W, H, stars = [], glow = 0;

  function fit(){
    const dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
    W = canvas.width  = Math.floor(innerWidth  * dpr);
    H = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width  = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    make();
  }
  function make(){
    stars = [];
    const count = Math.floor((innerWidth * innerHeight) / 6000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * Math.PI * 2,
        v: Math.random() * 0.35 + 0.1,
        f: Math.random() * Math.PI * 2
      });
    }
  }
  function draw(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    glow += 0.008;
    const globalGlow = 0.3 + 0.7 * Math.sin(glow);
    for (const p of stars){
      const alpha = 0.4 + 0.4 * Math.sin(p.f + glow * 0.5);
      ctx.globalAlpha = alpha * globalGlow;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
      p.x += Math.cos(p.a) * p.v;
      p.y += Math.sin(p.a) * p.v;
      p.f += 0.02;
      if (p.x < 0) p.x = innerWidth;  if (p.x > innerWidth) p.x = 0;
      if (p.y < 0) p.y = innerHeight; if (p.y > innerHeight) p.y = 0;
    }
    requestAnimationFrame(draw);
  }
  addEventListener("resize", fit, {passive:true});
  fit(); draw();
})();

/* ========= 画面フロー ========= */
(() => {
  const title    = document.querySelector('.title');
  const subtitle = document.querySelector('.subtitle');
  const whiteout = document.querySelector('.whiteout');
  const skipBtn  = document.getElementById('skipBtn');

  function goHome(){
    localStorage.setItem('introSeen', '1');
    location.replace('./index.html'); // 戻るでループしない
  }

  // 1) 題名出現
  setTimeout(() => {
    title?.classList.add('show');
    subtitle?.classList.add('show');
  }, 900);

  // 2) 題名フェードアウト
  setTimeout(() => {
    title?.classList.add('fade');
    subtitle?.classList.add('fade');
  }, 5800);

  // 3) 白フェード → 遷移
  setTimeout(() => {
    whiteout?.classList.add('show');
    setTimeout(goHome, 1000);
  }, 7800);

  // スキップ
  skipBtn?.addEventListener('click', () => {
    whiteout?.classList.add('show');
    setTimeout(goHome, 300);
  });

  // 低動作環境では即座に遷移（酔い防止）
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    whiteout?.classList.add('show'); setTimeout(goHome, 200);
  }
})();
