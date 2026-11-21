/* Draggable project cards.
   - mouse: drag anywhere on a card; touch: drag by the title bar (so the page can still scroll)
   - keyboard: focus a card, then arrow keys move it (Shift = bigger steps, Home = put it back)
   - without JavaScript the cards simply sit in a tilted grid */
(function () {
  var desk = document.querySelector(".desk");
  if (!desk) return;
  var cards = Array.prototype.slice.call(desk.querySelectorAll(".desk-card"));
  if (!cards.length) return;

  var topZ = 10, suppressClickUntil = 0;
  var STEP = 12, BIG_STEP = 48, THRESHOLD = 5;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function place(card, x, y) {
    var maxX = desk.clientWidth - card.offsetWidth;
    var maxY = desk.clientHeight - card.offsetHeight;
    card._x = clamp(x, 0, Math.max(0, maxX));
    card._y = clamp(y, 0, Math.max(0, maxY));
    card.style.setProperty("--x", card._x + "px");
    card.style.setProperty("--y", card._y + "px");
  }

  function layout() {
    var W = desk.clientWidth;
    desk.classList.add("desk--live");
    if (W >= 560) {
      desk.style.height = (parseFloat(desk.dataset.height) || 520) + "px";
      cards.forEach(function (c) {
        c.style.width = c.dataset.w + "%";
        c._home = [W * parseFloat(c.dataset.x) / 100, parseFloat(c.dataset.y)];
        place(c, c._home[0], c._home[1]);
      });
    } else {
      /* narrow screens: one loose column, alternating sides */
      var y = 12;
      cards.forEach(function (c, i) {
        c.style.width = (c.classList.contains("desk-card--sticky") ? 72 : 88) + "%";
        c._home = [W * (i % 2 ? 0.10 : 0.02), y];
        desk.style.height = "9999px";            /* no clamping while measuring */
        place(c, c._home[0], c._home[1]);
        y += c.offsetHeight + 34;
      });
      desk.style.height = (y + 4) + "px";
    }
  }

  function raise(card) { card.style.zIndex = ++topZ; }

  cards.forEach(function (card) {
    var drag = null;

    card.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.pointerType === "touch" && !e.target.closest(".desk-label")) return; /* touch: title bar only */
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: card._x, oy: card._y, moved: false };
      raise(card);
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", end);
      document.addEventListener("pointercancel", end);
    });

    function move(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < THRESHOLD) return;   /* still a click */
        drag.moved = true;
        card.classList.add("is-dragging");
        try { card.setPointerCapture(e.pointerId); } catch (_) {}
        card.focus({ preventScroll: true });
      }
      e.preventDefault();
      place(card, drag.ox + dx, drag.oy + dy);
    }

    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) {
        suppressClickUntil = performance.now() + 120;   /* a drag must not follow a link */
        card.classList.remove("is-dragging");
        try { card.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      drag = null;
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", end);
      document.removeEventListener("pointercancel", end);
    }

    card.addEventListener("keydown", function (e) {
      if (e.target !== card) return;                   /* only when the card itself is focused */
      var s = e.shiftKey ? BIG_STEP : STEP, dx = 0, dy = 0;
      if (e.key === "ArrowLeft") dx = -s;
      else if (e.key === "ArrowRight") dx = s;
      else if (e.key === "ArrowUp") dy = -s;
      else if (e.key === "ArrowDown") dy = s;
      else if (e.key === "Home") { raise(card); place(card, card._home[0], card._home[1]); e.preventDefault(); return; }
      else return;
      e.preventDefault();
      raise(card);
      place(card, card._x + dx, card._y + dy);
    });
  });

  desk.addEventListener("click", function (e) {
    if (performance.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  var timer;
  window.addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(layout, 120); });
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();
