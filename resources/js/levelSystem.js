/* ===============================
  LEVEL LOCK SYSTEM – GRAMMARFLOW
================================ */

const defaultProgress = {
  free: true,
  normal: false,
  standard: false,
  pro: false
};

// GET progress
function getProgress() {
  return JSON.parse(localStorage.getItem("grammarflow_progress")) || defaultProgress;
}

// SAVE progress
function setProgress(progress) {
  localStorage.setItem("grammarflow_progress", JSON.stringify(progress));
}

// APPLY LOCK UI
function applyLevelLocks() {
  const progress = getProgress();
  const cards = document.querySelectorAll(".level-card");

  cards.forEach(card => {
    const level = card.dataset.level;

    if (!progress[level]) {
      card.classList.add("locked");
      card.setAttribute("aria-disabled", "true");
    } else {
      card.classList.remove("locked");
      card.removeAttribute("aria-disabled");
    }
  });
}

// COMPLETE LEVEL
function completeLevel(levelName) {
  const progress = getProgress();

  progress[levelName] = true;

  if (levelName === "free") progress.normal = true;
  if (levelName === "normal") progress.standard = true;
  if (levelName === "standard") progress.pro = true;

  setProgress(progress);
  applyLevelLocks();
}

// INIT
document.addEventListener("DOMContentLoaded", applyLevelLocks);