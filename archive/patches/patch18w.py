#!/usr/bin/env python3
"""v18 round 21: the app is now called Till Morning. Text only; code names (inPausa, openPausa, 'pausa') stay."""
import sys, re
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=None):
    global s
    n = s.count(old)
    if n == 0 or (count is not None and n != count):
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


rep('Pausa card', 'Morning card')
rep('Pausa words each shield to fit the habit.', 'Each shield is worded to fit the habit.')
rep('Your cool-off length is in Pausa’s Settings.', 'Your cool-off length is in Settings.')
rep('The same as your Pausa budget.', 'The same as your monthly budget.')
s, n = re.subn(r'(?<![A-Za-z_$])Pausa(?![A-Za-z_$])', 'Till Morning', s)
print('patch18w ok', n)
open(F, 'w', encoding='utf-8').write(s)
