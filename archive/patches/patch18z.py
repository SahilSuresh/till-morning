#!/usr/bin/env python3
"""v18 round 24: +5 XP for turning shields back on (the switch, "Turn them back on now", or fixing Screen Time access).
Once a day, inside the 60 XP daily cap, so switching off and on again can't farm it."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


rep("const offTill = () =>", """function shieldsOnXp() { rollDay(); if (S.onXpDay === S.day) return ''; S.onXpDay = S.day; const r = award(5, 'Turned your shields back on', null); if (r.up) setTimeout(rankBanner, 1400); return r.give ? `+${r.give} XP · ` : ''; }
const offTill = () =>""")
rep("  protection() { S.protection = !S.protection; if (!S.protection) breakDay('you switched your shields off'); const t = S.protection ? -1 : loseOnce('shieldsOff', LOSS.shieldsOff, 'Switched every shield off'); go('home'); toast(S.protection ? 'Shields are back on' : lossMsg(t, 'Shields are off')); },",
    "  protection() { S.protection = !S.protection; if (!S.protection) breakDay('you switched your shields off'); const t = S.protection ? -1 : loseOnce('shieldsOff', LOSS.shieldsOff, 'Switched every shield off'), m = S.protection ? shieldsOnXp() : ''; go('home'); toast(S.protection ? m + 'Shields are back on' : lossMsg(t, 'Shields are off')); },")
rep("  offEnd() { S.offUntil = 0; fx = 'protect'; S.tab = 'home'; go('home'); toast('Shields are back on'); },",
    "  offEnd() { S.offUntil = 0; const m = shieldsOnXp(); fx = 'protect'; S.tab = 'home'; go('home'); toast(m + 'Shields are back on'); },")
rep("if (S.permFix) { S.permFix = false; S.accessLost = false; S.sheet = null; fx = 'protect'; S.tab = 'home'; go('home'); toast('Screen Time access is back. Shields are up.'); return; }",
    "if (S.permFix) { S.permFix = false; S.accessLost = false; S.sheet = null; const m = shieldsOnXp(); fx = 'protect'; S.tab = 'home'; go('home'); toast(m + 'Shields are back on'); return; }")

open(F, 'w', encoding='utf-8').write(s)
print('patch18z ok')
