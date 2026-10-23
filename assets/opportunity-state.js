/* opportunity-state.js — demonstration states for /opportunity/ (no ledger table).
   ?state=empty|error|loading mirrors the other routes' contract on this
   page's own structure: sections hide behind the copy, retry resets. */
'use strict';
(function () {
  const PARAM = new URLSearchParams(location.search).get('state');
  const MODE = ['loading', 'empty', 'error'].includes(PARAM) ? PARAM : null;

  function ready(fn) {
    if (MODE) document.documentElement.classList.add('state-' + MODE);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function apply() {
    if (!MODE) return;
    const active = document.getElementById('active-section');
    const archive = document.getElementById('archive-section');
    const note = document.getElementById('state-note');
    if (MODE === 'loading') {
      document.querySelectorAll('[data-sub]').forEach((b) => { b.disabled = true; });
      if (note) note.hidden = false;
    } else {
      if (active) active.hidden = true;
      if (archive) archive.hidden = true;
      if (note) { note.hidden = false; note.querySelector('h2').textContent = MODE === 'empty' ? 'No submissions loaded for this demo state.' : 'Submission fixtures failed to load.'; }
    }
  }

  function wireRetry() {
    if (MODE !== 'error') return;
    const note = document.getElementById('state-note');
    const btn = note && note.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const url = new URL(location);
      url.searchParams.delete('state');
      location.replace(url);
    });
  }

  ready(() => { apply(); wireRetry(); });
})();
