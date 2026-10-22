#!/usr/bin/env python3
"""v18 round 6: a short 'Set your rules' step in setup, before the paywall."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


rep("const ONB = ['welcome', 'story', 'pain', 'screenTime', 'picker', 'demo', 'roomIntro', 'paywall'];",
    "const ONB = ['welcome', 'story', 'pain', 'screenTime', 'picker', 'demo', 'roomIntro', 'rules', 'paywall'];")
rep("const w = (k) => Math.round(k / 5 * 100);", "const w = (k) => Math.round(k / 6 * 100);")
rep('aria-valuemax="5"', 'aria-valuemax="6"')
rep("roomIntro: 'The waiting room (intro)',", "roomIntro: 'The waiting room (intro)', rules: 'Set your rules',")
rep("  treat(arg) { const i = +arg; S.treats = { ...(S.treats || {}) }; if (S.treats[i]) delete S.treats[i]; else S.treats[i] = true; go('home');",
    "  treat(arg) { const i = +arg; S.treats = { ...(S.treats || {}) }; if (S.treats[i]) delete S.treats[i]; else S.treats[i] = true; go(S.onboarded ? 'home' : S.screen);")
rep("roomIntro: () => `", r"""rules: () => `<div class="h-full flex flex-col">${obHead(6)}
<div class="flex-1 scroll px-7 pt-2 pb-2">
<h1 class="t-h1 rise">Set your rules</h1>
<p class="mt-2 t-body rise" style="--d:60">Decide now, while you’re calm. Pausa sticks to them when you’re not. Change them any time in Settings.</p>
<h2 class="mt-6 t-h2 rise" style="--d:100">Pick a challenge</h2>
<div class="mt-3 space-y-2 rise" style="--d:120" role="radiogroup" aria-label="Pick a challenge">${Object.entries(CHALLENGES).map(([k, c]) => `<button class="opt w-full px-4 py-3 flex items-center gap-3" role="radio" aria-checked="${S.challenge === k}" data-a="challenge" data-arg="${k}"><span class="tile w-10 h-10 ${c.bg} text-[20px]">${ic(c.icon)}</span><span class="flex-1 min-w-0 text-left"><span class="block t-title">${c.name}</span><span class="block t-small">${c.sub}</span></span><span class="check round"></span></button>`).join('')}</div>
<h2 class="mt-6 t-h2 rise" style="--d:160">Treat nights</h2><p class="mt-1 t-small rise" style="--d:160">On these nights your takeaway apps open with a hello, not a pause. Tap to add or remove.</p>
<div class="wr-week mt-3 rise" style="--d:180" role="group" aria-label="Treat nights">${DAY_NAMES.map((n, i) => `<button data-a="treat" data-arg="${i}" aria-pressed="${!!(S.treats || {})[i]}" aria-label="${n}${(S.treats || {})[i] ? ', treat night' : ''}">${n[0]}<small>${(S.treats || {})[i] ? 'Treat' : ''}</small></button>`).join('')}</div>
<div class="card mt-6 p-4 flex items-start gap-3 rise" style="--d:220"><span class="tile w-10 h-10 bg-hush text-azure-light text-[20px]">${ic('hourglass-medium-bold')}</span><p class="t-small"><b class="block t-title text-ink">How long wants wait</b>Not sure what it costs? It waits till 08:00. Otherwise about 1 hour for every £10, and never ready in the middle of the night.</p></div>
</div>${foot(btn(S.challenge === 'none' ? 'Continue' : 'Start my challenge', 'next'))}</div>`,

roomIntro: () => `""")

open(F, 'w', encoding='utf-8').write(s)
print('ok g', len(s))
