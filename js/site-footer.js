/* Keep the copyright year current without hard-coding it in each page. */
(function () {
  "use strict";

  var year = String(new Date().getFullYear());

  document.querySelectorAll("[data-current-year]").forEach(function (el) {
    el.textContent = year;
  });
})();
