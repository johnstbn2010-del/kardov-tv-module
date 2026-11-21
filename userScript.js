// Kardov TV navigation (TizenBrew mods module)
// Arrow keys move a visible focus between clickable elements, OK clicks.
(function () {
  var SEL = 'a, button, input, select, textarea, iframe, [tabindex]';

  var style = document.createElement('style');
  style.textContent =
    '.kardov-focus { outline: 3px solid #e50914 !important; outline-offset: 2px !important; }';
  document.documentElement.appendChild(style);

  function visible(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 &&
      r.bottom > 0 && r.right > 0 &&
      r.top < window.innerHeight && r.left < window.innerWidth &&
      !el.disabled;
  }

  function candidates() {
    var all = document.querySelectorAll(SEL), out = [];
    for (var i = 0; i < all.length; i++) if (visible(all[i])) out.push(all[i]);
    return out;
  }

  function isTextField(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    var t = (el.type || 'text').toLowerCase();
    return ['text', 'search', 'email', 'password', 'url', 'tel', 'number'].indexOf(t) !== -1;
  }

  var current = null;

  function setFocus(el) {
    if (current) current.classList.remove('kardov-focus');
    current = el;
    if (!el) return;
    el.classList.add('kardov-focus');
    el.focus();
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function focusNearestCenter() {
    var list = candidates();
    var best = null, bd = Infinity;
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      var d = Math.abs(r.top + r.height / 2 - window.innerHeight / 2);
      if (d < bd) { bd = d; best = list[i]; }
    }
    if (best) setFocus(best);
  }

  function move(dx, dy) {
    var list = candidates();
    if (!list.length) {
      // Page without clickable elements: plain scroll.
      window.scrollBy({ top: dy * window.innerHeight * 0.7, left: dx * window.innerWidth * 0.7 });
      return;
    }
    if (!current || list.indexOf(current) === -1) {
      focusNearestCenter();
      return;
    }
    var cr = current.getBoundingClientRect();
    var cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
    var best = null, bs = Infinity;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el === current) continue;
      var r = el.getBoundingClientRect();
      var ex = r.left + r.width / 2, ey = r.top + r.height / 2;
      var ox = ex - cx, oy = ey - cy;
      // Element must be in the requested direction.
      if (dx > 0 && ox <= 4) continue;
      if (dx < 0 && ox >= -4) continue;
      if (dy > 0 && oy <= 4) continue;
      if (dy < 0 && oy >= -4) continue;
      // Score: primary-axis distance + strong penalty for off-axis drift.
      var primary = dx !== 0 ? Math.abs(ox) : Math.abs(oy);
      var cross = dx !== 0 ? Math.abs(oy) : Math.abs(ox);
      var score = primary + cross * 3;
      if (score < bs) { bs = score; best = el; }
    }
    if (best) { setFocus(best); return; }
    // Nothing further in that direction on screen: scroll the page, then
    // refocus on whatever appears (keeps the catalogue reachable).
    window.scrollBy({ top: dy * window.innerHeight * 0.7, left: dx * window.innerWidth * 0.7 });
    setTimeout(focusNearestCenter, 250);
  }

  document.addEventListener('keydown', function (e) {
    var k = e.key || e.keyCode;
    var isArrow = (k === 'ArrowUp' || k === 38 || k === 'ArrowDown' || k === 40 ||
                   k === 'ArrowLeft' || k === 37 || k === 'ArrowRight' || k === 39);
    var isOk = (k === 'Enter' || k === 13);
    if (!isArrow && !isOk) return;

    // Inside a text field: keep native caret (left/right) and submit (Enter);
    // only up/down escape the field.
    if (isTextField(document.activeElement)) {
      if (k === 'ArrowUp' || k === 38) { move(0, -1); e.preventDefault(); }
      else if (k === 'ArrowDown' || k === 40) { move(0, 1); e.preventDefault(); }
      return;
    }

    if (k === 'ArrowUp' || k === 38) { move(0, -1); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 40) { move(0, 1); e.preventDefault(); }
    else if (k === 'ArrowLeft' || k === 37) { move(-1, 0); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 39) { move(1, 0); e.preventDefault(); }
    else if (isOk) {
      if (current) { current.click(); e.preventDefault(); }
    }
  }, true);

  // Follow real mouse/tab focus too, so state stays consistent.
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target !== current && e.target.classList) {
      if (current) current.classList.remove('kardov-focus');
      current = e.target;
      current.classList.add('kardov-focus');
    }
  }, true);
})();
