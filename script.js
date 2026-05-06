const STORAGE_KEY = "noor_life_dashboard_v1";
const state = loadState();
let currentPage = state.currentPage || 'home';
let timerInterval = null;

const prayerDefaults = [
  { name: 'الفجر', time: '04:07', done: false },
  { name: 'الظهر', time: '11:54', done: false },
  { name: 'العصر', time: '15:28', done: false },
  { name: 'المغرب', time: '18:30', done: false },
  { name: 'العشاء', time: '19:52', done: false }
];

const athkarMorning = [
  'أصبحنا وأصبح الملك لله.',
  'اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور.',
  'رضيت بالله رباً وبالإسلام ديناً وبمحمد صلى الله عليه وسلم نبياً.'
];
const athkarEvening = [
  'أمسينا وأمسى الملك لله.',
  'اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير.',
  'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم.'
];
const duas = [
  'اللهم أعني على ذكرك وشكرك وحسن عبادتك.',
  'اللهم إني أسألك الهدى والتقى والعفاف والغنى.',
  'رب اشرح لي صدري ويسر لي أمري.'
];

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      currentPage: 'home',
      todayTasks: [
        { id: id(), title: 'مراجعة جدول اليوم', note: 'ترتيب أهم أولويات اليوم', done: false, delayed: false, duration: 20 },
        { id: id(), title: 'متابعة ورد القرآن', note: 'تسميع ومراجعة محفوظ', done: false, delayed: false, duration: 30 },
        { id: id(), title: 'مشي 20 دقيقة', note: 'حركة خفيفة ونشاط', done: false, delayed: false, duration: 20 }
      ],
      prayers: prayerDefaults,
      quran: {
        dailyWird: 'حزب اليوم',
        recitation: 0,
        memorization: 0,
        review: 0,
        notes: ''
      },
      finance: {
        incomes: [
          { id: id(), name: 'مرتب مستشفى 1', amount: 0 },
          { id: id(), name: 'مرتب مستشفى 2', amount: 0 },
          { id: id(), name: 'مرتب آخر', amount: 0 }
        ],
        fixed: [
          { id: id(), name: 'إيجار / قسط', amount: 0 }
        ],
        expenses: []
      },
      goals: {
        weekly: [],
        monthly: [],
        yearly: []
      },
      fitness: {
        exercises: [
          { id: id(), name: 'ضغط', count: 0, target: 30 },
          { id: id(), name: 'جري', count: 0, target: 20 },
          { id: id(), name: 'قفز', count: 0, target: 50 }
        ]
      },
      notes: [],
      tasksPage: {
        items: [
          { id: id(), title: 'مهمة عميقة', duration: 45, done: false },
          { id: id(), title: 'تعلم / دراسة', duration: 30, done: false }
        ],
        timer: { total: 1500, remaining: 1500, running: false, startedAt: null }
      }
    };
  }
  return JSON.parse(raw);
}

function saveState() {
  state.currentPage = currentPage;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function id() {
  return Date.now() + Math.floor(Math.random() * 9999);
}

function enterApp() {
  document.getElementById('splashScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
  renderTopbarDate();
  navigate(currentPage || 'home');
}

function renderTopbarDate() {
  const date = new Date();
  document.getElementById('topbarDate').textContent = date.toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  if (page === 'more') {
    openMore();
    return;
  }
  const root = document.getElementById('mainContent');
  root.innerHTML = renderPage(page);
  saveState();
  bindDynamic();
}

function renderPage(page) {
  switch (page) {
    case 'home': return renderHome();
    case 'prayer': return renderPrayer();
    case 'quran': return renderQuran();
    case 'finance': return renderFinance();
    case 'goals': return renderGoals();
    case 'fitness': return renderFitness();
    case 'notes': return renderNotes();
    case 'athkar': return renderAthkar();
    case 'tasks': return renderTasks();
    default: return renderHome();
  }
}

function renderHome() {
  const completion = getTodayCompletion();
  const prayerDone = state.prayers.filter(p => p.done).length;
  const quranProgress = state.quran.recitation + state.quran.memorization + state.quran.review;
  return `
  <section class="section">
    <div class="hero-card">
      <div class="hero-head">
        <div>
          <span class="badge green">✨ يوم جديد</span>
          <h2>خطة يومك اليوم</h2>
          <p>رتبي يومك بهدوء ووضوح وبستايل احترافي ثلاثي الأبعاد</p>
        </div>
        <div class="progress-bubble">${completion}%</div>
      </div>
      <div class="plan-grid">
        <div class="plan-box sleep">
          <div class="dot-spark"></div>
          <p>اليوم</p>
          <h4>خطة اليوم</h4>
          <div class="small-bars"><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="plan-box water">
          <p>الإنجاز</p>
          <h4>النسبة الحالية</h4>
          <div class="circle-progress"><span>${completion}%</span></div>
        </div>
        <div class="plan-box food">
          <p>القرآن</p>
          <h4>ورد اليوم</h4>
          <div class="kcal-ring"><span>${quranProgress}</span></div>
        </div>
        <div class="plan-box exercise">
          <p>الصلاة</p>
          <h4>${prayerDone}/5</h4>
          <div class="wave-box"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row-head">
        <div>
          <h4>ما أفعله اليوم</h4>
          <p>المهام السريعة، التأجيل، والملاحظات</p>
        </div>
        <button class="small-3d" onclick="openTaskModal()">+ إضافة</button>
      </div>
      <div class="task-list">
        ${state.todayTasks.map(task => `
          <div class="task-card">
            <div class="task-top">
              <div>
                <h4>${escapeHtml(task.title)}</h4>
                <p>${escapeHtml(task.note || 'بدون ملاحظة')} • ${task.duration} دقيقة</p>
              </div>
              <span class="badge ${task.done ? 'green' : task.delayed ? 'orange' : ''}">${task.done ? 'تم' : task.delayed ? 'مؤجل' : 'جارٍ'}</span>
            </div>
            <div class="task-actions">
              <button class="task-mini-btn" onclick="markTaskDone(${task.id})">Done</button>
              <button class="task-mini-btn" onclick="delayTask(${task.id})">تأجيل</button>
              <button class="task-mini-btn" onclick="removeTodayTask(${task.id})">حذف</button>
            </div>
          </div>
        `).join('') || `<div class="empty-state"><p>لا توجد مهام اليوم</p></div>`}
      </div>
    </div>

    <div class="card">
      <div class="row-head">
        <div>
          <h4>الصلوات اليوم</h4>
          <p>تأكيد سريع من الصفحة الرئيسية</p>
        </div>
        <button class="small-3d" onclick="navigate('prayer')">فتح الصفحة</button>
      </div>
      <div class="prayer-list">
        ${state.prayers.map((prayer, idx) => `
          <div class="prayer-card">
            <div class="prayer-top">
              <div>
                <h4>${prayer.name}</h4>
                <p>الموعد: ${prayer.time}</p>
              </div>
              <span class="badge ${prayer.done ? 'green' : ''}">${prayer.done ? 'تمت' : 'بانتظار'}</span>
            </div>
            <div class="prayer-actions">
              <button class="tiny-prayer-btn" onclick="togglePrayer(${idx})">تأكيد</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="row-head">
        <div>
          <h4>ورد القرآن اليومي</h4>
          <p>ممتد من صفحة القرآن الرئيسية</p>
        </div>
        <button class="small-3d" onclick="navigate('quran')">فتح الصفحة</button>
      </div>
      <div class="metric-row">
        <div class="metric-pill"><p>تسميع</p><h4>${state.quran.recitation}</h4></div>
        <div class="metric-pill"><p>حفظ</p><h4>${state.quran.memorization}</h4></div>
        <div class="metric-pill"><p>مراجعة</p><h4>${state.quran.review}</h4></div>
        <div class="metric-pill"><p>ورد اليوم</p><h4>${escapeHtml(state.quran.dailyWird)}</h4></div>
      </div>
    </div>
  </section>`;
}

function renderPrayer() {
  return `
  <section class="section">
    <div class="hero-card purple">
      <div class="hero-head">
        <div>
          <span class="badge">🕌 الصلاة</span>
          <h2>مواقيت الصلاة</h2>
          <p>بناءً على الموقع الجغرافي أو التحديث اليدوي</p>
        </div>
        <button class="icon-btn-3d" onclick="getPrayerTimesByLocation()">📍</button>
      </div>
      <div class="d3-scene">
        <div class="d3-figure">
          <div class="d3-body"></div>
          <div class="d3-head"></div>
          <div class="d3-shadow"></div>
          <div class="d3-star s1">🕊️</div>
          <div class="d3-star s2">✦</div>
          <div class="d3-star s3">✦</div>
        </div>
      </div>
    </div>

    <div class="prayer-list">
      ${state.prayers.map((prayer, idx) => `
        <div class="prayer-card">
          <div class="prayer-top">
            <div>
              <h4>${prayer.name}</h4>
              <p>الوقت: ${prayer.time}</p>
            </div>
            <span class="badge ${prayer.done ? 'green' : ''}">${prayer.done ? 'تمت' : 'لم تؤد بعد'}</span>
          </div>
          <div class="prayer-actions">
            <button class="small-3d" onclick="togglePrayer(${idx})">تأكيد الصلاة</button>
            <button class="small-3d" onclick="editPrayerTime(${idx})">تعديل الوقت</button>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="row-head">
        <div>
          <h4>تذكير الصلاة</h4>
          <p>تنبيه محلي بسيط قبل المواعيد</p>
        </div>
        <button class="small-3d" onclick="setPrayerReminder()">تفعيل</button>
      </div>
    </div>
  </section>`;
}

function renderQuran() {
  return `
  <section class="section">
    <div class="hero-card white">
      <div class="hero-head">
        <div>
          <span class="badge">📖 القرآن</span>
          <h2>وردك اليومي</h2>
          <p>تسميع، حفظ، مراجعة، وتعليم احترافي</p>
        </div>
        <button class="icon-btn-3d" onclick="openQuranEdit()">✏️</button>
      </div>
      <div class="d3-scene">
        <div class="d3-figure">
          <div class="d3-body"></div>
          <div class="d3-head"></div>
          <div class="d3-shadow"></div>
          <div class="d3-star s1">📘</div>
          <div class="d3-star s2">✦</div>
          <div class="d3-star s3">✦</div>
        </div>
      </div>
    </div>

    <div class="metric-row">
      <div class="stats-card"><p>تسميع</p><h4>${state.quran.recitation}</h4><button class="small-3d full" onclick="incQuran('recitation')">+1</button></div>
      <div class="stats-card"><p>حفظ</p><h4>${state.quran.memorization}</h4><button class="small-3d full" onclick="incQuran('memorization')">+1</button></div>
      <div class="stats-card"><p>مراجعة</p><h4>${state.quran.review}</h4><button class="small-3d full" onclick="incQuran('review')">+1</button></div>
      <div class="stats-card"><p>ورد اليوم</p><h4>${escapeHtml(state.quran.dailyWird)}</h4><button class="small-3d full" onclick="openQuranEdit()">تعديل</button></div>
    </div>

    <div class="quran-card">
      <div class="row-head">
        <div>
          <h4>ملاحظات وتعليم</h4>
          <p>اكتبي خطة التسميع أو علامات الحفظ</p>
        </div>
      </div>
      <textarea class="textarea" onchange="saveQuranNotes(this.value)">${escapeHtml(state.quran.notes || '')}</textarea>
    </div>
  </section>`;
}

function renderFinance() {
  const totalIncome = state.finance.incomes.reduce((a, b) => a + Number(b.amount || 0), 0);
  const totalFixed = state.finance.fixed.reduce((a, b) => a + Number(b.amount || 0), 0);
  const totalExpenses = state.finance.expenses.reduce((a, b) => a + Number(b.amount || 0), 0);
  const spendingRate = totalIncome ? Math.min(Math.round(((totalFixed + totalExpenses) / totalIncome) * 100), 100) : 0;
  const rest = totalIncome - totalFixed - totalExpenses;
  return `
  <section class="section">
    <div class="hero-card">
      <div class="hero-head">
        <div>
          <span class="badge green">💰 المالية</span>
          <h2>المعاملات والمصاريف</h2>
          <p>دخل، مصروف، بنود ثابتة، وتقرير مصغر</p>
        </div>
        <div class="progress-bubble">${spendingRate}%</div>
      </div>
      <div class="metric-row">
        <div class="metric-pill"><p>الإجمالي</p><h4>${fmt(totalIncome)}</h4></div>
        <div class="metric-pill"><p>المصروف</p><h4>${fmt(totalFixed + totalExpenses)}</h4></div>
        <div class="metric-pill"><p>المتبقي</p><h4>${fmt(rest)}</h4></div>
        <div class="metric-pill"><p>الإنفاق</p><h4>${spendingRate}%</h4></div>
      </div>
    </div>

    <div class="finance-card">
      <div class="row-head"><div><h4>مصادر الدخل</h4><p>رواتبك الأساسية</p></div></div>
      <div class="expense-list">
        ${state.finance.incomes.map(item => `
          <div class="expense-card">
            <div class="expense-top"><div><h4>${escapeHtml(item.name)}</h4><p>دخل ثابت</p></div><span class="badge green">${fmt(item.amount)}</span></div>
            <input class="input" type="number" value="${item.amount}" onchange="updateFinanceItem('incomes','${item.id}',this.value)"/>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="finance-card">
      <div class="row-head"><div><h4>البنود الثابتة</h4><p>إيجار، قسط، التزامات</p></div><button class="small-3d" onclick="openFixedModal()">+ بند</button></div>
      <div class="expense-list">
        ${state.finance.fixed.map(item => `
          <div class="expense-card">
            <div class="expense-top"><div><h4>${escapeHtml(item.name)}</h4><p>مصروف ثابت</p></div><span class="badge orange">${fmt(item.amount)}</span></div>
            <input class="input" type="number" value="${item.amount}" onchange="updateFinanceItem('fixed','${item.id}',this.value)"/>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="finance-card">
      <div class="row-head"><div><h4>المصاريف اليومية</h4><p>حددي المصروف مع التاريخ</p></div><button class="small-3d" onclick="openExpenseModal()">+ مصروف</button></div>
      <div class="expense-list">
        ${state.finance.expenses.map(exp => `
          <div class="expense-card">
            <div class="expense-top"><div><h4>${escapeHtml(exp.name)}</h4><p>${exp.date}</p></div><span class="badge red">${fmt(exp.amount)}</span></div>
          </div>
        `).join('') || `<div class="empty-state"><p>لا توجد مصاريف مسجلة</p></div>`}
      </div>
    </div>

    <div class="card">
      <div class="row-head"><div><h4>إرشادات التوفير</h4><p>بناءً على نسبة الإنفاق الحالية</p></div><button class="small-3d" onclick="printFinanceReport()">طباعة تقرير</button></div>
      <div class="info-row">
        <div class="info-line"><div><h4>نسبة الإنفاق</h4><p>${spendingRate}% من الدخل</p></div><span class="badge ${spendingRate < 50 ? 'green' : spendingRate < 80 ? 'orange' : 'red'}">${spendingRate < 50 ? 'ممتاز' : spendingRate < 80 ? 'متوسط' : 'مرتفع'}</span></div>
        <div class="info-line"><div><h4>نصيحة</h4><p>${getSavingAdvice(spendingRate)}</p></div></div>
      </div>
    </div>
  </section>`;
}

function renderGoals() {
  return `
  <section class="section">
    <div class="hero-card white">
      <div class="hero-head">
        <div>
          <span class="badge">🎯 الأهداف</span>
          <h2>أسبوعية / شهرية / سنوية</h2>
          <p>تنظيم قريب من أسلوب نوشن مع تقويم بسيط</p>
        </div>
        <button class="small-3d" onclick="openGoalModal()">+ هدف</button>
      </div>
    </div>

    <div class="calendar-card">
      <div class="row-head"><div><h4>التقويم</h4><p>عرض احترافي للأيام</p></div></div>
      <div class="calendar-grid">
        ${['س','ح','ن','ث','ر','خ','ج'].map(d => `<div class="calendar-label">${d}</div>`).join('')}
        ${Array.from({length: 30}, (_, i) => `<div class="calendar-day ${i === new Date().getDate()-1 ? 'active' : ''}">${i+1}</div>`).join('')}
      </div>
    </div>

    ${renderGoalBlock('weekly','الأهداف الأسبوعية')}
    ${renderGoalBlock('monthly','الأهداف الشهرية')}
    ${renderGoalBlock('yearly','الأهداف السنوية')}
  </section>`;
}

function renderGoalBlock(type, title) {
  const items = state.goals[type] || [];
  return `
    <div class="goal-card">
      <div class="row-head"><div><h4>${title}</h4><p>أضيفي خططك بوضوح</p></div><button class="small-3d" onclick="openGoalModal('${type}')">+ إضافة</button></div>
      <div class="goal-list">
        ${items.map(item => `
          <div class="goal-card">
            <div class="goal-top">
              <div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.note || 'بدون تفاصيل')}</p></div>
              <span class="badge ${item.done ? 'green' : ''}">${item.done ? 'تم' : 'مفتوح'}</span>
            </div>
            <div class="task-actions">
              <button class="task-mini-btn" onclick="toggleGoal('${type}','${item.id}')">إنهاء</button>
              <button class="task-mini-btn" onclick="removeGoal('${type}','${item.id}')">حذف</button>
            </div>
          </div>
        `).join('') || `<div class="empty-state"><p>لا توجد عناصر حالياً</p></div>`}
      </div>
    </div>`;
}

function renderFitness() {
  return `
  <section class="section">
    <div class="hero-card">
      <div class="hero-head">
        <div>
          <span class="badge green">💪 التمارين</span>
          <h2>حركة ونشاط</h2>
          <p>متابعة الضغط والجري والقفز بصورة بسيطة واحترافية</p>
        </div>
        <button class="small-3d" onclick="openExerciseModal()">+ تمرين</button>
      </div>
      <div class="d3-scene">
        <div class="d3-figure">
          <div class="d3-body"></div>
          <div class="d3-head"></div>
          <div class="d3-shadow"></div>
          <div class="d3-star s1">🏃</div>
          <div class="d3-star s2">✦</div>
          <div class="d3-star s3">✦</div>
        </div>
      </div>
    </div>

    <div class="exercise-list">
      ${state.fitness.exercises.map(item => {
        const percent = item.target ? Math.min(Math.round((item.count / item.target) * 100), 100) : 0;
        return `
          <div class="exercise-card">
            <div class="exercise-top">
              <div><h4>${escapeHtml(item.name)}</h4><p>${item.count} / ${item.target}</p></div>
              <span class="badge green">${percent}%</span>
            </div>
            <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
            <div class="task-actions">
              <button class="task-mini-btn" onclick="incExercise('${item.id}')">+1</button>
              <button class="task-mini-btn" onclick="decExercise('${item.id}')">-1</button>
            </div>
          </div>`;
      }).join('')}
    </div>
  </section>`;
}

function renderNotes() {
  return `
  <section class="section">
    <div class="hero-card purple">
      <div class="hero-head">
        <div>
          <span class="badge">📝 الملاحظات</span>
          <h2>مدونتي الصغيرة</h2>
          <p>ذكريات، أفكار، وملاحظات يومية بشكل هادئ</p>
        </div>
        <button class="small-3d" onclick="openNoteModal()">+ ملاحظة</button>
      </div>
    </div>

    <div class="note-list">
      ${state.notes.map(note => `
        <div class="note-card">
          <div class="row-head">
            <div>
              <h4>${escapeHtml(note.title)}</h4>
              <p>${note.date}</p>
            </div>
            <button class="task-mini-btn" onclick="deleteNote('${note.id}')">حذف</button>
          </div>
          <p>${escapeHtml(note.body)}</p>
        </div>
      `).join('') || `<div class="empty-state card"><p>لا توجد ملاحظات بعد</p></div>`}
    </div>
  </section>`;
}

function renderAthkar() {
  return `
  <section class="section">
    <div class="hero-card white">
      <div class="hero-head">
        <div>
          <span class="badge">🤲 الأذكار</span>
          <h2>أذكار اليوم</h2>
          <p>الصباح، المساء، وأدعية قصيرة متنوعة</p>
        </div>
      </div>
    </div>

    <div class="goal-card">
      <div class="row-head"><div><h4>أذكار الصباح</h4><p>نصوص قصيرة</p></div></div>
      <div class="athkar-list">
        ${athkarMorning.map(z => `<div class="note-card"><p>${z}</p></div>`).join('')}
      </div>
    </div>

    <div class="goal-card">
      <div class="row-head"><div><h4>أذكار المساء</h4><p>نصوص قصيرة</p></div></div>
      <div class="athkar-list">
        ${athkarEvening.map(z => `<div class="note-card"><p>${z}</p></div>`).join('')}
      </div>
    </div>

    <div class="goal-card">
      <div class="row-head"><div><h4>أدعية</h4><p>أدعية نافعة متنوعة</p></div></div>
      <div class="athkar-list">
        ${duas.map(z => `<div class="note-card"><p>${z}</p></div>`).join('')}
      </div>
    </div>
  </section>`;
}

function renderTasks() {
  const timer = state.tasksPage.timer;
  const percent = timer.total ? Math.min(Math.round(((timer.total - timer.remaining) / timer.total) * 360), 360) : 0;
  return `
  <section class="section">
    <div class="hero-card white">
      <div class="hero-head">
        <div>
          <span class="badge">✅ المهام والوقت</span>
          <h2>إدارة المهام والتركيز</h2>
          <p>قائمة أوسع + تايمر + إنهاء احترافي</p>
        </div>
        <button class="small-3d" onclick="openTasksPageModal()">+ مهمة</button>
      </div>
      <div class="d3-scene">
        <div class="d3-figure">
          <div class="d3-body"></div>
          <div class="d3-head"></div>
          <div class="d3-shadow"></div>
          <div class="d3-star s1">📌</div>
          <div class="d3-star s2">✦</div>
          <div class="d3-star s3">✦</div>
        </div>
      </div>
    </div>

    <div class="timer-card">
      <div class="row-head"><div><h4>مؤقت التركيز</h4><p>للإنجاز أو الدراسة</p></div></div>
      <div class="timer-ring" style="background:conic-gradient(#8f7eff 0deg,#7d6bff ${percent}deg,#ece8ff ${percent}deg 360deg)">
        <div class="timer-inner">
          <h2>${formatSeconds(timer.remaining)}</h2>
          <p>${timer.running ? 'قيد التشغيل' : 'جاهز'}</p>
        </div>
      </div>
      <div class="timer-controls">
        <button class="small-3d" onclick="setTaskTimer(25)">25 دقيقة</button>
        <button class="small-3d" onclick="setTaskTimer(15)">15 دقيقة</button>
        <button class="small-3d" onclick="startTaskTimer()">ابدأ</button>
        <button class="small-3d" onclick="pauseTaskTimer()">إيقاف</button>
        <button class="small-3d" onclick="resetTaskTimer()">إعادة</button>
      </div>
    </div>

    <div class="task-list">
      ${state.tasksPage.items.map(item => `
        <div class="task-card">
          <div class="task-top">
            <div><h4>${escapeHtml(item.title)}</h4><p>${item.duration} دقيقة</p></div>
            <span class="badge ${item.done ? 'green' : ''}">${item.done ? 'تمت' : 'نشطة'}</span>
          </div>
          <div class="task-actions">
            <button class="task-mini-btn" onclick="toggleTaskPageItem('${item.id}')">إنهاء</button>
            <button class="task-mini-btn" onclick="removeTaskPageItem('${item.id}')">حذف</button>
          </div>
        </div>
      `).join('') || `<div class="empty-state card"><p>لا توجد مهام هنا</p></div>`}
    </div>
  </section>`;
}

function bindDynamic() {
  if (currentPage === 'tasks') restoreTaskTimer();
}

function getTodayCompletion() {
  const total = state.todayTasks.length || 1;
  const done = state.todayTasks.filter(t => t.done).length;
  return Math.round((done / total) * 100);
}

function markTaskDone(taskId) {
  const item = state.todayTasks.find(t => t.id === taskId);
  if (!item) return;
  item.done = !item.done;
  item.delayed = false;
  saveState();
  navigate('home');
}

function delayTask(taskId) {
  const item = state.todayTasks.find(t => t.id === taskId);
  if (!item) return;
  item.delayed = !item.delayed;
  if (item.delayed) item.done = false;
  saveState();
  navigate('home');
}

function removeTodayTask(taskId) {
  state.todayTasks = state.todayTasks.filter(t => t.id !== taskId);
  saveState();
  navigate('home');
}

function togglePrayer(index) {
  state.prayers[index].done = !state.prayers[index].done;
  saveState();
  navigate(currentPage === 'prayer' ? 'prayer' : 'home');
}

function editPrayerTime(index) {
  openModal(`
    <h3>تعديل وقت الصلاة</h3>
    <input id="prayerTimeInput" class="input" type="time" value="${state.prayers[index].time}"/>
    <div class="task-actions" style="margin-top:14px">
      <button class="btn-3d btn-primary full" onclick="savePrayerTime(${index})">حفظ</button>
    </div>
  `);
}

function savePrayerTime(index) {
  const val = document.getElementById('prayerTimeInput').value;
  state.prayers[index].time = val || state.prayers[index].time;
  saveState();
  closeModal();
  navigate('prayer');
}

function getPrayerTimesByLocation() {
  if (!navigator.geolocation) {
    alert('المتصفح لا يدعم الموقع الجغرافي');
    return;
  }
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=5`);
      const data = await res.json();
      const t = data.data.timings;
      state.prayers = [
        { name: 'الفجر', time: t.Fajr.slice(0,5), done: false },
        { name: 'الظهر', time: t.Dhuhr.slice(0,5), done: false },
        { name: 'العصر', time: t.Asr.slice(0,5), done: false },
        { name: 'المغرب', time: t.Maghrib.slice(0,5), done: false },
        { name: 'العشاء', time: t.Isha.slice(0,5), done: false }
      ];
      saveState();
      navigate('prayer');
    } catch (e) {
      alert('تعذر جلب المواقيت الآن');
    }
  }, () => alert('تعذر الوصول للموقع'));
}

function setPrayerReminder() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification('تم تفعيل تنبيهات الصلاة محلياً');
      }
    });
  }
}

function incQuran(field) {
  state.quran[field] += 1;
  saveState();
  navigate('quran');
}

function saveQuranNotes(value) {
  state.quran.notes = value;
  saveState();
}

function openQuranEdit() {
  openModal(`
    <h3>تعديل ورد القرآن</h3>
    <input id="wirdInput" class="input" value="${escapeHtml(state.quran.dailyWird)}" placeholder="ورد اليوم"/>
    <div class="task-actions" style="margin-top:14px">
      <button class="btn-3d btn-primary full" onclick="saveQuranWird()">حفظ</button>
    </div>
  `);
}

function saveQuranWird() {
  state.quran.dailyWird = document.getElementById('wirdInput').value || 'ورد اليوم';
  saveState();
  closeModal();
  navigate('quran');
}

function updateFinanceItem(type, itemId, value) {
  const item = state.finance[type].find(i => String(i.id) === String(itemId));
  if (!item) return;
  item.amount = Number(value || 0);
  saveState();
  navigate('finance');
}

function openExpenseModal() {
  openModal(`
    <h3>إضافة مصروف</h3>
    <div class="inline-inputs">
      <input id="expName" class="input" placeholder="اسم المصروف"/>
      <input id="expAmount" class="input" type="number" placeholder="المبلغ"/>
    </div>
    <input id="expDate" class="input" type="date" style="margin-top:10px"/>
    <div class="task-actions" style="margin-top:14px">
      <button class="btn-3d btn-primary full" onclick="saveExpense()">حفظ</button>
    </div>
  `);
}

function saveExpense() {
  state.finance.expenses.unshift({
    id: id(),
    name: document.getElementById('expName').value || 'مصروف',
    amount: Number(document.getElementById('expAmount').value || 0),
    date: document.getElementById('expDat