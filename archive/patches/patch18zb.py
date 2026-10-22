#!/usr/bin/env python3
"""v18 round 26: the whole Morning card opens the calm-day page; Back returns to the same scroll spot in Me."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


rep("""return `<section class="wr-hero mt-5 rise" style="--d:30" aria-label="Morning card, ${n} of 10 stamps">""",
    """return `<section class="wr-hero mt-5 rise" style="--d:30;cursor:pointer" role="button" tabindex="0" data-a="goalOpen" data-arg="cape" aria-label="Morning card, ${n} of 10 calm days. Show what a calm day is">""")
rep("""${n} of 10 calm days · <button class="underline" data-a="goalOpen" data-arg="cape">What’s a calm day?</button></p>""",
    """${n} of 10 calm days · <span class="underline">What’s a calm day?</span></p>""")
rep("  goalOpen(arg) { S.goalK = arg; goT('goal', 'fwd'); },",
    "  goalOpen(arg) { const sc = $('#scr .scroll'); S.goalScroll = S.screen === 'home' && sc ? sc.scrollTop : 0; S.goalTab = S.screen === 'home' ? S.tab : 'progress'; S.goalK = arg; goT('goal', 'fwd'); },")
rep("  goalBack() { S.tab = 'progress'; nextT = 'back'; go('home'); setTimeout(() => { const el = document.getElementById('wr-stickers'), sc = $('#scr .scroll'); if (el && sc) sc.scrollTop = Math.max(0, el.offsetTop - 12); }, 60); },",
    "  goalBack() { const y = S.goalScroll || 0; S.tab = S.goalTab || 'progress'; nextT = 'back'; go('home'); const sc = $('#scr .scroll'); if (sc) sc.scrollTop = y; },")
open(F, 'w', encoding='utf-8').write(s)
print('patch18zb ok')
