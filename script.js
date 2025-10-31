/* ===== 設定 ===== */
const PREFERS_REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WHISPER_INTERVAL = 5200;
const TYPE_SPEED = 22;

/* ===== 星空 ===== */
(function starfield(){
  const c = document.getElementById('stars');
  if(!c) return;
  const ctx = c.getContext('2d');

  function fit(){ c.width = innerWidth; c.height = innerHeight; }
  addEventListener('resize', fit, {passive:true}); fit();

  const N = PREFERS_REDUCED ? 40 : 110;
  const S = PREFERS_REDUCED ? 0.006 : 0.02;
  const stars = Array.from({length:N}, ()=>({
    x: Math.random()*c.width,
    y: Math.random()*c.height*0.82 + c.height*0.06,
    r: Math.random()*1.6 + 0.3,
    s: Math.random()*S + 0.004
  }));

  (function draw(){
    requestAnimationFrame(draw);
    ctx.clearRect(0,0,c.width,c.height);
    for(const st of stars){
      ctx.beginPath();
      const a = 0.5 + 0.5*Math.sin(performance.now()*st.s + st.x);
      ctx.fillStyle = `rgba(255,235,245,${0.10 + a*0.18})`;
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2);
      ctx.fill();
    }
  })();
})();

/* ===== 囁き：タイプライター＋ローテーション ===== */
(function whisper(){
  const el = document.getElementById('whisper');
  if(!el) return;
  const lines = (el.dataset.lines || '').split('|').map(s=>s.trim()).filter(Boolean);
  if(!lines.length) return;

  let i = 0, typing = false;

  function type(text){
    typing = true;
    const open='「', close='」';
    el.textContent = open;
    let idx = 0;
    (function step(){
      if(idx <= text.length){
        el.textContent = open + text.slice(0, idx) + close;
        idx++;
        setTimeout(step, PREFERS_REDUCED ? TYPE_SPEED*1.5 : TYPE_SPEED);
      }else{
        typing = false;
      }
    })();
  }

  function next(){
    if(typing) return;
    i = (i+1) % lines.length;
    type(lines[i]);
  }

  type(lines[0]);
  setInterval(next, WHISPER_INTERVAL);
})();

/* ===== 再訪メッセージ（サブタイトル微変化） ===== */
(function visits(){
  const key='seraphia_visits';
  const n = Number(localStorage.getItem(key)||0) + 1;
  localStorage.setItem(key, String(n));
  const sub = document.getElementById('subtitle');
  if(!sub) return;
  if(n===1) sub.textContent = '── 透明な光、はじめまして。';
  else if(n<=5) sub.textContent = '── また会えましたね。';
  else sub.textContent = '── ここは、あなたの帰る場所。';
})();

/* ===== 音：トグル＆やさしい効果音 ===== */
(function audio(){
  const btn = document.getElementById('soundToggle');
  if(!btn) return;

  let enabled = false;
  let ac, gain;

  function init(){
    if(ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    gain = ac.createGain();
    gain.gain.value = 0.0;
    gain.connect(ac.destination);
  }

  function chime(){
    if(!enabled || !ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(660, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(990, ac.currentTime+0.25);
    g.gain.value=0.0;
    g.gain.linearRampToValueAtTime(0.08, ac.currentTime+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime+0.6);
    o.connect(g).connect(gain);
    o.start(); o.stop(ac.currentTime+0.65);
  }

  function tick(){
    if(!enabled || !ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type='triangle'; o.frequency.value=220;
    g.gain.value=0.0;
    g.gain.linearRampToValueAtTime(0.05, ac.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime+0.12);
    o.connect(g).connect(gain);
    o.start(); o.stop(ac.currentTime+0.13);
  }

  btn.addEventListener('click', ()=>{
    init();
    enabled = !enabled;
    btn.setAttribute('aria-pressed', String(enabled));
    btn.textContent = enabled ? '🔊' : '🔇';
    gain.gain.setTargetAtTime(enabled ? 1.0 : 0.0, ac.currentTime, 0.05);
    if(enabled) chime();
  });

  document.querySelectorAll('.door').forEach(d=>{
    d.addEventListener('mouseenter', tick);
    d.addEventListener('focus', tick);
  });
})();
