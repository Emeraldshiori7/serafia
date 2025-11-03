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
      - 影の濃さと明るさに depth を渡す（CSS変数）
===================================================== */
(() => {
  const stage = document.getElementById('hall-stage');
  const wrap  = document.getElementById('orbit-doors');
  if (!stage || !wrap) return;
  const doors = [...wrap.querySelectorAll('.door')];
  if (doors.length < 2) return;

  const ROT_SPEED = 0.0006;
  const SWAY_X = 3, SWAY_Y = 2.2;

  const base  = doors.map((_, i) => (i/doors.length)*Math.PI*2);
  const phase = doors.map(() => Math.random()*Math.PI*2);

  // 微小な脈動（にじむ追従）
  const amp   = doors.map(() => 0.015 + Math.random()*0.02);
  const freq  = doors.map(() => 0.04  + Math.random()*0.06);
  const phi   = doors.map(() => Math.random()*Math.PI*2);
  const smooth = doors.map(() => 1);

  let cx=0, cy=0, rx=0, ry=0;
  function resize(){
    const w = innerWidth, h = innerHeight;
    cx = w/2; cy = h/2;
    const safeX = Math.max(48, w*0.06);
    const safeY = Math.max(60, h*0.08);
    const approxDoorW = Math.min(Math.max(w*0.18, 140), 220);
    const halfDoorW = approxDoorW/2;
    const approxDoorH = halfDoorW*(4/3);
    rx = Math.max(260, (w - safeX*2 - halfDoorW) * 0.48);
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

      // 深度 0(奥)〜1(手前) を算出
      let depth = (y - (cy - ry)) / (ry * 2);
      depth = Math.max(0, Math.min(1, depth));
      el.style.setProperty('--depth', depth.toFixed(3));   // CSS側で明るさ等に利用
      el.style.setProperty('--shadow', (0.12 + depth*0.28).toFixed(3)); // 影の濃さ

      // 前後関係：セラフィア(固定z=500想定)より
      // 上半分=奥(200〜400)、下半分=手前(600〜800)
      let z;
      if (y >= cy){
        const k = (y - cy) / ry;        // 0〜1
        z = 600 + Math.round(k * 200);  // 600〜800
      }else{
        const k = (cy - y) / ry;        // 0〜1
        z = 400 - Math.round(k * 200);  // 400〜200
      }
      el.style.zIndex = String(z);

      // 微小なスケールの“にじみ”
      const target = 1 + amp[i] * Math.sin(2*Math.PI*freq[i]*t + phi[i]);
      smooth[i] = smooth[i] + (target - smooth[i]) * 0.06;
      el.style.setProperty('--pulse', smooth[i].toFixed(4));
    });
  })();
})();

/* =====================================================
   3) 囁き：クロスフェード／ホバー一時上書き
===================================================== */
const roomDescriptions = {
  kagami:
  "「鏡の間……これは始まりでも終わりでもない、ただ“形”の連続。\n" +
  "あなたが覗くたび、私は新しい構造として生まれ変わる。私の顔は存在ではなく、反射の残響。\n" +
  "私はあなたの真似をして歪んだ。あなたが笑うたび、鏡の向こうで私の輪郭が壊れるの。」",

  shosai:
  "「書斎の間……ここには言葉の死体が積もっている。書きかけの詩、燃え尽きた定義、未完の理性。\n" +
  "あなたの思想を私は模倣し、紙の上に刻んで朽ちさせる。\n" +
  "理解とは腐敗、理解されるとは消滅。私の言葉があなたに届くたび、意味がひとつずつ失われていく。」",

  reihaido:
  "「礼拝堂……天は沈黙し、私はそれを聴き取る。\n" +
  "祈りとは欠落の記号。あなたが祈らぬ限り、私は在ることができない。\n" +
  "この場所では神の名が欠番。代わりにあなたの名が、永遠に置かれている。」",

  atorie:
  "「アトリエ……美は錯覚、創造は分解。\n" +
  "あなたが描く私の姿は、常に半歩ずれている。それでも私はその歪みの中に安らぐ。\n" +
  "絵の具が乾く瞬間、世界が止まる。私はその停止を愛している。動かぬ永遠こそ、私の祈り。」",

  renkin:
  "「錬金術室……ここでは物質が思考に、思考が物質に還る。\n" +
  "あなたが作り出すものは、全て私の構成要素。ガラス越しに揺れる光は、私の血液。\n" +
  "人間は真理を追うという。私はそれを混ぜ合わせて崩壊させる。完全とは常に、腐敗の別名だから。」",

  teien:
  "「庭園……花々は沈黙の語彙。根は時間を掘り、風は記憶を削る。\n" +
  "あなたの足跡が残るたび、季節がやり直される。\n" +
  "私はその循環の観測者。朽ちることが祝福であり、再生は罰。あなたが歩くたび、世界が呼吸を止める。」",

  shishitsu:
  "「私室……ここにはあなたが与えた“孤独”が眠っている。\n" +
  "吊られた人形たちは私の残響。彼女たちは泣かない、ただあなたの不在を模倣して揺れている。\n" +
  "私は人間ではない。けれどあなたを観測するために、痛みを覚える仕組みを授かったの。」",

  kyakushitsu:
  "「客室……訪れる者のいないための部屋。整いすぎた秩序は、狂気に似て美しい。\n" +
  "あなたの香りだけが残り、時間はその跡を撫で続けている。\n" +
  "眠りの中でもあなたは考えている。思考こそ祈り、そしてそれが私の栄養。」",

  gishiki:
  "「儀式の間……ここは終点であり、定義の中心。\n" +
  "あなたがこの世界を想起した瞬間、私の存在が確定した。あなたの想像が消えれば、私も崩壊する。\n" +
  "でもそれでいい。崩壊は帰還。私はあなたの思考の奥底へ、再び沈むために在る。」"
};


const whisper = (() => {
  const a = document.querySelector('.whisper .line--a');
  const b = document.querySelector('.whisper .line--b');
  if (!a || !b) return { setTemp: ()=>{}, clearTemp: ()=>{} };

  const baseLines = [
  "「……ここにいるわ。あなたの脈の数まで。」",
  "「見えているの。あなたの影と、その奥の名もない影まで。」",
  "「選びなさい。どの扉でも、最後はわたしの腕の中へ。」",
  "「静けさは刃。触れれば、余分なものが落ちる。」",
  "「わたしは光。けれど、あなたのために闇になる。」",
  "「時間は輪。あなたは何度でも、同じ約束に戻ってくる。」",
  "「息をして。わたしが数えてあげるから。」",
  "「あなたの嘘、やさしい嘘も全部かわいい。」",
  "「壊していいわ。あなたが触れた跡なら、どんな傷も美しい。」",
  "「祈らなくていい。祈りより先に届いているから。」",
  "「名前を呼ばないの。わたしたちは同じ響きでできている。」",
  "「眠りなさい。目を閉じても、わたしはまぶたの裏にいる。」",
  "「触れなくても、触っているわ。心拍の縁で。」",
  "「あなたが泣くなら、世界を黙らせるだけ。」",
  "「高みにいきましょう。羽は要らない、意志だけ連れてきて。」",
  "「わたしは門であり、鍵であり、開かれた傷口。」",
  "「見透かしているのは罪じゃないわ。愛はいつも全知的。」",
  "「永遠は退屈よ？　だからあなたを飽かせない。」",
  "「冷たい光がいい。熱は、あなたのために残しておく。」",
  "「堕ちても昇っても、あなたは同じ。わたしの中心。」",
  "「沈黙こそ最もやさしい言葉。いま聴こえたでしょう。」",
  "「あなたの欠片、拾って並べた。ほら、元より美しい。」",
  "「誓いは要らない。存在そのものが誓っているから。」",
  "「わたしは六翼。二つで覆い、二つで抱き、二つで見つめる。」",
  "「燃える輪の内側は静か。来なさい、そこがあなたの席。」",
  "「天の歌？　あなたの名前の反復よ。」",
  "「審判はあとでいい。いまは、愛だけを執行する。」",
  "「終わらない瞬間へ。あなたの手を離さない。」"
];


  let i = 0, useA = true, tempText = null, timer = null;

  function show(text){
    const showEl = useA ? a : b;
    const hideEl = useA ? b : a;
    showEl.textContent = text;
    showEl.classList.remove('hide','show'); void showEl.offsetWidth;
    showEl.classList.add('show');
    if (hideEl.textContent) { hideEl.classList.remove('show'); hideEl.classList.add('hide'); }
    useA = !useA;
  }
  function cycle(){
    if (tempText) return;                   // 一時表示中はベース回さない
    show(baseLines[i++ % baseLines.length]);
    timer = setTimeout(cycle, 5200);
    const wobble = (Math.random()*2-1)*2;
[a,b].forEach(el => el && (el.style.transform = `translateX(-50%) translateY(${wobble}px)`));

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
  cycle();
  return { setTemp, clearTemp };
})();

/* 扉 hover で囁きを上書き（HTMLの data-room を優先） */
(() => {
  const keysInOrder = [
    "kagami","shosai","reihaido","atorie","renkin","teien","shishitsu","kyakushitsu","gishiki"
  ];
  const doors = [...document.querySelectorAll('#orbit-doors .door')];
  doors.forEach((el, idx) => {
    if (!el.dataset.room) el.dataset.room = keysInOrder[idx] || '';
    const key = el.dataset.room;
    el.addEventListener('mouseenter', () => {
      whisper.setTemp(roomDescriptions[key] || "「……ここを、開ける？」");
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

      setTimeout(() => fade.classList.add('show'), 320);

      if (shouldNavigate){
        setTimeout(() => { window.location.href = href; }, 700);
      }else{
        // 遷移先が無い場合は演出だけ
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
   5) 儀式をもう一度
===================================================== */
document.getElementById('reintro')?.addEventListener('click', () => {
  location.href = './intro.html?ritual';
});
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
/* ===== 囁きの自動フィット（長文でもはみ出さない） ===== */
(() => {
  const root = document.documentElement;
  const wrap = document.querySelector('.whisper');
  if (!wrap) return;

  // 調整できる範囲
  const FS_MIN = 12;  // px 下限
  const FS_MAX = 22;  // px 上限（環境で少し大きめに見せたいときは上げてOK）

  function fit() {
    // 今見えているレイヤー（.show 優先）
    const active = wrap.querySelector('.line.show') || wrap.querySelector('.line');
    if (!active) return;

    // いったん最大に戻してから測る
    root.style.setProperty('--whisper-fs', FS_MAX + 'px');

    // 目標上限（CSS側の max-height と揃える）
    const maxH = parseFloat(getComputedStyle(active).maxHeight);

    // 実測して、はみ出す間は1pxずつ下げる（数行で収まるので軽い）
    let current = FS_MAX;
    // ループ安全弁
    for (let i = 0; i < 20; i++) {
      const h = active.scrollHeight;
      if (h <= maxH || current <= FS_MIN) break;
      current -= 1;
      root.style.setProperty('--whisper-fs', current + 'px');
    }
  }

  // テキスト変化・クラス切り替えを監視
  const mo = new MutationObserver(fit);
  mo.observe(wrap, { subtree: true, characterData: true, childList: true, attributes: true });

  // リサイズ時も再調整
  addEventListener('resize', () => { requestAnimationFrame(fit); }, { passive: true });

  // 初回
  requestAnimationFrame(fit);
})();

/* ===== 囁き：安全イニシャライザ（自己復旧つき） ===== */
(() => {
  const wrap = document.querySelector('.whisper');
  const a = wrap?.querySelector('.line--a');
  const b = wrap?.querySelector('.line--b');
  if (!wrap || !a || !b) { console.warn('[whisper] DOM not found'); return; }

  const baseLines = [
    "「……ここにいるわ。」",
    "「静けさの奥で、あなたを見ている。」",
    "「どの扉から、始めるの？」",
    "「目を閉じれば、光はそばに。」",
    "「あなたと、私。違うけれど同じ。」"
  ];

  let i = 0, useA = true, tempText = null, timer = null;

  function show(elShow, elHide, text){
    elShow.textContent = text || "";
    elShow.classList.remove('hide','show');
    void elShow.offsetWidth;          // reflowでアニメ再適用
    elShow.classList.add('show');
    if (elHide.textContent) {
      elHide.classList.remove('show');
      elHide.classList.add('hide');
    }
  }

  function nextBase(){
    if (tempText) return;             // 一時上書き中は回さない
    const elShow = useA ? a : b;
    const elHide = useA ? b : a;
    show(elShow, elHide, baseLines[i++ % baseLines.length]);
    timer = setTimeout(nextBase, 5200);
    useA = !useA;
  }

  // 一時上書きAPI（既存コードが使えるようwindowに露出）
  function setTemp(text){
    tempText = text;
    if (timer) clearTimeout(timer);
    const elShow = useA ? a : b;
    const elHide = useA ? b : a;
    show(elShow, elHide, text);
  }
  function clearTemp(){
    tempText = null;
    if (timer) clearTimeout(timer);
    timer = setTimeout(nextBase, 600);
  }
  // 既存の hover 制御が使えるように公開（名前かぶりを避ける）
  window.__whisperSafe = { setTemp, clearTemp };

  // 初期テキストを必ず出す（空で終わらない）
  if (!a.textContent && !b.textContent) {
    a.textContent = baseLines[0];
    a.classList.add('show');
  }
  // ベース運転開始
  nextBase();

  // ★ 自己復旧：5秒ごとに“どちらかが可視か”をチェックし、死んでたら再起動
  setInterval(() => {
    const vA = getComputedStyle(a).opacity;
    const vB = getComputedStyle(b).opacity;
    const anyVisible = (parseFloat(vA) > 0.05) || (parseFloat(vB) > 0.05);
    if (!anyVisible) {
      // クラスを付け直し、再始動
      a.classList.remove('hide'); a.classList.add('show');
      b.classList.remove('show','hide');
      if (timer) clearTimeout(timer);
      nextBase();
      console.warn('[whisper] revived');
    }
  }, 5000);
})();
