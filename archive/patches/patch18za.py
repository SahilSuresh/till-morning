#!/usr/bin/env python3
"""v18 round 25: tap a sticker goal in Me to open its page: what counts, how to get it, your progress, one next step.
Calm days explained (shields on all day, no "off till tomorrow", 2 passes or fewer; stamp lands at midnight)."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


rep("const cnt = (k) => (S.cnt || {})[k] || 0;", r"""const cnt = (k) => (S.cnt || {})[k] || 0;
/* Each sticker goal explained: what counts, the steps, and one button that starts it */
const PASS_STEPS = ['On Today, tap “Need to shop? Get a pass” and pick the app', 'Say what you need and set a limit, then tear the ticket', 'When the pass ends, tap the check-in and answer honestly'];
const GOAL_HOW = {
  welcome: { what: 'Each time you open a shielded app, wait out the breathing pause, then choose “I’ll leave it”.', steps: ['Open a shielded app, like SHEIN, from your home screen', 'Tap “I still want to shop” and breathe through the pause', 'Tap “I’ll leave it”. That’s one.'], cta: ['Try it: open an app', 'goHomeScreen'] },
  shieldm: { what: 'A want you parked, decided after its wait is over. Keep it or let it go: both count.', steps: ['At the pause, tap “Park it till morning”', 'Wait till it’s ready, usually 08:00', 'Open Waiting, tap it and decide'], cta: ['Open your waiting room', 'openRoom', 'waiting'] },
  ticket: { what: 'A Shopping Pass you finish and then check in on. Any honest answer counts.', steps: PASS_STEPS, cta: ['Get a pass', 'planPass'] },
  puzzle: { what: 'When a parked want is ready and you choose “Let it go”. Each one goes on your Let go shelf.', steps: ['Park something at the pause', 'When it’s ready, open Waiting and tap it', 'Choose “Let it go”'], cta: ['Open your waiting room', 'openRoom', 'ready'] },
  cape: { what: 'A calm day is any day you keep your shields on and use 2 Shopping Passes or fewer. You don’t need to do anything else.', steps: ['Keep your shields on all day (switching them off or “Turn off till tomorrow” breaks the day)', 'Use no more than 2 Shopping Passes', 'At midnight the day gets a stamp on your Morning card. 10 stamps fill the card and earn this sticker.'],
    today: () => (S.dayBroken ? `Today won’t get a stamp: ${esc(S.brokenWhy || 'the day was broken')}. Tomorrow is a fresh start.` : 'Today is calm so far. Its stamp lands at midnight.'), cta: ['Got it', 'goalBack'] },
  bubble: { what: 'Fifteen parked wants you chose to let go. They all sit on your Let go shelf.', steps: ['Park something at the pause', 'When it’s ready, open Waiting and tap it', 'Choose “Let it go”'], cta: ['Open your waiting room', 'openRoom', 'ready'] },
  receipt: { what: 'After a pass, add a screenshot of your checkout at check-in. If the total is under the limit you set, it counts.', steps: ['Get a pass and set a limit (£)', 'Buy what you planned', 'At check-in, add your checkout screenshot'], cta: ['Get a pass', 'planPass'] },
  wallet: { what: 'Five passes where your checkout screenshot shows you stayed under your limit.', steps: ['Get a pass and set a limit (£)', 'Buy what you planned', 'At check-in, add your checkout screenshot'], cta: ['Get a pass', 'planPass'] },
  legend: { what: 'Pick a 30-day challenge in Your rules, like a no-buy month, and reach day 30.', steps: ['Open Your rules and pick a challenge', 'Keep going, one day at a time', 'Day 30 earns the sticker'],
    today: () => { const ch = CHALLENGES[S.challenge]; return ch && ch.len ? `You’re on day ${Math.min(challengeDay(), ch.len)} of your ${esc(ch.name.toLowerCase())}.` : 'No challenge picked yet.'; }, cta: ['Pick a challenge', 'openRules', 'settings'] }
};""")

# Me: rows open their page
rep("""return `<div class="wr-goal${got ? ' got' : ''}${n ? ' border-t-[1.5px] border-[#23275E]' : ''}">""",
    """return `<button class="wr-goal w-full text-left${got ? ' got' : ''}${n ? ' border-t-[1.5px] border-[#23275E]' : ''}" data-a="goalOpen" data-arg="${g.k}" aria-label="${esc(g.task)}, ${v} of ${g.n}. Show how to get it">""")
rep("""`${v} / ${g.n}`}</span></div>`; }).join('')}</div>""",
    """`${v} / ${g.n}`}</span><span class="text-lg text-ink3 flex">${ic('caret-right-bold')}</span></button>`; }).join('')}</div>""")
rep("<p class=\"mt-1 t-small\">Finish a goal to earn its sticker. They can’t be bought.</p>",
    "<p class=\"mt-1 t-small\">Finish a goal to earn its sticker. They can’t be bought. Tap one to see how.</p>")
rep("""<p class="text-[13px] font-bold opacity-90 relative">${n} of 10 calm days</p>""",
    """<p class="text-[13px] font-bold opacity-90 relative">${n} of 10 calm days · <button class="underline" data-a="goalOpen" data-arg="cape">What’s a calm day?</button></p>""")

# the goal page
rep("lock: () => { const [n, t] = widgetCount()", r"""goal: () => {
  const g = SGOALS.find((x) => x.k === S.goalK) || SGOALS[4], h = GOAL_HOW[g.k], got = (S.got || []).includes(g.k), wait = (S.queue || []).includes(g.k), v = Math.min(g.get(), g.n), pct = Math.round(v / g.n * 100);
  const cta = got ? btn('Back to Me', 'goalBack') : wait ? btn(`${ic('package-bold', 'text-xl')} Open your parcel`, 'openParcel') : btn(h.cta[0], h.cta[1], 'primary', h.cta[2] || '');
  return `<div class="h-full flex flex-col">
<header class="flex-shrink-0 px-6 pt-14 pb-2 flex items-center gap-3"><button class="backbtn" data-a="goalBack" aria-label="Back">${ic('arrow-left-bold')}</button><span class="t-h2">Sticker goal</span></header>
<div class="flex-1 scroll px-7 pt-2 pb-4">
<div class="gd-hero rise"><span class="gd-img${got ? ' got' : ''}${g.special ? ' special' : ''}"><img src="${IMG[g.k]}" alt="${esc(stickerName(g.k))} sticker"></span>${g.special ? '<span class="sp-chip mt-3">Proof only</span>' : ''}<p class="gd-name">${esc(stickerName(g.k))} sticker</p><h1 class="t-h1 text-center">${g.task}</h1></div>
<div class="card mt-5 p-4 rise" style="--d:60"><div class="flex items-baseline justify-between"><span class="t-label">Your progress</span><span class="t-num text-[22px]">${v} of ${g.n}</span></div><span class="gd-bar"><i style="width:${pct}%"></i></span><p class="mt-2 t-small">${got ? 'Earned. It’s on your sticker shelf.' : wait ? 'Done! Your parcel is waiting on Today.' : `${g.n - v} to go.`}</p>${h.today && !got ? `<p class="gd-today">${h.today()}</p>` : ''}</div>
<h2 class="mt-6 mb-2 t-h2 rise" style="--d:100">What counts</h2><p class="t-body rise" style="--d:120">${h.what}</p>
<h2 class="mt-6 mb-3 t-h2 rise" style="--d:140">How to get it</h2><ol class="gd-steps rise" style="--d:160">${h.steps.map((t, i) => `<li><span>${i + 1}</span><p>${t}</p></li>`).join('')}</ol>
<p class="mt-5 t-small rise" style="--d:180">Stickers only come from things Till Morning can check. They can’t be bought.</p>
</div>${foot(cta)}</div>`;
},

lock: () => { const [n, t] = widgetCount()""")
rep("const face = (on, big) =>", r"""(() => { const st = document.createElement('style'); st.textContent = `
.gd-hero { display: flex; flex-direction: column; align-items: center; text-align: center; }
.gd-img { width: 120px; height: 120px; border-radius: 34px; background: #1C2057; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 0 #15184A; }
.gd-img img { width: 96px; height: 96px; object-fit: contain; filter: grayscale(1) brightness(.6); opacity: .55; }
.gd-img.got { background: #FFF6D8; } .gd-img.got img { filter: none; opacity: 1; }
.gd-img.special { background: linear-gradient(135deg, #FFE38F, #B48CFF); } .gd-img.special img { filter: grayscale(.4) brightness(.85); opacity: .8; }
.gd-name { margin-top: 12px; font-size: 13px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #FFC94D; }
.gd-hero h1 { margin-top: 4px; }
.gd-bar { display: block; margin-top: 10px; height: 10px; border-radius: 99px; background: #23275E; overflow: hidden; }
.gd-bar i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #4361FF, #8B5CF6); }
.gd-today { margin-top: 10px; padding: 9px 12px; border-radius: 14px; background: rgba(94, 233, 181, .1); color: #A8F5D6; font-size: 14px; font-weight: 600; line-height: 1.35; }
.gd-steps { display: grid; gap: 10px; }
.gd-steps li { display: flex; gap: 12px; align-items: flex-start; }
.gd-steps li span { width: 28px; height: 28px; border-radius: 50%; background: #2A2F7A; color: #C9D3FF; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.gd-steps li p { font-size: 16px; font-weight: 600; line-height: 1.4; color: #E4E3FA; padding-top: 3px; }`; document.head.appendChild(st); })();
const face = (on, big) =>""")
rep("lock: 'iPhone Lock Screen (simulated)',", "lock: 'iPhone Lock Screen (simulated)', goal: 'Sticker goal',")
rep("  closeSheet() {", """  goalOpen(arg) { S.goalK = arg; goT('goal', 'fwd'); },
  goalBack() { S.tab = 'progress'; nextT = 'back'; go('home'); setTimeout(() => { const el = document.getElementById('wr-stickers'), sc = $('#scr .scroll'); if (el && sc) sc.scrollTop = Math.max(0, el.offsetTop - 12); }, 60); },
  closeSheet() {""")
rep("if (['parked', 'decide', 'parcel', 'note'].includes(s.screen))", "if (['parked', 'decide', 'parcel', 'note', 'goal'].includes(s.screen))")
# test panel
rep("['day', 'calendar-check-bold', 'Pretend it’s 14:00 (daytime)']]", "['day', 'calendar-check-bold', 'Pretend it’s 14:00 (daytime)'], ['goal', 'star-fill', 'Sticker goal page (calm days)']]")
rep("    else if (k === 'day') {", "    else if (k === 'goal') { S.goalK = 'cape'; goT('goal', 'fade'); }\n    else if (k === 'day') {")

open(F, 'w', encoding='utf-8').write(s)
print('patch18za ok')
