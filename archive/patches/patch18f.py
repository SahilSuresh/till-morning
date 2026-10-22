#!/usr/bin/env python3
"""v18 round 5: Settings back in the tab bar and trimmed to essentials; the spending buddy explained plainly."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# ---------- Tab bar: 4 tabs. The current one is a wide pill with its name, the others are icons with a small label ----------
rep("display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }", "display: flex; gap: 4px; }")
rep(".tabbar button { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 7px; border-radius: 999px; font-size: 14.5px; font-weight: 800; color: #8E93CC; transition: background .25s, color .25s; }",
    ".tabbar button { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; border-radius: 999px; font-size: 10.5px; font-weight: 800; color: #8E93CC; transition: flex-grow .3s var(--ease), background .25s, color .25s; }\n"
    ".tabbar button[aria-current=\"page\"] { flex-grow: 1.7; flex-direction: row; gap: 7px; font-size: 14.5px; }")
rep("[['home', 'house-bold', 'Today'], ['room', 'hourglass-medium-bold', 'Waiting'], ['progress', 'user-bold', 'Me']].map(([id, i, l]) => { const on = S.tab === id || (id === 'progress' && ['settings', 'apps', 'plan'].includes(S.tab));",
    "[['home', 'house-bold', 'Today'], ['room', 'hourglass-medium-bold', 'Waiting'], ['progress', 'user-bold', 'Me'], ['settings', 'gear-six-bold', 'Settings']].map(([id, i, l]) => { const on = S.tab === id || (id === 'settings' && ['apps', 'plan'].includes(S.tab));")
# Me loses its gear (Settings is a tab again)
rep("<div class=\"flex items-center justify-between rise\"><h1 class=\"t-h1\">Me</h1><button class=\"backbtn\" data-a=\"tab\" data-arg=\"settings\" aria-label=\"Settings\">${ic('gear-six-bold')}</button></div>",
    "<h1 class=\"t-h1 rise\">Me</h1>")

# ---------- Settings: the essentials up front, the rest folded away ----------
i = s.index("function settingsTab() {")
j = s.index("\n}\n", i) + 3
s = s[:i] + r"""function settingsTab() {
  const day = S.trialAt ? Math.min(7, Math.floor((Date.now() - S.trialAt) / 86400000) + 1) : null;
  const seg = (key, opts, a, label) => `<div class="mt-3 grid gap-2" style="grid-template-columns:repeat(${opts.length},minmax(0,1fr))" role="group" aria-label="${label}">${opts.map(([v, l]) => `<button class="tag text-center px-2" aria-pressed="${S[key] === v}" data-a="${a}" data-arg="${v}">${l}</button>`).join('')}</div>`;
  const row = (inner, first) => `<div class="px-4 py-3.5${first ? '' : ' border-t-[1.5px] border-[#23275E]'}">${inner}</div>`;
  const link = (a, arg, i, tile, t, d, first) => `<button class="w-full px-4 py-3.5 flex items-center gap-3 text-left${first ? '' : ' border-t-[1.5px] border-[#23275E]'}" data-a="${a}" data-arg="${arg}"><span class="tile w-10 h-10 ${tile} text-[20px]">${ic(i)}</span><span class="flex-1 min-w-0"><span class="block t-title">${t}</span><span class="block t-small">${d}</span></span><span class="text-xl text-ink3">${ic('caret-right-bold')}</span></button>`;
  const head = (t, d) => `<h2 class="mt-6 mb-2 t-h2 rise" style="--d:${d}">${t}</h2>`;
  return `<div class="flex-1 scroll px-6 pt-14 pb-24">
<h1 class="t-h1 rise">Settings</h1>
<div class="card mt-5 overflow-hidden rise" style="--d:40">
${row(`<div class="flex items-center gap-3"><span class="tile w-10 h-10 bg-mint text-[20px]">${ic('shield-check-bold')}</span><span class="flex-1"><span class="block t-title">Shield my apps</span><span class="block t-small">${S.protection ? 'On. Your apps open with a pause.' : 'Off. Your apps open straight away.'}</span></span>${sw(S.protection, 'protection', '', 'Shield my apps')}</div>`, true)}
${link('tab', 'apps', 'squares-four-bold', 'bg-lav', 'Your apps', `${S.picked.length} protected`)}
${link('tab', 'plan', 'calendar-check-bold', 'bg-sun', 'Your rules', 'Challenge, treat nights, how long wants wait')}
</div>
${head('Pause', 60)}<div class="card overflow-hidden rise" style="--d:80">
${row(`<p class="t-title">How long the pause lasts</p>${seg('pauseLen', PAUSE_OPTS.map((v) => [v, v < 60 ? `${v} s` : '1 min']), 'pauseLen', 'Pause length')}${S.fast ? '<p class="mt-2 text-[12.5px] font-semibold text-ink3">Fast timers are on in this preview, so the pause lasts 5 seconds.</p>' : ''}`, true)}
${row(`<p class="t-title">When to shield</p>${seg('schedule', [['all', 'All day'], ['evenings', 'Evenings'], ['weekends', 'Weekends']], 'schedule', 'When to shield')}`)}
</div>
<details class="card mt-6 overflow-hidden rise" style="--d:100"><summary class="px-4 py-3.5 flex items-center gap-3 cursor-pointer"><span class="tile w-10 h-10 bg-hush text-azure-light text-[20px]">${ic('toggle-right-bold')}</span><span class="flex-1"><span class="block t-title">More options</span><span class="block t-small">Budget, shield message, cool-off and more</span></span><span class="text-xl text-ink3">${ic('caret-right-bold', 'rotate-90')}</span></summary>
${row(`<div class="flex items-center gap-3"><span class="flex-1 min-w-0"><span class="block t-title">Monthly budget</span><span class="block t-small">${budgetSummary()}</span></span><button class="link text-azure-light text-[15px]" data-a="editBudget" data-arg="settings">Edit</button></div>`)}
${row(`<label for="smsg" class="t-title block">Your shield message</label><p class="t-small">Shown first on every shield, in your own words.</p><input id="smsg" data-in="shieldMsg" value="${esc(S.shieldMsg)}" maxlength="60" autocomplete="off" placeholder="e.g. Is this worth an hour of work?" class="field mt-3 w-full px-4 py-3 text-[16px] font-semibold">`)}
${row(`<label for="sgoal" class="t-title block">What you’re saving for</label><input id="sgoal" data-in="goal" value="${esc(S.goal)}" maxlength="40" autocomplete="off" placeholder="e.g. a Japan trip" class="field mt-3 w-full px-4 py-3 text-[16px] font-semibold">`)}
${row(`<p class="t-title">Cool-off after you leave</p><p class="t-small">The app stays locked this long after you walk away.</p>${seg('coolOff', [[0, 'Off'], [5, '5 min'], [10, '10 min'], [30, '30 min']], 'coolOff', 'Cool-off length')}`)}
${row(`<div class="flex items-center gap-3"><span class="flex-1"><span class="block t-title">Ask “What’s this one about?”</span><span class="block t-small">A question in the pause, with a short coach reply</span></span>${sw(S.askQuestion, 'askQuestion', '', 'Ask a question during the pause')}</div>`)}
${row(`<p class="t-title">Shopping Pass lengths</p><p class="t-small">In minutes</p><div class="mt-3 grid grid-cols-3 gap-2">${[0, 1, 2].map((k) => `<label class="relative block"><span class="sr-only">Pass length ${k + 1} in minutes</span><input data-in="passMin" data-arg="${k}" value="${esc((S.passMins || [])[k] ?? '')}" inputmode="numeric" maxlength="3" autocomplete="off" class="field w-full pl-4 pr-12 py-3 text-[17px] font-semibold"><span class="absolute right-3.5 top-1/2 -translate-y-1/2 t-small" aria-hidden="true">min</span></label>`).join('')}</div>`)}
${row(`<div class="flex items-center gap-3"><span class="flex-1 min-w-0"><span class="block t-title">Bank limit</span><span class="block t-small">${S.bankLock ? `Set ${lockDays()} day${lockDays() === 1 ? '' : 's'} ago, self-reported` : 'Optional: a card limit your bank enforces'}</span></span><button class="link text-azure-light text-[15px]" data-a="openGuide" data-arg="settings">${S.bankLock ? 'Steps' : 'Set up'}</button></div>${S.bankLock ? '<button class="mt-3 text-[14px] font-bold text-ink3 underline" data-a="unlockBank">I removed my card limit</button>' : ''}`)}
</details>
${head('Subscription and privacy', 120)}<div class="card overflow-hidden rise" style="--d:140">
${row(`<p class="t-title">${S.plan === 'yearly' ? 'Yearly, £29.88 a year' : 'Monthly, £4.99 a month'}</p>${day ? `<p class="t-small">Free trial, day ${day} of 7</p>` : ''}`, true)}
${row(`<div class="flex gap-3 items-center"><span class="tile w-10 h-10 bg-mint text-[20px]">${ic('lock-key-bold')}</span><p class="text-[14.5px] font-semibold">Everything stays on this phone. No bank links, no account.</p></div>`)}
</div>
<button class="mt-6 w-full py-2 font-bold text-[#FF9F8A] rise" style="--d:160" data-a="askDelete">Delete all data</button>
</div>`;
}
""" + s[j:]
rep("<div class=\"flex items-center gap-3 rise\"><button class=\"backbtn\" data-a=\"tab\" data-arg=\"progress\" aria-label=\"Back to Me\">${ic('arrow-left-bold')}</button><h1 class=\"t-h1\">Settings</h1></div>\n", "", 0)

# ---------- Spending buddy: say what it does ----------
rep("<span class=\"block t-title\">Spending buddy: Sam</span><span class=\"block t-small\">For wants over £50, ask Sam to let one skip the wait. It goes through iCloud Messages: no Pausa account, but it does leave your phone.</span>",
    "<span class=\"block t-title\">Ask a friend</span><span class=\"block t-small\">When you park something over £50, a button lets you text a friend (here, Sam): “Can this skip the wait?” If Sam says yes, it’s ready straight away. If not, it waits as normal. Sent as a normal iMessage, so that one message leaves your phone. Off unless you turn it on.</span>")
rep("Ask Sam to let it skip the wait</button>", "Ask Sam if it can skip the wait</button>")
rep("'Sent through iCloud Messages. Waiting for a reply.'", "'Sent as an iMessage. Waiting for Sam to reply.'")

open(F, 'w', encoding='utf-8').write(s)
print('ok f', len(s))
