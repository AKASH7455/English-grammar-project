/* ================= STATE ================= */

const STORAGE_KEY = "grammarflow_state";

window.appState = {
  currentTopicId: null,
  topics: {}
};

let currentTopic = null;
let mcqIndex = 0;
let fillIndex = 0;

/* ================= STATE MANAGER ================= */

const StateManager = {
  load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) window.appState = JSON.parse(saved);
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.appState));
  },

  calculatePercent(state) {
    let p = 0;
    if (state.notesDone) p += 33;
    if (state.mcqDone) p += 33;
    if (state.fillDone) p += 34;
    return p;
  }
};

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  StateManager.load();
  waitForData(initApp);
});

function waitForData(callback) {
  if (window.topicsData) callback();
  else setTimeout(() => waitForData(callback), 100);
}

function initApp() {

  const topicId =
    new URLSearchParams(window.location.search).get("topic") || "1";

  window.appState.currentTopicId = topicId;

  if (!window.appState.topics[topicId]) {
    window.appState.topics[topicId] = {
      notesDone: false,
      mcqDone: false,
      fillDone: false,
      score: {
        mcq: { correct: 0, wrong: 0 },
        fill: { correct: 0, wrong: 0 }
      }
    };
  }

  currentTopic = window.topicsData[topicId];

  document.getElementById("topicTitle").textContent =
    currentTopic.title;

  renderNotes();
  updateScoreUI();
  updateProgress();
  updateTabLocks();
  bindEvents();

  lucide.createIcons();
}

/* ================= EVENTS ================= */

function bindEvents() {

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {

      const tab = btn.dataset.tab;
      if (!canOpenTab(tab)) return;

      setActiveTab(tab);

      if (tab === "mcq") {
        mcqIndex = 0;
        renderMCQ();
      }

      if (tab === "fill") {
        fillIndex = 0;
        renderFill();
      }
    });
  });

  document.getElementById("markNotesBtn")
    .addEventListener("click", markNotesDone);

  document.querySelector(".back-btn")
    .addEventListener("click", () => window.history.back());
}

/* ================= NOTES ================= */

function renderNotes() {

  const notesList = document.getElementById("notesList");
  const rulesList = document.getElementById("rulesList");
  const examplesList = document.getElementById("examplesList");

  notesList.innerHTML = "";
  rulesList.innerHTML = "";
  examplesList.innerHTML = "";

  currentTopic.notes.forEach(n => {
    const li = document.createElement("li");
    li.innerHTML = n;
    notesList.appendChild(li);
  });

  currentTopic.rules.forEach(r => {
    const li = document.createElement("li");
    li.innerHTML = r;
    rulesList.appendChild(li);
  });

  currentTopic.examples.forEach(e => {
    const li = document.createElement("li");
    li.innerHTML = e;
    examplesList.appendChild(li);
  });

  const state =
    window.appState.topics[window.appState.currentTopicId];

  if (state.notesDone) {
    document.getElementById("notesProgressFill").style.width = "100%";
    document.getElementById("notesProgressText").textContent = "100%";
  }
}

function markNotesDone() {

  const state =
    window.appState.topics[window.appState.currentTopicId];

  if (state.notesDone) return showToast("Already completed");

  state.notesDone = true;
  StateManager.save();
  updateProgress();
  updateTabLocks();

  document.getElementById("notesProgressFill").style.width = "100%";
  document.getElementById("notesProgressText").textContent = "100%";

  showToast("Notes Completed");
}

/* ================= MCQ ================= */

function renderMCQ() {

  const q = currentTopic.mcq[mcqIndex];

  document.getElementById("mcqQuestionNum").textContent =
    `Q${mcqIndex + 1}/${currentTopic.mcq.length}`;

  document.getElementById("mcqQuestionText").innerHTML =
    q.question;

  const box = document.getElementById("mcqOptions");
  const explanationBox =
    document.getElementById("mcqExplanation");
  const nextBtn =
    document.getElementById("mcqNextBtn");

  box.innerHTML = "";
  explanationBox.style.display = "none";
  nextBtn.style.display = "none";

  q.options.forEach((opt, i) => {

    const btn = document.createElement("button");
    btn.className = "mcq-option";
    btn.textContent = opt;

    btn.addEventListener("click", () => {

      document.querySelectorAll(".mcq-option")
        .forEach(b => b.disabled = true);

      const score =
        window.appState.topics[
          window.appState.currentTopicId
        ].score.mcq;

      if (i === q.answer) {
        btn.classList.add("correct");
        score.correct++;
      } else {
        btn.classList.add("wrong");
        document.querySelectorAll(".mcq-option")[q.answer]
          .classList.add("correct");
        score.wrong++;
      }

      explanationBox.innerHTML = `
        ${i === q.answer ? "✅ Correct!" : "❌ Wrong!"}
        <br><br>
        ${q.explanation}
      `;

      explanationBox.style.display = "block";
      nextBtn.style.display = "inline-flex";

      StateManager.save();
      updateScoreUI();
    });

    box.appendChild(btn);
  });

  nextBtn.onclick = () => {

    if (mcqIndex < currentTopic.mcq.length - 1) {
      mcqIndex++;
      renderMCQ();
    } else {
      completeMCQ();
    }
  };

  lucide.createIcons();
}

function completeMCQ() {

  window.appState.topics[
    window.appState.currentTopicId
  ].mcqDone = true;

  StateManager.save();
  updateProgress();
  updateTabLocks();

  showToast("MCQ Completed");
}

/* ================= FILL ================= */

function renderFill() {

  const q = currentTopic.fill[fillIndex];

  document.getElementById("fillQuestionNum").textContent =
    `Q${fillIndex + 1}/${currentTopic.fill.length}`;

  document.getElementById("fillQuestionText").innerHTML =
    q.question;

  document.getElementById("fillOptionsList").innerHTML =
    q.options.map(o => `<span>${o}</span>`).join(", ");

  const container =
    document.getElementById("fillContainer");
  const explanationBox =
    document.getElementById("fillExplanation");
  const nextBtn =
    document.getElementById("fillNextBtn");

  container.innerHTML = "";
  explanationBox.style.display = "none";
  nextBtn.style.display = "none";

  const input = document.createElement("input");
  input.className = "fill-input";

  const checkBtn = document.createElement("button");
  checkBtn.className = "complete-btn";
  checkBtn.textContent = "Check";

  checkBtn.addEventListener("click", () => {

    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer =
      q.options[q.answer].toLowerCase();

    const score =
      window.appState.topics[
        window.appState.currentTopicId
      ].score.fill;

    if (userAnswer === correctAnswer) {
      input.classList.add("correct");
      score.correct++;
    } else {
      input.classList.add("wrong");
      score.wrong++;
    }

    explanationBox.innerHTML = `
      ${userAnswer === correctAnswer
        ? "✅ Correct!"
        : "❌ Wrong!"}
      <br><br>
      ${q.explanation}
    `;

    explanationBox.style.display = "block";
    nextBtn.style.display = "inline-flex";

    StateManager.save();
    updateScoreUI();
  });

  nextBtn.onclick = () => {

    if (fillIndex < currentTopic.fill.length - 1) {
      fillIndex++;
      renderFill();
    } else {
      completeFill();
    }
  };

  container.appendChild(input);
  container.appendChild(checkBtn);

  lucide.createIcons();
}

function completeFill() {

  window.appState.topics[
    window.appState.currentTopicId
  ].fillDone = true;

  StateManager.save();
  updateProgress();
  updateTabLocks();

  showToast("Course Completed");
}

/* ================= TAB ================= */

function setActiveTab(tab) {

  document.querySelectorAll(".tab-btn")
    .forEach(btn =>
      btn.classList.toggle("active",
        btn.dataset.tab === tab)
    );

  document.querySelectorAll(".tab-content")
    .forEach(content =>
      content.classList.toggle("active",
        content.id === tab + "Tab")
    );
}

function updateTabLocks() {

  const state =
    window.appState.topics[
      window.appState.currentTopicId
    ];

  document.querySelectorAll(".tab-btn")
    .forEach(btn => {

      const tab = btn.dataset.tab;

      const locked =
        (tab === "mcq" && !state.notesDone) ||
        (tab === "fill" && !state.mcqDone);

      btn.classList.toggle("locked", locked);
    });
}

function canOpenTab(tab) {

  const state =
    window.appState.topics[
      window.appState.currentTopicId
    ];

  if (tab === "mcq" && !state.notesDone) {
    showToast("Complete Notes first");
    return false;
  }

  if (tab === "fill" && !state.mcqDone) {
    showToast("Complete MCQ first");
    return false;
  }

  return true;
}

/* ================= UI ================= */

function updateProgress() {

  const state =
    window.appState.topics[
      window.appState.currentTopicId
    ];

  const percent =
    StateManager.calculatePercent(state);

  document.getElementById("progressFill")
    .style.width = percent + "%";

  document.getElementById("progressPercent")
    .textContent = percent + "%";
}

function updateScoreUI() {

  const score =
    window.appState.topics[
      window.appState.currentTopicId
    ].score;

  document.getElementById("mcqCorrect")
    .textContent = score.mcq.correct;

  document.getElementById("mcqWrong")
    .textContent = score.mcq.wrong;

  document.getElementById("fillCorrect")
    .textContent = score.fill.correct;

  document.getElementById("fillWrong")
    .textContent = score.fill.wrong;
}

function showToast(message) {

  const toast =
    document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}