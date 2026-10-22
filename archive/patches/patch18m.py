#!/usr/bin/env python3
"""v18 round 12: the setup tour shows the checkout screenshot reward, folded into the Shop with a plan slide (no extra slide)."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


rep("t: 'Shop with a plan', d: 'Say what you need and set a limit, then tear the ticket. The app opens for a set time and locks again by itself.'",
    "t: 'Shop with a plan', d: 'Set a limit and the app opens for a while, then locks again. Stayed under? Show your checkout screenshot for bonus XP and a rare sticker.'")
rep("<div class=\"flex items-center justify-center gap-2 text-[14px] font-bold text-cream/80\">${ic('hand-pointing-bold')} Tear the ticket to start</div>` },",
    "<div class=\"mini-card flex items-center gap-3\"><span class=\"w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0\" style=\"background:linear-gradient(135deg,#FFE38F,#B48CFF)\"><img src=\"${IMG.receipt}\" alt=\"\" class=\"w-10 h-10\"></span><span class=\"flex-1 min-w-0\"><span class=\"sp-chip\">Proof only</span><b class=\"block t-title mt-1\">Under your limit</b><span class=\"block t-small\">Spent £12.99 of £15</span></span><span class=\"chip chip-mint flex-shrink-0\">+15 XP</span></div>` },")

open(F, 'w', encoding='utf-8').write(s)
print('ok m', len(s))
