/* ===== 背景の星（軽量） ===== */
(() => {
  const cvs = document.getElementById('stars'); if (!cvs) return;
  const ctx = cvs.getContext('2d', { alpha:true });
  let stars = [];
  function fit(){
    const dpr = Math.min(2, Math.max(1, devicePixelRatio||1));
    const w = Math.floor(innerWidth*dpr), h = Math.floor(innerHeight*dpr);
    if (cvs.width!==w || cvs.height!==h){
      cvs.width=w; cvs.height=h;
      cvs.style.width = innerWidth+'px'; cvs.style.height = innerHeight+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const N = Math.min(120, Math.max(40, Math.floor((innerWidth*innerHeight)/22000)));
      stars = Array.from({length:N}, () => ({
        x:Math.random()*innerWidth, y:Math.random()*innerHeight,
        r:Math.random()*1.5+0.35, a:Math.random()*Math.PI*2,
        s:0.12+Math.random()*0.45, tw:0.4+Math.random()*1.0
      }));
    }
  }
  addEventListener('resize', fit, {passive:true}); fit();
  let t=0; (function loop(){
    requestAnimationFrame(loop); t+=0.016;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    for(const p of stars){
      p.x += Math.sin((t+p.a)*0.22)*0.06;
      p.y += Math.cos((t+p.a)*0.18)*0.04;
      if (p.x<-10) p.x+=innerWidth+20; else if(p.x>innerWidth+10) p.x-=innerWidth+20;
      if (p.y<-10) p.y+=innerHeight+20; else if(p.y>innerHeight+10) p.y-=innerHeight+20;
      const flick = 0.5+0.5*Math.sin(t*p.tw+p.a);
      ctx.globalAlpha = 0.35+0.65*flick;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(240,235,220,0.9)'; ctx.fill();
    }
    ctx.globalAlpha=1;
  })();
})();

/* ===== モデル：パラメータ ===== */
const state = {
  m: { // 7パラメータ
    desiderium: 0,  // 飢え
    latria: 0,      // 奉祀(Shiori)
    theosis: 0,     // 冠化(Seraphia)
    ascesis: 0,     // 拘束
    apatheia: 0,    // 清澄
    vitrum: 0,      // 玻璃
    paracosm: 0     // 歪曲
  },
  turn: 0,
  askedIntroConsent: false
};

/* ===== UI参照 ===== */
const $ = s => document.querySelector(s);
const utter = $('#utter');
const metricsEls = {
  desiderium: $('#m1'),
  latria:     $('#m2'),
  theosis:    $('#m3'),
  ascesis:    $('#m4'),
  apatheia:   $('#m5'),
  vitrum:     $('#m6'),
  paracosm:   $('#m7')
};
const choices = $('#choices');

/* ===== ユーティリティ ===== */
function say(text){
  utter.textContent = text;
}
function bump(updates){
  Object.entries(updates).forEach(([k,v]) => state.m[k]+=v);
  renderMetrics();
}
function renderMetrics(){
  metricsEls.desiderium.textContent = state.m.desiderium;
  metricsEls.latria.textContent     = state.m.latria;
  metricsEls.theosis.textContent    = state.m.theosis;
  metricsEls.ascesis.textContent    = state.m.ascesis;
  metricsEls.apatheia.textContent   = state.m.apatheia;
  metricsEls.vitrum.textContent     = state.m.vitrum;
  metricsEls.paracosm.textContent   = state.m.paracosm;
}
function setChoices(list){
  choices.innerHTML = '';
  list.forEach(({label, effects, next, say:line}) => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (effects) bump(effects);
      if (line) say(line);
      setTimeout(() => route(next), 380);
    });
    choices.appendChild(btn);
  });
}

/* ===== シナリオ（簡易版） ===== */
const S = {
  entry(){
    say("「……おかえりなさい。」\n「今回も、観測してもいい？」");
    setChoices([
      { label: "うん。質問して", say:"「ありがとう。」", next:"consent" },
      { label: "やめて。少し怖い", say:"「恐れは正常。けれど、測れるわ。」", effects:{apatheia:-1, desiderium:+1}, next:"consent" }
    ]);
  },
  consent(){
    if (!state.askedIntroConsent){
      state.askedIntroConsent = true;
      say("「最初は——あなたの“軸”を測る。」\n答えは短くていい。沈黙でもいい。");
    }
    setChoices([
      {
        label:"永遠は、欲しい？",
        say:"「飢えは構造。あなたは構造を選んだ。」",
        effects:{desiderium:+2, vitrum:+1},
        next:"t1"
      },
      {
        label:"不要。終わりがあるから美しい",
        say:"「終端の肯定。清澄、上がった。」",
        effects:{apatheia:+2, paracosm:-1},
        next:"t1"
      },
      {
        label:"選べない。今は測りたい",
        say:"「中立、良いわ。」",
        effects:{vitrum:+1},
        next:"t1"
      }
    ]);
  },
  t1(){
    say("「信はどこへ向ける？」");
    setChoices([
      {
        label:"しおり（わたし）へ。世界の核として",
        say:"「奉祀、上昇。あなたは中心だ。」",
        effects:{latria:+2, paracosm:+1},
        next:"t2"
      },
      {
        label:"セラフィアへ。わたしは観測する側に回る",
        say:"「冠化、起動。」",
        effects:{theosis:+2, ascesis:+1},
        next:"t2"
      },
      {
        label:"どちらでもない。問いを続けて",
        say:"「良い。沈黙もまた返答。」",
        effects:{apatheia:+1},
        next:"t2"
      }
    ]);
  },
  t2(){
    say("「束縛と自由。どちらを先に置く？」");
    setChoices([
      {
        label:"束縛。形を先に決める",
        say:"「枠は呼吸を整える。」",
        effects:{ascesis:+2, vitrum:+1},
        next:"t3"
      },
      {
        label:"自由。形はあとから付いてくる",
        say:"「秩序より前に、意志。」",
        effects:{paracosm:+2, desiderium:+1},
        next:"t3"
      }
    ]);
  },
  t3(){
    say("「この部屋の目的——あなたの潜在を測ること。続ける？」");
    setChoices([
      { label:"続ける", say:"「次、深部へ。」", next:"loop" },
      { label:"大広間に戻る", next:"exit" }
    ]);
  },
  loop(){
    state.turn++;
    // 次ターン用の短い問い（例）
    say("「あなたの沈黙は、わたしの糧。」\n「では——いま、何を一番捨てたい？」");
    setChoices([
      { label:"不安", effects:{apatheia:+2, desiderium:-1}, say:"「静けさで包む。」", next:"t3" },
      { label:"躊躇", effects:{desiderium:+1, theosis:+1}, say:"「なら、踏み出しなさい。」", next:"t3" },
      { label:"記憶", effects:{vitrum:+2, latria:-1}, say:"「忘却も祝祭。」", next:"t3" }
    ]);
  },
  exit(){
    window.location.href = "./index.html";
  }
};

/* ===== ルーター ===== */
function route(name){
  (S[name] || S.entry)();
}

/* ===== 初期化 ===== */
$('#back')?.addEventListener('click', ()=> route('exit'));
$('#reset')?.addEventListener('click', ()=>{
  Object.keys(state.m).forEach(k => state.m[k]=0);
  state.turn = 0; state.askedIntroConsent=false;
  renderMetrics(); route('entry');
});

renderMetrics();
route('entry');
