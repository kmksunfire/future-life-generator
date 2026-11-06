/* Sky Breakers moves: swipe gestures for tricks (they work alongside tilt steering) and the Moves guide with secret moves to discover. */
window.SBMoves = (function () {
  'use strict';
  // read one swipe: up / down / left / right, or a quarter-circle curl (cw or ccw)
  function watch(el, onGesture) {
    var pts = null, id = null;
    el.addEventListener('pointerdown', function (e) { if (e.target.closest('button, a, input, .card, .tiltcard, .intro')) return; id = e.pointerId; pts = [[e.clientX, e.clientY, performance.now()]]; });
    el.addEventListener('pointermove', function (e) { if (pts && e.pointerId === id) pts.push([e.clientX, e.clientY, performance.now()]); });
    function up(e) { if (!pts || e.pointerId !== id) return; var p = pts; pts = null; if (p.length < 3) return;
      var a = p[0], b = p[p.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), dur = b[2] - a[2];
      // total turning of the path (about 90 degrees = a quarter-circle curl), plus every full circle drawn, in order
      var turn = 0, hi = 0, lo = 0, loops = [], FULL = 5.3;
      for (var i = 2; i < p.length; i++) { var u = [p[i - 1][0] - p[i - 2][0], p[i - 1][1] - p[i - 2][1]], v = [p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]];
        if (Math.hypot(u[0], u[1]) < 2 || Math.hypot(v[0], v[1]) < 2) continue; turn += Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1]);
        hi = Math.max(hi, turn); lo = Math.min(lo, turn);
        if (turn <= hi - FULL) { loops.push('ccw'); hi = lo = turn; } else if (turn >= lo + FULL) { loops.push('cw'); hi = lo = turn; } }
      // info.speed: how fast the finger moved (px per ms); a quick flick is about 1.5+, a lazy swipe about 0.4
      var info = { speed: len / Math.max(dur, 16), len: len, loops: loops };
      // a full circle (or two) drawn with the finger: 'spin' (screen y points down, so a negative turn is counter-clockwise)
      if (loops.length && dur < 6000) return onGesture('spin', info);
      if (len < 40 || dur > 900) return;
      if (Math.abs(turn) > 1.0) return onGesture(turn > 0 ? 'curl-cw' : 'curl-ccw', info);
      onGesture(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy < 0 ? 'up' : 'down'), info); }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', function () { pts = null; });
  }
  // discovered secrets are remembered on this device
  var KEY = 'sb-moves-found';
  function found() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function discover(id) { var f = found(); if (f[id]) return false; f[id] = 1; try { localStorage.setItem(KEY, JSON.stringify(f)); } catch (e) {} return true; }
  // the Moves guide: list of moves; secrets show as ??? until found
  function guide(list) { var f = found(), d = document.createElement('div'); d.className = 'movesguide';
    var h = document.createElement('div'); h.className = 'lbhead'; var n = list.filter(function (m) { return m.secret; }).length, k = list.filter(function (m) { return m.secret && f[m.id]; }).length;
    h.textContent = '🤸 Moves' + (n ? ' · secrets found ' + k + ' of ' + n : ''); d.appendChild(h);
    var ul = document.createElement('ul'); list.forEach(function (m) { var li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('span'), open = !m.secret || f[m.id];
      b.textContent = open ? m.name : '??? Secret move'; s.textContent = open ? m.how : (m.hint || 'Keep exploring to find it.'); if (!open) li.className = 'secret'; li.append(b, s); ul.appendChild(li); });
    d.appendChild(ul); return d; }
  return { watch: watch, discover: discover, guide: guide };
})();
