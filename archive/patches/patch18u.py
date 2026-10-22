#!/usr/bin/env python3
"""v18 round 19: first-time tutorial on Today, right after the paywall.
Four spotlight tips on the real screen (status card, waiting card, pass button, try it), one tip at a time, Skip any time.
Ends on "Open an app" so the first thing people do is try the pause. Replay from the test panel."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# anchors on the real Today screen
rep('class="card st-card mt-5 rise"', 'data-coach="status" class="card st-card mt-5 rise"', 4)
rep('class="card wt-card mt-3', 'data-coach="wait" class="card wt-card mt-3', 2)
rep('<button class="try-pill" data-a="goHomeScreen">', '<button class="try-pill" data-coach="try" data-a="goHomeScreen">')
rep('<button class="pass-cta" data-a="planPass">', '<button class="pass-cta" data-coach="pass" data-a="planPass">')

# steps + styles
rep("/* Calm Today: one card, at most one next step, then the pass button. Everything else lives in Me. */",
    r"""/* First-time tutorial: four tips on the real Today screen, right after the paywall. One tip at a time, Skip any time. */
const COACH_TIPS = [
  { k: 'status', t: 'Your shield is up', d: 'These apps now get a short pause before they open. You don’t need to do anything else.' },
  { k: 'wait', t: 'Your waiting room', d: 'When a want hits, park it. It waits here till morning, and you decide with a clear head.' },
  { k: 'pass', t: 'Need to shop for real?', d: 'Get a pass: say what you need, set a limit and a timer. The app locks again after.' },
  { k: 'try', t: 'Try it once now', d: 'Open a shopping app from your home screen and park something. New tips arrive here over your first week.' }
];
function startCoach() { if (S.screen !== 'home' || S.tab !== 'home' || S.sheet || !S.subscribed) return; hideBanner(); S.coachStep = S.coachStep || 0; S.sheet = 'coach'; renderOverlays(); }
(() => { const st = document.createElement('style'); st.textContent = `
.coach-wrap { position: absolute; inset: 0; pointer-events: auto; overflow: hidden; }
.coach-hole { position: absolute; box-shadow: 0 0 0 9999px rgba(4, 5, 22, .76); border: 2px solid rgba(255, 201, 77, .95); pointer-events: none; animation: coach-pop .35s ease-out both; }
.coach-tip { position: absolute; left: 16px; right: 16px; background: #F4F3FF; color: #14163A; border-radius: 22px; padding: 16px 16px 14px; box-shadow: 0 14px 34px rgba(0, 0, 0, .45); animation: in-fade .3s ease-out .08s both; }
.coach-arr { position: absolute; width: 16px; height: 16px; background: #F4F3FF; transform: rotate(45deg); margin-left: -8px; border-radius: 3px; }
.coach-tip .st-face { width: 44px; height: 44px; padding: 0; background: transparent; animation: none; }
.coach-tip .st-face i::before, .coach-tip .st-face i::after { width: 6px; height: 8px; }
.coach-next { padding: 9px 18px; border-radius: 99px; background: #4361FF; color: #fff; font-weight: 800; font-size: 15px; box-shadow: 0 3px 0 #2A3BC0; }
.coach-dots { display: flex; gap: 5px; } .coach-dots i { width: 6px; height: 6px; border-radius: 50%; background: #C9C8E6; } .coach-dots i.on { background: #4361FF; width: 16px; border-radius: 99px; }
@keyframes coach-pop { from { opacity: 0; transform: scale(1.06); } }
@media (prefers-reduced-motion: reduce) { .coach-hole, .coach-tip { animation: none; } }`; document.head.appendChild(st); })();

/* Calm Today: one card, at most one next step, then the pass button. Everything else lives in Me. */""")

# the overlay
rep("  rate: () => {", r"""  coach: () => {
    const ov = $('#ovl'), steps = COACH_TIPS.filter((c) => $(`#scr [data-coach="${c.k}"]`));
    let i = Math.min(S.coachStep || 0, steps.length - 1); const c = steps[i]; if (!c || !ov) return '';
    const el = $(`#scr [data-coach="${c.k}"]`), o = ov.getBoundingClientRect(), r = el.getBoundingClientRect(), z = o.width / ov.offsetWidth || 1, pad = 6;
    const x = (r.left - o.left) / z - pad, y = (r.top - o.top) / z - pad, w = r.width / z + pad * 2, h = r.height / z + pad * 2, H = ov.offsetHeight, W = ov.offsetWidth;
    const below = y + h / 2 < H * 0.5, cx = Math.max(36, Math.min(W - 36, x + w / 2)), rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 16, last = i === steps.length - 1;
    const tipPos = below ? `top:${Math.round(y + h + 14)}px` : `bottom:${Math.round(H - y + 14)}px`, arr = below ? 'top:-7px' : 'bottom:-7px';
    return `<div class="coach-wrap" role="dialog" aria-label="Quick tour, tip ${i + 1} of ${steps.length}"><div class="coach-hole" style="left:${Math.round(x)}px;top:${Math.round(y)}px;width:${Math.round(w)}px;height:${Math.round(h)}px;border-radius:${Math.round(rad + pad)}px"></div>
<div class="coach-tip" style="${tipPos}"><i class="coach-arr" style="${arr};left:${Math.round(cx - 16)}px"></i><div class="flex gap-3 items-start"><span class="st-face" aria-hidden="true"><i></i></span><span class="flex-1 min-w-0"><b class="block text-[17px] leading-tight">${c.t}</b><span class="block mt-1 text-[14.5px] font-semibold leading-snug text-[#4A4E7A]">${c.d}</span></span></div>
<div class="mt-3.5 flex items-center gap-3"><span class="coach-dots" aria-hidden="true">${steps.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('')}</span><span class="text-[12.5px] font-bold text-[#6B6F9E]">${i + 1} of ${steps.length}</span><span class="flex-1"></span>${last ? `<button class="text-[14.5px] font-bold text-[#6B6F9E] px-2" data-a="coachEnd">Later</button><button class="coach-next" data-a="coachTry">Open an app</button>` : `<button class="text-[14.5px] font-bold text-[#6B6F9E] px-2" data-a="coachEnd">Skip</button><button class="coach-next" data-a="coachNext">Next</button>`}</div></div></div>`;
  },
  rate: () => {""")
rep("  rateStar(k) {", """  coachNext() { S.coachStep = (S.coachStep || 0) + 1; renderOverlays(); },
  coachEnd() { S.coachDone = true; S.coachStep = 0; S.sheet = null; save(); renderOverlays(); },
  coachTry() { ACT.coachEnd(); goHome(); },
  rateStar(k) {""")

# start it after the paywall, once the "Shields on" stamp has landed
rep("welcomeParcel(); fx = 'protect'; goT('home', 'fade'); }, /* no toast",
    "welcomeParcel(); fx = 'protect'; goT('home', 'fade'); if (!S.coachDone) { S.coachStep = 0; setTimeout(startCoach, 1900); } }, /* no toast")

# test panel replay
rep("['9', 'star-fill', 'Review pop-up (let a want go)']]", "['9', 'star-fill', 'Review pop-up (let a want go)'], ['tut', 'hand-pointing-bold', 'Replay first-time tutorial']]")
rep("    else if (k === '9') {", "    else if (k === 'tut') { S.tab = 'home'; S.coachStep = 0; goT('home', 'fade'); setTimeout(startCoach, 700); }\n    else if (k === '9') {")

open(F, 'w', encoding='utf-8').write(s)
print('patch18u ok')
