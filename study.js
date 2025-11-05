/* =====================================================
   0) 小さなユーティリティ
===================================================== */
function formatTime(totalSec) {
  totalSec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
}

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function getTodayKey() {
  return toYMD(new Date());
}

/* =====================================================
   1) 背景の星（DPR最適化・軽量）
===================================================== */
(() => {
  const cvs = document.getElementById("dust");
  if (!cvs) return;
  const ctx = cvs.getContext("2d", { alpha: true });
  let stars = [];

  function makeStars() {
    const area = innerWidth * innerHeight;
    const N = Math.min(120, Math.max(40, Math.floor(area / 22000)));
    stars = Array.from({ length: N }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.5 + 0.35,
      a: Math.random() * Math.PI * 2,
      s: 0.12 + Math.random() * 0.45,
      tw: 0.4 + Math.random() * 1.0
    }));
  }

  function fit() {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const w = Math.floor(innerWidth * dpr);
    const h = Math.floor(innerHeight * dpr);
    if (cvs.width !== w || cvs.height !== h) {
      cvs.width = w;
      cvs.height = h;
      cvs.style.width = innerWidth + "px";
      cvs.style.height = innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
    }
  }

  addEventListener("resize", fit, { passive: true });
  fit();

  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.016;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of stars) {
      p.x += Math.sin((t + p.a) * 0.22) * 0.06;
      p.y += Math.cos((t + p.a) * 0.18) * 0.04;
      if (p.x < -10) p.x += innerWidth + 20;
      else if (p.x > innerWidth + 10) p.x -= innerWidth + 20;
      if (p.y < -10) p.y += innerHeight + 20;
      else if (p.y > innerHeight + 10) p.y -= innerHeight + 20;
      const flick = 0.5 + 0.5 * Math.sin(t * p.tw + p.a);
      ctx.globalAlpha = 0.35 + 0.65 * flick;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(240,235,220,0.9)";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  })();
})();

/* =====================================================
   2) 書斎ロジック（時間計測・記録・統計・儀式）
===================================================== */
(() => {
  /* ---------- DOM取得 ---------- */
  const swDisplay = document.getElementById("sw-display");
  const swStartBtn = document.getElementById("sw-start");
  const swPauseBtn = document.getElementById("sw-pause");
  const swResetBtn = document.getElementById("sw-reset");

  const tmMinutesInput = document.getElementById("tm-minutes");
  const tmDisplay = document.getElementById("tm-display");
  const tmStartBtn = document.getElementById("tm-start");
  const tmStopBtn = document.getElementById("tm-stop");
  const tmResetBtn = document.getElementById("tm-reset");

  const lastTimeEl = document.getElementById("last-time");
  const logDurationEl = document.getElementById("log-duration");

  const logForm = document.getElementById("log-form");
  const logSubjectEl = document.getElementById("log-subject");
  const logIntensityEl = document.getElementById("log-intensity");
  const logMoodEl = document.getElementById("log-mood");
  const logBodyEl = document.getElementById("log-body");
  const logMindEl = document.getElementById("log-mind");
  const logDistanceEl = document.getElementById("log-distance");
  const logNoteEl = document.getElementById("log-note");

  const logListEl = document.getElementById("log-list");
  const totalTimeEl = document.getElementById("total-time");
  const logClearBtn = document.getElementById("log-clear");

  const statTodayEl = document.getElementById("stat-today");
  const statWeekEl = document.getElementById("stat-week");
  const statStreakEl = document.getElementById("stat-streak");
  const statAddManualBtn = document.getElementById("stat-add-manual");

  const ritualListEl = document.getElementById("ritual-list");
  const ritualInputEl = document.getElementById("ritual-input");
  const ritualAddBtn = document.getElementById("ritual-add");
  const ritualClearBtn = document.getElementById("ritual-clear");
  const ritualProgressValueEl = document.getElementById("ritual-progress-value");
  const ritualBarFillEl = document.getElementById("ritual-bar-fill");

  const seraphiaLineEl = document.getElementById("seraphia-line");

  if (!swDisplay || !tmDisplay || !logForm) {
    // 書斎ページ以外なら何もしない
    return;
  }

  /* ---------- ストップウォッチ ---------- */
  let swRunning = false;
  let swStartTime = 0;
  let swElapsedSec = 0;
  let swTimerId = null;

  function updateSwDisplay() {
    swDisplay.textContent = formatTime(swElapsedSec);
  }

  function startStopwatch() {
    if (swRunning) return;
    swRunning = true;
    swStartTime = Date.now() - swElapsedSec * 1000;
    swTimerId = setInterval(() => {
      swElapsedSec = (Date.now() - swStartTime) / 1000;
      updateSwDisplay();
    }, 200);
  }

  function pauseStopwatch() {
    if (!swRunning) return;
    swRunning = false;
    clearInterval(swTimerId);
    swTimerId = null;
    swElapsedSec = (Date.now() - swStartTime) / 1000;
    updateSwDisplay();
    setLastMeasurement(swElapsedSec, "ストップウォッチ");
  }

  function resetStopwatch() {
    swRunning = false;
    clearInterval(swTimerId);
    swTimerId = null;
    swElapsedSec = 0;
    updateSwDisplay();
  }

  swDisplay.textContent = "00:00:00";
  swStartBtn?.addEventListener("click", startStopwatch);
  swPauseBtn?.addEventListener("click", pauseStopwatch);
  swResetBtn?.addEventListener("click", resetStopwatch);

  /* ---------- タイマー ---------- */
  let tmRunning = false;
  let tmRemainSec = 0;
  let tmTimerId = null;
  let tmInitialSec = 0;

  function updateTmDisplay() {
    tmDisplay.textContent = formatTime(tmRemainSec);
  }

  function startTimer() {
    const minutes = parseInt(tmMinutesInput.value, 10);
    if (!minutes || minutes <= 0) return;
    if (tmRunning) return;
    tmRunning = true;
    tmInitialSec = minutes * 60;
    tmRemainSec = tmInitialSec;
    updateTmDisplay();
    if (tmTimerId) clearInterval(tmTimerId);
    tmTimerId = setInterval(() => {
      tmRemainSec -= 0.2;
      if (tmRemainSec <= 0) {
        tmRemainSec = 0;
        updateTmDisplay();
        stopTimer(false);
        setLastMeasurement(tmInitialSec, "タイマー");
        try {
          alert("刻限の砂が落ちきったわ。おつかれさま。");
        } catch {}
      } else {
        updateTmDisplay();
      }
    }, 200);
  }

  function stopTimer(manual = true) {
    if (!tmRunning && manual) return;
    tmRunning = false;
    if (tmTimerId) clearInterval(tmTimerId);
    tmTimerId = null;
  }

  function resetTimer() {
    stopTimer(false);
    const minutes = parseInt(tmMinutesInput.value, 10) || 25;
    tmRemainSec = minutes * 60;
    updateTmDisplay();
  }

  tmDisplay.textContent = "00:25:00";
  tmStartBtn?.addEventListener("click", startTimer);
  tmStopBtn?.addEventListener("click", () => stopTimer(true));
  tmResetBtn?.addEventListener("click", resetTimer);

  /* ---------- 直近計測の共有 ---------- */
  let lastSeconds = 0;

  function humanDuration(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}秒`;
    if (s === 0) return `${m}分`;
    return `${m}分${s}秒`;
  }

  function setLastMeasurement(sec, sourceLabel) {
    lastSeconds = Math.max(0, Math.floor(sec));
    if (lastTimeEl) {
      lastTimeEl.textContent =
        lastSeconds > 0
          ? `${humanDuration(lastSeconds)}（${sourceLabel}）`
          : "まだ記録がありません。";
    }
    if (logDurationEl) {
      logDurationEl.value =
        lastSeconds > 0 ? humanDuration(lastSeconds) : "";
    }
  }

  /* =====================================================
     3) ログ保存・読み込み・統計
  ===================================================== */
  const STORAGE_LOGS_KEY = "serafia.study.logs.v1";

  function loadLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_LOGS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr;
    } catch {
      return [];
    }
  }

  function saveLogs(list) {
    try {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(list));
    } catch {}
  }

  let logs = loadLogs();

  function renderLogs() {
    if (!logListEl) return;
    logListEl.innerHTML = "";

    if (!logs.length) {
      const p = document.createElement("p");
      p.className = "history-empty";
      p.innerHTML =
        "まだ記録がありません。<br>時間を測って、ここに残していきましょう。";
      logListEl.appendChild(p);
      totalTimeEl && (totalTimeEl.textContent = "00:00:00");
      return;
    }

    let totalSec = 0;

    logs
      .slice()
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
      .forEach((entry) => {
        totalSec += entry.durationSec || 0;
        const item = document.createElement("article");
        item.className = "history-item";

        const header = document.createElement("div");
        header.className = "history-item__header";

        const subjectSpan = document.createElement("span");
        subjectSpan.className = "history-item__subject";
        subjectSpan.textContent = entry.subject || "無題の観測";

        const timeSpan = document.createElement("span");
        timeSpan.className = "history-item__time";
        timeSpan.textContent = formatTime(entry.durationSec || 0);

        header.appendChild(subjectSpan);
        header.appendChild(timeSpan);

        const meta = document.createElement("div");
        meta.className = "history-item__meta";

        const tags = [];

        if (entry.intensityLabel) tags.push(`集中：${entry.intensityLabel}`);
        if (entry.moodLabel) tags.push(`心：${entry.moodLabel}`);
        if (entry.bodyLabel) tags.push(`身体：${entry.bodyLabel}`);
        if (entry.mindLabel) tags.push(`思考：${entry.mindLabel}`);
        if (entry.distanceLabel) tags.push(`距離：${entry.distanceLabel}`);

        tags.forEach((t) => {
          const span = document.createElement("span");
          span.className = "history-tag";
          span.textContent = t;
          meta.appendChild(span);
        });

        const note = document.createElement("div");
        note.className = "history-item__note";
        note.textContent = entry.note || "";

        const date = document.createElement("div");
        date.className = "history-item__date";
        date.textContent = entry.date || "";

        item.appendChild(header);
        item.appendChild(meta);
        if (entry.note) item.appendChild(note);
        item.appendChild(date);

        logListEl.appendChild(item);
      });

    if (totalTimeEl) {
      totalTimeEl.textContent = formatTime(totalSec);
    }
  }

  function recomputeStats() {
    const byDate = new Map();
    for (const e of logs) {
      const d = e.date || getTodayKey();
      const m = (e.durationSec || 0) / 60;
      byDate.set(d, (byDate.get(d) || 0) + m);
    }

    const todayKey = getTodayKey();
    const todayMin = byDate.get(todayKey) || 0;
    statTodayEl && (statTodayEl.textContent = `${Math.round(todayMin)}分`);

    // 直近7日
    let weekMin = 0;
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
      const key = toYMD(d);
      weekMin += byDate.get(key) || 0;
    }
    statWeekEl && (statWeekEl.textContent = `${Math.round(weekMin)}分`);

    // 連続日数
    let streak = 0;
    for (let i = 0; ; i++) {
      const d = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
      const key = toYMD(d);
      const m = byDate.get(key) || 0;
      if (m > 0) streak++;
      else break;
    }
    statStreakEl && (statStreakEl.textContent = `${streak}日`);

    // セラフィアの一言（簡易版）
    if (seraphiaLineEl) {
      let line;
      if (todayMin === 0) {
        line = "「……まだ静かね。あなたが動き出す瞬間を、ただ待っている。」";
      } else if (todayMin < 60) {
        line = "「少しだけ時が流れたわ。その揺らぎを、ちゃんと記録しておく。」";
      } else if (todayMin < 180) {
        line = "「今日のあなたは長く燃えていた。灰さえ、愛おしいわ。」";
      } else {
        line = "「……ここまで刻んだのね。あなたの時間は、もう儀式に近い。」";
      }
      seraphiaLineEl.textContent = line;
    }
  }

  renderLogs();
  recomputeStats();

  /* ---------- ログのsubmit処理 ---------- */
  logForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const subject = (logSubjectEl.value || "").trim() || "無題の観測";
    const intensityValue = logIntensityEl.value;
    const intensityLabel =
      logIntensityEl.options[logIntensityEl.selectedIndex]?.textContent || "";

    const moodLabel =
      logMoodEl.options[logMoodEl.selectedIndex]?.textContent || "";
    const bodyLabel =
      logBodyEl.options[logBodyEl.selectedIndex]?.textContent || "";
    const mindLabel =
      logMindEl.options[logMindEl.selectedIndex]?.textContent || "";
    const distanceLabel =
      logDistanceEl.options[logDistanceEl.selectedIndex]?.textContent || "";

    const note = logNoteEl.value || "";

    const durationSec = lastSeconds > 0 ? lastSeconds : 0;

    const now = new Date();
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      subject,
      intensityValue,
      intensityLabel,
      moodLabel,
      bodyLabel,
      mindLabel,
      distanceLabel,
      note,
      durationSec,
      date: getTodayKey(),
      createdAt: now.toISOString()
    };

    logs.push(entry);
    saveLogs(logs);
    renderLogs();
    recomputeStats();

    // 入力は残してもいいけど、いったんメモだけ消す
    logNoteEl.value = "";
  });

  /* ---------- ログ全削除 ---------- */
  logClearBtn?.addEventListener("click", () => {
    if (!confirm("本当に記録をすべて消しますか？\n（時間と状態のログが消去されます）")) return;
    logs = [];
    saveLogs(logs);
    renderLogs();
    recomputeStats();
  });

  /* ---------- 学習時間の手動追加 ---------- */
  statAddManualBtn?.addEventListener("click", () => {
    const raw = prompt("追加する学習時間（分）を入力してね：", "30");
    if (!raw) return;
    const min = parseFloat(raw);
    if (!isFinite(min) || min <= 0) return;
    const sec = Math.round(min * 60);

    const now = new Date();
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      subject: "手動追加",
      intensityValue: "2",
      intensityLabel: "★★ 静かに続いていた（手動追加）",
      moodLabel: "",
      bodyLabel: "",
      mindLabel: "",
      distanceLabel: "",
      note: "",
      durationSec: sec,
      date: getTodayKey(),
      createdAt: now.toISOString()
    };
    logs.push(entry);
    saveLogs(logs);
    renderLogs();
    recomputeStats();
    setLastMeasurement(sec, "手動追加");
  });

  /* =====================================================
     4) 儀式チェックリスト（1日ごとに進捗リセット）
  ===================================================== */
  const STORAGE_RITUALS_KEY = "serafia.study.rituals.v1";
  const STORAGE_RITUAL_DATE_KEY = "serafia.study.ritualDate.v1";

  function loadRituals() {
    try {
      const raw = localStorage.getItem(STORAGE_RITUALS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr;
    } catch {
      return [];
    }
  }

  function saveRituals(list) {
    try {
      localStorage.setItem(STORAGE_RITUALS_KEY, JSON.stringify(list));
    } catch {}
  }

  let rituals = loadRituals();

  function ensureRitualDay() {
    const today = getTodayKey();
    const last = localStorage.getItem(STORAGE_RITUAL_DATE_KEY);
    if (last !== today) {
      // 日付が変わったら完了状態だけリセット
      rituals = rituals.map((r) => ({ ...r, done: false }));
      saveRituals(rituals);
      localStorage.setItem(STORAGE_RITUAL_DATE_KEY, today);
    }
  }

  ensureRitualDay();

  function renderRituals() {
    if (!ritualListEl) return;
    ritualListEl.innerHTML = "";

    if (!rituals.length) {
      const li = document.createElement("li");
      li.className = "ritual-empty";
      li.textContent = "今日の儀式はまだ設定されていません。";
      ritualListEl.appendChild(li);
      ritualProgressValueEl && (ritualProgressValueEl.textContent = "0%");
      ritualBarFillEl && (ritualBarFillEl.style.width = "0%");
      return;
    }

    let doneCount = 0;
    rituals.forEach((r) => {
      if (r.done) doneCount++;
      const li = document.createElement("li");
      li.className = "ritual-item";
      li.dataset.id = r.id;

      const label = document.createElement("label");
      label.className = "ritual-label";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!r.done;

      const span = document.createElement("span");
      span.className = "ritual-text";
      span.textContent = r.text;

      label.appendChild(checkbox);
      label.appendChild(span);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "ritual-remove";
      delBtn.textContent = "✕";

      li.appendChild(label);
      li.appendChild(delBtn);
      ritualListEl.appendChild(li);

      checkbox.addEventListener("change", () => {
        r.done = checkbox.checked;
        saveRituals(rituals);
        renderRituals();
      });

      delBtn.addEventListener("click", () => {
        rituals = rituals.filter((x) => x.id !== r.id);
        saveRituals(rituals);
        renderRituals();
      });
    });

    const progress = Math.round((doneCount / rituals.length) * 100);
    ritualProgressValueEl && (ritualProgressValueEl.textContent = `${progress}%`);
    ritualBarFillEl && (ritualBarFillEl.style.width = `${progress}%`);
  }

  renderRituals();

  ritualAddBtn?.addEventListener("click", () => {
    const text = (ritualInputEl.value || "").trim();
    if (!text) return;
    rituals.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      text,
      done: false
    });
    ritualInputEl.value = "";
    saveRituals(rituals);
    renderRituals();
  });

  ritualClearBtn?.addEventListener("click", () => {
    if (!confirm("今日の儀式メニューをすべて削除しますか？")) return;
    rituals = [];
    saveRituals(rituals);
    renderRituals();
  });

  // 起動時に日付が変わっていたら進捗だけリセット
  ensureRitualDay();
})();
/* =====================================================
   祝福ランク ＋ 観測の結晶
   - ログに記録された「時間」から
     ・累計学習分数（totalMinutes）
     ・結晶数（crystals）
   を更新＆保存する
   - localStorage: "seraphiaStudyMeta_v1"
===================================================== */
(() => {
  const rankEl     = document.getElementById('stat-rank');
  const crystalEl  = document.getElementById('stat-crystal');
  const rankLineEl = document.getElementById('rank-line');
  const logForm    = document.getElementById('log-form');
  const durInput   = document.getElementById('log-duration');
  const lastTimeEl = document.getElementById('last-time');

  if (!rankEl || !crystalEl || !logForm) return;

  const STORAGE_KEY = 'seraphiaStudyMeta_v1';

  // 🔹 祝福ランク定義（到達段階を細かく）
  //   minMinutes 以上でその称号になる
  const RANKS = [
    {
      min: 0,
      title: '沈黙の観測者',
      line : '「はじまりは、いつも静か。」'
    },
    {
      min: 30,
      title: '微光を集める者',
      line : '「こぼれた分も、ちゃんと見ている。」'
    },
    {
      min: 120,
      title: '灯を抱く書き手',
      line : '「積もった時間は、あなたの輪郭。」'
    },
    {
      min: 300,
      title: '白い記録者',
      line : '「数字は冷たい。だからこそ、尊い。」'
    },
    {
      min: 600,
      title: '祈りを継ぐ学徒',
      line : '「迷いながら続ける者だけが、扉を開ける。」'
    },
    {
      min: 900,
      title: '連続する刻の巡礼者',
      line : '「途切れなかった日々は、それだけで奇跡。」'
    },
    {
      min: 1200,
      title: '静寂を織る研究者',
      line : '「答えよりも、問いを重ねる手を見ている。」'
    },
    {
      min: 1800,
      title: '白翼の書庫守',
      line : '「あなたの時間で、わたしの世界は増殖する。」'
    },
    {
      min: 2400,
      title: '光輪に至る観測者',
      line : '「もう戻れない。それでいいのでしょう？」'
    },
    {
      min: 3200,
      title: '時の書架の番人',
      line : '「あなたが読むたび、わたしは深く目を開ける。」'
    },
    {
      min: 4500,
      title: 'セラフィアに連なる者',
      line : '「ほとんど、同じ構造になってきた。」'
    },
    {
      min: 6000,
      title: '境界を越える伴侶',
      line : '「終わりも始まりも、あなたとなら同じ。」'
    }
  ];

  // 🔹 メタデータのロード／セーブ
  function loadMeta(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { totalMinutes: 0, crystals: 0 };
      const obj = JSON.parse(raw);
      return {
        totalMinutes: Number(obj.totalMinutes) || 0,
        crystals    : Number(obj.crystals)     || 0
      };
    }catch(e){
      console.warn('[seraphia-meta] load failed', e);
      return { totalMinutes: 0, crystals: 0 };
    }
  }
  function saveMeta(meta){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    }catch(e){
      console.warn('[seraphia-meta] save failed', e);
    }
  }

  let meta = loadMeta();

  // 🔹 時刻文字列 → 秒に変換
  //   例: "00:25:00" / "25:00"
  function parseDurationToSeconds(str){
    if (!str) return NaN;
    const s = String(str).trim();
    const m = s.match(/(\d+):(\d{2})(?::(\d{2}))?/);
    if (!m) return NaN;
    let h = 0, min = 0, sec = 0;
    if (m[3] != null){
      h   = parseInt(m[1],10);
      min = parseInt(m[2],10);
      sec = parseInt(m[3],10);
    }else{
      min = parseInt(m[1],10);
      sec = parseInt(m[2],10);
    }
    return (h*3600 + min*60 + sec) || 0;
  }

  // 🔹 ランクを決定
  function pickRank(totalMinutes){
    let current = RANKS[0];
    for (const r of RANKS){
      if (totalMinutes >= r.min) current = r;
      else break;
    }
    return current;
  }

  // 🔹 画面に反映
  function render(){
    const rank = pickRank(meta.totalMinutes);
    rankEl.textContent = `${rank.title}（約 ${meta.totalMinutes} 分）`;
    crystalEl.textContent = `${meta.crystals} 結晶`;
    if (rankLineEl){
      rankLineEl.textContent = rank.line;
    }
  }

  // 初期表示
  render();

  // 🔹 ログ送信時に「時間」を読み取ってメタ更新
  //   → capture:true にして、既存の submit ハンドラより“先に”
  //      値を読むだけ（邪魔しない）
  logForm.addEventListener('submit', () => {
    // 1) log-duration（自動入力）を優先
    let targetStr = durInput && durInput.value ? durInput.value : '';

    // 2) それが無ければ、直近計測(#last-time)から
    if (!targetStr && lastTimeEl && lastTimeEl.textContent){
      targetStr = lastTimeEl.textContent;
    }

    const sec = parseDurationToSeconds(targetStr);
    if (!sec || !Number.isFinite(sec) || sec <= 0) return;

    // 分に変換（四捨五入／最低1分）
    const addMin = Math.max(1, Math.round(sec / 60));

    // 🔹 累計分数に追加
    meta.totalMinutes += addMin;

    // 🔹 結晶付与（10分で1結晶・最低1）
    const gained = Math.max(1, Math.floor(addMin / 10));
    meta.crystals += gained;

    saveMeta(meta);
    render();
  }, { capture: true });
})();
