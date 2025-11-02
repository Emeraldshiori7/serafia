// -------------------------
// 光の粒（星屑）エフェクト
// -------------------------
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

let W, H;
let stars = [];

function fit() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  W = canvas.width  = Math.floor(window.innerWidth  * dpr);
  H = canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width  = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  makeStars();
}

function makeStars() {
  stars = [];
  const count = Math.floor((window.innerWidth * window.innerHeight) / 6000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * Math.PI * 2,
      s: Math.random() * 0.35 + 0.1,
      f: Math.random() * Math.PI * 2
    });
  }
}

let glowPhase = 0;
function draw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // 全体の明滅（呼吸のような光）
  glowPhase += 0.008;
  const globalGlow = 0.3 + 0.7 * Math.sin(glowPhase);

  for (const p of stars) {
    const alpha = 0.4 + 0.4 * Math.sin(p.f + glowPhase * 0.5);
    ctx.globalAlpha = alpha * globalGlow;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    p.x += Math.cos(p.a) * p.s;
    p.y += Math.sin(p.a) * p.s;
    p.f += 0.02;

    if (p.x < 0) p.x = window.innerWidth;
    if (p.x > window.innerWidth) p.x = 0;
    if (p.y < 0) p.y = window.innerHeight;
    if (p.y > window.innerHeight) p.y = 0;
  }
  requestAnimationFrame(draw);
}

window.addEventListener("resize", fit);
fit();
draw();

// ===== 遷移ユーティリティ =====
function goHome() {
  // intro.html と同じフォルダにある index.html に確実に解決
  const url = new URL('./index.html', window.location.href).toString();
  window.location.assign(url);        // historyに残してOKなら assign
  // 履歴を残したくなければ → window.location.replace(url);
}

// ===== フロー制御 =====
const whiteout  = document.querySelector('.whiteout');
const title     = document.querySelector('.title');
const subtitle  = document.querySelector('.subtitle');

// 1. 題名出現
setTimeout(() => {
  title?.classList.add('show');
  subtitle?.classList.add('show');
}, 1000);

// 2. 題名フェードアウト
setTimeout(() => {
  title?.classList.add('fade');
  subtitle?.classList.add('fade');
}, 6000);

// 3. 白フェード → 遷移
setTimeout(() => {
  whiteout?.classList.add('show');
  setTimeout(goHome, 1000);
}, 8000);

// 4. スキップでも遷移
document.getElementById('skipBtn')?.addEventListener('click', goHome);

// （デバッグ用）失敗時にコンソールへ
setTimeout(() => console.log('intro done – trying to go home…'), 7900);

