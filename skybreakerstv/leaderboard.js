/* Sky Breakers leaderboards: top 10 per game and course.
   Online when LB_URL is set (the "Sky Breakers Leaderboard" Apps Script web app, ends in /exec);
   until then scores are kept on this device so the board still works. */
window.SBLeaderboard = (function () {
  'use strict';
  var LB_URL = '';
  var key = function (game, course) { return 'sb-lb-' + game + '-' + course; };
  function local(game, course) { try { return JSON.parse(localStorage.getItem(key(game, course)) || '[]'); } catch (e) { return []; } }
  function saveLocal(game, course, list) { try { localStorage.setItem(key(game, course), JSON.stringify(list.slice(0, 10))); } catch (e) {} }
  function clean(name) { return String(name || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); }
  function top(game, course) {
    if (!LB_URL) return Promise.resolve(local(game, course));
    return fetch(LB_URL + '?game=' + encodeURIComponent(game) + '&course=' + encodeURIComponent(course)).then(function (r) { return r.json(); })
      .then(function (d) { return Array.isArray(d.top) ? d.top : local(game, course); }).catch(function () { return local(game, course); });
  }
  function submit(game, course, name, score, note) {
    name = clean(name); score = Math.max(0, Math.round(score)); if (name.length !== 3) return Promise.reject(new Error('initials'));
    var row = { name: name, score: score, note: String(note || '').slice(0, 24), at: Date.now() };
    var list = local(game, course); list.push(row); list.sort(function (a, b) { return b.score - a.score; }); saveLocal(game, course, list);
    if (!LB_URL) return Promise.resolve(row);
    return fetch(LB_URL, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ game: game, course: course, name: name, score: score, note: row.note }) }).then(function () { return row; }, function () { return row; });
  }
  function qualifies(list, score) { return list.length < 10 || score > list[list.length - 1].score; }
  // renders into an end card: initials box + Save, then the top 10 with your entry highlighted
  function mount(el, game, course, courseName, score, note) {
    el.innerHTML = '<div class="lbhead">Top 10 · ' + courseName + '</div><form class="lbform" hidden><label>Your initials <input maxlength="3" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC"></label><button type="submit">Save score</button></form><ol class="lblist"><li class="lbwait">Loading…</li></ol>';
    var form = el.querySelector('.lbform'), input = form.querySelector('input'), ol = el.querySelector('.lblist'), mine = null;
    function render(list) { ol.innerHTML = ''; if (!list.length) { ol.innerHTML = '<li class="lbwait">No scores yet. Be the first!</li>'; return; }
      list.slice(0, 10).forEach(function (r) { var li = document.createElement('li'); if (mine && r.name === mine.name && r.score === mine.score) li.className = 'me';
        var n = document.createElement('b'); n.textContent = r.name; var sc = document.createElement('span'); sc.textContent = r.score; li.append(n, sc); if (r.note) { var t = document.createElement('i'); t.textContent = r.note; li.append(t); } ol.appendChild(li); }); }
    top(game, course).then(function (list) { render(list); if (score > 0 && qualifies(list, score)) { form.hidden = false; setTimeout(function () { try { input.focus(); } catch (e) {} }, 50); } });
    input.addEventListener('input', function () { input.value = clean(input.value); });
    form.addEventListener('submit', function (e) { e.preventDefault(); if (clean(input.value).length !== 3) { input.focus(); return; }
      form.querySelector('button').disabled = true; submit(game, course, input.value, score, note).then(function (row) { mine = row; form.hidden = true; return top(game, course); }).then(function (list) {
        if (mine && !list.some(function (r) { return r.name === mine.name && r.score === mine.score; })) { list.push(mine); list.sort(function (a, b) { return b.score - a.score; }); } render(list); }); });
  }
  // full Top 10 browser: one tab per leaderboard course
  function browser(game, courses) { var wrap = document.createElement('div'); wrap.className = 'lbbrowse';
    var tabs = document.createElement('div'); tabs.className = 'lbtabs'; var ol = document.createElement('ol'); ol.className = 'lblist';
    function show(c) { [].forEach.call(tabs.children, function (t) { t.setAttribute('aria-pressed', t.dataset.c === c.id); }); ol.innerHTML = '<li class="lbwait">Loading…</li>';
      top(game, c.id).then(function (list) { ol.innerHTML = ''; if (!list.length) { ol.innerHTML = '<li class="lbwait">No scores yet. Be the first!</li>'; return; }
        list.slice(0, 10).forEach(function (r) { var li = document.createElement('li'), n = document.createElement('b'), sc = document.createElement('span'); n.textContent = r.name; sc.textContent = r.score; li.append(n, sc);
          if (r.note) { var t = document.createElement('i'); t.textContent = r.note; li.append(t); } ol.appendChild(li); }); }); }
    courses.forEach(function (c) { var t = document.createElement('button'); t.type = 'button'; t.dataset.c = c.id; t.textContent = c.name; t.addEventListener('click', function () { show(c); }); tabs.appendChild(t); });
    var h = document.createElement('div'); h.className = 'lbhead'; h.textContent = '🏆 Top 10' + (LB_URL ? '' : ' · on this device'); wrap.append(h, tabs, ol); if (courses[0]) show(courses[0]); return wrap; }
  return { top: top, submit: submit, mount: mount, browser: browser, get online() { return !!LB_URL; } };
})();
/* Bonus courses unlock with a parent's email, sent to the "Sky Breakers Updates" Google Form. */
window.SBUnlock = (function () {
  var FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdqNBwbsZICxf4aTr0YFGb4_jr8g6mmzC2IQNHYoU3NNZ2elA/formResponse', FIELD = 'entry.1507120073', KEY = 'sb-bonus-unlocked';
  function isOpen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function unlock(email) { email = String(email || '').trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Promise.reject(new Error('email'));
    var body = new URLSearchParams(); body.append(FIELD, email);
    return fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: body }).catch(function () {}).then(function () { try { localStorage.setItem(KEY, '1'); } catch (e) {} return true; }); }
  // a small panel: "Bonus courses are locked. Ask a grown-up to enter an email to unlock them."
  function panel(onDone) { var d = document.createElement('form'); d.className = 'unlock';
    d.innerHTML = '<b>🔒 Bonus courses</b><span>These are the hardest runs. Ask a grown-up to enter their email to unlock them and get Sky Breakers updates.</span><div><input type="email" required placeholder="Parent\'s email" autocomplete="email"><button type="submit">Unlock</button></div><small></small>';
    d.addEventListener('submit', function (e) { e.preventDefault(); var b = d.querySelector('button'); b.disabled = true;
      unlock(d.querySelector('input').value).then(function () { onDone(); }, function () { b.disabled = false; d.querySelector('small').textContent = 'Please check the email address.'; }); });
    return d; }
  return { isOpen: isOpen, unlock: unlock, panel: panel };
})();
