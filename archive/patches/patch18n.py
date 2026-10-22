#!/usr/bin/env python3
"""v18 round 13: swipe left and right between the four tabs (Today, Waiting, Me, Settings). Calm: content follows the finger a little, then a short slide and fade. Also swipe through the setup tour."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# ---------- transitions: tabL = going to the next tab (content arrives from the right), tabR = going back ----------
rep("#ghost.over:is([data-t=\"fwd\"], [data-t=\"back\"], [data-t=\"tab\"]) > * { background: transparent; }",
    "#ghost.over:is([data-t=\"fwd\"], [data-t=\"back\"], [data-t=\"tab\"], [data-t=\"tabL\"], [data-t=\"tabR\"]) > * { background: transparent; }")
rep("#scr[data-t=\"fade\"], #scr[data-t=\"tab\"] { --base: 50ms; }",
    "#scr[data-t=\"fade\"], #scr:is([data-t=\"tab\"], [data-t=\"tabL\"], [data-t=\"tabR\"]) { --base: 50ms; }\n"
    "#scr.enter[data-t=\"tabL\"] > * > .scroll { animation: sw-in-r .3s var(--ease) both; }\n"
    "#scr.enter[data-t=\"tabR\"] > * > .scroll { animation: sw-in-l .3s var(--ease) both; }\n"
    "#scr.enter:is([data-t=\"tabL\"], [data-t=\"tabR\"]) nav [aria-current=\"page\"] > span { animation: pop-in .4s var(--spring) both; }\n"
    "#ghost[data-t=\"tabL\"] > * > .scroll { animation: sw-out-l .2s ease-in both; }\n"
    "#ghost[data-t=\"tabR\"] > * > .scroll { animation: sw-out-r .2s ease-in both; }\n"
    "@keyframes sw-in-r { from { transform: translateX(36px); opacity: 0; } }\n"
    "@keyframes sw-in-l { from { transform: translateX(-36px); opacity: 0; } }\n"
    "@keyframes sw-out-l { to { transform: translateX(-56px); opacity: 0; } }\n"
    "@keyframes sw-out-r { to { transform: translateX(56px); opacity: 0; } }\n"
    "#scr .scroll.swiping { will-change: transform; }\n#scr img { -webkit-user-drag: none; user-select: none; }")
rep("if (['home', 'down', 'fwd', 'back', 'tab'].includes(t)) g.className = 'over';",
    "if (['home', 'down', 'fwd', 'back', 'tab', 'tabL', 'tabR'].includes(t)) g.className = 'over';")
# vertical scrolling stays with the browser; sideways drags come to us
rep("  armMotion();\n  renderOverlays();\n  renderPanel();\n}",
    "  armMotion();\n  if (root && (S.screen === 'home' || S.screen === 'tour')) root.style.touchAction = 'pan-y';\n  renderOverlays();\n  renderPanel();\n}")

# ---------- the gesture ----------
rep("/* VoiceOver and Switch Control activate with a click and no drag: let that start the pass too */",
    r"""/* Swipe between the four tabs, and through the setup tour. The content follows the finger a little; let go past the line to move on. */
const SWIPE_TABS = ['home', 'room', 'progress', 'settings'];
let swipe = null, swipedAt = 0;
const swipeTarget = (dir) => { /* dir +1 = next (finger moved left), -1 = previous */
  if (S.screen === 'tour') { const i = (S.tourI || 0) + dir; return i >= 0 && i < TOUR.length ? 'ok' : null; }
  const i = SWIPE_TABS.indexOf(S.tab) + dir; return i >= 0 && i < SWIPE_TABS.length ? SWIPE_TABS[i] : null;
};
const canSwipeFrom = (e) => {
  if (S.sheet || $('#host .sheet-wrap, #host [role="dialog"]')) return false;
  if (!(S.screen === 'tour' || (S.screen === 'home' && SWIPE_TABS.includes(S.tab)))) return false;
  const t = e.target; if (!t.closest || !t.closest('#scr')) return false;
  if (t.closest('input, textarea, select, #tearStub, #holdBtn, [data-noswipe]')) return false;
  for (let el = t; el && el.id !== 'scr'; el = el.parentElement) { if (el.scrollWidth > el.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return false; }
  return true;
};
$('#host').addEventListener('pointerdown', (e) => {
  if (e.button > 0 || !canSwipeFrom(e)) return;
  const pane = $('#scr .scroll');
  swipe = { x0: e.clientX, y0: e.clientY, id: e.pointerId, pane, mode: null, dx: 0 };
});
document.addEventListener('pointermove', (e) => {
  if (!swipe || e.pointerId !== swipe.id) return;
  const sc = ($('#host').getBoundingClientRect().width / 393) || 1, dx = (e.clientX - swipe.x0) / sc, dy = (e.clientY - swipe.y0) / sc;
  if (!swipe.mode) {
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    swipe.mode = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : 'y';
    if (swipe.mode === 'y') { swipe = null; return; }
    if (swipe.pane) { swipe.pane.classList.add('swiping'); swipe.pane.style.transition = 'none'; }
  }
  swipe.dx = dx;
  const edge = !swipeTarget(dx < 0 ? 1 : -1), pull = Math.sign(dx) * Math.min(edge ? 14 : 48, Math.abs(dx) * (edge ? 0.12 : 0.3));
  if (swipe.pane && !calm()) { swipe.pane.style.transform = `translateX(${pull}px)`; swipe.pane.style.opacity = String(1 - Math.abs(pull) / 160); }
});
function swipeEnd(e) {
  if (!swipe || (e && e.pointerId !== swipe.id)) return;
  const { dx, pane, mode } = swipe; swipe = null;
  if (mode !== 'x') return;
  swipedAt = Date.now();
  const dir = dx < 0 ? 1 : -1, to = Math.abs(dx) > 60 ? swipeTarget(dir) : null;
  if (pane) { pane.classList.remove('swiping'); if (!to) { pane.style.transition = 'transform .25s var(--ease), opacity .25s'; pane.style.transform = ''; pane.style.opacity = ''; } }
  if (!to) return;
  try { navigator.vibrate && navigator.vibrate(8); } catch (err) { /* no vibration */ }
  if (S.screen === 'tour') { if (pane) { pane.style.transform = ''; pane.style.opacity = ''; } ACT[dir > 0 ? 'tourNext' : 'tourPrev'](); return; }
  nextT = dir > 0 ? 'tabL' : 'tabR';
  ACT.tab(to);
}
document.addEventListener('pointerup', swipeEnd); document.addEventListener('pointercancel', swipeEnd);
/* pictures never start a browser drag, which would cancel the swipe */
$('#host').addEventListener('dragstart', (e) => { if (e.target.closest && e.target.closest('#scr')) e.preventDefault(); });
/* a swipe that ends over a button is not a tap */
document.addEventListener('click', (e) => { if (Date.now() - swipedAt < 350 && e.target.closest && e.target.closest('#scr')) { e.stopPropagation(); e.preventDefault(); } }, true);
/* VoiceOver and Switch Control activate with a click and no drag: let that start the pass too */""")

open(F, 'w', encoding='utf-8').write(s)
print('ok n', len(s))
