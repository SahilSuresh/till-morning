#!/usr/bin/env python3
"""v18 round 22: app icon is now "Sleepy bag" (chosen 2026-10-22) wherever the app's own icon shows:
home-screen tile, Apple rating pop-up, notification banner, Safari extension header. In-app pause stamps/glyphs unchanged."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


GRAD = 'linear-gradient(135deg, #5B76FF 0%, #3241D6 100%)'
rep('.pausa-icon { background: linear-gradient(135deg, #4F6BFF 0%, #8B5CF6 100%); color: #FFFFFF; }',
    f'.pausa-icon {{ background: {GRAD}; color: #FFFFFF; overflow: hidden; }}\n.pausa-icon > svg, .bicon > svg {{ width: 100%; height: 100%; display: block; }}')
rep('.bicon { width: 38px; height: 38px; border-radius: 9px; background: linear-gradient(135deg, #4F6BFF 0%, #8B5CF6 100%);',
    f'.bicon {{ width: 38px; height: 38px; border-radius: 9px; overflow: hidden; background: {GRAD};')

SVG = ('<svg viewBox="0 0 100 100" aria-hidden="true">'
       '<ellipse cx="50" cy="86" rx="26" ry="4" fill="#1C2399" opacity=".45"/>'
       '<path d="M38.5 42 v-6.5 a11.5 11.5 0 0 1 23 0 V42" fill="none" stroke="#F3F2FF" stroke-width="5" stroke-linecap="round"/>'
       '<path d="M26 40 h48 l-3.4 40.5 a5 5 0 0 1 -5 4.5 h-31.2 a5 5 0 0 1 -5 -4.5 Z" fill="#F3F2FF"/>'
       '<path d="M33 57.5 q5 4.6 10 0 M57 57.5 q5 4.6 10 0" fill="none" stroke="#1B2266" stroke-width="3.4" stroke-linecap="round"/>'
       '<path d="M68 20 h8.5 l-8.5 9 h8.5" fill="none" stroke="#C9D3FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
       '<path d="M79.5 12 h4.5 l-4.5 4.8 h4.5" fill="none" stroke="#C9D3FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>'
       '</svg>')
rep('const ICONS = {', f"/* App icon: Sleepy bag */\nconst APP_ICON = '{SVG}';\nconst ICONS = {{")

# home-screen tile
rep('''pausa-icon flex items-center justify-center text-[30px] shadow-sm">${ic('pause-bold')}</span>''',
    '''pausa-icon flex items-center justify-center text-[30px] shadow-sm">${APP_ICON}</span>''')
# rating pop-up
rep('''pausa-icon flex items-center justify-center text-[30px]">${ic('pause-bold')}</span>''',
    '''pausa-icon flex items-center justify-center text-[30px]">${APP_ICON}</span>''')
# banner + Safari extension header
rep('''<span class="bicon">${ic('pause-bold')}</span>''', '''<span class="bicon">${APP_ICON}</span>''', 2)

open(F, 'w', encoding='utf-8').write(s)
print('patch18x ok')
