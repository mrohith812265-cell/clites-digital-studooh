(function () {
  "use strict";

  var concepts = Array.isArray(window.ENGINEERING_CONCEPTS) ? window.ENGINEERING_CONCEPTS.slice() : [];
  var categories = Array.isArray(window.ENGINEERING_CATEGORIES) ? window.ENGINEERING_CATEGORIES.slice() : [];
  var aliases = window.ENGINEERING_SEARCH_ALIASES || {};
  var grid = document.getElementById("concept-grid");

  if (!grid || !concepts.length) return;

  var searchInput = document.getElementById("concept-search");
  var filterWrap = document.getElementById("concept-filters");
  var countEl = document.getElementById("concept-count");
  var hintEl = document.getElementById("concept-hint");
  var emptyEl = document.getElementById("concept-empty");
  var resetButton = document.getElementById("reset-filters");
  var dialog = document.getElementById("concept-dialog");
  var dialogClose = document.getElementById("concept-dialog-close");
  var dialogBack = document.getElementById("concept-dialog-back");
  var dialogCategory = document.getElementById("concept-dialog-category");
  var dialogTitle = document.getElementById("concept-dialog-title");
  var dialogSummary = document.getElementById("concept-dialog-summary");
  var dialogWhy = document.getElementById("concept-dialog-why");
  var dialogExample = document.getElementById("concept-dialog-example");
  var dialogDifficulty = document.getElementById("concept-dialog-difficulty");
  var categoryById = Object.create(null);
  var conceptById = Object.create(null);
  var searchTextById = Object.create(null);
  var cards = [];
  var filterButtons = [];
  var state = { query: "", category: "all" };
  var lastTrigger = null;
  var skipNextCloseHash = false;

  categories.forEach(function (category) {
    categoryById[category.id] = category;
  });

  concepts.forEach(function (concept) {
    conceptById[concept.id] = concept;
    searchTextById[concept.id] = [concept.name].concat(aliases[concept.id] || []).join(" ").toLowerCase();
  });

  function formatCount(value) {
    return value + (value === 1 ? " concept" : " concepts");
  }

  function categoryLabel(concept) {
    var category = categoryById[concept.category];
    return category ? category.label : concept.category;
  }

  function updateStats() {
    var levels = {};
    concepts.forEach(function (concept) {
      levels[concept.difficulty] = true;
    });

    document.querySelectorAll("[data-eng-total]").forEach(function (el) {
      el.textContent = String(concepts.length);
    });
    document.querySelectorAll("[data-eng-categories]").forEach(function (el) {
      el.textContent = String(categories.length);
    });
    document.querySelectorAll("[data-eng-levels]").forEach(function (el) {
      el.textContent = String(Object.keys(levels).length);
    });
  }

  function makeCard(concept, index) {
    var article = document.createElement("article");
    article.className = "concept-card";
    article.dataset.category = concept.category;
    article.dataset.conceptId = concept.id;

    var top = document.createElement("div");
    top.className = "concept-card__top";

    var category = document.createElement("span");
    category.className = "concept-card__category";
    category.textContent = categoryLabel(concept);

    var number = document.createElement("span");
    number.className = "concept-card__index";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(index + 1).padStart(2, "0");

    top.appendChild(category);
    top.appendChild(number);

    var title = document.createElement("h3");
    title.className = "concept-card__title";

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "concept-card__trigger";
    trigger.dataset.conceptId = concept.id;
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.textContent = concept.name;
    title.appendChild(trigger);

    var summary = document.createElement("p");
    summary.className = "concept-card__summary";
    summary.textContent = concept.summary;

    var footer = document.createElement("div");
    footer.className = "concept-card__footer";

    var difficulty = document.createElement("span");
    difficulty.className = "concept-difficulty concept-difficulty--" + concept.difficulty.toLowerCase();
    difficulty.textContent = concept.difficulty;

    var openLabel = document.createElement("span");
    openLabel.className = "concept-card__open";
    openLabel.setAttribute("aria-hidden", "true");
    openLabel.textContent = "Read concept \u2192";

    footer.appendChild(difficulty);
    footer.appendChild(openLabel);
    article.appendChild(top);
    article.appendChild(title);
    article.appendChild(summary);
    article.appendChild(footer);

    return article;
  }

  function makeFilterButton(id, label) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "eng-filter";
    button.dataset.category = id;
    button.textContent = label;
    button.setAttribute("aria-controls", "concept-grid");
    button.setAttribute("aria-pressed", id === "all" ? "true" : "false");

    button.addEventListener("click", function () {
      state.category = id;
      filterButtons.forEach(function (item) {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      applyFilters();
    });

    filterButtons.push(button);
    return button;
  }

  function applyFilters() {
    var visible = 0;

    concepts.forEach(function (concept, index) {
      var matchesName = !state.query || searchTextById[concept.id].indexOf(state.query) !== -1;
      var matchesCategory = state.category === "all" || concept.category === state.category;
      var matches = matchesName && matchesCategory;
      cards[index].hidden = !matches;
      if (matches) visible += 1;
    });

    countEl.textContent = formatCount(visible);
    emptyEl.hidden = visible !== 0;
    hintEl.hidden = visible === 0;
  }

  function fillDialog(concept) {
    dialogCategory.textContent = "Engineering / " + categoryLabel(concept);
    dialogTitle.textContent = concept.name;
    dialogSummary.textContent = concept.summary;
    dialogWhy.textContent = concept.why;
    dialogExample.textContent = concept.example;
    dialogDifficulty.textContent = concept.difficulty;
    dialog.dataset.conceptId = concept.id;
  }

  function openConcept(id, options) {
    var concept = conceptById[id];
    if (!concept) return;

    var settings = options || {};
    fillDialog(concept);

    if (settings.trigger) {
      lastTrigger = settings.trigger;
    }

    if (!dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
        dialogClose.focus();
      }
      document.body.classList.add("eng-dialog-open");
    }

    if (settings.updateHash !== false) {
      var hash = "#concept-" + id;
      if (window.location.hash !== hash) {
        window.history.pushState({ concept: id }, "", hash);
      }
    }
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  function syncFromHash() {
    var hash = window.location.hash;
    if (hash.indexOf("#concept-") === 0) {
      var id = hash.slice("#concept-".length);
      if (conceptById[id]) {
        openConcept(id, { updateHash: false });
        return;
      }
    }

    if (dialog.open) {
      skipNextCloseHash = true;
      dialog.close();
    }
  }

  function setupNavigation() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    function setMenu(open) {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      setMenu(!menu.classList.contains("open"));
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
    });

    var desktop = window.matchMedia("(min-width: 941px)");
    if (desktop.addEventListener) {
      desktop.addEventListener("change", function (event) {
        if (event.matches) setMenu(false);
      });
    }
  }

  updateStats();

  concepts.forEach(function (concept, index) {
    var card = makeCard(concept, index);
    cards.push(card);
    grid.appendChild(card);
  });

  filterWrap.appendChild(makeFilterButton("all", "All"));
  categories.forEach(function (category) {
    filterWrap.appendChild(makeFilterButton(category.id, category.label));
  });

  applyFilters();

  searchInput.addEventListener("input", function () {
    state.query = searchInput.value.trim().toLowerCase();
    applyFilters();
  });

  resetButton.addEventListener("click", function () {
    state.query = "";
    state.category = "all";
    searchInput.value = "";
    filterButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.category === "all" ? "true" : "false");
    });
    applyFilters();
    searchInput.focus();
  });

  grid.addEventListener("click", function (event) {
    var trigger = event.target.closest(".concept-card__trigger");
    if (!trigger) return;
    openConcept(trigger.dataset.conceptId, { trigger: trigger, updateHash: true });
  });

  dialogClose.addEventListener("click", closeDialog);
  dialogBack.addEventListener("click", function (event) {
    event.preventDefault();
    closeDialog();
    document.getElementById("concepts").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  });

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener("close", function () {
    document.body.classList.remove("eng-dialog-open");

    if (!skipNextCloseHash && window.location.hash.indexOf("#concept-") === 0) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search + "#concepts");
    }
    skipNextCloseHash = false;

    if (lastTrigger && document.contains(lastTrigger)) {
      lastTrigger.focus({ preventScroll: true });
    }
    lastTrigger = null;
  });

  document.addEventListener("keydown", function (event) {
    if (!dialog.open || event.key !== "Tab") return;

    var focusable = Array.prototype.slice.call(
      dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(function (element) {
      return element.offsetParent !== null;
    });

    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first || !dialog.contains(document.activeElement)) {
        event.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last || !dialog.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("popstate", syncFromHash);
  window.addEventListener("hashchange", syncFromHash);

  setupNavigation();
  syncFromHash();
})();
