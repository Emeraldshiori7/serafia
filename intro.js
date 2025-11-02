// ========== 星屑（canvas） ==========
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");

let W, H;
let stars = [];

function fit() {
  // デバイスピクセル比に対応
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
  // 画面サイズに応じて密度を決定
  const count = Math.floor((window.innerWidth * window.innerHeight) / 6000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * Math.PI * 2, // 進行角
      s: Math.random() * 0.35 + 0.1,   // 速度
      f: Math.random() * Math.PI * 2   // 点滅位相
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.fillStyle = "#ffffff";

  for (const p of stars) {
    // ふわっとした点滅
    const alpha = 0.55 + 0.45 * Math.sin(p.f);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    // ゆっくり漂う
    p.x += Math.cos(p.a) * p.s;
    p.y += Math.sin(p.a) * p.s;
    p.f += 0.02;

    // 端でループ
    if (p.x < 0) p.x = window.innerWidth;
    if (p.x > window.innerWidth) p.x = 0;
    if (p.y < 0) p.y = window.innerHeight;
    if (p.y > window.innerHeight) p.y = 0;
  }
  requestAnimationFrame(draw);
}

// 初期化
window.addEventListener("resize", fit);
fit();
draw();

// ========== スキップ（今は白フェードせず即終了・必要なら後で追加） ==========
document.getElementById("skipBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});
