/* state.js — demonstration loading/empty/error states for the app routes.
   The fixtures are synthetic and always present, so these states are not a
   network simulation: `?state=loading|empty|error` renders the design
   contract's states for review. Loading shows the fixture skeleton with the
   label; empty and error hide the ledger and show their copy. "Retry" in the
   error state resets fixture state — it never claims a network was repaired.
   Deferred before the route scripts so their render() cannot un-apply the
   demo state after it lands. */
'use strict';
(function () {
  const PARAM = new URLSearchParams(location.search).get('state');
  const MODE = ['loading', 'empty', 'error'].includes(PARAM) ? PARAM : null;

  function apply() {
    if (!MODE) return;
    const table = document.querySelector('.table-scroll');
    const empty = document.getElementById('empty');
    const count = document.getElementById('result-count');
    if (MODE === 'loading') {
      /* skeleton: ledger visible but inert, count carries the loading label */
      document.querySelectorAll('.market-link, [data-proposal] button, [data-repo] button, [data-sub]').forEach((b) => { b.disabled = true; });
      if (count) count.textContent = 'Loading sample fixtures…';
      document.querySelectorAll('.pd-row .bar i').forEach((i) => { i.style.width = '0%'; });
    } else if (MODE === 'empty') {
      if (table) table.hidden = true;
      if (empty) { empty.hidden = false; empty.querySelector('h2').textContent = 'No markets loaded for this demo state.'; }
      if (count) count.textContent = '0 results';
    } else if (MODE === 'error') {
      if (table) table.hidden = true;
      if (empty) {
        empty.hidden = false;
        empty.querySelector('h2').textContent = 'Fixture state failed to load.';
        const p = empty.querySelector('p'); if (p) p.textContent = 'This is a demonstration of the error state. Retry restores the synthetic fixtures.';
        const btn = empty.querySelector('button'); if (btn) btn.textContent = 'Retry';
        btn.id = btn.id || 'reset-empty';
      }
      if (count) count.textContent = 'Fixture error';
    }
  }

  function wireRetry() {
    if (MODE !== 'error') return;
    const empty = document.getElementById('empty');
    const btn = empty && empty.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', () => {
      /* retry resets fixture state; it does not claim a network was repaired */
      const url = new URL(location);
      url.searchParams.delete('state');
      location.replace(url);
    });
  }

  if (MODE) {
    document.documentElement.classList.add('state-' + MODE);
    const go = () => { apply(); wireRetry(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  }
})();
