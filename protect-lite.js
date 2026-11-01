/*
 * protect-lite.js - image protect kore, kintu HTML/layout bodlay na (kono wrapper nai).
 * Use: </body> er age  <script src="protect-lite.js"></script>
 * Kono image bad dite: <img data-no-protect ...>
 */
(function () {
  // ====== Setting ======
  var CONFIG = {
    watermark: "© Your Name",   // watermark text
    showWatermark: false,       // false dile watermark layer off
    tiled: false,               // true dile pura image-e tirchha watermark
    blurOnScreenshot: true,     // PrintScreen / window focus harale blur
    minSize: 80                 // eta-r cheye chhoto image skip (px)
  };

  // ====== CSS (shudhu protect-related, layout touch kore na) ======
  var css =
    "img:not([data-no-protect]){-webkit-user-drag:none;user-drag:none;" +
      "-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}" +
    "img.pl-blur{filter:blur(25px)!important}" +
    "#pl-layer{position:absolute;top:0;left:0;width:0;height:0;z-index:2147483000;pointer-events:none}" +
    ".pl-box{position:absolute;overflow:hidden;pointer-events:none}" +
    ".pl-text{position:absolute;right:10px;bottom:8px;line-height:1;font:bold 15px sans-serif;" +
      "color:rgba(255,255,255,.65);text-shadow:0 0 4px rgba(0,0,0,.7)}" +
    "@media print{img:not([data-no-protect]),#pl-layer{visibility:hidden!important}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  function isProtected(el) {
    return el && el.tagName === "IMG" && !el.hasAttribute("data-no-protect");
  }

  // ====== Right-click / drag shudhu image-er upor off ======
  document.addEventListener("contextmenu", function (e) {
    if (isProtected(e.target)) e.preventDefault();
  });
  document.addEventListener("dragstart", function (e) {
    if (isProtected(e.target)) e.preventDefault();
  });

  // draggable=false shob image-e (layout-e kono effect nai)
  function markAll() {
    document.querySelectorAll("img").forEach(function (i) {
      if (isProtected(i)) i.setAttribute("draggable", "false");
    });
  }

  // ====== Watermark layer (image-er upor floating, layout-e effect nai) ======
  var layer = null, queued = false;

  function tileBg() {
    var t = CONFIG.watermark.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='140'>" +
      "<text x='20' y='80' transform='rotate(-25 110 70)' font-family='sans-serif' font-size='18' " +
      "font-weight='bold' fill='white' fill-opacity='0.35' stroke='black' stroke-opacity='0.15'>" +
      t + "</text></svg>";
    return "url(\"data:image/svg+xml;utf8," + encodeURIComponent(svg) + "\")";
  }

  function drawWatermarks() {
    queued = false;
    if (!CONFIG.showWatermark) return;
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "pl-layer";
      document.body.appendChild(layer);
    }
    layer.textContent = "";
    var sx = window.pageXOffset, sy = window.pageYOffset;
    document.querySelectorAll("img").forEach(function (img) {
      if (!isProtected(img)) return;
      var r = img.getBoundingClientRect();
      if (r.width < CONFIG.minSize || r.height < CONFIG.minSize) return;
      var cs = getComputedStyle(img);
      if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return;

      var box = document.createElement("div");
      box.className = "pl-box";
      box.style.left = (r.left + sx) + "px";
      box.style.top = (r.top + sy) + "px";
      box.style.width = r.width + "px";
      box.style.height = r.height + "px";
      if (CONFIG.tiled) box.style.backgroundImage = tileBg();

      var t = document.createElement("span");
      t.className = "pl-text";
      t.textContent = CONFIG.watermark;
      box.appendChild(t);
      layer.appendChild(box);
    });
  }
  function queueDraw() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(drawWatermarks);
  }

  function start() {
    markAll();
    queueDraw();
    window.addEventListener("load", function () { markAll(); queueDraw(); setTimeout(queueDraw, 800); });
    window.addEventListener("resize", queueDraw);
    document.addEventListener("load", queueDraw, true); // image load hole
    if (window.ResizeObserver) new ResizeObserver(queueDraw).observe(document.body);
    new MutationObserver(function (list) {
      // nijer layer-er change ignore korbo
      for (var i = 0; i < list.length; i++) {
        if (list[i].target !== layer && !(layer && layer.contains(list[i].target))) {
          markAll(); queueDraw(); return;
        }
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "class", "style"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  // ====== Screenshot-er somoy shudhu image blur ======
  if (CONFIG.blurOnScreenshot) {
    var setBlur = function (on) {
      document.querySelectorAll("img").forEach(function (i) {
        if (isProtected(i)) i.classList.toggle("pl-blur", on);
      });
    };
    document.addEventListener("keydown", function (e) {
      if (e.key === "PrintScreen") {
        setBlur(true);
        try { navigator.clipboard.writeText(""); } catch (_) {}
      }
    });
    document.addEventListener("keyup", function (e) {
      if (e.key === "PrintScreen") setTimeout(function () { setBlur(false); }, 1500);
    });
    window.addEventListener("blur", function () { setBlur(true); });
    window.addEventListener("focus", function () { setBlur(false); });
    document.addEventListener("visibilitychange", function () { setBlur(document.hidden); });
  }
})();
