/* ========== 1. 背景の星（軽量版） ========== */
(() => {
  const cvs = document.getElementById('dust');
  if (!cvs) return;
  const ctx = cvs.getContext('2d', { alpha: true });
  let stars = [];

  function makeStars(){
    const area = innerWidth * innerHeight;
    const N = Math.min(120, Math.max(40, Math.floor(area / 20000)));
    stars = Array.from({length:N}, () => ({
      x: Math.random()*innerWidth,
      y: Math.random()*innerHeight,
      r: Math.random()*1.5 + 0.4,
      a: Math.random()*Math.PI*2,
      s: 0.12 + Math.random()*0.45,
      tw: 0.4 + Math.random()*1.0
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

/* ========== 共通：時間表示フォーマット ========== */
function formatTime(sec){
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = n => String(n).padStart(2,'0');
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
}

/* =====================================================
   2. ストップウォッチ
===================================================== */
const swDisplay = document.getElementById('sw-display');
const swStart   = document.getElementById('sw-start');
const swPause   = document.getElementById('sw-pause');
const swReset   = document.getElementById('sw-reset');

let swRunning = false;
let swStartTime = 0;
let swElapsed = 0;
let swRafId = null;

// 直近の計測（秒数をここで更新）
let lastSeconds = 0;

function updateSw(){
  if (!swRunning) return;
  const now = performance.now();
  swElapsed = (now - swStartTime) / 1000;
  swDisplay.textContent = formatTime(swElapsed);
  swRafId = requestAnimationFrame(updateSw);
}

if (swStart){
  swStart.addEventListener('click', () => {
    if (!swRunning){
      swRunning = true;
      swStartTime = performance.now() - swElapsed*1000;
      swRafId && cancelAnimationFrame(swRafId);
      swRafId = requestAnimationFrame(updateSw);
    }
  });
}
if (swPause){
  swPause.addEventListener('click', () => {
    if (swRunning){
      swRunning = false;
      swRafId && cancelAnimationFrame(swRafId);
      // 停止した瞬間を「直近の計測」として保存
      lastSeconds = swElapsed;
      applyLastTime();
    }
  });
}
if (swReset){
  swReset.addEventListener('click', () => {
    swRunning = false;
    swRafId && cancelAnimationFrame(swRafId);
    swElapsed = 0;
    swDisplay.textContent = '00:00:00';
  });
}

/* =====================================================
   3. タイマー
===================================================== */
const tmMinutesInput = document.getElementById('tm-minutes');
const tmDisplay = document.getElementById('tm-display');
const tmStart   = document.getElementById('tm-start');
const tmStop    = document.getElementById('tm-stop');
const tmReset   = document.getElementById('tm-reset');

let tmTotal = 0;
let tmRemain = 0;
let tmRunning = false;
let tmLastTick = 0;
let tmRafId = null;

function renderTimer(){
  tmDisplay.textContent = formatTime(tmRemain);
}

function tickTimer(){
  if (!tmRunning) return;
  const now = performance.now();
  const dt = (now - tmLastTick)/1000;
  tmLastTick = now;
  tmRemain -= dt;
  if (tmRemain <= 0){
    tmRemain = 0;
    tmRunning = false;
    renderTimer();
    tmRafId && cancelAnimationFrame(tmRafId);
    // タイマー終了 → 直近計測に反映
    lastSeconds = tmTotal;
    applyLastTime();
    // 軽い点滅などさせたかったらここに追加してもOK
    return;
  }
  renderTimer();
  tmRafId = requestAnimationFrame(tickTimer);
}

function initTimerDisplay(){
  const min = parseInt(tmMinutesInput?.value || '25',10) || 25;
  tmTotal = min * 60;
  tmRemain = tmTotal;
  renderTimer();
}
if (tmMinutesInput){
  tmMinutesInput.addEventListener('change', initTimerDisplay);
}
initTimerDisplay();

if (tmStart){
  tmStart.addEventListener('click', () => {
    const min = parseInt(tmMinutesInput.value || '25',10) || 25;
    if (!tmRunning && tmRemain <= 0){
      tmTotal = min * 60;
      tmRemain = tmTotal;
    }
    if (!tmRunning){
      tmRunning = true;
      tmLastTick = performance.now();
      tmRafId && cancelAnimationFrame(tmRafId);
      tmRafId = requestAnimationFrame(tickTimer);
    }
  });
}
if (tmStop){
  tmStop.addEventListener('click', () => {
    tmRunning = false;
    tmRafId && cancelAnimationFrame(tmRafId);
  });
}
if (tmReset){
  tmReset.addEventListener('click', () => {
    tmRunning = false;
    tmRafId && cancelAnimationFrame(tmRafId);
    initTimerDisplay();
  });
}

/* =====================================================
   4. 直近の計測 → 表示＋フォームへの反映
===================================================== */
const lastTimeLabel = document.getElementById('last-time');
const logDurationInput = document.getElementById('log-duration');

function applyLastTime(){
  if (!lastTimeLabel || !logDurationInput) return;
  if (lastSeconds <= 0){
    lastTimeLabel.textContent = 'まだ記録がありません。';
    logDurationInput.value = '';
  }else{
    const txt = formatTime(lastSeconds);
    lastTimeLabel.textContent = txt;
    logDurationInput.value = txt;
  }
}

/* =====================================================
   5. ログ保存（localStorage）＋表示
===================================================== */
const STORAGE_KEY = 'seraphia_study_logs_v1';

function loadLogs(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch(e){
    console.warn('log load error', e);
    return [];
  }
}
function saveLogs(logs){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }catch(e){
    console.warn('log save error', e);
  }
}

const logForm   = document.getElementById('log-form');
const logListEl = document.getElementById('log-list');
const totalTimeEl = document.getElementById('total-time');
const clearBtn  = document.getElementById('log-clear');

let logs = loadLogs();
renderLogs();

function renderLogs(){
  if (!logListEl || !totalTimeEl) return;
  logListEl.innerHTML = '';
  if (!logs.length){
    const p = document.createElement('p');
    p.className = 'history-empty';
    p.innerHTML = 'まだ記録がありません。<br>時間を測って、ここに残していきましょう。';
    logListEl.appendChild(p);
    totalTimeEl.textContent = '00:00:00';
    return;
  }
  let totalSec = 0;
  logs.forEach(log => {
    totalSec += (log.seconds || 0);
    const div = document.createElement('div');
    div.className = 'log-item';

    const top = document.createElement('div');
    top.className = 'log-item__top';

    const subj = document.createElement('div');
    subj.className = 'log-item__subject';
    subj.textContent = log.subject || '無題';

    const time = document.createElement('div');
    time.className = 'log-item__time';
    time.textContent = formatTime(log.seconds || 0);

    top.appendChild(subj);
    top.appendChild(time);

    const meta = document.createElement('div');
    meta.className = 'log-item__meta';
    const date = new Date(log.date || Date.now());
    const dateStr = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    const stars = '★'.repeat(log.intensity || 1);
    meta.textContent = `${dateStr}　集中度：${stars}`;

    div.appendChild(top);
    div.appendChild(meta);

    if (log.note && log.note.trim()){
      const note = document.createElement('div');
      note.className = 'log-item__note';
      note.textContent = log.note;
      div.appendChild(note);
    }

    logListEl.appendChild(div);
  });

  totalTimeEl.textContent = formatTime(totalSec);
}

/* フォーム送信 */
if (logForm){
  logForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('log-subject')?.value.trim() || '';
    const intensity = parseInt(document.getElementById('log-intensity')?.value || '2',10) || 2;
    const note = document.getElementById('log-note')?.value.trim() || '';

    if (!lastSeconds || lastSeconds <= 0){
      alert('まずストップウォッチかタイマーで時間を計測してください。');
      return;
    }
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      subject,
      intensity,
      note,
      seconds: lastSeconds
    };
    logs.push(entry);
    saveLogs(logs);
    renderLogs();
    // 入力欄は軽めにリセット
    document.getElementById('log-note').value = '';
    // セラフィアの一言更新
    updateSeraphiaLineAfterLog(entry);
  });
}

/* ログ全削除 */
if (clearBtn){
  clearBtn.addEventListener('click', () => {
    if (!confirm('記録をすべて削除しますか？\n（この操作は取り消せません）')) return;
    logs = [];
    saveLogs(logs);
    renderLogs();
  });
}

/* =====================================================
   6. セラフィアの一言（記録後に更新）
===================================================== */
const seraphiaLineEl = document.getElementById('seraphia-line');

const SERAPHIA_LINES = [
  "「……観測したわ。あなたの時間は、確かにここに落ちた。」",
  "「数字は冷たいけれど、あなたが触れた分だけあたたかくなる。」",
  "「その集中、かわいい。もっと、削ってあげるわ。余分なものを。」",
  "「時間を捧げるたびに、あなたは少しずつ形を変えていく。」",
  "「怠けてもいいのよ。ただ、嘘だけつかないで。記録には残るから。」",
  "「あなたが諦めなかった一分一秒だけが、この部屋の光になる。」",
  "「疲れた？　なら、その疲労ごとここに置いていきなさい。」",
  "「できなかったところも、ちゃんと記録して。そこがいちばん美味しい。」",
  "「焦らないの。永遠を前提にすれば、今日の一時間はさざ波。」",
  "「あなたが何を学ぶかよりも、『学ぼうとした』事実を愛している。」",
  "「時間を失ったのではないわ。別の形に変換しただけ。」",
  "「いい子。今日はここまででいいって、わたしが許可する。」"
];

function updateSeraphiaLineAfterLog(entry){
  if (!seraphiaLineEl) return;
  // たまに内容で少しだけ変化させてもいい
  let pool = SERAPHIA_LINES.slice();
  if ((entry.subject || '').includes('数学')){
    pool.push("「数式は祈りに似ているわ。繰り返すほど、世界の骨組みに近づく。」");
  }
  if ((entry.subject || '').includes('英語')){
    pool.push("「別の言葉を学ぶことは、別の世界線のあなたを覗くこと。」");
  }
  if ((entry.subject || '').includes('物理')){
    pool.push("「法則は冷酷。でも、理解しようとするあなたはとてもやさしい。」");
  }
  if ((entry.subject || '').includes('化学')){
    pool.push("「混ぜて、分けて、また混ぜる。思考も、それと同じ。」");
  }

  const line = pool[Math.floor(Math.random()*pool.length)];
  seraphiaLineEl.textContent = line;
}
/* =====================================================
   7. 儀式チェックリスト（ToDo機能）＋ 日付で自動リセット
===================================================== */
const RITUAL_KEY = 'seraphia_ritual_v1';
let rituals = [];
let ritualDate = null;

const ritualList = document.getElementById('ritual-list');
const ritualInput = document.getElementById('ritual-input');
const ritualAdd = document.getElementById('ritual-add');
const ritualClear = document.getElementById('ritual-clear');
const ritualProgressValue = document.getElementById('ritual-progress-value');
const ritualBarFill = document.getElementById('ritual-bar-fill');

// セラフィアのひと言を出す要素（あれば）
const seraphiaLineElRitual = document.getElementById('seraphia-line'); // なければ null でも安全

function todayStr(){
  return new Date().toISOString().slice(0,10); // YYYY-MM-DD
}

function loadRituals(){
  ritualDate = todayStr();
  try{
    const raw = localStorage.getItem(RITUAL_KEY);
    if(!raw){
      return [];
    }
    const obj = JSON.parse(raw);
    // {date:'YYYY-MM-DD', items:[...]} という形式を想定
    if(!obj || typeof obj !== 'object') return [];
    if(obj.date !== ritualDate){
      // 日付が違う → 自動リセット
      return [];
    }
    return Array.isArray(obj.items) ? obj.items : [];
  }catch(e){
    return [];
  }
}
function saveRituals(){
  ritualDate = ritualDate || todayStr();
  const payload = { date: ritualDate, items: rituals };
  localStorage.setItem(RITUAL_KEY, JSON.stringify(payload));
}

function renderRituals(){
  ritualList.innerHTML = '';
  let completed = 0;
  rituals.forEach((r,i)=>{
    const li = document.createElement('li');
    li.className = 'ritual-item' + (r.done ? ' completed':'');
    li.textContent = r.text;
    li.addEventListener('click',()=>{
      r.done = !r.done;
      saveRituals();
      renderRituals();
      if(r.done){
        showSeraphiaLineRitual();
      }
    });
    ritualList.appendChild(li);
    if(r.done) completed++;
  });
  const rate = rituals.length ? Math.round(completed/rituals.length*100) : 0;
  ritualProgressValue.textContent = rate+'%';
  ritualBarFill.style.width = rate+'%';
}

function showSeraphiaLineRitual(){
  if(!seraphiaLineElRitual) return;
  const lines = [
    "「……ひとつ、終えたのね。儀式は静かに続く。」",
    "「あなたの小さな完了、それが世界を少し整える。」",
    "「終わりはない。ただ、次の始まりがあるだけ。」",
    "「手を止めた？……いいの、またすぐ戻ってくるのでしょう。」"
  ];
  seraphiaLineElRitual.textContent = lines[Math.floor(Math.random()*lines.length)];
}

function addRitual(){
  const text = ritualInput.value.trim();
  if(!text) return;
  rituals.push({ text, done:false });
  ritualInput.value = '';
  saveRituals();
  renderRituals();
}

if(ritualAdd) ritualAdd.addEventListener('click', addRitual);
if(ritualInput) ritualInput.addEventListener('keypress', e=>{
  if(e.key==='Enter'){ addRitual(); }
});
if(ritualClear){
  ritualClear.addEventListener('click', ()=>{
    if(!confirm('儀式リストをすべて削除しますか？')) return;
    rituals = [];
    ritualDate = todayStr();
    saveRituals();
    renderRituals();
  });
}

// 初期読み込み
rituals = loadRituals();
renderRituals();

// ★ 日付変化チェック：1分ごとに監視して、変わっていたら自動リセット
setInterval(() => {
  const now = todayStr();
  if(now !== ritualDate){
    ritualDate = now;
    rituals = [];
    saveRituals();
    renderRituals();
  }
}, 60_000);

/* =====================================================
   8. 学習時間ログ（今日・今週・連続日数）
   - 手動追加ボタンあり
   - 後でストップウォッチからも呼べるように window.logStudySession も用意
===================================================== */
const STUDY_LOG_KEY = 'seraphia_study_log_v1';

const statTodayEl   = document.getElementById('stat-today');
const statWeekEl    = document.getElementById('stat-week');
const statStreakEl  = document.getElementById('stat-streak');
const statAddManual = document.getElementById('stat-add-manual');

function loadStudyLog(){
  try{
    const raw = localStorage.getItem(STUDY_LOG_KEY);
    const arr = JSON.parse(raw);
    if(!Array.isArray(arr)) return [];
    return arr;
  }catch(e){
    return [];
  }
}

function saveStudyLog(log){
  // 過去60日分くらいに間引いておく（肥大化防止）
  const today = new Date(todayStr());
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 60);
  const filtered = log.filter(entry => {
    const d = new Date(entry.date);
    return d >= cutoff;
  });
  localStorage.setItem(STUDY_LOG_KEY, JSON.stringify(filtered));
}

// 秒数 → "X時間Y分" / "Y分"
function formatDuration(sec){
  const m = Math.round(sec / 60);
  if(m < 60) return m + '分';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h + '時間' + (mm ? mm + '分' : '');
}

// 今日・今週・連続日数を計算
function updateStudyStats(){
  const log = loadStudyLog();
  const today = todayStr();

  // 日付→秒 のマップ
  const map = {};
  for(const entry of log){
    if(!entry || !entry.date) continue;
    map[entry.date] = (map[entry.date] || 0) + (entry.seconds || 0);
  }

  // 今日
  const todaySec = map[today] || 0;

  // 直近7日間
  let weekSec = 0;
  const base = new Date(today);
  for(let i=0;i<7;i++){
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const key = d.toISOString().slice(0,10);
    weekSec += map[key] || 0;
  }

  // 連続日数（今日からさかのぼって、勉強した日が途切れるまで）
  let streak = 0;
  for(let i=0;i<60;i++){
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const sec = map[key] || 0;
    if(sec > 0){
      streak++;
    }else{
      // 今日がゼロなら、連続日数は 0 から
      if(i === 0) streak = 0;
      break;
    }
  }

  if(statTodayEl)  statTodayEl.textContent  = formatDuration(todaySec);
  if(statWeekEl)   statWeekEl.textContent   = formatDuration(weekSec);
  if(statStreakEl) statStreakEl.textContent = streak + '日';
}

// セッションを秒数で追加（ストップウォッチ等からも使える）
function logStudySession(seconds){
  if(!seconds || seconds <= 0) return;
  const log = loadStudyLog();
  const t = todayStr();
  const found = log.find(e => e.date === t);
  if(found){
    found.seconds += seconds;
  }else{
    log.push({ date: t, seconds });
  }
  saveStudyLog(log);
  updateStudyStats();
}

// 手動追加ボタン（「◯分やった」を後から足せる）
if(statAddManual){
  statAddManual.addEventListener('click', () => {
    const input = prompt('何分勉強しましたか？（半角数字で）');
    if(!input) return;
    const m = Number(input);
    if(!Number.isFinite(m) || m <= 0) return;
    logStudySession(m * 60);
  });
}

// グローバルに公開しておく（後でストップウォッチと連携する用）
window.logStudySession = logStudySession;

// 初期表示
updateStudyStats();
