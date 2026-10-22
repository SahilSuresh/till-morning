#!/usr/bin/env python3
"""v18 round 3: calm mode. Fewer setup screens, 3 tabs, a one-card Today, a quieter pause, one-tap Park it."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# ---------- Setup: 8 screens again (challenge and goal move to Settings) ----------
rep("const ONB = ['welcome', 'story', 'pain', 'screenTime', 'picker', 'demo', 'roomIntro', 'challenge', 'goal', 'paywall'];",
    "const ONB = ['welcome', 'story', 'pain', 'screenTime', 'picker', 'demo', 'roomIntro', 'paywall'];")
rep("const w = (k) => Math.round(k / 7 * 100);", "const w = (k) => Math.round(k / 5 * 100);")
rep('aria-valuemax="7"', 'aria-valuemax="5"')
rep("challenge: 'nobuy', challengeAt: null", "challenge: 'none', challengeAt: null")
rep("schedule: 'all', askQuestion: true,", "schedule: 'all', askQuestion: false,")

# Waiting room intro: one idea, not three
old_intro_start = "<h1 class=\"t-h1 rise\">Every want waits its turn</h1>\n<p class=\"mt-2 t-body rise\" style=\"--d:60\">Blockers only lock the app. Pausa also holds the thing you wanted in a waiting room, so you can sleep on it.</p>"
rep(old_intro_start,
    "<h1 class=\"t-h1 rise\">Not now. Maybe tomorrow.</h1>\n<p class=\"mt-2 t-body rise\" style=\"--d:60\">When you want something, you don’t have to fight it. Park it, and decide in the morning with a clear head.</p>")
i = s.index("<div class=\"card mt-6 p-2 rise\" style=\"--d:200\">${[['hourglass-medium-bold', 'bg-azure', 'Unplanned wants wait'")
j = s.index("</div>\n</div>${foot(btn('Got it', 'next'))}</div>`,", i)
s = s[:i] + "<p class=\"mt-6 t-body text-center rise\" style=\"--d:200\">No name or price needed. Let it go and you get a little parcel.</p>" + s[j + len("</div>"):]

# ---------- Tabs: Today, Waiting, Me ----------
rep("[['home', 'house-bold', 'Today'], ['room', 'hourglass-medium-bold', 'Waiting'], ['plan', 'calendar-check-bold', 'Plan'], ['progress', 'user-bold', 'Me'], ['settings', 'gear-six-bold', 'Settings']].map(([id, i, l]) => { const on = S.tab === id || (id === 'settings' && S.tab === 'apps');",
    "[['home', 'house-bold', 'Today'], ['room', 'hourglass-medium-bold', 'Waiting'], ['progress', 'user-bold', 'Me']].map(([id, i, l]) => { const on = S.tab === id || (id === 'progress' && ['settings', 'apps', 'plan'].includes(S.tab));")
rep("({ home: homeTab, room: roomTab, plan: planTab, apps: appsTab, progress: progressTab, settings: settingsTab }[S.tab] || homeTab)()",
    "({ home: calmHome, room: roomTab, plan: planTab, apps: appsTab, progress: progressTab, settings: settingsTab }[S.tab] || calmHome)()")

# Settings and Rules get a back button to Me
rep("<h1 class=\"t-h1 rise\">Settings</h1><p class=\"mt-1 t-body rise\" style=\"--d:40\">Make Pausa work your way.</p>",
    "<div class=\"flex items-center gap-3 rise\"><button class=\"backbtn\" data-a=\"tab\" data-arg=\"progress\" aria-label=\"Back to Me\">${ic('arrow-left-bold')}</button><h1 class=\"t-h1\">Settings</h1></div>\n"
    "<button class=\"card mt-5 w-full p-4 flex items-center gap-3 text-left rise\" style=\"--d:40\" data-a=\"tab\" data-arg=\"plan\"><span class=\"tile w-11 h-11 bg-sun text-[22px]\">${ic('calendar-check-bold')}</span><span class=\"flex-1 min-w-0\"><span class=\"block t-title\">Your rules</span><span class=\"block t-small\">Challenge, treat nights and how long wants wait</span></span><span class=\"text-xl text-ink3\">${ic('caret-right-bold')}</span></button>")
rep("<button class=\"card mt-5 w-full p-4 flex items-center gap-3 text-left rise\" style=\"--d:50\" data-a=\"tab\" data-arg=\"apps\">",
    "<button class=\"card mt-3 w-full p-4 flex items-center gap-3 text-left rise\" style=\"--d:50\" data-a=\"tab\" data-arg=\"apps\">")
rep("<p class=\"t-small rise\">Decide calmly, ahead of time</p><h1 class=\"t-h1 rise\">Plan</h1>",
    "<div class=\"flex items-center gap-3 rise\"><button class=\"backbtn\" data-a=\"tab\" data-arg=\"settings\" aria-label=\"Back to Settings\">${ic('arrow-left-bold')}</button><h1 class=\"t-h1\">Your rules</h1></div><p class=\"mt-1 t-small rise\">Decide calmly, ahead of time. All optional.</p>")
rep(". Set it in Plan.</p>", ". Change it in Settings.</p>")

# ---------- Today: one card, one next step ----------
rep("S.parcels ? 'There’s a parcel for you. Tap the yellow tile.'", "S.parcels ? 'There’s a parcel for you, just below.'")
rep("<p class=\"text-[13px] font-bold opacity-90 relative\">${n} of 10 stamps, one for each day you shop on purpose. A full card gets +50 XP and a parcel.</p>",
    "<p class=\"text-[13px] font-bold opacity-90 relative\">${n} of 10 calm days</p>")

CALM = r'''
/* Calm Today: one card, at most one next step, then the pass button. Everything else lives in Me. */
function nextStep() {
  const r = roomReady().length, w = roomWaiting();
  const row = (i, tile, t, d, a, arg) => `<button class="card mt-4 w-full p-4 flex items-center gap-3 text-left rise" style="--d:60" data-a="${a}"${arg ? ` data-arg="${arg}"` : ''}><span class="tile w-11 h-11 ${tile} text-[22px]">${ic(i)}</span><span class="flex-1 min-w-0"><span class="block t-title">${t}</span><span class="block t-small">${d}</span></span><span class="text-xl text-ink3">${ic('caret-right-bold')}</span></button>`;
  if (r) return row('hourglass-medium-bold', 'bg-mint', `${r} ready to decide`, 'You slept on it. Now you get the final say.', 'openRoom', 'ready');
  if (S.parcels) return row('package-bold', 'bg-sun', S.parcels > 1 ? `${S.parcels} parcels to open` : 'A parcel to open', 'A sticker, for letting go', 'openParcel', '');
  if (w.length) return row('hourglass-medium-bold', 'bg-hush text-azure-light', `${w.length} waiting their turn`, `Next one ready ${w[0].when}`, 'openRoom', 'waiting');
  return '';
}
function calmHome() { /* bottom padding leaves room for the try-it pill */
  const protect = fx === 'protect';
  const h = new Date().getHours(), part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  const sfx = S.stampFx || 0; S.stampFx = 0;
  return `<div class="flex-1 scroll px-6 pt-14 pb-20">
<div class="flex items-center justify-between gap-2 rise"><h1 class="t-h1">Good ${part}</h1><span class="chip ${S.protection ? 'chip-mint' : 'chip-paper'} text-[13px]${protect ? ' stamp-in ring-pulse' : ''}" style="--d:250;--rx:1.12;--ry:1.6;--pulse:#5EE9B5">${ic('shield-check-bold')} ${S.protection ? 'Shield on' : 'Shield off'}</span></div>
${S.checkin ? `<button class="nudge mt-5 w-full rounded-[22px] bg-sun text-deep px-4 py-3.5 flex items-center gap-3 text-left shadow-[0_3px_0_#C9952A]" data-a="openCheckin"><span class="tile w-11 h-11 bg-white/60 text-[22px]">${ic('ticket-bold')}</span><span class="flex-1"><span class="block t-title">Your ${nm(S.checkin.app)} pass ended</span><span class="block text-[14px] font-semibold">How did it go?</span></span><span class="text-xl">${ic('caret-right-bold')}</span></button>` : ''}
${S.pass ? `<button class="ticket mt-5 w-full px-6 py-4 flex items-center gap-3 text-left rise" style="--d:30" data-a="openApp" data-arg="${S.pass.app}"><span class="w-11 h-11 bg-white rounded-full p-1.5 flex-shrink-0">${appArt(S.pass.app, 'w-full h-full')}</span><span class="flex-1 min-w-0"><span class="block t-title">${nm(S.pass.app)} pass</span><span class="block text-[14px] font-semibold leading-snug line-clamp-2 opacity-80">${esc(passLine(S.pass))}</span></span><span class="perf-v" aria-hidden="true"></span><span class="text-right w-[62px] flex-shrink-0"><span class="block t-num text-[24px] leading-none" data-countdown="pass">${fmt(passLeft())}</span><span class="block text-[12px] font-bold mt-0.5">left</span></span><span class="passbar" data-passbar style="width:${passPct()}%"></span></button>` : ''}
${heroCard(sfx)}
${S.subscribed && saleOn() ? `<div class="wr-sale mt-4 rise" style="--d:40"><b>It’s Black Friday week</b><span class="t-small">Waits are doubled until Monday.</span></div>` : ''}
${S.subscribed ? nextStep() : ''}
${S.subscribed && !S.pass && S.picked.length ? `<button class="mt-6 w-full py-2 flex items-center justify-center gap-2 font-bold text-azure-light rise" style="--d:80" data-a="planPass">${ic('ticket-bold', 'text-xl')} Need to shop? Plan it with a Shopping Pass</button>` : ''}
</div>`;
}
function rankCard() {
  const r = RANKS[S.rank], nx = RANKS[S.rank + 1];
  const pctOf = (xp) => (nx ? Math.round(Math.max(0, Math.min(1, (xp - r.xp) / (nx.xp - r.xp))) * 100) : 100);
  const pct = pctOf(S.xp), gain = S.xp - shownXp, from = S.rank !== shownRank ? r.xp : shownXp, grow = gain > 0;
  shownXp = S.xp; shownRank = S.rank;
  return `<div class="rankcard relative mt-4 px-5 pt-5 pb-4 rise" style="--d:40"><div class="flex items-center gap-4"><span class="w-14 h-14 bg-white sticker rounded-full flex items-center justify-center text-[28px]">${ic(r.icon)}</span><div class="flex-1 min-w-0"><p class="text-[14px] font-bold">${r.name}</p><p class="t-h2">${r.title}</p></div></div>
<div class="mt-4 h-3 bg-white/25 rounded-full overflow-hidden"><div class="xpfill h-full bg-sun rounded-full${grow ? ' grow' : ''}" style="width:${pct}%;--from:${pctOf(from)}%"></div></div>
<div class="mt-2 flex justify-between text-[14px] font-bold tabular-nums"><span>${nx ? `<span${grow ? ` data-count="${from}" data-to="${S.xp}"` : ''}>${fmtN(S.xp)}</span> / ${fmtN(nx.xp)} XP` : `${fmtN(S.xp)} XP`}</span><span>${nx ? `${fmtN(nx.xp - S.xp)} XP to ${nx.name}` : 'Top rank'}</span></div></div>`;
}
function heroCard('''
rep("\nfunction heroCard(", CALM)

# ---------- Me: rank card, stickers, note, decisions. Rules tucked away. ----------
i = s.index("function progressTab() {")
j = s.index("<h2 class=\"mt-7 t-h2 rise\" style=\"--d:380\">How XP works</h2>", i)
s = s[:i] + """function progressTab() {
  return `<div class="flex-1 scroll px-6 pt-14 pb-5">
<div class="flex items-center justify-between rise"><h1 class="t-h1">Me</h1><button class="backbtn" data-a="tab" data-arg="settings" aria-label="Settings">${ic('gear-six-bold')}</button></div>
${rankCard()}
${meExtras()}
""" + s[j:]
rep("<h2 class=\"mt-7 t-h2 rise\" style=\"--d:380\">How XP works</h2>\n<div class=\"card mt-2 p-2 rise\" style=\"--d:400\">",
    "<details class=\"card mt-4 p-2 rise\" style=\"--d:400\"><summary class=\"px-3 py-2 t-title cursor-pointer\">How XP works</summary>")
rep("Up to 3 parcels a day.</p></div>", "Up to 3 parcels a day.</p></details>")
rep("<h2 class=\"mt-7 t-h2 rise\" style=\"--d:420\">Recent decisions</h2>", "<h2 class=\"mt-6 t-h2 rise\" style=\"--d:420\">Recent decisions</h2>")
# drop the coach panel from Me (the question is off by default now)
i = s.index("<section class=\"card mt-4 p-4 rise\" style=\"--d:160\"><h2 class=\"t-h2\">What the coach has noticed</h2>")
j = s.index("</section>`;\n}", i)
s = s[:i] + "`;\n}" + s[j + len("</section>`;\n}"):]

# ---------- Pause: two clear choices, no XP noise ----------
rep("I’ll leave it <span class=\"chip chip-mint\">+10 XP</span></button>", "I’ll leave it</button>")
rep("Park it till morning <span class=\"chip chip-sun\">+5 XP</span></button>", "Park it till morning</button>")
rep("<button class=\"pchoice btn btn-ghost\" data-a=\"shopPlan\"${done ? '' : ' disabled'}>${ic('ticket-bold', 'text-[20px]')} ${ch.allowed ? `It’s ${ch.allowed}` : 'Shop with a plan'} <span class=\"chip chip-sun\">+5 XP</span></button>",
    "<button class=\"pchoice w-full py-1.5 text-[15px] font-bold text-cream/80 underline disabled:opacity-40\" data-a=\"shopPlan\"${done ? '' : ' disabled'}>${ch.allowed ? `It’s ${ch.allowed}` : 'I need it now'}</button>")
rep("${done ? 'Pick what feels right' : 'Choices unlock when the timer ends'}", "${done ? 'Whatever you pick is fine' : 'Just breathe. Choices come in a moment.'}")

# ---------- Park it: one tap by default, details only if you want them ----------
rep("  park: () => { const k = S.park; if (!k) return ''; const ex = k.band === 'exact'; return `<div class=\"sheet-wrap items-end\"><div class=\"sheet-in w-full",
    "  park: () => { const k = S.park; if (!k) return ''; const ex = k.band === 'exact';\n"
    "  if (!k.more && !ex && k.from !== 'share' && !k.name) return `<div class=\"sheet-wrap items-end\"><div class=\"sheet-in w-full bg-[#14173F] border-t-[1.5px] border-[#2E3374] rounded-t-[30px] px-6 pt-3 pb-9\" role=\"dialog\" aria-label=\"Park it till morning\"><div class=\"mx-auto mb-4 w-10 h-1.5 rounded-full bg-[#343A80]\"></div>\n"
    "<h2 class=\"t-h2 text-[24px]\">Park it till morning</h2><p class=\"mt-1 t-small\">You don’t need to know what it is or what it costs. ${nm(k.app)} stays shielded, and you decide with a clear head.</p>\n"
    "<div class=\"mt-5 rounded-[22px] bg-[#1C2057] px-5 py-4 flex items-center gap-4\"><span class=\"tile w-12 h-12 bg-hush text-azure-light text-[24px]\">${ic('moon-stars-bold')}</span><span><span class=\"block t-small\">Ready</span><span class=\"block t-num text-[24px] leading-tight\">${waitFor(0, 'unsure').when}</span></span></div>\n"
    "<div class=\"mt-5 space-y-2\">${btn(ic('hourglass-medium-bold', 'text-xl') + ' Park it', 'doPark')}<button class=\"w-full py-2 font-bold text-azure-light\" data-a=\"parkMore\">Add what it is or a rough price</button><button class=\"w-full py-1 font-semibold text-ink3\" data-a=\"parkCancel\">Cancel</button></div></div></div>`;\n"
    "  return `<div class=\"sheet-wrap items-end\"><div class=\"sheet-in w-full")
rep("role=\"dialog\" aria-label=\"Park it in the waiting room\">", "role=\"dialog\" aria-label=\"Park it in the waiting room\"${k.still ? ' style=\"animation:none\"' : ''}>")
rep("<h2 class=\"t-h2 text-[24px]\">Park it till morning</h2><p class=\"mt-1 t-small\">Don’t know exactly what, or what it costs? That’s fine, nothing here is required. ${nm(k.app)} stays shielded while it waits.</p>",
    "<h2 class=\"t-h2 text-[24px]\">Park it till morning</h2><p class=\"mt-1 t-small\">All of this is optional. ${nm(k.app)} stays shielded while it waits.</p>")
rep("  parkBand(arg) {", "  parkMore() { const k = S.park; if (!k) return; k.more = true; k.still = true; renderOverlays(); },\n  openRoom(arg) { S.tab = 'room'; S.roomView = arg; go('home'); },\n  parkBand(arg) {")
rep("k.snapping = true; renderOverlays();", "k.snapping = true; k.still = true; renderOverlays();")

rep("if (h) h.textContent = 'Pick what feels right';", "if (h) h.textContent = 'Whatever you pick is fine';")

open(F, 'w', encoding='utf-8').write(s)
print('ok d', len(s))
