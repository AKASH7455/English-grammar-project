import { verbsData } from "./verbsData.js";

const tableBody = document.getElementById("verbTableBody");
const searchInput = document.getElementById("searchInput");
const filterBtn = document.getElementById("filterBtn");
const filterMenu = document.getElementById("filterMenu");
const filterItems = document.querySelectorAll(".filter-item");

let selectedFilter = "";

/* ================= RENDER TABLE ================= */

function renderTable(data) {
  tableBody.innerHTML = "";

  if (!data.length) {
    tableBody.innerHTML = `
      <tr class="no-data-row">
        <td colspan="5" class="no-data-cell">
          No verbs found
        </td>
      </tr>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  data.forEach((verb, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${verb._index}</td>
      <td>${verb.v1}</td>
      <td>${verb.v2}</td>
      <td>${verb.v3}</td>
      <td>${verb.meaning}</td>
    `;

    fragment.appendChild(row);
  });

  tableBody.appendChild(fragment);
}

/* ================= FILTER + SEARCH LOGIC ================= */

function getFilteredData() {
  const searchValue = searchInput.value.trim().toLowerCase();

  return verbsData
    .map((verb, index) => ({
      ...verb,
      _index: index + 1
    }))
    .filter((verb) => {

      // 🔹 Number Search Support
      const isNumberSearch = !isNaN(searchValue) && searchValue !== "";

      const matchesNumber =
        isNumberSearch && verb._index === Number(searchValue);

      const matchesText =
        verb.v1.toLowerCase().includes(searchValue) ||
        verb.v2.toLowerCase().includes(searchValue) ||
        verb.v3.toLowerCase().includes(searchValue) ||
        verb.meaning.toLowerCase().includes(searchValue);

      let matchesFilter = true;

      if (selectedFilter) {
        if (selectedFilter === "regular" || selectedFilter === "irregular") {
          matchesFilter = verb.type === selectedFilter;
        } else {
          matchesFilter = verb.category === selectedFilter;
        }
      }

      return (matchesNumber || matchesText) && matchesFilter;
    });
}

/* ================= UPDATE TABLE ================= */

function updateTable() {
  const filteredData = getFilteredData();
  renderTable(filteredData);
}

/* ================= SEARCH ================= */

searchInput.addEventListener("input", updateTable);

/* ================= FILTER TOGGLE ================= */

filterBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  filterMenu.classList.toggle("active");
});

/* ================= FILTER SELECT ================= */

filterItems.forEach((item) => {
  item.addEventListener("click", () => {
    selectedFilter = item.dataset.value;

    filterItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    filterBtn.innerHTML = `
      <i data-lucide="filter"></i>
      ${item.textContent}
    `;

    lucide.createIcons();

    filterMenu.classList.remove("active");

    updateTable();
  });
});

/* ================= CLOSE DROPDOWN OUTSIDE ================= */

document.addEventListener("click", (e) => {
  if (!e.target.closest(".filter-container")) {
    filterMenu.classList.remove("active");
  }
});

/* ================= INITIAL LOAD ================= */

updateTable();