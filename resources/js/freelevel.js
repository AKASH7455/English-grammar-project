/* ===============================
   DASHBOARD - CONNECTED WITH APP
================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "grammarflow_state";

  function initDashboard() {
    syncAllCards();
    setupListeners();
  }

function setupListeners() {

  window.addEventListener("stateUpdated", syncAllCards);

  setInterval(syncAllCards, 2000);

  document.addEventListener("click", handleCardClick);

  /* 🔥 ADD THIS BACK BUTTON LOGIC */
  const backBtn = document.querySelector(".back-btn");

  if (backBtn) {
    backBtn.addEventListener("click", () => {

      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "index.html"; // fallback page
      }

    });
  }
}

  /* ===============================
     CORE SYNC
  ================================ */

  function getAppState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { topics: {} };
    } catch {
      return { topics: {} };
    }
  }

  function getTopicProgress(topicId) {

    const state = getAppState().topics[topicId] || {};

    let percent = 0;
    if (state.notesDone) percent += 33;
    if (state.mcqDone) percent += 33;
    if (state.fillDone) percent += 34;

    return {
      percent,
      score: state.score || {
        mcq: { correct: 0, wrong: 0 },
        fill: { correct: 0, wrong: 0 }
      }
    };
  }

  function syncAllCards() {

    const cards = document.querySelectorAll(".topic-card");
    if (!cards.length) return;

    cards.forEach((card, index) => {

      const topicId = card.dataset.topic;
      if (!topicId) return;

      const data = getTopicProgress(topicId);

      updateCardUI(card, data);
      handleUnlock(card, index);
    });
  }

  /* ===============================
     UI UPDATE
  ================================ */

  function updateCardUI(card, data) {

    const fill = card.querySelector(".topic-progress-fill");
    const text = card.querySelector(".topic-progress-text");
    const scoreBadge = card.querySelector(".topic-score");
    const status = card.querySelector(".topic-status");

    if (fill) fill.style.width = data.percent + "%";
    if (text) text.textContent = data.percent + "%";

    if (scoreBadge) {

      const correct = data.score.mcq.correct + data.score.fill.correct;
      const total =
        data.score.mcq.correct +
        data.score.mcq.wrong +
        data.score.fill.correct +
        data.score.fill.wrong;

      scoreBadge.textContent = `${correct}/${total || 0}`;
    }

    if (status) {

      if (data.percent === 100) {
        status.textContent = "✅ Complete";
        status.className = "topic-status complete";
      } else if (data.percent > 0) {
        status.textContent = `📚 ${data.percent}%`;
        status.className = "topic-status progress";
      } else {
        status.textContent = "🔒 Locked";
        status.className = "topic-status locked";
      }
    }
  }

  /* ===============================
     UNLOCK LOGIC
  ================================ */

function handleUnlock(card, index) {

  if (index === 0) {
    card.classList.remove("locked");
    card.classList.add("unlocked");   // 🔥 add this
    return;
  }

  const prevCard = document.querySelectorAll(".topic-card")[index - 1];
  const prevTopicId = prevCard?.dataset.topic;

  const prevData = prevTopicId
    ? getTopicProgress(prevTopicId)
    : { percent: 0 };

  if (prevData.percent >= 60) {
    card.classList.remove("locked");
    card.classList.add("unlocked");   // 🔥 add this
  } else {
    card.classList.add("locked");
    card.classList.remove("unlocked"); // 🔥 safety
  }
}
  /* ===============================
     CLICK HANDLER
  ================================ */

  function handleCardClick(e) {

    const card = e.target.closest(".topic-card");
    if (!card) return;

    if (card.classList.contains("locked")) {
      showToast("🔒 Previous topic complete karo pehle!");
      return;
    }

    const topicId = card.dataset.topic;
    window.location.href = `practice.html?topic=${topicId}`;
  }

  /* ===============================
     TOAST
  ================================ */

  function showToast(message) {

    const old = document.querySelector(".dashboard-toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.className = "dashboard-toast";
    toast.textContent = message;

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2C7E81;
      color: white;
      padding: 12px 18px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 9999;
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  /* ===============================
     INIT
  ================================ */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }

  console.log("✅ Dashboard connected with Practice App");
})();