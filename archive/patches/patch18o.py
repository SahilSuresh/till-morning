#!/usr/bin/env python3
"""v18 round 14: calmer rules. Your rules shows four short cards (challenge, treat nights, how long wants wait, when to shield); the extras fold under More rules. The setup rules screen is trimmed too."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# shorter challenge lines (used in setup and in Your rules)
rep("sub: '30 days of buying only what you need. Groceries and gifts are fine.'", "sub: 'Only what you need for 30 days. Groceries and gifts are fine.'")
rep("sub: 'Takeaways at the weekend, or on a treat night you plan.'", "sub: 'Takeaways only at weekends or on treat nights.'")

# ---------- setup: Set your rules ----------
rep("<p class=\"mt-2 t-body rise\" style=\"--d:60\">Decide now, while you’re calm. Pausa sticks to them when you’re not. Change them any time in Settings.</p>",
    "<p class=\"mt-2 t-body rise\" style=\"--d:60\">Decide now, while you’re calm. You can change them later.</p>")
rep("<h2 class=\"mt-6 t-h2 rise\" style=\"--d:160\">Treat nights</h2><p class=\"mt-1 t-small rise\" style=\"--d:160\">On these nights your takeaway apps open with a hello, not a pause. Tap to add or remove.</p>",
    "<h2 class=\"mt-6 t-h2 rise\" style=\"--d:160\">Treat nights</h2><p class=\"mt-1 t-small rise\" style=\"--d:160\">Takeaway apps open with a hello, not a pause.</p>")
rep("<div class=\"card mt-6 p-4 flex items-start gap-3 rise\" style=\"--d:220\"><span class=\"tile w-10 h-10 bg-hush text-azure-light text-[20px]\">${ic('hourglass-medium-bold')}</span><p class=\"t-small\"><b class=\"block t-title text-ink\">How long wants wait</b>Not sure what it costs? It waits till 08:00. Otherwise about 1 hour for every £10, and never ready in the middle of the night.</p></div>\n", "")

# ---------- Your rules ----------
i = s.index("function planTab() {")
j = s.index("\n}\n", i) + 3
s = s[:i] + r"""function planTab() {
  const ch = CHALLENGES[S.challenge], d = Math.min(challengeDay(), ch.len || 0), p = S.rulePrice || 68, open = S.openKeep || {};
  const card = (id, dl, inner) => `<section class="card mt-4 p-4 rise" id="${id}" style="--d:${dl}">${inner}</section>`;
  const row = (t, sub, end) => `<div class="px-4 py-3.5 border-t-[1.5px] border-[#23275E] flex items-center gap-3"><span class="flex-1 min-w-0"><span class="block t-title">${t}</span><span class="block t-small">${sub}</span></span>${end}</div>`;
  const pick = S.chPick || !ch.len;
  return `<div class="flex-1 scroll px-6 pt-14 pb-24">
<div class="flex items-center gap-3 rise"><button class="backbtn" data-a="rulesBack" aria-label="Back">${ic('arrow-left-bold')}</button><h1 class="t-h1">Your rules</h1></div><p class="mt-1 t-small rise">Set them while you’re calm.</p>
${card('wr-ch', 30, `<div class="flex items-center gap-3"><span class="tile w-11 h-11 ${ch.bg} text-[22px]">${ic(ch.icon)}</span><span class="flex-1 min-w-0"><span class="block text-[13px] font-bold text-ink3">Your challenge</span><b class="block t-title">${ch.len ? ch.name : 'None yet'}</b></span>${ch.len ? `<button class="text-[14.5px] font-bold text-azure-light px-1" data-a="chPick" aria-expanded="${pick}">${pick ? 'Done' : 'Change'}</button>` : ''}</div>
${ch.len ? `<div class="mt-3 flex items-center gap-3"><span class="flex-1 h-2 rounded-full bg-[#23275E] overflow-hidden block"><i class="block h-full rounded-full bg-gradient-to-r from-[#4361FF] to-[#8B5CF6]" style="width:${Math.max(3, Math.round(d / ch.len * 100))}%"></i></span><span class="t-small tabular-nums">Day ${d} of ${ch.len}</span></div>` : ''}
${pick ? `<div class="mt-3 space-y-2" role="radiogroup" aria-label="Your challenge">${Object.entries(CHALLENGES).map(([k, c]) => `<button class="opt w-full px-4 py-3 flex items-center gap-3" role="radio" aria-checked="${S.challenge === k}" data-a="challenge" data-arg="${k}"><span class="flex-1 min-w-0 text-left"><span class="block t-title">${c.name}</span><span class="block t-small">${c.sub}</span></span><span class="check round"></span></button>`).join('')}</div>` : ''}`)}
${card('wr-treats', 60, `<h2 class="t-h2">Treat nights</h2><p class="mt-1 t-small">Takeaway apps open with a hello, not a pause.</p>
<div class="wr-week mt-3" role="group" aria-label="Treat nights">${DAY_NAMES.map((n, i) => `<button data-a="treat" data-arg="${i}" aria-pressed="${!!(S.treats || {})[i]}" class="${i === dow() ? 'today' : ''}" aria-label="${n}${(S.treats || {})[i] ? ', treat night' : ''}">${n[0]}<small>${(S.treats || {})[i] ? 'Treat' : ''}</small></button>`).join('')}</div>`)}
${card('wr-rule', 90, `<h2 class="t-h2">How long wants wait</h2><p class="mt-1 t-small">About 1 hour for every £10, never ready at night. No price? It waits till 08:00.</p>
<details class="mt-2" data-keep="price"${open.price ? ' open' : ''}><summary class="inline-flex items-center gap-1 text-[14.5px] font-bold text-azure-light cursor-pointer">Try a price ${ic('caret-right-bold', 'rotate-90')}</summary>
<div class="wr-rule mt-3"><div class="flex items-center justify-between"><span class="t-small">If it costs</span><b class="t-num text-[26px]" id="rp">£${p}</b></div><input type="range" class="wr-range mt-1" data-in="rulePrice" min="5" max="200" step="1" value="${p}" aria-label="Price in pounds"><div class="mt-2">${ruleInner(p, 'r')}</div></div></details>`)}
${card('wr-when', 120, `<h2 class="t-h2">When to shield</h2><div class="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="When to shield">${[['all', 'All day'], ['evenings', 'Evenings'], ['weekends', 'Weekends']].map(([v, l]) => `<button class="tag text-center px-2" aria-pressed="${S.schedule === v}" data-a="schedule" data-arg="${v}">${l}</button>`).join('')}</div>`)}
<details class="card mt-4 overflow-hidden rise" id="wr-risk" data-keep="more" style="--d:150"${open.more ? ' open' : ''}><summary class="px-4 py-3.5 flex items-center gap-3 cursor-pointer"><span class="tile w-10 h-10 bg-hush text-azure-light text-[20px]">${ic('toggle-right-bold')}</span><span class="flex-1 min-w-0"><span class="block t-title">More rules</span><span class="block t-small">Late nights, sales, ask a friend</span></span><span class="text-xl text-ink3">${ic('caret-right-bold', 'rotate-90')}</span></summary>
${row('Late nights', `Pauses get longer from 22:00, when most of your wants start.`, risky() ? '<span class="chip chip-peach">Now</span>' : '')}
${row('Sale seasons', 'Waits double in Black Friday week and other big sales.', sw(S.sale, 'sale', '', 'Sale season shield'))}
${row('Prices as hours of work', 'Your take-home pay per hour', `<button class="backbtn w-9 h-9 text-[16px]" data-a="wage" data-arg="-1" aria-label="£1 less">−</button><span class="t-num text-[17px] w-10 text-center">£${S.wage}</span><button class="backbtn w-9 h-9 text-[16px]" data-a="wage" data-arg="1" aria-label="£1 more">${ic('plus-bold')}</button>`)}
${row('Ask a friend', 'Text a friend to let something over £50 skip the wait. Sends one iMessage.', sw(S.buddy, 'buddy', '', 'Ask a friend'))}
</details>
</div>`;
}
""" + s[j:]

rep("#scr .scroll.swiping { will-change: transform; }", "#scr .scroll.swiping { will-change: transform; }\n#wr-rule summary { list-style: none; } #wr-rule summary::-webkit-details-marker { display: none; }")
# challenge picker opens and closes; picking one closes it
rep("  challenge(arg) { if (!CHALLENGES[arg]) return; const was = S.challenge; S.challenge = arg;",
    "  chPick() { S.chPick = !S.chPick; go(S.screen); },\n  challenge(arg) { if (!CHALLENGES[arg]) return; const was = S.challenge; S.challenge = arg; if (arg !== 'none') S.chPick = false;")
# folded sections remember being open across re-draws
rep("/* VoiceOver and Switch Control activate with a click and no drag: let that start the pass too */",
    "document.addEventListener('toggle', (e) => { const k = e.target && e.target.dataset && e.target.dataset.keep; if (k) { S.openKeep = Object.assign({}, S.openKeep, { [k]: e.target.open }); } }, true);\n/* VoiceOver and Switch Control activate with a click and no drag: let that start the pass too */")

open(F, 'w', encoding='utf-8').write(s)
print('ok o', len(s))
