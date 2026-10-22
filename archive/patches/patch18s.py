#!/usr/bin/env python3
"""v18 round 17, market research changes 1-8 rebuilt to match the "after" mockups (research versions of 1 and 4).
1 setup: welcome, story, Screen Time, UK apps, Apple's picker, try the pause, one tour slide, paywall. Six features unlock on Today on days 2-7.
2 paywall: "Your free week" timeline card, two plan rows, reminder switch.
3 pause: one true line with bold facts and a dots row.
4 Today: status card, waiting card, one pass button. Calm-days card moves to Me.
5 pass: "XP when you check in" chip, reward line in the footer.
6 shield: after 22:00 the title names the time and the app.
7 a new "Pick the apps that get you" screen before Apple's picker.
8 Sunday recap restyled: date label, compact rows, rank line, share button.
Plus a "Market research changes" group in the test panel."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


def between(start, end, new):
    """Replace s[start:end) where start/end are unique markers; end marker is kept."""
    global s
    if s.count(start) != 1:
        raise SystemExit(f'start marker count {s.count(start)}: {start[:80]!r}')
    a = s.index(start)
    b = s.index(end, a)
    s = s[:a] + new + s[b:]


# ---------- icons + styles ----------
rep("function ic(n, c = '') {",
    r"""ICONS['clock-bold'] = '<circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" stroke-width="24"/><polyline points="128 72 128 128 184 128" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"/>';
function ic(n, c = '') {""")

rep("/* Feature tour in setup: one feature per slide, each with a small preview of the real screen */",
    r"""(() => { const st = document.createElement('style'); st.textContent = `
.try-pill { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 99px; background: #FFC94D; color: #14163A; font-weight: 800; font-size: 13.5px; box-shadow: 0 3px 0 #C9952A; }
.try-pill:active { translate: 0 2px; box-shadow: 0 1px 0 #C9952A; }
.pass-cta { width: 100%; height: 56px; border-radius: 99px; background: linear-gradient(90deg, #7C4DFF, #A066FF); color: #fff; font-weight: 800; font-size: 17px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 0 #4B2BB0; }
.pass-cta:active { translate: 0 2px; box-shadow: 0 2px 0 #4B2BB0; }
.st-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 22px 18px 20px; }
.st-face { width: 84px; height: 84px; border-radius: 50%; background: #fff; padding: 4px; display: block; flex-shrink: 0; animation: st-breathe 6s ease-in-out infinite; }
.st-face i { display: block; width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #B9F26B, #74CC2E 60%, #4E9E1C); position: relative; }
.st-face i::before, .st-face i::after { content: ''; position: absolute; top: 37%; width: 11px; height: 15px; border-radius: 50%; background: #14163A; }
.st-face i::before { left: 31%; } .st-face i::after { right: 31%; }
.st-face.off i { background: radial-gradient(circle at 35% 30%, #D5D6EE, #8A8EC6 70%); }
.st-face.big { width: 100px; height: 100px; }
.st-face.big i::before, .st-face.big i::after { width: 13px; height: 18px; }
@keyframes st-breathe { 50% { transform: scale(1.04); } }
@media (prefers-reduced-motion: reduce) { .st-face { animation: none; } }
.wt-card { display: block; padding: 14px 16px; }
.wt-lab { display: block; font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #FFC94D; }
.wt-lab.mint { color: #5EE9B5; } .wt-lab.muted { color: #8A8EC6; } .wt-lab.lilac { color: #C4B5FD; }
.wt-n { width: 30px; height: 30px; border-radius: 9px; background: #FFC94D; color: #14163A; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wt-n.mint { background: #5EE9B5; }
.pw-card { background: #F4F3FF; color: #14163A; border-radius: 22px; padding: 18px 18px 14px; }
.pw-tl { display: flex; flex-direction: column; gap: 14px; }
.pw-step { display: flex; gap: 11px; align-items: flex-start; font-size: 15.5px; line-height: 1.3; }
.pw-step b { font-weight: 800; }
.pw-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.pw-sub { font-size: 13.5px; font-weight: 600; color: #4A4E7A; }
.pw-rule { border-top: 1.5px dashed #C9C8E6; margin: 16px 0 10px; }
.pw-total { display: flex; justify-content: space-between; align-items: baseline; font-weight: 800; font-size: 19px; }
.pw-due { display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 600; color: #4A4E7A; margin-top: 4px; }
.pw-plan { width: 100%; display: flex; align-items: center; gap: 12px; padding: 15px 16px; border-radius: 16px; background: #161942; border: 1.5px solid #2E3374; font-weight: 700; font-size: 16px; color: #F3F2FF; text-align: left; }
.pw-plan[aria-checked="true"] { border-color: #93A5FF; background: #1C2160; }
.pw-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #5A5F9E; flex-shrink: 0; }
.pw-plan[aria-checked="true"] .pw-radio { border-color: #93A5FF; background: #93A5FF; box-shadow: inset 0 0 0 4px #1C2160; }
.pfact { font-weight: 600 !important; background: rgba(13,15,46,.32) !important; }
.pfact b { font-weight: 800; color: #fff; }
.pdots { display: flex; gap: 6px; justify-content: center; margin-top: 14px; }
.pdots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.3); }
.pdots i.on { background: #fff; }
.uk-l { width: 28px; height: 28px; border-radius: 8px; color: #14163A; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.uk-also { background: #1E1A55; border: 1.5px solid #7C5CFF; border-radius: 22px; box-shadow: 0 3px 0 #3B2E8F; }
.rc2-date { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 12.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #FFC94D; }
.rc2-card { background: #1C2057; border: 1.5px solid #343A80; border-radius: 18px; padding: 4px 16px; }
.rc2-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; font-size: 15.5px; font-weight: 600; color: #D7D8F5; }
.rc2-row + .rc2-row { border-top: 1.5px solid #2A2F70; }
.rc2-row b { font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; }
.rc2-row b.mint { color: #5EE9B5; }
.rc2-star { width: 34px; height: 34px; border-radius: 10px; background: #FFC94D; color: #14163A; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }`; document.head.appendChild(st); })();
/* Feature tour in setup: one feature per slide, each with a small preview of the real screen */""")

# ---------- 1: setup tells one story ----------
rep("const ONB = ['welcome', 'story', 'pain', 'screenTime', 'picker', 'demo', 'tour', 'rules', 'paywall'];",
    "const ONB = ['welcome', 'story', 'screenTime', 'ukApps', 'picker', 'demo', 'tour', 'paywall'];")
rep("const w = (k) => Math.round(k / 6 * 100);", "const w = (k) => Math.round(k / 5 * 100);")
rep('aria-valuemin="0" aria-valuemax="6"', 'aria-valuemin="0" aria-valuemax="5"')
rep("screenTime: () => `<div class=\"h-full flex flex-col\">${obHead(3)}", "screenTime: () => `<div class=\"h-full flex flex-col\">${obHead(2)}")
rep("note: 'A note from calm you' };", "note: 'A note from calm you', ukApps: 'Pick the apps that get you', unlock: 'New for you (week one)', recap: 'Sunday recap' };")

rep("""const WEEK1 = [[1, 2, 'checkout'], [3, 4, 'risky'], [5, 6, 'note']].map(([i, day, k]) => ({ ...TOUR[i], day, k }));
[5, 3, 1].forEach((i) => TOUR.splice(i, 1));""",
    r"""const RULES_SLIDE = { kick: 'Decide while you’re calm', t: 'Your rules', d: 'Pick a challenge, like a no-buy month, and choose treat nights when takeaway apps open with a hello instead of a pause.', art: () => `<div class="mini-card flex items-center gap-3"><span class="tile w-11 h-11 bg-mint text-[22px]">${ic('lock-key-bold')}</span><span class="flex-1 min-w-0"><b class="block t-title">No-buy month</b><span class="block t-small">Only what you need for 30 days</span></span><span class="chip chip-mint">Day 1</span></div>
<div class="mini-card"><b class="block t-title mb-2">Treat nights</b><div class="wr-week" aria-hidden="true">${DAY_NAMES.map((n, i) => `<button tabindex="-1" aria-pressed="${i === 4}">${n[0]}<small>${i === 4 ? 'Treat' : ''}</small></button>`).join('')}</div></div>` };
const WEEK1 = [[TOUR[2], 2, 'plan'], [RULES_SLIDE, 3, 'rules'], [TOUR[1], 4, 'checkout'], [TOUR[4], 5, 'stickers'], [TOUR[3], 6, 'risky'], [TOUR[5], 7, 'note']].map(([t, day, k]) => ({ ...t, day, k }));
TOUR.splice(1, 5);""")

rep("<span class=\"chip chip-lilac text-[13px] tour-kick\">${i + 1} of ${TOUR.length} · ${t.kick}</span>",
    "<span class=\"chip chip-lilac text-[13px] tour-kick\">${TOUR.length > 1 ? `${i + 1} of ${TOUR.length} · ` : ''}${t.kick}</span>")
rep("""<footer class="flex-shrink-0 px-7 pt-3 pb-9 space-y-3"><div class="tour-dots" role="group" aria-label="Feature tour">${TOUR.map((x, k) => `<button data-a="tourGo" data-arg="${k}" aria-label="${x.t}" aria-current="${k === i}"></button>`).join('')}</div>
${btn(last ? 'Set my rules' : 'Next', 'tourNext')}<button class="w-full py-1 font-bold text-ink3" data-a="tourSkip">Skip the tour</button></footer></div>`;""",
    """<footer class="flex-shrink-0 px-7 pt-3 pb-11 space-y-3">${TOUR.length > 1 ? `<div class="tour-dots" role="group" aria-label="Feature tour">${TOUR.map((x, k) => `<button data-a="tourGo" data-arg="${k}" aria-label="${x.t}" aria-current="${k === i}"></button>`).join('')}</div>` : `<p class="text-center t-small">More arrives on Today during your first week.</p>`}
${btn(last ? 'Continue' : 'Next', 'tourNext')}${TOUR.length > 1 ? `<button class="w-full py-1 font-bold text-ink3" data-a="tourSkip">Skip the tour</button>` : ''}</footer></div>`;""")

# week-one unlock screen: footer per feature
rep("""</div>${foot(u.k === 'note' ? btn('Record my note', 'unlockGo', 'primary') + `<button class="w-full mt-2 py-2 text-[15px] font-bold text-azure-light" data-a="unlockDone">Maybe later</button>` : u.k === 'risky' ? btn('Got it', 'unlockDone') + `<button class="w-full mt-2 py-2 text-[15px] font-bold text-azure-light" data-a="unlockGo">See my rules</button>` : btn('Got it', 'unlockDone'))}</div>`;""",
    """</div>${(() => { const go = { note: 'Record my note', rules: 'Set my rules', risky: 'See my rules', stickers: 'See my stickers' }[u.k]; return foot(go ? btn(go, 'unlockGo') + `<button class="w-full mt-2 py-2 text-[15px] font-bold text-azure-light" data-a="unlockDone">Maybe later</button>` : btn('Got it', 'unlockDone')); })()}</div>`;""")
rep("if (k === 'risky') { S.rulesFrom = 'home'; S.tab = 'plan'; goT('home', 'fwd'); }",
    "if (k === 'risky' || k === 'rules') { S.rulesFrom = 'home'; S.tab = 'plan'; goT('home', 'fwd'); } else if (k === 'stickers') { S.tab = 'progress'; goT('home', 'fwd'); setTimeout(() => ACT.goto('progress|wr-stickers'), 0); }")
rep("toast('All three are unlocked')", "toast('All six are unlocked')")

# ---------- 7: UK apps screen before Apple's picker ----------
rep("""<div class="card mt-5 p-4 flex gap-3 items-start rise" style="--d:120"><span class="tile w-10 h-10 bg-lav text-[20px]">${ic('shopping-bag-bold')}</span><p class="t-small"><span class="block t-title text-ink">Tick Shopping &amp; Food</span>It already holds Deliveroo, Just Eat, Uber Eats, SHEIN, Temu, ASOS and Vinted.</p></div>
<div class="card mt-3 p-4 flex gap-3 items-start rise" style="--d:140"><span class="tile w-10 h-10 bg-sun text-[20px]">${ic('piggy-bank-bold')}</span><p class="t-small"><span class="block t-title text-ink">Also worth shielding</span>Klarna, Clearpay and PayPal, under Finance. Pay later makes it feel free. Shielding the app won’t stop pay-later at checkout inside a shop app.</p></div>
<div class="card mt-4 p-2">""", """<div class="card mt-6 p-2">""")
rep("note('Next, Apple lists the apps on your phone. Pick them from Shopping &amp; Food.')", "note('Next, a quick tip on which apps to pick.')")
rep("\npicker: () => {", r"""
ukApps: () => `<div class="h-full flex flex-col">${obHead(3)}
<div class="flex-1 scroll px-7 pt-3">
<h1 class="t-h1 rise">Pick the apps that get you</h1>
<p class="mt-2 t-body rise" style="--d:60">Next, Apple shows your apps. Tick Shopping &amp; Food. It already includes:</p>
<div class="card mt-5 p-4 space-y-3 rise" style="--d:100">${[['D', '#5EE9B5', 'Deliveroo, Just Eat, Uber Eats'], ['S', '#FF8F78', 'SHEIN, Temu, ASOS, Vinted']].map(([l, c, t]) => `<div class="flex items-center gap-3"><span class="uk-l" style="background:${c}">${l}</span><span class="t-title">${t}</span></div>`).join('')}</div>
<div class="uk-also mt-3 p-4 rise" style="--d:160"><span class="wt-lab lilac">Also worth shielding</span><div class="mt-2.5 flex items-start gap-3"><span class="uk-l" style="background:#FFC94D">£</span><span><b class="block t-title">Klarna, Clearpay, PayPal</b><span class="block t-small">In Finance. Pay later makes it feel free.</span></span></div></div>
<p class="mt-4 t-small rise" style="--d:220">Shielding Klarna’s app won’t stop pay-later inside a shop’s own checkout. The pause on the shop app still catches you first.</p>
</div>${foot(btn('Open Apple’s app list', 'ukNext'))}</div>`,

picker: () => {""")
rep("permAllow() { S.permission = true; S.permDenied = false; S.pickerReturn = 'tags'; go('picker'); },",
    "permAllow() { S.permission = true; S.permDenied = false; go('ukApps'); },\n  ukNext() { S.pickerReturn = 'tags'; go('picker'); },")
rep("pickerCancel() { if (S.pickerReturn === 'apps') { S.tab = 'apps'; go('home'); } else go('screenTime'); },",
    "pickerCancel() { if (S.pickerReturn === 'apps') { S.tab = 'apps'; go('home'); } else go('ukApps'); },")

# ---------- 2: paywall as a free-week timeline ----------
between("paywall: () => {", "\nhome: () =>", r"""paywall: () => {
  const y = S.plan === 'yearly', rem = S.trialRemind !== false;
  const apps = S.picked.length ? S.picked : ['ubereats', 'amazon', 'shein'];
  const dt = (n) => new Date(Date.now() + n * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const price = y ? '£29.88 a year' : '£4.99 a month';
  const step = (c, t, d) => `<li class="pw-step"><i class="pw-dot" style="background:${c}"></i><span><b class="block">${t}</b><span class="block pw-sub">${d}</span></span></li>`;
  const planRow = (id, name, amt, on) => `<button class="pw-plan" role="radio" aria-checked="${on}" data-a="plan" data-arg="${id}"><span class="pw-radio" aria-hidden="true"></span><span class="flex-1 min-w-0">${name}</span><b class="tabular-nums">${amt}</b></button>`;
  /* The price billed stays the biggest number on the page (Apple's rule); "Due today £0.00" is smaller */
  return `<div class="h-full flex flex-col top-glow">
<div class="flex-1 scroll px-6 pt-14 pb-4">
<h1 class="t-h1 text-center rise" style="--d:40">Your free week</h1>
<div class="pw-card mt-5 rise" style="--d:100" aria-label="Your free week"><ol class="pw-tl">
${step('#4361FF', 'Today', `Shields go up on ${apps.length} app${apps.length === 1 ? '' : 's'}`)}
${step('#8B5CF6', `Day 5 · ${dt(5)}`, rem ? 'We remind you the plan starts soon' : 'No reminder. You turned it off below.')}
${step('#14163A', `Day 7 · ${dt(7)}`, `${price} starts. Cancel any time before.`)}
</ol><div class="pw-rule"></div>
<div class="pw-total"><span>Total</span><span>${price}</span></div>
<div class="pw-due"><span>Due today</span><span>£0.00</span></div></div>
<div class="mt-4 space-y-2.5 rise" style="--d:160" role="radiogroup" aria-label="Choose a plan">${planRow('yearly', 'Yearly · £2.49 a month', '£29.88', y)}${planRow('monthly', 'Monthly', '£4.99', !y)}</div>
<div class="pw-plan mt-2.5 rise" style="--d:200"><span class="text-sun text-[20px] flex">${ic('bell-ringing-bold')}</span><span class="flex-1">Remind me on day 5</span>${sw(rem, 'trialRemind', '', 'Remind me on day 5')}</div>
</div>
<footer class="flex-shrink-0 px-7 pt-3 pb-10 flex flex-col items-center gap-2">${btn('Start my free week', 'buy')}<p class="text-[12.5px] text-center text-ink2 font-semibold leading-snug">Cancel anytime in Settings at least 24 hours before your trial ends.</p><div class="flex gap-4 text-[12.5px] font-bold text-ink2"><button class="underline" data-a="restore">Restore purchases</button><button class="underline" data-a="legal" data-arg="Terms">Terms</button><button class="underline" data-a="legal" data-arg="Privacy">Privacy</button></div></footer>
</div>`;
},
""")

# ---------- 4: Today has one job ----------
rep("${S.tab === 'home' && S.subscribed && S.picked.length ? `<button class=\"proto-hint\" data-a=\"goHomeScreen\">${ic('hand-pointing-bold', 'text-[18px]')} Try the blocker: open an app</button>` : ''}", "")
rep("""  if (r) return out.join('') + row('hourglass-medium-bold', 'bg-mint', `${r} ready to decide`, 'You slept on it. Now you get the final say.', 'openRoom', 'ready');
  if (w.length) return out.join('') + row('hourglass-medium-bold', 'bg-hush text-azure-light', `${w.length} waiting their turn`, `Next one ready ${w[0].when}`, 'openRoom', 'waiting');
  return out.join('');""", "  return out.join('');")
between("function calmHome() {", "\nfunction rankCard() {", r"""const face = (on, big) => `<span class="st-face${on ? '' : ' off'}${big ? ' big' : ''}" aria-hidden="true"><i></i></span>`;
/* Today answers one question: am I protected, and what's waiting? */
function statusCard() {
  if (!S.subscribed) return `<section class="card st-card mt-5 rise" style="--d:30">${face(false)}<h2 class="mt-3 t-h2">No shields right now</h2><p class="mt-1 t-small">Your plan has ended, so your apps open with no pause.</p><div class="mt-4 w-full">${btn('See plans', 'resubscribe')}</div></section>`;
  const on = S.picked.filter(shielded), names = on.map((id) => nm(id));
  if (!S.protection) return `<section class="card st-card mt-5 rise" style="--d:30">${face(false)}<h2 class="mt-3 t-h2">Shields are off</h2><p class="mt-1 t-small">Your apps open with no pause right now.</p><div class="mt-4 w-full">${btn('Turn shields back on', 'protection')}</div></section>`;
  if (!on.length) return `<section class="card st-card mt-5 rise" style="--d:30">${face(false)}<h2 class="mt-3 t-h2">No apps shielded</h2><p class="mt-1 t-small">Pick the apps that get you, and Pausa puts a pause in front of them.</p><div class="mt-4 w-full">${btn('Choose apps', 'tab', 'primary', 'apps')}</div></section>`;
  const list = names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(', ');
  return `<section class="card st-card mt-5 rise" style="--d:30" aria-label="${on.length} apps are shielded">${face(true)}<h2 class="mt-3 t-h2">${on.length} app${on.length === 1 ? ' is' : 's are'} shielded</h2><p class="mt-1 t-small">${esc(list)}. ${risky() ? `It’s your risky hour, so pauses are ${realPauseSecs()} seconds.` : 'Pauses get longer from 22:00.'}</p></section>`;
}
function waitCard() {
  if (!S.subscribed) return '';
  const r = roomReady().length, w = roomWaiting();
  const card = (lab, n, t, d, arg, tone) => `<button class="card wt-card mt-3 w-full text-left rise" style="--d:60" data-a="openRoom" data-arg="${arg}"><span class="wt-lab ${tone}">${lab}</span><span class="mt-2 flex items-center gap-3"><span class="wt-n ${tone}">${n}</span><span class="flex-1 min-w-0"><b class="block t-title">${t}</b><span class="block t-small">${d}</span></span><span class="text-lg text-ink3">${ic('caret-right-bold')}</span></span></button>`;
  if (r) return card('Ready now', r, `${r} ready to decide`, 'You slept on it. Now you get the final say.', 'ready', 'mint');
  if (w.length) return card(`Ready at ${w[0].when.split(' ')[0]}`, w.length, `${w.length} parked want${w.length === 1 ? '' : 's'}`, `Decide with a clear head ${w[0].when.endsWith('today') ? 'later today' : 'tomorrow'}`, 'waiting', '');
  return `<div class="card wt-card mt-3 rise" style="--d:60"><span class="wt-lab muted">Waiting room</span><p class="mt-2 t-title">Nothing parked</p><p class="t-small">When a want hits, park it till morning.</p></div>`;
}
function calmHome() {
  const protect = fx === 'protect';
  const h = vhour(), part = h < 5 ? 'evening' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  S.stampFx = 0;
  const on = S.subscribed && S.protection;
  return `<div class="flex-1 scroll px-6 pt-14 pb-4">
<div class="flex items-center justify-between gap-2 rise"><h1 class="t-h1">Good ${part}</h1><span class="chip ${on ? 'chip-mint' : 'chip-paper'} text-[13px]${protect ? ' stamp-in ring-pulse' : ''}" style="--d:250;--rx:1.12;--ry:1.6;--pulse:#5EE9B5">${ic('shield-check-bold')} ${on ? 'Shields on' : 'Shields off'}</span></div>
${S.checkin ? `<button class="nudge mt-5 w-full rounded-[22px] bg-sun text-deep px-4 py-3.5 flex items-center gap-3 text-left shadow-[0_3px_0_#C9952A]" data-a="openCheckin"><span class="tile w-11 h-11 bg-white/60 text-[22px]">${ic('ticket-bold')}</span><span class="flex-1"><span class="block t-title">Your ${nm(S.checkin.app)} pass ended</span><span class="block text-[14px] font-semibold">How did it go?</span></span><span class="text-xl">${ic('caret-right-bold')}</span></button>` : ''}
${S.pass ? `<button class="ticket mt-5 w-full px-6 py-4 flex items-center gap-3 text-left rise" style="--d:30" data-a="openApp" data-arg="${S.pass.app}"><span class="w-11 h-11 bg-white rounded-full p-1.5 flex-shrink-0">${appArt(S.pass.app, 'w-full h-full')}</span><span class="flex-1 min-w-0"><span class="block t-title">${nm(S.pass.app)} pass</span><span class="block text-[14px] font-semibold leading-snug line-clamp-2 opacity-80">${esc(passLine(S.pass))}</span></span><span class="perf-v" aria-hidden="true"></span><span class="text-right w-[62px] flex-shrink-0"><span class="block t-num text-[24px] leading-none" data-countdown="pass">${fmt(passLeft())}</span><span class="block text-[12px] font-bold mt-0.5">left</span></span><span class="passbar" data-passbar style="width:${passPct()}%"></span></button>` : ''}
${statusCard()}
${waitCard()}
${S.subscribed && saleOn() ? `<div class="wr-sale mt-3 rise" style="--d:40"><b>It’s Black Friday week</b><span class="t-small">Waits are doubled until Monday.</span></div>` : ''}
${S.subscribed ? nextStep() : ''}
</div>
${S.subscribed && S.picked.length ? `<div class="flex-shrink-0 px-6 pt-2 pb-3 flex flex-col items-center gap-3"><button class="try-pill" data-a="goHomeScreen">${ic('hand-pointing-bold', 'text-[16px]')} Try the blocker: open an app</button>${!S.pass ? `<button class="pass-cta" data-a="planPass">Need to shop? Get a pass</button>` : ''}</div>` : ''}`;
}""")
# the calm-days card moves to Me
rep("${rankCard()}\n${meExtras()}", "${rankCard()}\n${heroCard(0)}\n${meExtras()}")

# ---------- 3: one true line in the pause ----------
between("function pauseFact(app, i) {", "\nfunction finishPause(", r"""function pauseFact(app, i) {
  const f = [], lo = leftOf(app), w = roomWaiting(), ch = CHALLENGES[S.challenge], nt = nextTreat(), h = vhour(), N = esc(nm(app));
  if (lo.of >= 2 && lo.left) {
    const prev = (S.log || []).find((e) => e.app === app && ['leave', 'park', 'shop'].includes(e.k));
    let last = '';
    if (prev) { const a = new Date(vnow()); a.setHours(0, 0, 0, 0); const b = new Date(prev.at); b.setHours(0, 0, 0, 0); const dd = Math.round((a - b) / 86400000); if (dd < 7) last = ` Last time was ${dd === 0 ? 'earlier today' : dd === 1 ? 'yesterday' : DAY_NAMES[(new Date(prev.at).getDay() + 6) % 7]} at ${hhmm(prev.at)}.`; }
    f.push(`You left ${N} <b>${lo.left} of the last ${lo.of} times</b>.${last}`);
  }
  if (w.length) f.push(w.length === 1 ? `<b>1 thing</b> is already parked, ready at ${w[0].when.split(' ')[0]}.` : `<b>${w.length} things</b> are parked, waiting their turn.`);
  if (ch.len) f.push(`Day <b>${Math.min(challengeDay(), ch.len)} of ${ch.len}</b> of your ${ch.name.toLowerCase()}.`);
  if (nt && nt !== 'Tonight') { const d = [0, 1, 2, 3, 4, 5, 6].find((k) => (S.treats || {})[(dow() + k) % 7]); f.push(`Your next treat night is <b>${nt}</b>${d > 1 ? `, ${d} days away` : ''}.`); }
  if (h >= 22 || h < 5) f.push(`It’s <b>${hhmm(vnow())}</b>. A want made this late can wait till 8.`);
  const wk = weekLog().filter((e) => e.k === 'leave').length;
  if (wk) f.push(`You’ve walked away <b>${wk} time${wk === 1 ? '' : 's'}</b> this week.`);
  if (!f.length) f.push('Most wants fade in a few minutes. <b>Watch this one.</b>');
  return { html: f[i % f.length], k: i % f.length, n: f.length };
}""")
rep("""${p.fact ? `<p class="pfact mt-4 rise" style="--d:200"><span class="text-[18px] flex-shrink-0">${ic('timer-bold')}</span><span>${esc(p.fact)}</span></p>` : ''}""",
    """${p.fact ? `<div class="pfact mt-4 rise" style="--d:200"><span class="text-[18px] flex-shrink-0 mt-px">${ic('clock-bold')}</span><span>${typeof p.fact === 'string' ? esc(p.fact) : p.fact.html}</span></div>${p.fact.n > 1 ? `<div class="pdots rise" style="--d:240" aria-hidden="true">${Array.from({ length: Math.min(p.fact.n, 5) }, (_, k) => `<i${k === p.fact.k % 5 ? ' class="on"' : ''}></i>`).join('')}</div>` : ''}` : ''}""")
rep("why = [p.risky ? 'risky hour' : '', p.sale ? 'sale week' : '']",
    "why = [p.risky ? (vhour() >= 22 || vhour() < 5 ? 'late night' : 'risky hour') : '', p.sale ? 'sale week' : '']")
rep("${p.real || p.secs}-second pause for ${nm(p.app)}", "${p.real || p.secs}-second pause · ${nm(p.app)}")

# ---------- 5: XP when the plan is kept ----------
rep("<span class=\"chip chip-lilac text-[13px]\">${ic('ticket-bold', 'text-[15px]')} Shopping pass</span></header>",
    "<span class=\"chip chip-sun text-[13px]\">${ic('lightning-bold', 'text-[15px]')} XP when you check in</span></header>")
rep("""<p class="mt-4 t-small flex items-center gap-1.5 rise" style="--d:460"><span class="text-mint">${ic('check-circle-fill')}</span> Check in afterwards: +10 XP for an honest answer</p>
""", "")
rep("note(`Drag the stub to tear it. ${nm(d.app)} locks again when your time’s up.`)",
    "note(`Check in afterwards: +10 XP for an honest answer. ${nm(d.app)} locks again when time’s up.`)")

# ---------- 6: a shield that knows it's late ----------
rep("""<div class="flex-1 flex flex-col items-center justify-center pt-10">${img('shieldm', 'w-28 h-28 cut')}
<h1 class="mt-6 text-[28px] font-bold leading-tight text-ink" style="font-family:inherit">${late ? `It’s ${hhmm(vnow())}.` : 'Hold on. Think twice.'}</h1>
<p class="mt-3 text-[17px] leading-snug text-ink2 whitespace-pre-line">${late ? [`${nm(id)} will still be there at 8.`, lo.of >= 2 && lo.left ? `You left it ${lo.left} of ${lo.of} times this week.` : lines[1] || ''].filter(Boolean).join('\\n') : lines.join('\\n')}</p></div>""",
    """<div class="flex-1 flex flex-col items-center justify-center pt-10">${late ? face(true, true) : img('shieldm', 'w-28 h-28 cut')}
<h1 class="mt-6 ${late ? 'text-[26px]' : 'text-[28px]'} font-bold leading-tight text-ink" style="font-family:inherit">${late ? `It’s ${hhmm(vnow())}. ${nm(id)} will still be there at 8.` : 'Hold on. Think twice.'}</h1>
<p class="mt-3 text-[17px] leading-snug text-ink2 whitespace-pre-line">${late ? (lo.of >= 2 && lo.left ? `You left it ${lo.left} of the last ${lo.of} times.` : lines[0]) : lines.join('\\n')}</p></div>""")

# ---------- 8: Sunday recap, counts only ----------
between("recap: () => {", "\ncheckin: () =>", r"""recap: () => {
  const L = weekLog(), n = (k) => L.filter((e) => e.k === k).length;
  const pauses = n('leave') + n('park') + n('shop'), parked = n('park'), letgo = n('letgo'), passes = L.filter((e) => e.k.startsWith('checkin:')).length, kept = n('checkin:plan') + n('checkin:nothing');
  const nx = RANKS[S.rank + 1], st = (S.got || []).length, late = L.filter((e) => ['leave', 'park', 'shop'].includes(e.k) && (new Date(e.at).getHours() >= 22 || new Date(e.at).getHours() < 5));
  const byDay = [0, 1, 2, 3, 4, 5, 6].map((d) => late.filter((e) => (new Date(e.at).getDay() + 6) % 7 === d).length), top = byDay.indexOf(Math.max(...byDay));
  const end = new Date(vnow()).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  const row = (t, v, c = '') => `<div class="rc2-row"><span>${t}</span><b class="${c}">${v}</b></div>`;
  return `<div class="h-full flex flex-col">
<header class="flex-shrink-0 px-6 pt-14 pb-1 flex items-center justify-between gap-3"><span class="rc2-date">${end}</span><button class="backbtn" data-a="recapDone" aria-label="Close">${ic('x-bold')}</button></header>
<div class="flex-1 scroll px-6 pb-6">
<h1 class="mt-2 t-h1 rise">Your week with Pausa</h1>
<div class="rc2-card mt-5 rise" style="--d:60" id="recapCard">${row('Pauses', pauses)}${row('You left it', n('leave'), 'mint')}${row('Parked, then let go', `${letgo} of ${parked}`)}${row('Passes kept to plan', `${kept} of ${passes}`)}</div>
<div class="rc2-card mt-3 py-3 flex items-center gap-3 rise" style="--d:100"><span class="rc2-star">${ic('star-fill')}</span><span class="flex-1 min-w-0"><b class="block text-[15.5px]">${nx ? `${nx.name} next` : 'Top rank reached'}</b><span class="block t-small">${nx ? `${fmtN(nx.xp - S.xp)} XP to go · ` : ''}${st} sticker${st === 1 ? '' : 's'} so far</span></span></div>
${late.length ? `<p class="mt-4 t-small rise" style="--d:140">Busiest night: ${DAY_NAMES[top]} after 22:00.</p>` : ''}
<p class="mt-2 t-small rise" style="--d:160">Counts from the last 7 days. Never pounds.</p>
</div>${foot(btn(`${ic('share-network-bold', 'text-xl')} Share my week`, 'shareWeek', 'ghost'))}</div>`;
},
""")

# ---------- test panel: one button per change ----------
rep("""${S.subscribed ? '' : '<p class="fine">Finish or skip setup first. Apps are only shielded once the free week starts.</p>'}</section>""",
    r"""${S.subscribed ? '' : '<p class="fine">Finish or skip setup first. Apps are only shielded once the free week starts.</p>'}</section>
<section class="pgroup"><h2>Market research changes</h2><div class="prow">${[['1', 'sparkle-fill', '1 · Week-one New card'], ['2', 'calendar-check-bold', '2 · Free-week paywall'], ['3', 'timer-bold', '3 · True line in the pause'], ['4', 'house-bold', '4 · Calmer Today'], ['5', 'ticket-bold', '5 · Pass: XP at check-in'], ['6', 'moon-stars-bold', '6 · Late-night shield'], ['7', 'shopping-bag-bold', '7 · UK apps screen'], ['8', 'calendar-check-bold', '8 · Sunday recap']].map(([k, i, l]) => `<button class="pbtn" data-p="mr:${k}">${ic(i)} ${l}</button>`).join('')}</div>
<p class="fine">1 shows the next “New” card on Today (they arrive on days 2 to 7). 6 turns on “Pretend it’s 23:10”. Setup itself (1 and 7) shows after Restart prototype.</p></section>""")
rep("  else if (p === 'passend') {", r"""  else if (p.startsWith('mr:')) { const k = p.slice(3);
    if (!S.subscribed && !['2', '7'].includes(k)) { toast('Skip setup first, then try this one'); return; }
    hideBanner(); S.sheet = null; renderOverlays();
    const app = (pref) => (S.picked.includes(pref) ? pref : S.picked.find(shielded) || S.picked[0]);
    const seed = (id) => { if (leftOf(id).of >= 3) return; const day = 86400000, base = vnow(); [['leave', 2, 23, 40], ['leave', 3, 22, 50], ['park', 4, 23, 5], ['leave', 5, 23, 30], ['leave', 6, 22, 15]].forEach(([e, ago, hr, mi]) => { const t = new Date(base - ago * day); t.setHours(hr, mi, 0, 0); S.log = [...(S.log || []), { at: t.getTime(), k: e, app: id }]; }); S.log.sort((x, y) => y.at - x.at); };
    if (k === '1') { const b = $('#panel [data-p="unlock"]'); if (b) b.click(); }
    else if (k === '2') goT('paywall', 'fade');
    else if (k === '3') { const id = app('ubereats'); seed(id); S.factI = -1; S.shieldApp = id; save(); ACT.startPause(); }
    else if (k === '4') { S.tab = 'home'; goT('home', 'fade'); }
    else if (k === '5') { const id = app('amazon'); S.draft = { app: id, reason: 'specific', need: '', limit: '', minutes: passDefault(), custom: false, waitUntil: 0 }; goT('pass', 'fade'); }
    else if (k === '6') { const id = app('ubereats'); S.night = true; seed(id); if (S.cool) delete S.cool[id]; S.shieldApp = id; save(); goT('shield', 'fade'); }
    else if (k === '7') goT('ukApps', 'fade');
    else if (k === '8') { const b = $('#panel [data-p="recap"]'); if (b) b.click(); }
  }
  else if (p === 'passend') {""")

rep("if (weekLog().length < 6) { const day = 86400000, base = vnow();", "if (!weekLog().some((e) => e.k === 'letgo' || e.k.startsWith('checkin:'))) { const day = 86400000, base = vnow();")
open(F, 'w', encoding='utf-8').write(s)
print('patch18s ok')
