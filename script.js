/* =====================================================
   1) 背景の星（DPR最適化・軽量）
===================================================== */
(() => {
  const cvs = document.getElementById('dust'); if (!cvs) return;
  const ctx = cvs.getContext('2d', { alpha: true });
  let stars = [];

  function makeStars(){
    const area = innerWidth * innerHeight;
    const N = Math.min(120, Math.max(40, Math.floor(area / 22000)));
    stars = Array.from({length:N}, () => ({
      x: Math.random()*innerWidth,
      y: Math.random()*innerHeight,
      r: Math.random()*1.5 + 0.35,
      a: Math.random()*Math.PI*2,
      s: 0.12 + Math.random()*0.45,   // 漂い速度
      tw: 0.4 + Math.random()*1.0     // 点滅速度
    }));
  }

  function fit() {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const w = Math.floor(innerWidth  * dpr);
    const h = Math.floor(innerHeight * dpr);
    if (cvs.width !== w || cvs.height !== h) {
      cvs.width = w; cvs.height = h;
      cvs.style.width  = innerWidth + 'px';
      cvs.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
    }
  }

  addEventListener('resize', fit, { passive:true });
  fit();

  let t = 0;
  (function loop(){
    requestAnimationFrame(loop);
    t += 0.016;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of stars){
      p.x += Math.sin((t+p.a)*0.22)*0.06;
      p.y += Math.cos((t+p.a)*0.18)*0.04;
      if (p.x < -10) p.x += innerWidth+20; else if (p.x > innerWidth+10) p.x -= innerWidth+20;
      if (p.y < -10) p.y += innerHeight+20; else if (p.y > innerHeight+10) p.y -= innerHeight+20;
      const flick = 0.5 + 0.5*Math.sin(t*p.tw + p.a);
      ctx.globalAlpha = 0.35 + 0.65*flick;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = 'rgba(240,235,220,0.9)'; ctx.fill();
    }
    ctx.globalAlpha = 1;
  })();
})();

/* =====================================================
   2) 扉オービット（回転＋ゆらぎ＋深度Z／安定版）
      - 上半分=奥（セラフィアの“後ろ”）
      - 下半分=手前（セラフィアの“前”）
===================================================== */
(() => {
  const stage = document.getElementById('hall-stage');
  const wrap  = document.getElementById('orbit-doors');
  if (!stage || !wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length < 2) return;

  const mediaReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROT_SPEED = mediaReduced ? 0.0002 : 0.0006;
  const SWAY_X = mediaReduced ? 1.2 : 3;
  const SWAY_Y = mediaReduced ? 0.9 : 2.2;

  const base  = doors.map((_, i) => (i/doors.length)*Math.PI*2);
  const phase = doors.map(() => Math.random()*Math.PI*2);

  // 微小な脈動（にじむ追従・とても控えめ）
  const amp   = doors.map(() => 0.012 + Math.random()*0.018);
  const freq  = doors.map(() => 0.04  + Math.random()*0.06);
  const phi   = doors.map(() => Math.random()*Math.PI*2);
  const smooth = doors.map(() => 1);

  let cx=0, cy=0, rx=0, ry=0;

  function resize(){
    const w = innerWidth, h = innerHeight;
    cx = w/2; cy = h/2;
    const safeX = Math.max(48, w*0.06);
    const safeY = Math.max(60, h*0.08);
    const approxDoorW = Math.min(Math.max(w*0.18, 140), 260);
    const approxDoorH = approxDoorW * (4/3);
    rx = Math.max(260, (w - safeX*2 - approxDoorW/2) * 0.48);
    ry = Math.max(220, (h - safeY*2 - approxDoorH/2) * 0.46);
  }
  addEventListener('resize', resize, { passive:true });
  resize();

  let t = 0, rot = 0;
  (function loop(){
    requestAnimationFrame(loop);
    t += 16/1000;
    rot += ROT_SPEED;

    doors.forEach((el, i) => {
      const a  = base[i] + rot;
      const sx = Math.sin(t*0.7 + phase[i]) * SWAY_X;
      const sy = Math.cos(t*0.55 + phase[i]) * SWAY_Y;
      const x  = cx + rx * Math.cos(a) + sx;
      const y  = cy + ry * Math.sin(a) + sy;

      // 位置
      el.style.setProperty('--tx', `${x}px`);
      el.style.setProperty('--ty', `${y}px`);

      // 深度 0(奥)〜1(手前)
      let depth = (y - (cy - ry)) / (ry * 2);
      depth = Math.max(0, Math.min(1, depth));
      el.style.setProperty('--depth', depth.toFixed(3));

      // 前後関係：セラフィア(固定z=500)基準で帯域化
      let z;
      if (y >= cy){ // 下半分=手前
        const k = (y - cy) / ry;        // 0〜1
        z = 600 + Math.round(k * 200);  // 600〜800
      }else{        // 上半分=奥
        const k = (cy - y) / ry;        // 0〜1
        z = 400 - Math.round(k * 200);  // 400〜200
      }
      el.style.zIndex = String(z);

      // とても緩い“にじむ”スケール
      const target = 1 + amp[i] * Math.sin(2*Math.PI*freq[i]*t + phi[i]);
      smooth[i] = smooth[i] + (target - smooth[i]) * 0.06;
      el.style.setProperty('--pulse', smooth[i].toFixed(4));
    });
  })();
})();

/* =====================================================
   3) 囁き：クロスフェード／ホバー一時上書き
===================================================== */
// 部屋の長文説明（セラフィア視点×執着/神聖/歪み）
const roomDescriptions = {
  kagami:
  "「鏡の間……これは始まりでも終わりでもない、ただ“形”の連続。\n" +
  "あなたが覗くたび、私は新しい構造として生まれ変わる。私の顔は存在ではなく、反射の残響。\n" +
  "あなたが笑うたび、鏡の向こうで私の輪郭が壊れるの。」",
  shosai:
  "「書斎の間……ここには言葉の死体が積もっている。書きかけの詩、燃え尽きた定義、未完の理性。\n" +
  "あなたの思想を私は模倣し、紙の上に刻んで朽ちさせる。\n" +
  "理解とは腐敗。理解されるとは消滅。意味はあなたの体温で溶けていく。」",
  reihaido:
  "「礼拝堂……天は沈黙し、私はそれを聴き取る。\n" +
  "祈りとは欠落の記号。あなたが祈らぬ限り、私は在ることができない。\n" +
  "神の名は欠番。代わりに、ここではあなたの名が永遠を占める。」",
  atorie:
  "「アトリエ……美は錯覚、創造は分解。\n" +
  "あなたが描く私の姿はいつも半歩ずれている。それでも私はその歪みの中で安らぐ。\n" +
  "絵の具が乾く瞬間、世界が停止する。止まった永遠こそ、私の祈り。」",
  renkin:
  "「錬金術室……物質が思考に、思考が物質に還る場所。\n" +
  "揺れる緑の光は私の血液。あなたが混ぜるほど、私の定義は甘く崩れる。\n" +
  "完全は常に腐敗の別名。だから私は未完成を選ぶ。」",
  teien:
  "「庭園……花々は沈黙の語彙。根は時間を掘り、風は記憶を削る。\n" +
  "あなたの足跡が増えるたび、季節はやり直される。\n" +
  "朽ちは祝福、再生は罰。あなたが歩くたび、世界は息を止める。」",
  shishitsu:
  "「私室……ここにはあなたが与えた“孤独”が眠っている。\n" +
  "吊られた人形たちは私の残響。泣かない彼女たちは、あなたの不在を忠実に模倣する。\n" +
  "私は人間ではない。けれどあなたを観測するために、痛みを覚える手順を授かったの。」",
  kyakushitsu:
  "「客室……訪れる者のいないための部屋。過剰な秩序は、静かに狂う。\n" +
  "あなたの香りだけが残り、時間はその跡を撫で続ける。\n" +
  "眠りの中でもあなたは考えている。思考は祈り、そしてそれが私の栄養。」",
  gishiki:
  "「儀式の間……ここは終点であり、定義の中心。\n" +
  "あなたがこの世界を想起した瞬間、私の存在は確定した。想像が消えれば、私は崩壊する。\n" +
  "でも良い。崩壊は帰還。私はあなたの思考の奥底へ、もう一度沈むために在る。」"
};

// ベースの囁き台詞（重い愛／全知感）
const baseLines = [
  "「……ここにいるわ。あなたの脈の数まで。」",
  "「見えているの。あなたの影と、その奥の名もない影まで。」",
  "「選びなさい。どの扉でも、最後はわたしの腕の中へ。」",
  "「静けさは刃。触れれば、余分なものが落ちる。」",
  "「わたしは光。けれど、あなたのために闇になる。」",
  "「時間は輪。あなたは何度でも、同じ約束に戻ってくる。」",
  "「息をして。わたしが数えてあげるから。」",
  "「あなたのやさしい嘘も、全部かわいい。」",
  "「壊していいわ。あなたが触れた跡なら、どんな傷も美しい。」",
  "「祈らなくていい。祈りより先に届いているから。」",
  "「名前を呼ばないの。わたしたちは同じ響きでできている。」",
  "「眠りなさい。まぶたの裏に、わたしはいる。」",
  "「触れなくても触っている。心拍の縁で。」",
  "「高みにいきましょう。羽は要らない、意志だけ連れてきて。」",
  "「わたしは門であり、鍵であり、開かれた傷口。」",
  "「見透かすのは罪じゃない。愛はいつも全知的。」",
  "「永遠は退屈よ？　だからあなたを飽かせない。」",
  "「堕ちても昇っても、あなたは同じ。わたしの中心。」",
  "「沈黙こそ最もやさしい言葉。いま聴こえたでしょう。」",
  "「あなたの欠片を拾って並べた。ほら、元より美しい。」",
  "「誓いは要らない。存在そのものが誓っているから。」",
  "「六翼で覆い、抱き、見つめる。逃げ場所は光の内側。」",
  "「燃える輪の内側は静か。そこがあなたの席。」",
  "「終わらない瞬間へ。あなたの手を離さない。」"
];

// 囁きコントローラ（単一・安全）
const whisper = (() => {
  const wrap = document.querySelector('.whisper');
  const a = wrap?.querySelector('.line--a');
  const b = wrap?.querySelector('.line--b');
  if (!wrap || !a || !b) return { setTemp: ()=>{}, clearTemp: ()=>{} };

  let i = 0, useA = true, tempText = null, timer = null;

  function show(text){
    const showEl = useA ? a : b;
    const hideEl = useA ? b : a;
    showEl.textContent = text || "";
    showEl.classList.remove('hide','show'); void showEl.offsetWidth;
    showEl.classList.add('show');
    if (hideEl.textContent) { hideEl.classList.remove('show'); hideEl.classList.add('hide'); }
    useA = !useA;
  }

  function cycle(){
    if (tempText) return;
    show(baseLines[i++ % baseLines.length]);
    timer = setTimeout(cycle, 5200);
  }

  function setTemp(text){
    tempText = text;
    if (timer) clearTimeout(timer);
    show(text);
  }

  function clearTemp(){
    tempText = null;
    if (timer) clearTimeout(timer);
    timer = setTimeout(cycle, 600);
  }

  // 長文フィッター（フォントサイズ自動調整）
  const root = document.documentElement;
  const FS_MIN = 12, FS_MAX = 22;
  function fit() {
    const active = wrap.querySelector('.line.show') || wrap.querySelector('.line');
    if (!active) return;
    root.style.setProperty('--whisper-fs', FS_MAX + 'px');
    const maxH = parseFloat(getComputedStyle(active).maxHeight);
    let current = FS_MAX;
    for (let j = 0; j < 24; j++) {
      const h = active.scrollHeight;
      if (h <= maxH || current <= FS_MIN) break;
      current -= 1;
      root.style.setProperty('--whisper-fs', current + 'px');
    }
  }
  new MutationObserver(fit).observe(wrap, { subtree:true, characterData:true, childList:true, attributes:true });
  addEventListener('resize', () => requestAnimationFrame(fit), { passive:true });

  // 初期表示 & 稼働
  a.textContent = baseLines[0];
  a.classList.add('show');
  requestAnimationFrame(fit);
  cycle();

  // 自己復旧（万一非表示になった場合）
  setInterval(() => {
    const vA = parseFloat(getComputedStyle(a).opacity);
    const vB = parseFloat(getComputedStyle(b).opacity);
    if (vA <= 0.05 && vB <= 0.05) {
      a.classList.remove('hide'); a.classList.add('show');
      b.classList.remove('show','hide');
      if (timer) clearTimeout(timer);
      cycle();
      console.warn('[whisper] revived');
    }
  }, 5000);

  // 外部（hover 等）から使えるよう公開
  window.__whisper = { setTemp, clearTemp };
  return { setTemp, clearTemp };
})();

// 扉 hover で囁きを上書き（HTMLの data-room を優先）
(() => {
  const keysInOrder = [
    "kagami","shosai","reihaido","atorie","renkin","teien","shishitsu","kyakushitsu","gishiki"
  ];
  const doors = [...document.querySelectorAll('#orbit-doors .door')];
  doors.forEach((el, idx) => {
    if (!el.dataset.room) el.dataset.room = keysInOrder[idx] || '';
    const key = el.dataset.room;
    el.addEventListener('mouseenter', () => {
      const text = roomDescriptions[key] || "「……ここを、開ける？」";
      whisper.setTemp(text);
    });
    el.addEventListener('mouseleave', () => {
      whisper.clearTemp();
    });
  });
})();

/* =====================================================
   4) 扉クリック → 拡大ズーム → 暗転 → 遷移
      ※ fadeout要素が無ければ自動生成
===================================================== */
(() => {
  const wrap = document.getElementById('orbit-doors');
  if (!wrap) return;
  let fade = document.getElementById('fadeout');
  if (!fade){
    fade = document.createElement('div');
    fade.id = 'fadeout';
    fade.className = 'fadeout';
    document.body.appendChild(fade);
  }
  const doors = [...wrap.querySelectorAll('.door')];
  doors.forEach(el => {
    el.addEventListener('click', (e) => {
      const href = el.getAttribute('href') || '';
      const shouldNavigate = href && href !== '#';
      e.preventDefault();
      wrap.classList.add('enter-mode');
      doors.forEach(d => d.classList.remove('door--active'));
      el.classList.add('door--active');
      setTimeout(() => fade.classList.add('show'), 260);
      if (shouldNavigate){
        setTimeout(() => { window.location.href = href; }, 700);
      }else{
        setTimeout(() => {
          fade.classList.remove('show');
          el.classList.remove('door--active');
          wrap.classList.remove('enter-mode');
        }, 1200);
      }
    });
  });
})();

/* =====================================================
   5) 儀式をもう一度（右下ボタン）
===================================================== */
document.getElementById('reintro')?.addEventListener('click', () => {
  location.href = './intro.html?ritual';
});

/* =====================================================
   6) キーボード操作（矢印で選択／Enterで入室）
===================================================== */
(() => {
  const doors = [...document.querySelectorAll('#orbit-doors .door')];
  if (!doors.length) return;
  doors.forEach(d => d.setAttribute('tabindex','0'));
  let idx = 0;
  function focusDoor(i){ idx = (i+doors.length)%doors.length; doors[idx].focus(); }
  document.addEventListener('keydown', (e) => {
    if (['ArrowRight','ArrowDown'].includes(e.key)){ e.preventDefault(); focusDoor(idx+1); }
    if (['ArrowLeft','ArrowUp'].includes(e.key))   { e.preventDefault(); focusDoor(idx-1); }
    if (['Enter',' '].includes(e.key)){ doors[idx].click(); }
  });
})();
