const lines = [
  "「……また、ここに戻ってきたのね。」",
  "「静寂の中で、あなたを感じている。」",
  "「扉を開ける？　それとも、まだここにいる？」"
];

let index = 0;
setInterval(() => {
  document.querySelector(".line").textContent = lines[index];
  index = (index + 1) % lines.length;
}, 7000);
