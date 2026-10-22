#!/usr/bin/env python3
"""v18 round 23 (feature research, approved 2026-10-22):
1 Night lock: 23:00 to 07:00 (movable in Settings) the shield offers only Park it till morning / Close, passes sleep,
  "It's urgent" = 60-second wait + one typed reason, no XP. Replaces the risky-hours pause at night.
2 Backup dinner: "What's easy at home?" (up to 3) asked once in setup for takeaway apps, editable in Settings,
  shown under the breathing ring and in the shield subtitle on takeaway apps. No XP.
3 Shields check and safe off: "Shields working, checked N min ago" on Today; calm warning when Screen Time access is off;
  "Turn off till tomorrow" in Settings (back on by itself at 07:00, no XP taken, no stamp today).
4 Widgets: small Home Screen widget on the springboard, and a Lock Screen (new simulated screen) widget.
Test panel group "New: night lock, dinner, shields, widgets"."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# ---------- state ----------
rep("park: null, lastParked: null, deciding: null };",
    "park: null, lastParked: null, deciding: null, nlOn: true, nlFrom: 23, nlTo: 7, nightAt: 1390, meals: [], mealsAsked: false, mealDraft: '', accessLost: false, offUntil: 0, hb: 0, urgent: null };")
rep("if (['parked', 'decide', 'parcel', 'note'].includes(s.screen))", "if (s.screen === 'urgent' && !s.urgent) s.screen = 'springboard';\n  if (['parked', 'decide', 'parcel', 'note'].includes(s.screen))")
rep("unlock: 'New for you (week one)', recap: 'Sunday recap' };",
    "unlock: 'New for you (week one)', recap: 'Sunday recap', lock: 'iPhone Lock Screen (simulated)', urgent: 'Night lock: “It’s urgent”', meals: 'Backup dinner' };")

# test clock: any pretend time, not just 23:10
rep("function vnow() { if (!S.night) return Date.now(); const d = new Date(); d.setHours(23, 10, 0, 0); return d.getTime(); }",
    "function vnow() { if (!S.night) return Date.now(); const m = S.nightAt ?? 1390, d = new Date(); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d.getTime(); }")

# shields only work with Screen Time access, and not while turned off till tomorrow
rep("function shielded(id) { return S.subscribed && S.protection && inSchedule()",
    "function shielded(id) { return S.subscribed && S.protection && !S.accessLost && !offTill() && inSchedule()")

# ---------- helpers + styles ----------
rep("const face = (on, big) =>", r"""/* Night lock: from 23:00 to 07:00 the shield only offers Park it or Close. Passes sleep. */
const hh = (h) => String(h).padStart(2, '0') + ':00';
function inNight(h = vhour()) { const f = S.nlFrom ?? 23, t = S.nlTo ?? 7; return f > t ? (h >= f || h < t) : (h >= f && h < t); }
const nightOn = () => S.subscribed && S.nlOn !== false && inNight();
const offTill = () => (S.offUntil || 0) > Date.now();
const URGENT_SECS = () => (S.fast ? 10 : 60);
const urgentLeft = () => (S.urgent ? Math.max(0, S.urgent.until - Date.now()) : 0);
function updateUrgent() {
  const u = S.urgent; if (!u) return; const left = urgentLeft(), tot = URGENT_SECS() * 1000, c = $('#ucount'), r = $('#uring'), b = $('#uopen'), h = $('#uhint');
  if (c) { const v = left ? String(Math.ceil(left / 1000)) : '0'; if (c.textContent !== v) c.textContent = v; }
  if (r) r.setAttribute('stroke-dashoffset', String(439.82 * (1 - left / tot)));
  const ok = !left && (u.why || '').trim().length > 1; if (b) b.disabled = !ok;
  if (h) h.textContent = left ? 'Take the minute. Then say why.' : ok ? 'Fine. It opens for 10 minutes, then locks again.' : 'Now say why, in a few words.';
}
/* Backup dinner: up to 3 easy meals, shown on takeaway pauses. Just for you, so no XP. */
const MEAL_IDEAS = [['Freezer pizza', '🍕', 15], ['Eggs on toast', '🍳', 5], ['Pasta and pesto', '🍝', 12], ['Beans on toast', '🥫', 5], ['Cheese toastie', '🧀', 8], ['Instant noodles', '🍜', 5]];
const isTakeaway = (id) => TAKEAWAY_IDS.includes(id) || S.tags[id] === 'Takeaways';
function mealLine(id) { const m = S.meals || []; if (!isTakeaway(id) || !m.length) return ''; const n = m.map((x) => x.n.charAt(0).toLowerCase() + x.n.slice(1)); return `You’ve got ${n.length > 1 ? n.slice(0, -1).join(', ') + ' or ' + n[n.length - 1] : n[0]} at home.`; }
const mealsCard = (m) => `<div class="bd-card mt-4 rise" style="--d:200"><p class="bd-lab">You’ve got at home</p>${m.map((x) => `<p class="bd-row"><span class="bd-e" aria-hidden="true">${x.e}</span><b>${esc(x.n)}</b>${x.m ? `<small>${x.m} min</small>` : ''}</p>`).join('')}</div>`;
/* Widgets: what's parked, and the night lock */
function widgetCount() { const r = roomReady().length, w = roomWaiting().length; return r ? [r, 'ready to decide'] : [w, 'parked till morning']; }
const nlChip = () => (S.nlOn === false ? '' : `<span class="wg-chip">${ic('moon-stars-bold')} ${nightOn() ? `Locked till ${hh(S.nlTo)}` : `Night lock ${hh(S.nlFrom)}`}</span>`);
function homeWidget() { const [n, t] = widgetCount(); return `<button class="wg-home" data-a="widgetOpen" aria-label="Till Morning widget: ${n} ${t}"><span class="wg-top"><span class="wg-ic">${APP_ICON}</span>Till Morning</span><span class="wg-n">${n}</span><span class="wg-t">${t}</span>${nlChip()}</button>`; }
const heartbeat = () => { if (!S.hb || Date.now() - S.hb > 5 * 60000) S.hb = Date.now() - 2 * 60000; const m = Math.floor((Date.now() - S.hb) / 60000); return m < 1 ? 'just now' : `${m} min ago`; };
(() => { const st = document.createElement('style'); st.textContent = `
.nl-sky { background: radial-gradient(70% 40% at 50% 22%, #262A7A 0%, rgba(38, 42, 122, 0) 70%), linear-gradient(180deg, #0D0F33 0%, #070818 100%); }
.nl-face { position: relative; display: inline-block; }
.nl-z { position: absolute; right: -30px; top: -6px; font-weight: 800; font-size: 20px; letter-spacing: 3px; color: #8EA2FF; animation: nl-z 3s ease-in-out infinite; }
@keyframes nl-z { 0%, 100% { opacity: .45; translate: 0 2px; } 50% { opacity: 1; translate: 0 -4px; } }
.st-face.sleep i::before, .st-face.sleep i::after { height: 4px; width: 17px; border-radius: 3px; top: 45%; }
.st-face.sleep { animation-duration: 8s; }
.nl-sub { margin-top: 10px; font-size: 15px; font-weight: 600; color: #9EA3D9; }
.nl-meal { margin-top: 16px; padding: 10px 14px; border-radius: 16px; background: rgba(94, 233, 181, .1); color: #A8F5D6; font-size: 15px; font-weight: 600; line-height: 1.35; }
.nl-park { width: 100%; height: 52px; border-radius: 14px; background: linear-gradient(90deg, #8B6CFF, #A57BFF); color: #fff; font-size: 17px; font-weight: 700; box-shadow: 0 3px 0 #5B3FD0; }
.nl-close { width: 100%; height: 50px; border-radius: 14px; border: 1.5px solid #343A80; color: #F3F2FF; font-size: 17px; font-weight: 600; }
.nl-urgent { margin-top: 6px; padding: 6px; font-size: 14px; font-weight: 600; color: #8A8EC6; text-decoration: underline; text-underline-offset: 3px; }
.nl-sleep { background: #1E2256; color: #B4B6E4; box-shadow: 0 3px 0 #15184A; font-size: 16px; }
.sc-line { margin-top: 10px; display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: #8A8EC6; }
.sc-line i { width: 8px; height: 8px; border-radius: 50%; background: #5EE9B5; box-shadow: 0 0 0 3px rgba(94, 233, 181, .18); }
.sc-warn { border-color: rgba(255, 143, 120, .55) !important; background: linear-gradient(180deg, #2A1A3E 0%, #1A1A45 100%) !important; }
.sc-chip { font-size: 12px; font-weight: 800; padding: 2px 9px; border-radius: 99px; background: rgba(255, 143, 120, .16); color: #FFAB98; }
.bd-card { width: 100%; padding: 12px 16px 6px; border-radius: 20px; background: rgba(255, 255, 255, .08); border: 1.5px solid rgba(255, 255, 255, .12); text-align: left; }
.bd-lab { font-size: 13px; font-weight: 700; color: rgba(243, 242, 255, .7); margin-bottom: 4px; }
.bd-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; font-size: 16px; color: #F3F2FF; }
.bd-row b { flex: 1; font-weight: 700; } .bd-row small { font-size: 13px; font-weight: 600; color: rgba(243, 242, 255, .65); } .bd-e { font-size: 20px; }
.bd-opt { width: 100%; display: flex; align-items: center; gap: 12px; padding: 13px 16px; text-align: left; }
.bd-opt + .bd-opt, .bd-own { border-top: 1.5px solid #23275E; }
.bd-opt[aria-checked="true"] .check { background: #5EE9B5; border-color: #5EE9B5; color: #0B0D2A; }
.bd-own { display: flex; gap: 8px; padding: 10px 12px 12px; }
.wg-home { grid-column: span 2; grid-row: span 2; border-radius: 22px; padding: 12px 14px; display: flex; flex-direction: column; align-items: flex-start; text-align: left; color: #fff; background: linear-gradient(160deg, rgba(43, 48, 130, .92), rgba(22, 25, 80, .92)); border: 1px solid rgba(255, 255, 255, .14); box-shadow: 0 6px 18px rgba(0, 0, 0, .35); }
.wg-top { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, .75); }
.wg-ic { width: 18px; height: 18px; border-radius: 5px; overflow: hidden; background: linear-gradient(135deg, #5B76FF, #3241D6); display: block; } .wg-ic svg { width: 100%; height: 100%; display: block; }
.wg-n { margin-top: auto; font-size: 40px; font-weight: 800; line-height: 1; font-family: inherit; }
.wg-t { margin-top: 2px; font-size: 13px; font-weight: 600; }
.wg-chip { white-space: nowrap; margin-top: 8px; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 99px; background: rgba(94, 233, 181, .16); color: #74F0C1; }
.lk-date { padding-top: 64px; font-size: 18px; font-weight: 600; color: rgba(255, 255, 255, .9); text-align: center; }
.lk-time { font-size: 92px; font-weight: 700; line-height: 1; letter-spacing: -2px; text-align: center; color: #fff; }
.wg-lock { margin: 14px auto 0; width: 300px; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 22px; background: rgba(255, 255, 255, .16); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); color: #fff; text-align: left; }
.wg-lock .wg-lic { width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, .2); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.wg-lock b { font-size: 16px; } .wg-lock small { display: block; font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, .75); }
.lk-hint { padding-bottom: 56px; text-align: center; font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, .7); }
.u-ring { position: relative; width: 170px; height: 170px; flex-shrink: 0; }
.u-ring span { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
@media (prefers-reduced-motion: reduce) { .nl-z { animation: none; } }`; document.head.appendChild(st); })();
const face = (on, big) =>""")

# ---------- 1 night lock: the shield ----------
rep("  const cool = coolLeft(id), h = vhour(), late = h >= 22 || h < 5, lo = leftOf(id);\n  if (cool > 0)",
    r"""  const cool = coolLeft(id), h = vhour(), late = h >= 22 || h < 5, lo = leftOf(id);
  if (nightOn()) { const ml = mealLine(id); return `<div class="h-full flex flex-col items-center text-center px-8 font-ios nl-sky">
<div class="flex-1 flex flex-col items-center justify-center pt-10"><span class="nl-face"><span class="st-face big sleep" aria-hidden="true"><i></i></span><span class="nl-z" aria-hidden="true">z z</span></span>
<h1 class="mt-6 text-[26px] font-bold leading-tight text-ink" style="font-family:inherit">It’s late. ${nm(id)} can wait till morning.</h1>
<p class="nl-sub">Night lock is on until ${hh(S.nlTo)}</p>${ml ? `<p class="nl-meal">${ml}</p>` : ''}</div>
<div class="w-full pb-12 flex flex-col gap-2"><button class="nl-park" data-a="nightPark">Park it till morning</button><button class="nl-close" data-a="shieldClose">Close ${nm(id)}</button><button class="nl-urgent" data-a="urgent">It’s urgent</button></div>
</div>`; }
  if (cool > 0)""")
# takeaway apps: the shield's second line is the backup dinner
rep("  if (budgetFor(id)) lines.push(", "  if (mealLine(id)) lines.push(mealLine(id));\n  else if (budgetFor(id)) lines.push(")

# the urgent door + backup dinner screens
rep("pass: () => {\n  const d = S.draft;", r"""urgent: () => {
  const u = S.urgent; if (!u) return V.springboard(); const left = urgentLeft(), tot = URGENT_SECS() * 1000;
  return `<div class="h-full flex flex-col nl-sky on-dark">
<header class="flex-shrink-0 px-6 pt-14 pb-2 flex items-center gap-3"><button class="backbtn" data-a="urgentCancel" aria-label="Close">${ic('x-bold')}</button><span class="chip chip-glass text-[13px]">${ic('moon-stars-bold', 'text-[15px]')} Night lock · ${nm(u.app)}</span></header>
<div class="flex-1 scroll px-7 flex flex-col items-center text-center">
<div class="u-ring mt-4"><svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true"><circle cx="85" cy="85" r="70" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="7"/><circle id="uring" cx="85" cy="85" r="70" fill="none" stroke="#B9CBFF" stroke-width="7" stroke-linecap="round" transform="rotate(-90 85 85)" stroke-dasharray="439.82" stroke-dashoffset="${439.82 * (1 - left / tot)}"/></svg><span><b id="ucount" class="t-num text-[52px] leading-none">${Math.ceil(left / 1000)}</b><small class="mt-1 text-[14px] font-bold text-white/80">seconds</small></span></div>
<h1 class="mt-5 t-h1 text-cream">Is it really urgent?</h1>
<p class="mt-2 t-body">Wait one minute. If it still is, say why and ${nm(u.app)} opens for 10 minutes.</p>
<label for="uwhy" class="mt-5 self-start t-label mb-1.5">What’s it for?</label><input id="uwhy" data-in="urgentWhy" value="${esc(u.why || '')}" maxlength="60" autocomplete="off" placeholder="e.g. dinner for the kids" class="field w-full px-4 py-3 text-[17px] font-semibold">
</div>
<footer class="flex-shrink-0 px-7 pb-11 pt-3 space-y-2"><p id="uhint" class="text-center text-[14px] font-semibold text-cream/75" aria-live="polite">Take the minute. Then say why.</p><button id="uopen" class="btn btn-cream" data-a="urgentOpen" disabled>Open ${nm(u.app)}</button><button class="w-full py-2 font-bold text-cream/80" data-a="urgentCancel">Never mind, park it till morning</button><p class="text-center t-small">No XP either way, and no judgement.</p></footer></div>`;
},

meals: () => {
  const m = S.meals || [], on = new Set(m.map((x) => x.n)), own = m.filter((x) => !MEAL_IDEAS.some((i) => i[0] === x.n)), setup = !S.onboarded;
  const rows = [...MEAL_IDEAS.map(([n, e, mm]) => ({ n, e, m: mm })), ...own];
  return `<div class="h-full flex flex-col">${setup ? obHead(3) : `<header class="flex-shrink-0 px-6 pt-14 pb-2 flex items-center gap-3"><button class="backbtn" data-a="mealsBack" aria-label="Back">${ic('arrow-left-bold')}</button><span class="t-h2">Backup dinner</span></header>`}
<div class="flex-1 scroll px-7 pt-3 pb-4">
${setup ? '<p class="t-label rise">One question, once</p>' : ''}
<h1 class="t-h1 rise">What’s easy at home?</h1>
<p class="mt-2 t-body rise" style="--d:60">We’ll show it when you open a takeaway app, right under the breathing ring. Pick up to 3.</p>
<div class="card mt-5 overflow-hidden rise" style="--d:120" role="group" aria-label="Easy meals at home">${rows.map((x) => `<button class="bd-opt" role="checkbox" aria-checked="${on.has(x.n)}" data-a="meal" data-arg="${esc(x.n)}"><span class="bd-e" aria-hidden="true">${x.e}</span><span class="flex-1 min-w-0 t-title">${esc(x.n)}</span>${x.m ? `<span class="t-small">${x.m} min</span>` : ''}<span class="check">${on.has(x.n) ? ic('check-bold') : ''}</span></button>`).join('')}
<div class="bd-own"><label for="mown" class="sr-only">Write your own</label><input id="mown" data-in="mealDraft" value="${esc(S.mealDraft || '')}" maxlength="30" autocomplete="off" placeholder="+ Write your own" class="field flex-1 min-w-0 px-4 py-2.5 text-[16px] font-semibold"><button class="btn btn-secondary px-4" style="width:auto" data-a="mealAdd">Add</button></div></div>
<p class="mt-3 t-small rise" style="--d:160">${m.length} of 3 picked. No XP for this one: it’s just for you.</p>
</div>${foot(btn('Save', 'mealsDone') + (setup ? '<button class="w-full mt-2 py-1 font-bold text-ink3" data-a="mealsSkip">Skip for now</button>' : ''))}</div>`;
},

lock: () => { const [n, t] = widgetCount(), d = new Date(vnow());
  return `<div class="h-full flex flex-col font-ios wallpaper on-dark">
<p class="lk-date">${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p><p class="lk-time">${hhmm(vnow())}</p>
${S.subscribed ? `<button class="wg-lock" data-a="widgetOpen" aria-label="Till Morning widget: ${n} ${t}"><span class="wg-lic">${ic('moon-stars-bold')}</span><span class="flex-1 min-w-0"><b>${n} ${t}</b><small>${S.nlOn === false ? 'Till Morning' : nightOn() ? `Night lock till ${hh(S.nlTo)}` : `Night lock from ${hh(S.nlFrom)}`}</small></span></button>` : ''}
<div class="flex-1"></div><p class="lk-hint">Lock Screen (simulated) · tap the bar to unlock</p></div>`;
},

pass: () => {
  const d = S.draft;""")

# ---------- 2 backup dinner on the pause ----------
rep("  const ch = CHALLENGES[S.challenge], why = [p.risky ?",
    "  const meals = isTakeaway(p.app) ? (S.meals || []) : [];\n  const ch = CHALLENGES[S.challenge], why = [p.risky ?")
rep(""": `<h1 class="mt-6 t-h1 text-center text-cream rise" style="--d:120">Take a breath. Do you still want it?</h1>`}""",
    """: `<h1 class="mt-6 t-h1 text-center text-cream rise" style="--d:120">${meals.length ? 'Hungry, or just tired?' : 'Take a breath. Do you still want it?'}</h1>`}""")
rep("""${p.fact ? `<div class="pfact mt-4 rise" style="--d:200">""", """${meals.length ? mealsCard(meals) : p.fact ? `<div class="pfact mt-4 rise" style="--d:200">""")

# springboard: Home Screen widget first
rep("""<div class="mt-6 px-6 grid grid-cols-4 gap-x-3 gap-y-5">
${APP_IDS.map((id) =>""", """<div class="mt-6 px-6 grid grid-cols-4 gap-x-3 gap-y-5">
${S.subscribed ? homeWidget() : ''}${APP_IDS.map((id) =>""")

# ---------- 3 shields check and safe off: Today ----------
rep("""  const on = S.picked.filter(shielded), names = on.map((id) => nm(id));
  if (!S.protection)""", r"""  if (S.accessLost) return `<section data-coach="status" class="card st-card sc-warn mt-5 rise" style="--d:30" role="alert">${face(false)}<div class="mt-3 flex items-center gap-2"><h2 class="t-h2">Screen Time access is off</h2><span class="sc-chip">paused</span></div><p class="mt-1 t-small">Your apps aren’t shielded right now. One tap fixes it.</p><div class="mt-4 w-full">${btn('Turn it back on', 'accessFix')}</div></section>`;
  if (offTill()) return `<section data-coach="status" class="card st-card mt-5 rise" style="--d:30">${face(false)}<h2 class="mt-3 t-h2">Shields are off till tomorrow</h2><p class="mt-1 t-small">They come back on by themselves at 07:00 tomorrow. Nothing else changes.</p><div class="mt-4 w-full">${btn('Turn them back on now', 'offEnd', 'secondary')}</div></section>`;
  const on = S.picked.filter(shielded), names = on.map((id) => nm(id));
  if (!S.protection)""")
rep("""<p class="mt-1 t-small">${esc(list)}. ${risky() ? `It’s your risky hour, so pauses are ${realPauseSecs()} seconds.` : 'Pauses get longer from 22:00.'}</p></section>`;""",
    """<p class="mt-1 t-small">${esc(list)}. ${nightOn() ? `Night lock is on till ${hh(S.nlTo)}: park it or close it.` : risky() ? `It’s your risky hour, so pauses are ${realPauseSecs()} seconds.` : S.nlOn !== false ? `Pauses get longer from 22:00. Night lock from ${hh(S.nlFrom)}.` : 'Pauses get longer from 22:00.'}</p><p class="sc-line"><i></i>Shields working · checked ${heartbeat()}</p></section>`;""")
rep("  const on = S.subscribed && S.protection;\n", "  const on = S.subscribed && S.protection && !S.accessLost && !offTill();\n")
# passes sleep at night
rep("""${!S.pass ? `<button class="pass-cta" data-coach="pass" data-a="planPass">Need to shop? Get a pass</button>` : ''}""",
    """${!S.pass ? (nightOn() ? `<button class="pass-cta nl-sleep" data-coach="pass" data-a="planPass">${ic('moon-stars-bold')} Passes sleep till ${hh(S.nlTo)}</button>` : `<button class="pass-cta" data-coach="pass" data-a="planPass">Need to shop? Get a pass</button>`) : ''}""")

# ---------- Settings ----------
rep("""${link('tab', 'apps', 'squares-four-bold', 'bg-lav', 'Your apps', `${S.picked.length} protected`)}""",
    """${S.protection ? link('askOffTill', '', 'moon-stars-bold', 'bg-hush text-azure-light', offTill() ? 'Off till tomorrow' : 'Turn off till tomorrow', offTill() ? 'Back on by itself at 07:00' : 'Every shield comes back on at 07:00') : ''}
${link('tab', 'apps', 'squares-four-bold', 'bg-lav', 'Your apps', `${S.picked.length} protected`)}""")
rep("""${head('Pause', 60)}<div class="card overflow-hidden rise" style="--d:80">""",
    """${head('Night lock', 50)}<div class="card overflow-hidden rise" style="--d:55">
${row(`<div class="flex items-center gap-3"><span class="tile w-10 h-10 bg-hush text-azure-light text-[20px]">${ic('moon-stars-bold')}</span><span class="flex-1"><span class="block t-title">Night lock</span><span class="block t-small">${S.nlOn !== false ? `${hh(S.nlFrom)} to ${hh(S.nlTo)}: only Park it or Close. Passes sleep.` : 'Off. Nights get the longer pause instead.'}</span></span>${sw(S.nlOn !== false, 'nlOn', '', 'Night lock')}</div>`, true)}
${S.nlOn !== false ? row(`<p class="t-title">Starts</p>${seg('nlFrom', [[22, '22:00'], [23, '23:00'], [0, '00:00']], 'nlFrom', 'Night lock starts')}<p class="mt-4 t-title">Ends</p>${seg('nlTo', [[6, '06:00'], [7, '07:00'], [8, '08:00']], 'nlTo', 'Night lock ends')}`) : ''}
</div>
${head('Pause', 60)}<div class="card overflow-hidden rise" style="--d:80">""")
rep("""${row(`<p class="t-title">How long the pause lasts</p>""",
    """${link('editMeals', '', 'heart-bold', 'bg-sun', 'Backup dinner', (S.meals || []).length ? esc(S.meals.map((x) => x.n).join(', ')) : 'Easy meals to show on takeaway pauses', true)}
${row(`<p class="t-title">How long the pause lasts</p>""")
rep("""${seg('pauseLen', PAUSE_OPTS.map((v) => [v, v < 60 ? `${v} s` : '1 min']), 'pauseLen', 'Pause length')}${S.fast ? '<p class="mt-2 text-[12.5px] font-semibold text-ink3">Fast timers are on in this preview, so the pause lasts 5 seconds.</p>' : ''}`, true)}""",
    """${seg('pauseLen', PAUSE_OPTS.map((v) => [v, v < 60 ? `${v} s` : '1 min']), 'pauseLen', 'Pause length')}${S.fast ? '<p class="mt-2 text-[12.5px] font-semibold text-ink3">Fast timers are on in this preview, so the pause lasts 5 seconds.</p>' : ''}`)}""")

# turn off till tomorrow: a calm confirm
rep("  del: () =>", r"""  offTill: () => `<div class="sheet-wrap px-6"><div class="dlg-in w-full bg-[#161942] border-[1.5px] border-[#2E3374] rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,.55)]" role="dialog" aria-label="Turn off till tomorrow"><h2 class="t-h2 text-[24px]">Turn off till tomorrow?</h2><p class="mt-2 t-body">Every shield comes off now and turns back on by itself at 07:00 tomorrow. You keep your XP and your waiting room. Today just won’t get a stamp.</p><div class="mt-5 space-y-2">${btn('Turn off till 07:00', 'offConfirm', 'secondary')}<button class="w-full py-3 font-bold text-azure-light" data-a="closeSheet">Keep shields on</button></div></div></div>`,
  del: () =>""")

# ---------- actions ----------
rep("  closeSheet() {", r"""  nightPark() { const id = S.shieldApp; if (!id) return; S.park = { app: id, name: '', price: 0, band: 'unsure', from: 'night' }; startCool(id); doPark(false); },
  urgent() { const id = S.shieldApp; if (!id) return; S.urgent = { app: id, until: Date.now() + URGENT_SECS() * 1000, why: '' }; nextT = 'zoom'; go('urgent'); },
  urgentCancel() { const u = S.urgent; S.urgent = null; if (u) { S.shieldApp = u.app; S.park = { app: u.app, name: '', price: 0, band: 'unsure', from: 'night' }; doPark(false); } else go('springboard'); },
  urgentOpen() { const u = S.urgent; if (!u || urgentLeft() > 0 || (u.why || '').trim().length < 2) return; const factor = S.fast ? 60 : 1; S.pass = { app: u.app, reason: 'specific', need: u.why.trim(), limit: '', minutes: 10, factor, endsAt: Date.now() + 10 * 60000 / factor, urgent: true }; S.urgent = null; S.inApp = u.app; goT('inapp', 'slide'); toast(`${nm(u.app)} is open for 10 minutes`); },
  editMeals() { S.mealsReturn = 'settings'; goT('meals', 'fwd'); },
  mealsBack() { S.mealDraft = ''; S.tab = 'settings'; goT('home', 'back'); },
  meal(arg) { const m = S.meals || []; if (m.some((x) => x.n === arg)) S.meals = m.filter((x) => x.n !== arg); else { if (m.length >= 3) { toast('Up to 3. Untick one first.'); return; } const i = MEAL_IDEAS.find((x) => x[0] === arg); S.meals = [...m, i ? { n: i[0], e: i[1], m: i[2] } : { n: arg, e: '🍽️', m: 0 }]; } go('meals'); },
  mealAdd() { const n = (S.mealDraft || '').trim(); if (!n) { const f = $('#mown'); if (f) f.focus(); return; } const m = S.meals || []; if (m.some((x) => x.n.toLowerCase() === n.toLowerCase())) { S.mealDraft = ''; go('meals'); return; } if (m.length >= 3) { toast('Up to 3. Untick one first.'); return; } S.meals = [...m, { n: n.charAt(0).toUpperCase() + n.slice(1), e: '🍽️', m: 0 }]; S.mealDraft = ''; go('meals'); },
  mealsDone() { S.mealsAsked = true; S.mealDraft = ''; if (S.onboarded) { S.tab = 'settings'; goT('home', 'back'); toast((S.meals || []).length ? 'Backup dinner saved' : 'No backup dinner for now'); } else go('demo'); },
  mealsSkip() { S.mealsAsked = true; S.mealDraft = ''; go('demo'); },
  askOffTill() { if (offTill()) { ACT.offEnd(); return; } S.sheet = 'offTill'; renderOverlays(); },
  offConfirm() { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(7, 0, 0, 0); S.offUntil = d.getTime(); breakDay('you turned shields off till tomorrow'); S.sheet = null; S.tab = 'home'; go('home'); toast('Shields are off till 07:00 tomorrow'); },
  offEnd() { S.offUntil = 0; fx = 'protect'; S.tab = 'home'; go('home'); toast('Shields are back on'); },
  accessFix() { S.permFix = true; S.sheet = 'permission'; renderOverlays(); },
  openFix() { hideBanner(); S.tab = 'home'; nextT = inPausa() ? 'fade' : 'zoom'; openPausa(); },
  widgetOpen() { const r = roomReady().length; S.tab = 'room'; S.roomView = r ? 'ready' : 'waiting'; nextT = 'zoom'; openPausa(); },
  nlOn() { S.nlOn = S.nlOn === false; go('home'); toast(S.nlOn ? `Night lock on, ${hh(S.nlFrom)} to ${hh(S.nlTo)}` : 'Night lock off'); },
  nlFrom(arg) { S.nlFrom = +arg; go('home'); },
  nlTo(arg) { S.nlTo = +arg; go('home'); },
  closeSheet() {""")
# Screen Time access re-granted from Today (reuses Apple's pop-up)
rep("  permAllow() { S.permission = true; S.permDenied = false; go('ukApps'); },",
    "  permAllow() { if (S.permFix) { S.permFix = false; S.accessLost = false; S.sheet = null; fx = 'protect'; S.tab = 'home'; go('home'); toast('Screen Time access is back. Shields are up.'); return; } S.permission = true; S.permDenied = false; go('ukApps'); },")
rep("  permDeny() { S.permDenied = true; go(S.screen); },",
    "  permDeny() { if (S.permFix) { S.permFix = false; S.sheet = null; renderOverlays(); return; } S.permDenied = true; go(S.screen); },")
# setup: ask about dinner once, only if a takeaway app was picked
rep("pickerDone() { if (!S.picked.length) return; if (S.pickerReturn === 'apps') { S.tab = 'apps'; go('home'); } else go('demo'); },",
    "pickerDone() { if (!S.picked.length) return; if (S.pickerReturn === 'apps') { S.tab = 'apps'; go('home'); } else go(!S.mealsAsked && S.picked.some(isTakeaway) ? 'meals' : 'demo'); },")
rep("  back() { const i = ONB.indexOf(S.screen);", "  back() { if (S.screen === 'meals') return go('picker'); const i = ONB.indexOf(S.screen);")
# passes sleep at night
rep("  planPass() { S.sheet = 'passApp'; renderOverlays(); },",
    "  planPass() { if (nightOn()) { toast(`Shopping Passes sleep till ${hh(S.nlTo)}. Park it till morning instead.`); return; } S.sheet = 'passApp'; renderOverlays(); },")
rep("  shopPlan() { logEv(", "  shopPlan() { if (nightOn()) { toast(`Shopping Passes sleep till ${hh(S.nlTo)}`); return; } logEv(")
# an urgent pass ends quietly: no check-in, no XP
rep("  S.checkin = { app: p.app, need: p.need, limit: p.limit, reason: p.reason, minutes: p.minutes };",
    "  if (!p.urgent) S.checkin = { app: p.app, need: p.need, limit: p.limit, reason: p.reason, minutes: p.minutes };")
rep("  banner({ body: `Your ${nm(p.app)} pass ended. Tap to check in.`, action: 'openCheckin' });",
    "  if (p.urgent) toast(`${nm(p.app)} is locked again. Sleep well.`); else banner({ body: `Your ${nm(p.app)} pass ended. Tap to check in.`, action: 'openCheckin' });")
# an urgent opening is labelled as such in the app
rep('<span class="font-bold">Shopping pass</span>', '<span class="font-bold">${S.pass.urgent ? \'Urgent · 10 minutes\' : \'Shopping pass\'}</span>')
# inputs + tick
rep("  if (k === 'goal') S.goal = t.value.slice(0, 40);",
    "  if (k === 'goal') S.goal = t.value.slice(0, 40);\n  if (k === 'mealDraft') S.mealDraft = t.value.slice(0, 30);\n  if (k === 'urgentWhy' && S.urgent) { S.urgent.why = t.value.slice(0, 60); updateUrgent(); }")
rep("  if (S.screen === 'pause') updatePause();", "  if (S.screen === 'pause') updatePause();\n  if (S.screen === 'urgent') updateUrgent();")
rep("const inPausa = () => !['springboard', 'shield', 'inapp', 'safari'].includes(S.screen);",
    "const inPausa = () => !['springboard', 'shield', 'inapp', 'safari', 'lock'].includes(S.screen);")

# ---------- test panel ----------
rep("""<section class="pgroup"><h2>Market research changes</h2>""", r"""<section class="pgroup"><h2>New: night lock, dinner, shields, widgets</h2><div class="prow">${[['night', 'moon-stars-bold', 'Night lock shield (pretend 23:30)'], ['urgent', 'timer-bold', '“It’s urgent” door'], ['dinner', 'heart-bold', 'Takeaway pause with backup dinner'], ['meals', 'clipboard-text-bold', '“What’s easy at home?”'], ['lost', 'warning-circle-bold', 'Screen Time access lost'], ['off', 'toggle-right-bold', 'Turn off till tomorrow'], ['lock', 'device-mobile-bold', 'Lock Screen widget'], ['widget', 'squares-four-bold', 'Home Screen widget'], ['day', 'calendar-check-bold', 'Pretend it’s 14:00 (daytime)']].map(([k, i, l]) => `<button class="pbtn" data-p="nl:${k}">${ic(i)} ${l}</button>`).join('')}</div>
<p class="fine">Night lock follows the real clock too (23:00 to 07:00). “Pretend it’s 14:00” shows the daytime app at any hour. “Jump to the morning” goes back to the real time.</p></section>
<section class="pgroup"><h2>Market research changes</h2>""")
rep("  else if (p.startsWith('mr:')) { const k = p.slice(3);", r"""  else if (p.startsWith('nl:')) { const k = p.slice(3);
    if (!S.subscribed) { toast('Skip setup first, then try this one'); return; }
    hideBanner(); S.sheet = null; S.urgent = null; renderOverlays();
    const app = (pref) => (S.picked.includes(pref) ? pref : S.picked.find((x) => isTakeaway(x)) || S.picked[0]);
    const daytime = () => { S.night = true; S.nightAt = 840; };
    if (k === 'night' || k === 'urgent') { const id = app('deliveroo'); S.night = true; S.nightAt = 1410; S.nlOn = true; S.accessLost = false; S.offUntil = 0; if (S.cool) delete S.cool[id]; if (S.pass && S.pass.app === id) S.pass = null; S.shieldApp = id; save(); goT('shield', 'fade'); if (k === 'urgent') setTimeout(() => ACT.urgent(), 900); }
    else if (k === 'dinner') { const id = app('justeat'); if (!(S.meals || []).length) S.meals = [{ n: 'Freezer pizza', e: '🍕', m: 15 }, { n: 'Eggs on toast', e: '🍳', m: 5 }]; daytime(); S.accessLost = false; S.offUntil = 0; if (S.pass && S.pass.app === id) S.pass = null; S.shieldApp = id; save(); ACT.startPause(); }
    else if (k === 'meals') { S.mealsReturn = 'settings'; goT('meals', 'fade'); }
    else if (k === 'lost') { S.accessLost = true; S.offUntil = 0; save(); if (S.screen !== 'springboard') go('springboard'); else render(); setTimeout(() => banner({ body: 'Screen Time access is off, so your apps aren’t shielded. Tap to fix it.', action: 'openFix' }), 500); }
    else if (k === 'off') { S.accessLost = false; S.offUntil = 0; S.protection = true; S.tab = 'settings'; goT('home', 'fade'); setTimeout(() => { S.sheet = 'offTill'; renderOverlays(); }, 600); }
    else if (k === 'lock') { goT('lock', 'fade'); }
    else if (k === 'widget') { if (S.screen !== 'springboard') goT('springboard', 'fade'); else render(); }
    else if (k === 'day') { daytime(); save(); render(); toast('It’s 14:00 for Till Morning. Night lock is asleep.'); }
  }
  else if (p.startsWith('mr:')) { const k = p.slice(3);""")
rep("    else if (k === '6') { const id = app('ubereats'); S.night = true;", "    else if (k === '6') { const id = app('ubereats'); S.night = true; S.nightAt = 1360;")
rep("  else if (p === 'night') { S.night = !S.night; save(); render(); toast(S.night ? 'It’s 23:10 for Till Morning: risky hour, longer pauses' : 'Back to the real time'); }",
    "  else if (p === 'night') { S.night = !(S.night && S.nightAt === 1390); S.nightAt = 1390; save(); render(); toast(S.night ? 'It’s 23:10 for Till Morning: night lock is on' : 'Back to the real time'); }")
rep("""<button class="pbtn${S.night ? ' primary' : ''}" data-p="night" aria-pressed="${S.night}">Pretend it’s 23:10: ${S.night ? 'on' : 'off'}</button>""",
    """<button class="pbtn${S.night && S.nightAt === 1390 ? ' primary' : ''}" data-p="night" aria-pressed="${!!(S.night && S.nightAt === 1390)}">Pretend it’s 23:10: ${S.night && S.nightAt === 1390 ? 'on' : 'off'}</button>""")

open(F, 'w', encoding='utf-8').write(s)
print('patch18y ok')
