#!/usr/bin/env python3
"""v18 round 8: a night-sky picture for parked wants (Parked screen, decide screen, tour slide)."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


CSS = """.night-im { background: radial-gradient(circle at 80% 115%, rgba(255, 201, 77, .38), transparent 46%), linear-gradient(160deg, #1B2068 0%, #372C9A 55%, #7A4FE0 100%); overflow: hidden; display: flex; align-items: center; justify-content: center; }
.night-im .moon { position: absolute; top: 14px; left: 14px; width: 26px; height: 26px; border-radius: 50%; box-shadow: 7px -4px 0 0 #FFE7A3; filter: drop-shadow(0 0 8px rgba(255, 231, 163, .55)); }
.night-im .st { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #FFFFFF; animation: twinkle 2.6s ease-in-out infinite; }
@keyframes twinkle { 0%, 100% { opacity: .9; } 50% { opacity: .25; } }
.night-im .hill { position: absolute; left: -10%; right: -10%; bottom: -34px; height: 62px; border-radius: 50%; background: rgba(13, 15, 46, .5); }
.night-im .obj { position: relative; width: 60px; height: 60px; border-radius: 17px; background: #FFFFFF; padding: 8px; display: flex; box-shadow: 0 0 0 7px rgba(255, 255, 255, .13), 0 12px 26px rgba(4, 5, 24, .45); animation: bob 3.2s ease-in-out infinite; }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.night-im .z { position: absolute; right: -26px; top: -18px; color: #DDE3FF; font-weight: 800; font-size: 15px; line-height: 1; }
.night-im .z small { font-size: 11px; margin-left: 2px; vertical-align: super; }
.night-im .tm { position: absolute; right: 10px; bottom: 9px; background: rgba(255, 255, 255, .16); color: #FFFFFF; border-radius: 999px; padding: 3px 9px; font-size: 11.5px; font-weight: 800; }
@media (prefers-reduced-motion: reduce) { .night-im .obj, .night-im .st { animation: none; } }
"""
rep(".wr-bigtag { background:", CSS + ".wr-bigtag { background:")

rep("const bigTag = (t, stampText) => `<div class=\"wr-bigtag\"><div class=\"im\" style=\"background:linear-gradient(135deg,${GRADS[t.g % GRADS.length]})\"><span class=\"lg\">${appArt(t.app, 'w-full h-full', nm(t.app))}</span></div>",
    "const nightArt = (app, when) => `<span class=\"moon\"></span>${[[38, 22], [62, 12], [84, 30], [24, 58], [72, 54], [52, 34]].map(([x, y], i) => `<i class=\"st\" style=\"left:${x}%;top:${y}%;animation-delay:${i * .4}s\"></i>`).join('')}<span class=\"hill\"></span><span class=\"obj\">${appArt(app, 'w-full h-full', nm(app))}<span class=\"z\">z<small>z</small></span></span>${when ? `<span class=\"tm\">${when}</span>` : ''}`;\n"
    "const bigTag = (t, stampText) => `<div class=\"wr-bigtag\"><div class=\"im night-im\">${nightArt(t.app, t.when && t.when !== 'now' && stampText !== 'Ready' ? `Ready ${t.when.split(' ')[0]}` : '')}</div>")

# Tour slide 1 uses the same picture
i = s.index("art: () => `<div class=\"wr-mini\">${[['Something from SHEIN'")
j = s.index("` },", i)
s = s[:i] + "art: () => `<div class=\"flex justify-center\">${bigTag({ app: 'shein', name: 'Something from SHEIN', band: 'unsure', price: 0, g: 1, when: '08:00 tomorrow' }, 'Decide 08:00 tomorrow')}</div>" + s[j:]

open(F, 'w', encoding='utf-8').write(s)
print('ok i', len(s))
