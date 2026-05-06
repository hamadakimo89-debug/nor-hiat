const STORAGE_KEY = "habitflow_app_v1";
const ONBOARDING_KEY = "habitflow_onboarding_seen";

const defaultState = {
  habits: [],
  selectedHabitId: null,
  timer: {
    duration: 25 * 60,
    remaining: 25 * 60,
    running: false,
    startedAt: null
  }
};

let state = loadState();
let timerInterval = null;
let activeFilter = "all";

const prayerNames = [
  { name: "Fajr", icon: "🌅" },
  { name: "Dhuhr", icon: "☀️" },
  { name: "Asr", icon: "🌤️" },
  { name: "Maghrib", icon: "🌇" },
  { name: "Isha", icon: "🌙" }
];

const els = {
  onboardingScreen: document.getElementById("onboardingScreen"),
  appScreen: document.getElementById("appScreen"),
  startAppBtn: document.getElementById("startAppBtn"),
  skipOnboardingBtn: document.getElementById("skipOnboardingBtn"),
  todayLabel: document.getElementById("todayLabel"),

  tabButtons: [...document.querySelectorAll(".tab-btn")],
  views: [...document.querySelectorAll(".view")],

  openStatsBtn: document.getElementById("openStatsBtn"),
  openModalBtn: document.getElementById("openModalBtn"),
  habitModal: document.getElementById("habitModal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  closeModalBtn: document.getElementById("closeModalBtn"),

  habitForm: document.getElementById("habitForm"),
  habitName: document.getElementById("habitName"),
  habitFrequency: document.getElementById("habitFrequency"),
  habitCategory: document.getElementById("habitCategory"),
  habitGoal: document.getElementById("habitGoal"),
  habitIcon: document.getElementById("habitIcon"),
  habitDate: document.getElementById("habitDate"),
  habitColor: document.getElementById("habitColor"),
  addPrayerPackBtn: document.getElementById("addPrayerPackBtn"),

  habitList: document.getElementById("habitList"),
  habitCardTemplate: document.getElementById("habitCardTemplate"),

  todayProgressBar: document.getElementById("todayProgressBar"),
  todayProgressText: document.getElementById("todayProgressText"),
  completionBadge: document.getElementById("completionBadge"),
  bestStreakText: document.getElementById("bestStreakText"),

  detailEmptyState: document.getElementById("detailEmptyState"),
  habitDetailCard: document.getElementById("habitDetailCard"),

  completionRateText: document.getElementById("completionRateText"),
  totalCompletedText: document.getElementById("totalCompletedText"),
  habitCountText: document.getElementById("habitCountText"),
  prayerRateText: document.getElementById("prayerRateText"),
  weeklyBars: document.getElementById("weeklyBars"),
  categoryStats: document.getElementById("categoryStats"),

  timerLabel: document.getElementById("timerLabel"),
  timerState: document.getElementById("timerState"),
  timerProgressRing: document.getElementById("timerProgressRing"),
  startTimerBtn: document.getElementById("startTimerBtn"),
  pauseTimerBtn: document.getElementById("pauseTimerBtn"),
  resetTimerBtn: document.getElementById("resetTimerBtn"),
  presetButtons: [...document.querySelectorAll(".preset-btn")],

  categoryFilters: [...document.querySelectorAll(".filter-btn")]
};

init();

function init() {
  setTodayLabel();
  setDefaultDate();
  setupOnboarding();
  bindEvents();
  restoreTimer();
  seedIfEmpty();
  renderAll();
}

function bindEvents() {
  els.startAppBtn.addEventListener("click", enterApp);
  els.skipOnboardingBtn.addEventListener("click", enterApp);

  els.openModalBtn.addEventListener("click", openModal);
  els.closeModalBtn.addEventListener("click", closeModal);
  els.modalBackdrop.addEventListener("click", closeModal);

  els.habitForm.addEventListener("submit", handleAddHabit);
  els.addPrayerPackBtn.addEventListener("click", addPrayerPack);

  els.tabButtons.forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  els.openStatsBtn.addEventListener("click", () => {
    switchView("statsView");
    setActiveTab("statsView");
  });

  els.categoryFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      els.categoryFilters.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderHabits();
    });
  });

  els.startTimerBtn.addEventListener("click", startTimer);
  els.pauseTimerBtn.addEventListener("click", pauseTimer);
  els.resetTimerBtn.addEventListener("click", resetTimer);

  els.presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      els.presetButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const minutes = Number(btn.dataset.minutes);
      state.timer.duration = minutes * 60;
      state.timer.remaining = minutes * 60;
      state.timer.running = false;
      state.timer.startedAt = null;
      saveState();
      updateTimerUI();
    });
  });

  document.addEventListener("visibilitychange", restoreTimer);
}

function setupOnboarding() {
  const seen = localStorage.getItem(ONBOARDING_KEY) === "true";
  if (seen) {
    els.onboardingScreen.classList.remove("active");
    els.appScreen.classList.add("active");
  }
}

function enterApp() {
  localStorage.setItem(ONBOARDING_KEY, "true");
  els.onboardingScreen.classList.remove("active");
  els.appScreen.classList.add("active");
}

function setTodayLabel() {
  const now = new Date();
  els.todayLabel.textContent = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function setDefaultDate() {
  const today = formatDate(new Date());
  els.habitDate.value = today;
}

function seedIfEmpty() {
  if (state.habits.length) return;

  const today = formatDate(new Date());
  state.habits = [
    createHabitObject({
      name: "Morning Reflection",
      frequency: "daily",
      category: "daily",
      goal: 1,
      icon: "✨",
      color: "#6C63FF",
      startDate: today
    }),
    createHabitObject({
      name: "Workout",
      frequency: "weekly",
      category: "fitness",
      goal: 3,
      icon: "💪",
      color: "#8B80FF",
      startDate: today
    }),
    createHabitObject({
      name: "Read 20 Pages",
      frequency: "daily",
      category: "skill",
      goal: 1,
      icon: "📚",
      color: "#6C63FF",
      startDate: today
    }),
    createHabitObject({
      name: "Fajr",
      frequency: "daily",
      category: "prayer",
      goal: 1,
      icon: "🌅",
      color: "#6C63FF",
      startDate: today
    })
  ];
  state.selectedHabitId = state.habits[0].id;
  saveState();
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return raw
      ? {
          ...defaultState,
          ...raw,
          timer: { ...defaultState.timer, ...(raw.timer || {}) }
        }
      : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createHabitObject({
  name,
  frequency,
  category,
  goal,
  icon,
  color,
  startDate
}) {
  return {
    id: Date.now() + Math.floor(Math.random() * 10000),
    name,
    frequency,
    category,
    goal: Number(goal),
    icon,
    color,
    startDate,
    logs: {},
    streak: 0,
    bestStreak: 0,
    createdAt: new Date().toISOString()
  };
}

function handleAddHabit(e) {
  e.preventDefault();

  const habit = createHabitObject({
    name: els.habitName.value.trim(),
    frequency: els.habitFrequency.value,
    category: els.habitCategory.value,
    goal: Number(els.habitGoal.value),
    icon: els.habitIcon.value,
    color: els.habitColor.value,
    startDate: els.habitDate.value
  });

  state.habits.unshift(habit);
  state.selectedHabitId = habit.id;
  saveState();
  e.target.reset();
  setDefaultDate();
  els.habitGoal.value = 1;
  els.habitColor.value = "#6C63FF";
  closeModal();
  renderAll();
  switchView("detailView");
  setActiveTab("detailView");
}

function addPrayerPack() {
  const today = formatDate(new Date());

  prayerNames.forEach((prayer, index) => {
    state.habits.unshift(
      createHabitObject({
        name: prayer.name,
        frequency: "daily",
        category: "prayer",
        goal: 1,
        icon: prayer.icon,
        color: index % 2 === 0 ? "#6C63FF" : "#857BFF",
        startDate: today
      })
    );
  });

  state.selectedHabitId = state.habits[0]?.id || null;
  saveState();
  closeModal();
  renderAll();
}

function openModal() {
  els.habitModal.classList.remove("hidden");
  els.habitModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  els.habitModal.classList.add("hidden");
  els.habitModal.setAttribute("aria-hidden", "true");
}

function switchView(viewId) {
  els.views.forEach(view => view.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");
  setActiveTab(viewId);
}

function setActiveTab(viewId) {
  els.tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });
}

function renderAll() {
  normalizeHabits();
  renderHabits();
  renderSummary();
  renderDetail();
  renderStats();
  updateTimerUI();
}

function normalizeHabits() {
  state.habits.forEach(habit => {
    if (!habit.logs) habit.logs = {};
    if (typeof habit.streak !== "number") habit.streak = 0;
    if (typeof habit.bestStreak !== "number") habit.bestStreak = 0;
  });
  saveState();
}

function renderHabits() {
  els.habitList.innerHTML = "";

  const filtered = state.habits.filter(habit => {
    if (activeFilter === "all") return true;
    return habit.frequency === activeFilter || habit.category === activeFilter;
  });

  if (!filtered.length) {
    els.habitList.innerHTML = `
      <div class="empty-state card">
        <div class="empty-illus">
          <div class="empty-cube"></div>
          <div class="empty-shadow"></div>
        </div>
        <h3>No habits found</h3>
        <p>Create a new habit or switch filters to see your tracked routines.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(habit => {
    const node = els.habitCardTemplate.content.firstElementChild.cloneNode(true);
    const todayCount = getCountForDate(habit, formatDate(new Date()));
    const percent = getHabitProgressPercent(habit, todayCount);

    const iconWrap = node.querySelector(".habit-icon-wrap");
    const title = node.querySelector(".habit-title");
    const tag = node.querySelector(".habit-tag");
    const meta = node.querySelector(".habit-meta");
    const progressFill = node.querySelector(".progress-fill");
    const miniRingProgress = node.querySelector(".ring-progress");
    const miniRingText = node.querySelector(".mini-ring-text");
    const streakText = node.querySelector(".streak-badge span");

    iconWrap.textContent = habit.icon;
    iconWrap.style.background = hexToSoft(habit.color);

    title.textContent = habit.name;
    tag.textContent = `${capitalize(habit.category)}`;
    meta.textContent = `${capitalize(habit.frequency)} • ${todayCount}/${habit.goal} completed today`;

    progressFill.style.width = `${percent}%`;
    progressFill.style.background = `linear-gradient(90deg, ${habit.color}, ${lightenColor(habit.color, 18)})`;

    setRingProgress(miniRingProgress, 44, percent);
    miniRingProgress.style.stroke = habit.color;
    miniRingText.textContent = `${Math.round(percent)}%`;
    streakText.textContent = `${habit.streak} day streak`;

    node.querySelector(".habit-main").addEventListener("click", () => {
      state.selectedHabitId = habit.id;
      saveState();
      renderDetail();
      switchView("detailView");
      setActiveTab("detailView");
    });

    node.querySelector(".complete-btn").addEventListener("click", () => incrementHabit(habit.id));
    node.querySelector(".decrement-btn").addEventListener("click", () => decrementHabit(habit.id));
    node.querySelector(".reset-btn").addEventListener("click", () => resetHabitToday(habit.id));

    els.habitList.appendChild(node);
  });
}

function incrementHabit(id) {
  const habit = findHabit(id);
  if (!habit) return;

  const today = formatDate(new Date());
  const current = getCountForDate(habit, today);

  if (current < habit.goal) {
    habit.logs[today] = current + 1;
    updateStreakForHabit(habit);
    saveState();
    renderAll();
  }
}

function decrementHabit(id) {
  const habit = findHabit(id);
  if (!habit) return;

  const today = formatDate(new Date());
  const current = getCountForDate(habit, today);

  if (current > 0) {
    habit.logs[today] = current - 1;
    if (habit.logs[today] === 0) delete habit.logs[today];
    recalculateStreaks(habit);
    saveState();
    renderAll();
  }
}

function resetHabitToday(id) {
  const habit = findHabit(id);
  if (!habit) return;

  const today = formatDate(new Date());
  delete habit.logs[today];
  recalculateStreaks(habit);
  saveState();
  renderAll();
}

function updateStreakForHabit(habit) {
  recalculateStreaks(habit);
}

function recalculateStreaks(habit) {
  const completedDates = Object.keys(habit.logs)
    .filter(date => habit.logs[date] >= habit.goal)
    .sort((a, b) => new Date(a) - new Date(b));

  let currentStreak = 0;
  let best = 0;

  for (let i = 0; i < completedDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(completedDates[i - 1]);
      const curr = new Date(completedDates[i]);
      const diff = dateDiffInDays(prev, curr);

      if (isExpectedNextPeriod(habit.frequency, prev, curr, diff)) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    }
    best = Math.max(best, currentStreak);
  }

  habit.bestStreak = best;

  const latestRelevantDates = [...completedDates].reverse();
  let liveStreak = 0;
  let previousDate = null;

  for (const dateStr of latestRelevantDates) {
    const date = new Date(dateStr);

    if (liveStreak === 0) {
      if (isCurrentPeriodOrPrevious(habit.frequency, date)) {
        liveStreak = 1;
        previousDate = date;
      } else {
        break;
      }
    } else {
      const diff = dateDiffInDays(date, previousDate);
      if (isExpectedNextPeriod(habit.frequency, date, previousDate, diff)) {
        liveStreak += 1;
        previousDate = date;
      } else {
        break;
      }
    }
  }

  habit.streak = liveStreak;
}

function isExpectedNextPeriod(frequency, prevDate, currDate, diffDays) {
  if (frequency === "daily") return diffDays === 1;
  if (frequency === "weekly") return diffDays >= 7 && diffDays <= 8;
  if (frequency === "monthly") {
    return (
      currDate.getMonth() !== prevDate.getMonth() &&
      currDate.getFullYear() >= prevDate.getFullYear()
    );
  }
  return false;
}

function isCurrentPeriodOrPrevious(frequency, date) {
  const now = new Date();

  if (frequency === "daily") {
    const diff = dateDiffInDays(date, now);
    return diff === 0 || diff === 1;
  }

  if (frequency === "weekly") {
    const diff = dateDiffInDays(date, now);
    return diff <= 8;
  }

  if (frequency === "monthly") {
    return (
      (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) ||
      (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() - 1) ||
      (now.getMonth() === 0 && date.getMonth() === 11 && date.getFullYear() === now.getFullYear() - 1)
    );
  }

  return false;
}

function renderSummary() {
  const habits = state.habits;
  const today = formatDate(new Date());
  const totalGoal = habits.reduce((sum, habit) => sum + habit.goal, 0);
  const totalDone = habits.reduce((sum, habit) => sum + Math.min(getCountForDate(habit, today), habit.goal), 0);
  const percent = totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;

  els.todayProgressText.textContent = `${totalDone}/${totalGoal}`;
  els.todayProgressBar.style.width = `${percent}%`;
  els.completionBadge.textContent = `${percent}%`;

  const bestStreak = habits.reduce((max, habit) => Math.max(max, habit.bestStreak || 0), 0);
  els.bestStreakText.textContent = `${bestStreak} day${bestStreak === 1 ? "" : "s"}`;
}

function renderDetail() {
  const habit = findHabit(state.selectedHabitId);

  if (!habit) {
    els.detailEmptyState.classList.remove("hidden");
    els.habitDetailCard.classList.add("hidden");
    return;
  }

  els.detailEmptyState.classList.add("hidden");
  els.habitDetailCard.classList.remove("hidden");

  const today = formatDate(new Date());
  const todayCount = getCountForDate(habit, today);
  const percent = getHabitProgressPercent(habit, todayCount);
  const last7 = getLast7DaysCounts(habit);

  els.habitDetailCard.innerHTML = `
    <div class="detail-top">
      <div class="detail-icon" style="background:${hexToSoft(habit.color)}">${habit.icon}</div>
      <div>
        <h3>${escapeHTML(habit.name)}</h3>
        <p class="detail-meta">${capitalize(habit.category)} • ${capitalize(habit.frequency)} habit</p>
      </div>
    </div>

    <div class="detail-section">
      <div class="progress-inline">
        <strong>Today's progress</strong>
        <span class="muted">${todayCount}/${habit.goal}</span>
      </div>
      <div class="detail-progress">
        <div class="progress-track">
          <div class="progress-fill" style="width:${percent}%; background:linear-gradient(90deg, ${habit.color}, ${lightenColor(habit.color, 18)});"></div>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-box">
        <span>Current streak</span>
        <strong>${habit.streak} days</strong>
      </div>
      <div class="detail-box">
        <span>Best streak</span>
        <strong>${habit.bestStreak} days</strong>
      </div>
      <div class="detail-box">
        <span>Goal</span>
        <strong>${habit.goal} per ${habit.frequency === "daily" ? "day" : habit.frequency === "weekly" ? "week" : "month"}</strong>
      </div>
      <div class="detail-box">
        <span>Start date</span>
        <strong>${formatFriendlyDate(habit.startDate)}</strong>
      </div>
    </div>

    <div class="detail-section">
      <div class="chart-head">
        <h4>Last 7 days</h4>
        <span class="muted">Quick history</span>
      </div>
      <div class="week-grid">
        ${last7.map(item => `
          <div class="week-item">
            <span>${item.label}</span>
            <div class="bar-column">
              <div class="bar-fill-vertical" style="height:${item.height}%; background:linear-gradient(180deg, ${lightenColor(habit.color, 20)}, ${habit.color});"></div>
            </div>
            <strong>${item.count}</strong>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderStats() {
  const today = formatDate(new Date());
  const totalHabits = state.habits.length;
  const totalCompletedToday = state.habits.reduce((sum, habit) => {
    return sum + Math.min(getCountForDate(habit, today), habit.goal);
  }, 0);

  const totalGoals = state.habits.reduce((sum, habit) => sum + habit.goal, 0);
  const completionRate = totalGoals ? Math.round((totalCompletedToday / totalGoals) * 100) : 0;

  const prayerHabits = state.habits.filter(habit => habit.category === "prayer");
  const prayerGoal = prayerHabits.reduce((sum, habit) => sum + habit.goal, 0);
  const prayerDone = prayerHabits.reduce((sum, habit) => sum + Math.min(getCountForDate(habit, today), habit.goal), 0);
  const prayerRate = prayerGoal ? Math.round((prayerDone / prayerGoal) * 100) : 0;

  els.completionRateText.textContent = `${completionRate}%`;
  els.totalCompletedText.textContent = String(totalCompletedToday);
  els.habitCountText.textContent = String(totalHabits);
  els.prayerRateText.textContent = `${prayerRate}%`;

  renderWeeklyActivity();
  renderCategoryStats();
}

function renderWeeklyActivity() {
  els.weeklyBars.innerHTML = "";
  const last7 = getLast7DaysGlobal();

  last7.forEach(item => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <strong>${item.label}</strong>
      <div class="progress-track">
        <div class="progress-fill" style="width:${item.percent}%;"></div>
      </div>
      <span class="muted">${item.done}</span>
    `;
    els.weeklyBars.appendChild(row);
  });
}

function renderCategoryStats() {
  els.categoryStats.innerHTML = "";
  const today = formatDate(new Date());

  const categories = ["daily", "weekly", "monthly", "prayer", "fitness", "skill"];
  categories.forEach(category => {
    const habits = state.habits.filter(habit => habit.category === category || habit.frequency === category);
    if (!habits.length) return;

    const goal = habits.reduce((sum, habit) => sum + habit.goal, 0);
    const done = habits.reduce((sum, habit) => sum + Math.min(getCountForDate(habit, today), habit.goal), 0);
    const percent = goal ? Math.round((done / goal) * 100) : 0;

    const row = document.createElement("div");
    row.className = "category-row";
    row.innerHTML = `
      <strong>${capitalize(category)}</strong>
      <div class="progress-track">
        <div class="progress-fill" style="width:${percent}%;"></div>
      </div>
      <span class="muted">${percent}%</span>
    `;
    els.categoryStats.appendChild(row);
  });
}

function startTimer() {
  if (state.timer.running) return;

  state.timer.running = true;
  state.timer.startedAt = Date.now();
  saveState();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.timer.startedAt) / 1000);
    const nextRemaining = Math.max(state.timer.duration - elapsed, 0);
    state.timer.remaining = nextRemaining;

    if (nextRemaining <= 0) {
      clearInterval(timerInterval);
      state.timer.running = false;
      state.timer.startedAt = null;
      state.timer.remaining = 0;
      notifyTimerDone();
    }

    saveState();
    updateTimerUI();
  }, 250);

  updateTimerUI();
}

function pauseTimer() {
  if (!state.timer.running) return;

  const elapsed = Math.floor((Date.now() - state.timer.startedAt) / 1000);
  state.timer.remaining = Math.max(state.timer.duration - elapsed, 0);
  state.timer.duration = state.timer.remaining;
  state.timer.running = false;
  state.timer.startedAt = null;

  clearInterval(timerInterval);
  saveState();
  updateTimerUI();
}

function resetTimer() {
  clearInterval(timerInterval);
  const activePreset = document.querySelector(".preset-btn.active");
  const minutes = activePreset ? Number(activePreset.dataset.minutes) : 25;

  state.timer.duration = minutes * 60;
  state.timer.remaining = minutes * 60;
  state.timer.running = false;
  state.timer.startedAt = null;

  saveState();
  updateTimerUI();
}

function restoreTimer() {
  if (!state.timer.running || !state.timer.startedAt) {
    updateTimerUI();
    return;
  }

  const elapsed = Math.floor((Date.now() - state.timer.startedAt) / 1000);
  state.timer.remaining = Math.max(state.timer.duration - elapsed, 0);

  if (state.timer.remaining <= 0) {
    state.timer.running = false;
    state.timer.startedAt = null;
    state.timer.remaining = 0;
    saveState();
    updateTimerUI();
    return;
  }

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsedNow = Math.floor((Date.now() - state.timer.startedAt) / 1000);
    state.timer.remaining = Math.max(state.timer.duration - elapsedNow, 0);

    if (state.timer.remaining <= 0) {
      clearInterval(timerInterval);
      state.timer.running = false;
      state.timer.startedAt = null;
      state.timer.remaining = 0;
      notifyTimerDone();
    }

    saveState();
    updateTimerUI();
  }, 250);

  updateTimerUI();
}

function updateTimerUI() {
  const total = Math.max(state.timer.duration, 1);
  const remaining = Math.max(state.timer.remaining, 0);
  const percent = ((total - remaining) / total) * 100;

  els.timerLabel.textContent = formatSeconds(remaining);
  els.timerState.textContent = state.timer.running ? "In progress" : remaining === 0 ? "Completed" : "Ready";

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  els.timerProgressRing.style.strokeDasharray = `${circumference}`;
  els.timerProgressRing.style.strokeDashoffset = `${offset}`;
}

function notifyTimerDone() {
  updateTimerUI();
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("HabitFlow Timer", {
      body: "Your session is complete."
    });
  }
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function getLast7DaysCounts(habit) {
  const days = [];
  const maxGoal = Math.max(habit.goal, 1);

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = formatDate(date);
    const count = getCountForDate(habit, key);
    const percent = Math.min((count / maxGoal) * 100, 100);

    days.push({
      label: date.toLocaleDateString([], { weekday: "short" }).slice(0, 2),
      count,
      height: Math.max(percent, 12)
    });
  }

  return days;
}

function getLast7DaysGlobal() {
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = formatDate(date);

    let goal = 0;
    let done = 0;

    state.habits.forEach(habit => {
      goal += habit.goal;
      done += Math.min(getCountForDate(habit, key), habit.goal);
    });

    result.push({
      label: date.toLocaleDateString([], { weekday: "short" }).slice(0, 3),
      done,
      percent: goal ? Math.round((done / goal) * 100) : 0
    });
  }

  return result;
}

function getCountForDate(habit, date) {
  return Number(habit.logs?.[date] || 0);
}

function getHabitProgressPercent(habit, count) {
  return Math.min((count / habit.goal) * 100, 100);
}

function findHabit(id) {
  return state.habits.find(habit => habit.id === id);
}

function dateDiffInDays(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000);
}

function formatDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

function formatFriendlyDate(dateString) {
  return new Date(dateString).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function setRingProgress(circle, radius, percent) {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = `${offset}`;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, char => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return map[char];
  });
}

function hexToSoft(hex) {
  const color = hex.replace("#", "");
  const bigint = parseInt(color, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

function lightenColor(hex, amount = 12) {
  const color = hex.replace("#", "");
  const num = parseInt(color, 16);

  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;

  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);

  return `rgb(${r}, ${g}, ${b})`;
}

requestNotificationPermission();
