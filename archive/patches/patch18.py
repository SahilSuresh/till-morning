#!/usr/bin/env python3
"""Build Pausa prototype v18: v17's full flow plus the Waiting Room ideas."""
import sys

SRC = '/mnt/project-files/handoff/Pausa prototype.html'
OUT = sys.argv[1]

src = open(SRC, encoding='utf-8').read()
lines = src.split('\n')
# drop the publish skeleton (first 8 lines) and the closing body/html
assert lines[7].strip() == '<body>', lines[7]
body = '\n'.join(lines[8:])
body = body.rstrip()
assert body.endswith('</html>')
body = body[: body.rfind('</body>')].rstrip() + '\n'
s = body


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count} match(es), found {n}: {old[:90]!r}')
    s = s.replace(old, new)


# ---------- title ----------
rep('<title>Pausa Prototype</title>', '<title>Pausa Prototype v18</title>')
rep('<h1>Pausa prototype</h1>', '<h1>Pausa prototype, version 18</h1>')
rep('<p>A clickable skeleton of the iPhone app, built from your screens. Tap through setup, then open a shopping app from the iPhone home screen to try the shield.</p>',
    '<p>The whole app from the first screen: setup, the paywall, then the app with the waiting room inside. Every want waits its turn, planned treats skip the queue, and letting go earns a sticker parcel.</p>')

# ---------- CSS ----------
rep('display: grid; grid-template-columns: repeat(4, 1fr); padding: 7px 0 30px; }',
    'display: grid; grid-template-columns: repeat(5, 1fr); padding: 7px 0 30px; }')
rep('.tabico { font-size: 22px; padding: 3px 16px;', '.tabico { font-size: 22px; padding: 3px 13px;')

CSS = r'''
/* v18: the waiting room, challenges, treat nights and parcels.
   Patterns from ScreensDesign: Answer.AI hero streak card and colour tiles, QUITTR segmented ring,
   Stompers tear-open foil pack, Luvu reward reveal, bless want list with countdowns. */
.tabbar button { position: relative; }
.tabbadge { position: absolute; top: -2px; left: 50%; margin-left: 9px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 99px; background: #FF8F78; color: #14163A; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #0D0F2E; }
.wr-hero { position: relative; border-radius: 26px; padding: 16px; background: linear-gradient(135deg, #5A48F2 0%, #3D5AFE 100%); box-shadow: 0 4px 0 #2A3BC0, 0 18px 40px rgba(67, 97, 255, .3); color: #FFFFFF; display: grid; gap: 12px; overflow: hidden; }
.wr-hero::after { content: ''; position: absolute; right: -40px; top: -60px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(closest-side, rgba(255, 255, 255, .22), transparent); pointer-events: none; }
.wr-hero .top { display: grid; grid-template-columns: 74px 1fr; gap: 10px; align-items: center; position: relative; z-index: 1; }
.wr-hero .top img { width: 74px; height: 74px; object-fit: contain; filter: drop-shadow(0 6px 10px rgba(0, 0, 0, .3)); }
.wr-say { background: rgba(13, 15, 46, .35); border-radius: 14px 14px 14px 4px; padding: 8px 10px; font-size: 13.5px; font-weight: 700; line-height: 1.35; }
.wr-track { display: grid; grid-template-columns: repeat(10, 1fr) 36px; align-items: center; position: relative; z-index: 1; }
.wr-track::before { content: ''; position: absolute; left: 10px; right: 30px; top: 50%; height: 6px; transform: translateY(-50%); border-radius: 9px; background: rgba(13, 15, 46, .35); }
.wr-track .fill { position: absolute; left: 10px; top: 50%; height: 6px; transform: translateY(-50%); border-radius: 9px; background: #5EE9B5; }
.wr-node { position: relative; justify-self: center; width: 22px; height: 22px; border-radius: 50%; background: #2B2F8A; border: 2px solid rgba(255, 255, 255, .25); display: flex; align-items: center; justify-content: center; font-size: 12px; color: #14163A; }
.wr-node.done { background: #5EE9B5; border-color: #5EE9B5; }
.wr-node.now { background: #FFFFFF; border-color: #FFFFFF; box-shadow: 0 0 0 4px rgba(255, 255, 255, .3), 0 0 16px #FFFFFF; }
.wr-node.missed { background: #3A2350; border-color: #FF8F78; color: #FFAB98; }
.wr-chest { position: relative; justify-self: end; width: 32px; height: 26px; border-radius: 5px; background: linear-gradient(#FFD46E, #E7A500); box-shadow: 0 0 14px rgba(255, 201, 77, .8); }
.wr-chest::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 6px; transform: translateX(-50%); background: #FFF1C9; }
.wr-chest::after { content: ''; position: absolute; left: -2px; right: -2px; top: 6px; height: 3px; background: #C88A00; }
.wr-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.wr-tile { border-radius: 22px; padding: 12px; min-height: 128px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; text-align: left; position: relative; overflow: hidden; transition: translate .08s, box-shadow .08s; }
.wr-tile:active { translate: 0 3px; }
.wr-tile .ico { width: 40px; height: 40px; border-radius: 50%; background: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.wr-tile .arr { position: absolute; top: 14px; right: 14px; font-size: 18px; opacity: .9; }
.wr-tile b { font: 600 17px/1.1 'Fredoka', ui-rounded, system-ui, sans-serif; display: block; position: relative; }
.wr-tile .sub { font-size: 12.5px; font-weight: 700; opacity: .9; line-height: 1.3; display: block; margin-top: 2px; position: relative; }
.wr-tile .bgnum { position: absolute; right: -4px; bottom: -16px; font: 600 74px/1 'Fredoka', ui-rounded, system-ui, sans-serif; opacity: .14; }
.wr-tile.t-blue { background: linear-gradient(150deg, #5B76FF, #3D4FE0); box-shadow: 0 4px 0 #2A3BC0; color: #FFFFFF; }
.wr-tile.t-blue .ico { color: #3D4FE0; }
.wr-tile.t-purple { background: linear-gradient(150deg, #A06BFF, #7E3FF2); box-shadow: 0 4px 0 #5427B8; color: #FFFFFF; }
.wr-tile.t-purple .ico { color: #7E3FF2; }
.wr-tile.t-coral { background: linear-gradient(150deg, #FFA28E, #FF7A63); box-shadow: 0 4px 0 #C8503C; color: #14163A; }
.wr-tile.t-coral .ico { color: #E0573E; }
.wr-tile.t-amber { background: linear-gradient(150deg, #FFD46E, #FFB82E); box-shadow: 0 4px 0 #C88A00; color: #14163A; }
.wr-tile.t-amber .ico { color: #C88A00; }
.wr-tile.t-amber.has .ico { animation: wr-bob 1.6s ease-in-out infinite; }
@keyframes wr-bob { 50% { transform: translateY(-3px) rotate(-6deg); } }
.wr-sale { background: linear-gradient(120deg, #3A1430, #2A1638); border: 1.5px solid rgba(255, 143, 120, .5); border-radius: 20px; padding: 12px 14px; }
.wr-sale b { color: #FFAB98; font: 600 17px/1.2 'Fredoka', ui-rounded, system-ui, sans-serif; display: block; }
.wr-seg { display: grid; grid-template-columns: repeat(3, 1fr); background: #12153A; border: 1.5px solid #282C68; border-radius: 99px; padding: 4px; gap: 4px; }
.wr-seg button { border-radius: 99px; padding: 8px 4px; font-weight: 800; font-size: 13.5px; color: #B4B6E4; }
.wr-seg button[aria-selected="true"] { background: #4361FF; color: #FFFFFF; box-shadow: 0 3px 0 #2A3BC0; }
.wr-tag { background: #F2F0FF; color: #14163A; border-radius: 18px; padding: 12px; display: grid; grid-template-columns: 74px 1fr; gap: 12px; position: relative; box-shadow: 0 3px 0 #C9C4EE; }
.wr-tag:nth-child(odd) { rotate: -.8deg; }
.wr-tag:nth-child(even) { rotate: .6deg; }
.wr-tag::after { content: ''; position: absolute; top: 12px; right: 12px; width: 9px; height: 9px; border-radius: 50%; background: #0D0F2E; }
.wr-tag.isready { box-shadow: 0 3px 0 #9BE8CB, 0 0 0 2px #5EE9B5, 0 0 26px rgba(94, 233, 181, .35); }
.wr-tag .nm { font-weight: 800; font-size: 16px; padding-right: 16px; line-height: 1.25; }
.wr-tag .meta { color: #5D6192; font-size: 12.5px; font-weight: 700; line-height: 1.3; }
.wr-tag .foot { display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-top: 2px; }
.wr-tag .when { font-weight: 800; font-size: 12.5px; color: #2A3BC0; }
.wr-tag .when.ok { color: #1F8A62; }
.wr-tag .left { background: #E7E4FB; color: #2A3BC0; border-radius: 99px; padding: 3px 10px; font-weight: 800; font-size: 12px; font-variant-numeric: tabular-nums; }
.wr-tag .go { background: #4361FF; color: #FFFFFF; border-radius: 99px; padding: 7px 14px; font-weight: 800; font-size: 13.5px; box-shadow: 0 3px 0 #2A3BC0; }
.wr-cring { position: relative; width: 74px; height: 74px; flex: none; }
.wr-cring svg { position: absolute; inset: 0; transform: rotate(-90deg); }
.wr-cring .thumbin { position: absolute; inset: 8px; border-radius: 50%; overflow: hidden; }
.wr-cring .lg { position: absolute; right: 7px; bottom: 7px; width: 22px; height: 22px; border-radius: 7px; background: #FFFFFF; padding: 2px; display: flex; }
.wr-shelf { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.wr-shelf div { border-radius: 14px; padding: 7px; aspect-ratio: 1 / 1; display: flex; align-items: flex-end; font-size: 11.5px; font-weight: 800; color: #FFFFFF; filter: grayscale(.75) brightness(.78); text-shadow: 0 1px 3px rgba(0, 0, 0, .6); line-height: 1.2; }
.wr-shelf div.new { filter: none; box-shadow: 0 0 0 2px #5EE9B5; }
.wr-empty { color: #8A8EC6; font-size: 14px; font-weight: 600; text-align: center; padding: 16px; border: 1.5px dashed #343A80; border-radius: 18px; line-height: 1.45; }
.wr-segring { width: 168px; height: 168px; margin: 8px auto 0; position: relative; display: flex; align-items: center; justify-content: center; }
.wr-segring svg { position: absolute; inset: 0; }
.wr-segring b { font: 600 36px/1 'Fredoka', ui-rounded, system-ui, sans-serif; text-align: center; position: relative; }
.wr-segring b small { display: block; font: 700 12px/1.2 'Figtree', system-ui, sans-serif; color: #8A8EC6; margin-top: 4px; }
.wr-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
.wr-week button { aspect-ratio: 1 / 1.3; border-radius: 12px; background: #12153A; border: 1.5px solid #282C68; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font-weight: 800; font-size: 13px; color: #8A8EC6; }
.wr-week button small { font-size: 9.5px; font-weight: 800; }
.wr-week button[aria-pressed="true"] { background: rgba(139, 92, 246, .35); border-color: #B48CFF; color: #FFFFFF; }
.wr-week button.today { box-shadow: 0 0 0 2px #93A5FF; }
.wr-rule { background: #12153A; border: 1.5px solid #282C68; border-radius: 16px; padding: 12px 14px; }
.wr-range { width: 100%; accent-color: #4361FF; height: 28px; }
.wr-hours { display: grid; grid-template-columns: repeat(24, 1fr); gap: 2px; align-items: end; height: 58px; }
.wr-hours i { display: block; border-radius: 3px 3px 1px 1px; background: rgba(147, 165, 255, .35); }
.wr-hours i.hot { background: #FF8F78; }
.wr-hours i.nowh { outline: 2px solid #FFFFFF; outline-offset: 1px; }
.wr-axis { display: flex; justify-content: space-between; font-size: 11px; color: #8A8EC6; font-weight: 800; margin-top: 4px; }
.wr-stickers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.wr-stickers > div { aspect-ratio: 1 / 1; border-radius: 16px; background: #12153A; border: 1.5px solid #282C68; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.wr-stickers img { width: 88%; height: 88%; object-fit: contain; }
.wr-stickers .lock { color: #4A4F95; font: 600 22px 'Fredoka', ui-rounded, system-ui, sans-serif; }
.wr-stickers .fresh { box-shadow: 0 0 0 2px #FFC94D, 0 0 20px rgba(255, 201, 77, .4); }
.wr-wave { display: flex; gap: 3px; align-items: center; height: 30px; }
.wr-wave i { width: 4px; border-radius: 4px; background: #C7B2FF; display: block; }
.wr-wave.play i { animation: wr-wv .9s ease-in-out infinite; }
.wr-wave.play i:nth-child(3n) { animation-delay: -.3s; }
.wr-wave.play i:nth-child(3n + 1) { animation-delay: -.6s; }
@keyframes wr-wv { 50% { transform: scaleY(.35); } }
.wr-mic { width: 112px; height: 112px; border-radius: 50%; background: linear-gradient(180deg, #5B76FF, #4361FF); box-shadow: 0 5px 0 #2A3BC0, 0 0 0 10px rgba(67, 97, 255, .18); color: #FFFFFF; font-size: 46px; display: flex; align-items: center; justify-content: center; }
.wr-mic.on { background: linear-gradient(180deg, #FF8F78, #FF6A50); box-shadow: 0 5px 0 #C8503C, 0 0 0 10px rgba(255, 143, 120, .22); animation: wr-pulse 1.2s ease-in-out infinite; }
@keyframes wr-pulse { 50% { box-shadow: 0 5px 0 #C8503C, 0 0 0 20px rgba(255, 143, 120, .08); } }
.wr-voice { background: rgba(255, 255, 255, .12); border: 1.5px solid rgba(255, 255, 255, .2); border-radius: 18px; padding: 10px 12px; display: grid; grid-template-columns: 36px 1fr; gap: 10px; align-items: center; text-align: left; width: 100%; }
.wr-voice .pl { width: 36px; height: 36px; border-radius: 50%; background: #FFFFFF; color: #2C24A3; display: flex; align-items: center; justify-content: center; font-size: 15px; }
.wr-voice small { display: block; color: rgba(255, 255, 255, .72); font-weight: 800; font-size: 11.5px; }
.wr-voice span.t { font-size: 14px; font-weight: 600; line-height: 1.35; }
.wr-coach { background: rgba(13, 15, 46, .45); border-radius: 16px; padding: 10px 12px; font-size: 14px; font-weight: 600; line-height: 1.4; display: grid; grid-template-columns: 28px 1fr; gap: 9px; text-align: left; color: #FFFFFF; }
.wr-coach .av { width: 28px; height: 28px; border-radius: 9px; background: rgba(255, 255, 255, .18); display: flex; align-items: center; justify-content: center; font-size: 14px; }
.wr-full { background: radial-gradient(120% 70% at 50% 20%, #2A2D7A, #0D0F2E 65%); }
.wr-bigtag { background: #F2F0FF; color: #14163A; border-radius: 20px; padding: 14px; display: grid; gap: 6px; text-align: left; rotate: -2deg; position: relative; width: 100%; max-width: 300px; box-shadow: 0 10px 40px rgba(0, 0, 0, .45); animation: wr-drop .55s cubic-bezier(.3, 1.4, .5, 1) both; }
.wr-bigtag::after { content: ''; position: absolute; top: 14px; right: 14px; width: 11px; height: 11px; border-radius: 50%; background: #0D0F2E; }
.wr-bigtag .im { height: 118px; border-radius: 14px; position: relative; }
.wr-bigtag .im .lg { position: absolute; right: 10px; bottom: 10px; width: 34px; height: 34px; border-radius: 10px; background: #FFFFFF; padding: 4px; display: flex; }
.wr-bigtag b { font-size: 18px; font-weight: 800; }
.wr-bigtag .meta { color: #5D6192; font-weight: 700; font-size: 13.5px; }
.wr-tagstamp { justify-self: start; border: 2.5px solid #2A3BC0; color: #2A3BC0; border-radius: 8px; padding: 2px 9px; font-weight: 800; font-size: 13.5px; rotate: -6deg; margin-top: 4px; animation: stamp .5s var(--spring) .45s both; }
@keyframes wr-drop { from { transform: translateY(-60px) rotate(-10deg); opacity: 0; } }
.wr-burst { background: radial-gradient(circle at 50% 45%, rgba(255, 201, 77, .35), transparent 55%), repeating-conic-gradient(from 0deg at 50% 45%, #1A1C55 0 12deg, #12143F 12deg 24deg); }
.wr-burst.dim { background: radial-gradient(circle at 50% 45%, rgba(147, 165, 255, .25), transparent 55%), repeating-conic-gradient(from 0deg at 50% 45%, #1A1C55 0 12deg, #12143F 12deg 24deg); }
.wr-xpill { background: rgba(13, 15, 46, .75); border: 1.5px solid #282C68; border-radius: 99px; padding: 6px 12px; font: 600 16px 'Fredoka', ui-rounded, system-ui, sans-serif; display: flex; gap: 7px; align-items: center; position: relative; color: #FFFFFF; }
.wr-xpill i { width: 16px; height: 16px; border-radius: 50%; background: #FFC94D; box-shadow: 0 0 10px #FFC94D; display: block; }
.wr-xpill .plus { position: absolute; right: 8px; top: -24px; color: #FFC94D; font-size: 18px; animation: wr-flyup 1.2s ease-out forwards; }
@keyframes wr-flyup { from { transform: translateY(20px); opacity: 0; } 30% { opacity: 1; } to { transform: translateY(-6px); opacity: 1; } }
.wr-pack { position: relative; width: 156px; height: 206px; display: block; touch-action: none; }
.wr-pack .body { position: absolute; inset: 24px 0 0; border-radius: 12px; background: linear-gradient(115deg, #5EE9B5 0%, #93A5FF 35%, #C7B2FF 55%, #5EE9B5 80%, #93A5FF 100%); background-size: 200% 200%; animation: wr-holo 3s linear infinite; box-shadow: 0 0 50px rgba(147, 165, 255, .6), inset 0 0 0 2px rgba(255, 255, 255, .35); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.wr-pack .body::after { content: ''; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, .55) 50%, transparent 65%); background-size: 250% 100%; animation: wr-shine 2.2s ease-in-out infinite; }
@keyframes wr-holo { to { background-position: 200% 200%; } }
@keyframes wr-shine { from { background-position: 150% 0; } to { background-position: -100% 0; } }
.wr-pack .body span { width: 76px; height: 76px; border-radius: 50%; background: rgba(255, 255, 255, .88); display: flex; align-items: center; justify-content: center; font-size: 36px; color: #4361FF; position: relative; z-index: 1; }
.wr-pack .strip { position: absolute; left: 0; right: 0; top: 0; height: 32px; border-radius: 12px 12px 0 0; background: linear-gradient(90deg, #4361FF, #8B5CF6); clip-path: polygon(0 0, 100% 0, 100% 70%, 92% 100%, 83% 70%, 75% 100%, 67% 70%, 58% 100%, 50% 70%, 42% 100%, 33% 70%, 25% 100%, 17% 70%, 8% 100%, 0 70%); transition: transform .5s cubic-bezier(.3, 1.3, .5, 1), opacity .5s; }
.wr-pack.torn .strip { transform: translate(64px, -74px) rotate(28deg); opacity: 0; }
.wr-pack.torn { animation: wr-sh .5s ease-in-out 2; }
.wr-pack:not(.torn) { animation: wr-sh 1.4s ease-in-out infinite; }
@keyframes wr-sh { 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
.wr-tearpill { display: inline-flex; gap: 8px; align-items: center; background: rgba(255, 255, 255, .14); border: 1.5px solid rgba(255, 255, 255, .3); border-radius: 99px; padding: 10px 18px; font-weight: 800; color: #FFFFFF; }
.wr-spark { position: absolute; width: 12px; height: 12px; background: #FFF1C9; clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%); animation: wr-tw 1.6s ease-in-out infinite; }
@keyframes wr-tw { 50% { transform: scale(.4); opacity: .4; } }
.wr-revealwrap { position: relative; width: 210px; height: 210px; }
.wr-reveal { width: 210px; height: 210px; border-radius: 32px; object-fit: contain; animation: wr-pop .55s cubic-bezier(.3, 1.6, .5, 1) both; filter: drop-shadow(0 0 30px rgba(255, 201, 77, .6)); }
@keyframes wr-pop { from { transform: scale(.2); opacity: 0; } }
.wr-mini { display: flex; gap: 10px; justify-content: center; }
.wr-minitag { width: 46%; background: #F2F0FF; color: #14163A; border-radius: 14px; padding: 8px; display: grid; gap: 3px; rotate: var(--r); box-shadow: 0 3px 0 #C9C4EE; text-align: left; position: relative; }
.wr-minitag::after { content: ''; position: absolute; top: 8px; right: 8px; width: 7px; height: 7px; border-radius: 50%; background: #0D0F2E; }
.wr-minitag .im { height: 56px; border-radius: 10px; }
.wr-minitag b { font-size: 14px; font-weight: 800; }
.wr-minitag span { font-size: 11.5px; font-weight: 700; color: #5D6192; }
.wr-treatbar { background: linear-gradient(120deg, #7E3FF2, #B455F0); }
@media (prefers-reduced-motion: reduce) { [class*="wr-"], [class*="wr-"]::before, [class*="wr-"]::after, .wr-wave i { animation: none !important; transition: none !important; } }
'''
rep('\n</style>\n\n<div class="page">', CSS + '</style>\n\n<div class="page">')

# ---------- constants ----------
rep("const ONB = ['welcome', 'story', 'pain', 'screenTime', 'picker', 'demo', 'goal', 'paywall'];",
    "const ONB = ['welcome', 'story', 'pain', 'screenTime', 'picker', 'demo', 'roomIntro', 'challenge', 'goal', 'paywall'];")
rep("pause: '15-second pause', pass: 'Shopping Pass', inapp: 'Shopping app (simulated)', checkin: 'Pass check-in', rankup: 'Rank up', paused: 'Protection paused' };",
    "pause: 'The pause', pass: 'Shopping Pass', inapp: 'Shopping app (simulated)', checkin: 'Pass check-in', rankup: 'Rank up', paused: 'Protection paused',\n  roomIntro: 'The waiting room (intro)', challenge: 'Pick a challenge', parked: 'Parked till morning', decide: 'Morning review', parcel: 'Sticker parcel', note: 'A note from calm you' };")
rep("const TAB_LABEL = { home: 'Home', apps: 'Apps', progress: 'Progress', settings: 'Settings' };",
    "const TAB_LABEL = { home: 'Today', room: 'Waiting room', plan: 'Plan', apps: 'Apps', progress: 'Me', settings: 'Settings' };")
rep("const KEY = 'pausa-prototype-v1';", "const KEY = 'pausa-prototype-v18';")

# fresh state: new fields
rep("pass: null, draft: null, checkin: null, pause: null, shieldApp: null, inApp: null, rankUp: false, sheet: null };\n}",
    "pass: null, draft: null, checkin: null, pause: null, shieldApp: null, inApp: null, rankUp: false, sheet: null,\n"
    "    room: [], shelf: [], nextId: 1, roomView: 'waiting', readySeen: [], parcels: 0, parcelsToday: 0, owned: 0, freshSticker: -1, parcelState: null, parcelWhy: '',\n"
    "    challenge: 'nobuy', challengeAt: null, dayShift: 0, treats: { 4: true }, sale: false, night: false, buddy: false, buddyAsks: 0, buddyReply: null, wage: 12, rulePrice: 68,\n"
    "    reasons: {}, note: '', noteDraft: '', rec: null, noteReturn: 'home', park: null, lastParked: null, deciding: null };\n}")
rep("s = Object.assign(fresh(), d, { sheet: null, penalties: d.penalties || {}, cool: d.cool || {}, lastXp: d.lastXp || {}, budgets: d.budgets || {}, passMins: d.passMins || [5, 10, 15] });",
    "s = Object.assign(fresh(), d, { sheet: null, park: null, rec: null, penalties: d.penalties || {}, cool: d.cool || {}, lastXp: d.lastXp || {}, budgets: d.budgets || {}, passMins: d.passMins || [5, 10, 15] });")
rep("  if (s.screen === 'inapp' && !s.inApp) s.screen = 'springboard';\n",
    "  if (s.screen === 'inapp' && !s.inApp) s.screen = 'springboard';\n"
    "  if (['parked', 'decide', 'parcel', 'note'].includes(s.screen)) s.screen = s.onboarded ? 'home' : 'welcome';\n")

# a filled Pausa card also brings a parcel; parcels per day reset at midnight
rep("award(50, 'Filled a Pausa card', null, { free: true }); S.stampFx = S.stamps; }",
    "award(50, 'Filled a Pausa card', null, { free: true }); S.parcels = (S.parcels || 0) + 1; S.stampFx = S.stamps; }")
rep("S.xpToday = 0; S.closesToday = 0; S.passesToday = 0; S.dayBroken = false; S.brokenWhy = '';",
    "S.xpToday = 0; S.closesToday = 0; S.passesToday = 0; S.parcelsToday = 0; S.dayBroken = false; S.brokenWhy = '';")

# treat nights lift the shield on takeaway apps
rep("function shielded(id) { return S.subscribed && S.protection && inSchedule() && S.picked.includes(id) && !S.off.includes(id) && !(S.pass && S.pass.app === id); }",
    "function shielded(id) { return S.subscribed && S.protection && inSchedule() && S.picked.includes(id) && !S.off.includes(id) && !(S.pass && S.pass.app === id) && !treatToday(id); }")

# setup progress now has 7 steps
rep("const w = (k) => Math.round(k / 5 * 100);", "const w = (k) => Math.round(k / 7 * 100);")
rep('aria-valuemin="0" aria-valuemax="5"', 'aria-valuemin="0" aria-valuemax="7"')

# ---------- helpers ----------
HELPERS = r'''
/* ---------- v18: the waiting room ---------- */
Object.assign(ICONS, {
  'package-bold': '<g fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><path d="M128 28 220 76v104l-92 48-92-48V76z"/><path d="M36 76l92 48 92-48M128 124v104M82 52l92 48"/></g>',
  'microphone-bold': '<g fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><rect x="92" y="24" width="72" height="136" rx="36"/><path d="M52 124a76 76 0 0 0 152 0M128 200v32"/></g>',
  'user-bold': '<g fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><circle cx="128" cy="96" r="52"/><path d="M36 216c18-40 54-60 92-60s74 20 92 60"/></g>',
  'play-fill': '<path fill="currentColor" d="M84 44c-8-5-18 1-18 10v148c0 9 10 15 18 10l120-74c8-5 8-15 0-20z"/>',
  'sparkle-fill': '<path fill="currentColor" d="M128 20l22 86 86 22-86 22-22 86-22-86-86-22 86-22z"/>',
  'fork-knife-bold': '<g fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><path d="M76 28v200M48 28v56a28 28 0 0 0 56 0V28M184 228V28c-28 8-44 44-44 92h44"/></g>'
});
const SUGGEST = { amazon: ['Robot vacuum', 68], shein: ['Satin slip dress', 28], temu: ['Galaxy projector', 19], ubereats: ['Pizza and wings', 26], deliveroo: ['Burger meal', 22], justeat: ['Curry for two', 31], ebay: ['Vintage camera', 85], vinted: ['Denim jacket', 24], asos: ['White trainers', 75] };
const GRADS = ['#C9B79C,#8C6F4E', '#F5B2C6,#C85A82', '#9ED3F5,#3C7FB8', '#FFD9A0,#E08A2E', '#B9F5D8,#2FA877', '#D8C7FF,#7A4FE0', '#FFB4A6,#E0573E'];
/* Twelve sticker slots: seven in this set, the rest arrive with an update. Fixed order, never sold. */
const STICKERS = [['welcome', 'Pause button'], ['shieldm', 'Wait sign'], ['ticket', 'Access ticket'], ['puzzle', 'Puzzle shield'], ['cape', 'Caped saver'], ['bubble', 'Garden thinker'], ['legend', 'Legend set']];
const STICKER_SLOTS = 12, PARCELS_A_DAY = 3;
const CHALLENGES = {
  nobuy: { name: 'No-buy month', sub: '30 days of buying only what you need. Groceries and gifts are fine.', icon: 'lock-key-bold', bg: 'bg-mint', len: 30, allowed: 'groceries or a gift', line: (d) => `Day ${d} of your no-buy month. Groceries and gifts only.` },
  lowbuy: { name: 'Low-buy month', sub: 'One planned buy this month. Everything else waits.', icon: 'ticket-bold', bg: 'bg-lav', len: 30, allowed: 'my one planned buy', line: () => 'Low-buy month: one planned buy. Is this it?' },
  takeaway: { name: 'Takeaway-free weekdays', sub: 'Takeaways at the weekend, or on a treat night you plan.', icon: 'fork-knife-bold', bg: 'bg-peach', len: 28, allowed: null, line: () => 'Takeaway-free weekdays. Is tonight a treat night?' },
  none: { name: 'No challenge for now', sub: 'Just the pause and the waiting room.', icon: 'hourglass-medium-bold', bg: 'bg-sun', len: 0, allowed: null, line: () => '' }
};
const REASONS = { bored: 'Bored', badday: 'Bad day', ad: 'Saw an ad', need: 'I need it' };
const COACH = {
  bored: (n) => n > 1 ? `That’s want number ${n} that started with boredom. Park it and see if it still matters tomorrow?` : 'Boredom wants feel urgent and fade fast. Park it and see if it still matters tomorrow?',
  badday: (n) => `Bad days have been behind ${n} of your wants. Buying usually helps for about an hour. Park it, and look again when today is over?`,
  ad: (n) => `Ads are built for this exact minute${n > 1 ? `, and it’s the ${n}th time one started a want` : ''}. It’ll still be there in the morning.`,
  need: () => 'If you need it, you’ll still need it at 08:00. Parking it costs you nothing.'
};
const NIGHT_FROM = 22;
const HOURLY = [1, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 2, 3, 2, 1, 1, 2, 2, 3, 4, 5, 7, 9, 8];
const TAKEAWAY_IDS = ['ubereats', 'deliveroo', 'justeat'];
const dow = () => (new Date().getDay() + 6) % 7; /* Monday = 0 */
/* "Pretend it's 23:10" in the test panel moves Pausa's clock to the risky hour */
function vnow() { if (!S.night) return Date.now(); const d = new Date(); d.setHours(23, 10, 0, 0); return d.getTime(); }
const vhour = () => new Date(vnow()).getHours();
const risky = () => vhour() >= NIGHT_FROM;
const saleOn = () => !!S.sale;
function realPauseSecs() { let s = S.pauseLen; if (risky()) s = Math.max(s, 45); if (saleOn()) s += 15; return s; }
const pauseSecs = () => (S.fast ? 5 : realPauseSecs());
function dur(mins) { mins = Math.max(0, Math.round(mins)); const h = Math.floor(mins / 60), m = mins % 60; return h ? `${h} h${m ? ' ' + m + ' min' : ''}` : `${m} min`; }
const workTime = (price) => dur(price / (S.wage || 12) * 60);
function whenLabel(target, base) {
  const a = new Date(base); a.setHours(0, 0, 0, 0); const b = new Date(target); b.setHours(0, 0, 0, 0);
  const d = Math.round((b - a) / 86400000), t = new Date(target).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${t} ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : DAY_NAMES[(new Date(target).getDay() + 6) % 7]}`;
}
/* The Pausa rule: 1 hour for every £10 (1 hour up to £20), doubled in sale week; a want that would be ready at night waits until 08:00 */
function waitFor(price) {
  const why = [], base = vnow();
  let h = price <= 20 ? 1 : Math.round(price / 10);
  why.push(price <= 20 ? '£20 or less: 1 h' : `£${price}: ${h} h`);
  if (saleOn()) { h *= 2; why.push('Sale week: ×2'); }
  let target = base + h * 3600000;
  const t = new Date(target), hr = t.getHours();
  if (hr >= NIGHT_FROM || hr < 8) { if (hr >= NIGHT_FROM) t.setDate(t.getDate() + 1); t.setHours(8, 0, 0, 0); target = t.getTime(); why.push('Ready at night? 08:00'); }
  return { h, ms: target - base, why, when: whenLabel(target, base) };
}
const whyChips = (w) => w.why.map((x) => `<span class="chip chip-lilac">${x}</span>`).join('');
function ruleInner(price, pre) {
  const w = waitFor(price);
  return `<div class="flex items-baseline justify-between gap-3"><span class="t-small">It waits</span><b class="t-num text-[26px] text-azure-light" id="${pre}w">${dur(w.ms / 60000)}</b></div>
<p class="text-right t-small" id="${pre}when">Ready ${w.when}</p><div class="mt-2 flex flex-wrap gap-1.5" id="${pre}why">${whyChips(w)}</div><p class="mt-2 t-small" id="${pre}work">That’s about ${workTime(price)} of your work.</p>`;
}
function updateRule(pre, price) {
  const w = waitFor(price), set = (id, v, html) => { const el = document.getElementById(pre + id); if (el) el[html ? 'innerHTML' : 'textContent'] = v; };
  set('w', dur(w.ms / 60000)); set('when', `Ready ${w.when}`); set('why', whyChips(w), true); set('work', `That’s about ${workTime(price)} of your work.`);
}
const isReady = (t) => Date.now() >= t.readyAt;
const leftMs = (t) => Math.max(0, t.readyAt - Date.now()) * timeScale();
const roomReady = () => S.room.filter(isReady);
const roomWaiting = () => S.room.filter((t) => !isReady(t)).sort((a, b) => a.readyAt - b.readyAt);
const challengeDay = () => (S.challengeAt ? Math.floor((Date.now() - S.challengeAt) / 86400000) + 1 + (S.dayShift || 0) : 1);
const treatApps = () => { const t = S.picked.filter((id) => TAKEAWAY_IDS.includes(id) || S.tags[id] === 'Takeaways'); return t.length ? t : ['ubereats']; };
const treatToday = (id) => !!(S.treats || {})[dow()] && treatApps().includes(id);
const treatAppNames = () => treatApps().map(nm).join(', ');
function nextTreat() { for (let i = 0; i < 7; i++) { const d = (dow() + i) % 7; if ((S.treats || {})[d]) return i === 0 ? 'Tonight' : i === 1 ? 'Tomorrow' : DAY_NAMES[d]; } return ''; }
function giveParcel() { rollDay(); if ((S.parcelsToday || 0) >= PARCELS_A_DAY) return false; S.parcelsToday = (S.parcelsToday || 0) + 1; S.parcels = (S.parcels || 0) + 1; return true; }
function ringSVG(frac, ready) {
  const C = 2 * Math.PI * 33;
  return `<svg viewBox="0 0 74 74" aria-hidden="true"><defs><linearGradient id="wrg"><stop offset="0" stop-color="#4361FF"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs><circle cx="37" cy="37" r="33" fill="none" stroke="#DCD8F7" stroke-width="6"/><circle cx="37" cy="37" r="33" fill="none" stroke="${ready ? '#1FBF86' : 'url(#wrg)'}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - frac)).toFixed(1)}"/></svg>`;
}
function tagHTML(t) {
  const rd = isReady(t), frac = t.waitMs ? Math.min(1, 1 - leftMs(t) / t.waitMs) : 1;
  return `<div class="wr-tag${rd ? ' isready' : ''}">
<div class="wr-cring">${ringSVG(frac, rd)}<div class="thumbin" style="background:linear-gradient(135deg,${GRADS[t.g % GRADS.length]})"><span class="lg">${appArt(t.app, 'w-full h-full', nm(t.app))}</span></div></div>
<div class="min-w-0 grid gap-1 content-center"><p class="nm">${esc(t.name)}</p><p class="meta">${nm(t.app)} · £${t.price} · about ${workTime(t.price)} of work</p>
<div class="foot">${rd ? `<span class="when ok">Ready. Still want it?</span><button class="go" data-a="decide" data-arg="${t.id}">Decide</button>` : `<span class="left" data-left="${t.id}">${dur(leftMs(t) / 60000)} left</span><span class="when">${t.when}</span>`}</div></div></div>`;
}
const bigTag = (t, stampText) => `<div class="wr-bigtag"><div class="im" style="background:linear-gradient(135deg,${GRADS[t.g % GRADS.length]})"><span class="lg">${appArt(t.app, 'w-full h-full', nm(t.app))}</span></div><b>${esc(t.name)}</b><span class="meta">${nm(t.app)} · £${t.price} · about ${workTime(t.price)} of work</span><span class="wr-tagstamp">${stampText}</span></div>`;
const wrEmpty = (t) => `<p class="wr-empty">${t}</p>`;
function segRing(day, n) {
  const r = 66, c = 80, gap = 4.5; let arcs = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 360 + gap / 2 - 90, a1 = ((i + 1) / n) * 360 - gap / 2 - 90;
    const p = (a) => [c + r * Math.cos(a * Math.PI / 180), c + r * Math.sin(a * Math.PI / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    const col = i < day - 1 ? '#5EE9B5' : i === day - 1 ? '#FFFFFF' : 'rgba(255,255,255,.12)';
    arcs += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${col}" stroke-width="11" fill="none"${i === day - 1 ? ' filter="url(#wrgl)"' : ''}/>`;
  }
  return `<div class="wr-segring" role="img" aria-label="Day ${day} of ${n}"><svg viewBox="0 0 160 160" aria-hidden="true"><defs><filter id="wrgl"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${arcs}</svg><b>${day}<small>of ${n} days</small></b></div>`;
}
const noteIdeas = () => [`Remember ${S.goal || 'what you’re saving for'}. Is this it?`, 'You said you’d sleep on it. So sleep on it.', 'Future you is the one who pays for this.'];
const WAVE = [8, 14, 20, 12, 24, 16, 9, 18, 26, 14, 10, 20, 15, 8, 22, 12, 18, 9, 14, 20, 11, 17];
const waveHTML = (play) => `<div class="wr-wave${play ? ' play' : ''}" aria-hidden="true">${WAVE.map((v) => `<i style="height:${v}px"></i>`).join('')}</div>`;
'''
rep("const RING_C = 691.15; /* circumference of the pause ring (r = 110) */\n",
    "const RING_C = 691.15; /* circumference of the pause ring (r = 110) */\n" + HELPERS)

# ---------- setup screens ----------
rep('<p class="mt-4 t-body rise" style="--d:200">That was Pausa: a pause between you and the apps that make you spend.</p>',
    '<p class="mt-4 t-body rise" style="--d:200">That was Pausa: a pause between you and the apps that make you spend. Anything you want waits its turn.</p>')

# demo: the three choices
rep("${[['I’ll leave it', '+10 XP', 'chip-mint'], ['Remind me in 1 hour', '+5 XP', 'chip-sun'], ['Shop with a plan', 'Shopping Pass', 'chip-lilac']].map(",
    "${[['I’ll leave it', '+10 XP and a parcel', 'chip-mint'], ['Park it till morning', '+5 XP', 'chip-sun'], ['Shop with a plan', 'Shopping Pass', 'chip-lilac']].map(")

rep("const other = S.goalOther || (!!S.goal && !GOALS.some(([, v]) => v === S.goal));\n  return `<div class=\"h-full flex flex-col\">${obHead(5)}",
    "const other = S.goalOther || (!!S.goal && !GOALS.some(([, v]) => v === S.goal));\n  return `<div class=\"h-full flex flex-col\">${obHead(7)}")

NEW_ONB = r'''
roomIntro: () => `<div class="h-full flex flex-col">${obHead(5)}
<div class="flex-1 scroll px-7 pt-2 pb-2">
<h1 class="t-h1 rise">Every want waits its turn</h1>
<p class="mt-2 t-body rise" style="--d:60">Blockers only lock the app. Pausa also holds the thing you wanted in a waiting room, so you can sleep on it.</p>
<div class="wr-mini mt-6 rise" style="--d:120" aria-hidden="true">${[['Air fryer', '£89 · ready 08:00', 0, '-3deg'], ['Slip dress', '£28 · ready in 3 h', 1, '2.5deg']].map(([n, m, g, r]) => `<div class="wr-minitag" style="--r:${r}"><span class="im" style="background:linear-gradient(135deg,${GRADS[g]})"></span><b>${n}</b><span>${m}</span></div>`).join('')}</div>
<div class="card mt-6 p-2 rise" style="--d:200">${[['hourglass-medium-bold', 'bg-azure', 'Unplanned wants wait', 'One hour for every £10. If it would be ready at night, it waits until 08:00.'], ['heart-bold', 'bg-lav', 'Planned treats skip the queue', 'Plan Friday’s takeaway on Sunday, and it opens with a hello, not a pause.'], ['package-bold', 'bg-sun', 'Letting go earns a parcel', 'Walk away and you get a sticker parcel to open. The unboxing, without the spending.']].map(([i, b, t, d], k) => `${k ? '<div class="divider mx-3"></div>' : ''}<div class="flex items-center gap-4 p-3"><span class="tile w-12 h-12 ${b === 'bg-azure' ? 'bg-hush text-azure-light' : b} text-[24px] pop-in" style="--d:${320 + k * 90}">${ic(i)}</span><div><p class="t-title">${t}</p><p class="t-small">${d}</p></div></div>`).join('')}</div>
</div>${foot(btn('Got it', 'next'))}</div>`,

challenge: () => `<div class="h-full flex flex-col">${obHead(6)}
<div class="flex-1 scroll px-7 pt-3">
<h1 class="t-h1 rise">Pick your first challenge</h1>
<p class="mt-2 t-body rise" style="--d:60">No-buy apps only ask you to be strong. Pausa’s shields lock the apps for real, so this challenge has teeth.</p>
<div class="mt-5 space-y-2.5" role="radiogroup" aria-label="Your challenge">${Object.entries(CHALLENGES).map(([k, c], i) => `<button class="opt w-full px-4 py-3.5 flex items-center gap-3 rise" style="--d:${120 + i * 60}" role="radio" aria-checked="${S.challenge === k}" data-a="challenge" data-arg="${k}"><span class="tile w-11 h-11 ${c.bg} text-[22px]">${ic(c.icon)}</span><span class="flex-1 min-w-0"><span class="block t-title">${c.name}</span><span class="block t-small">${c.sub}</span></span><span class="check round"></span></button>`).join('')}</div>
<p class="mt-5 text-center t-small rise" style="--d:420">Change it any time in Plan.</p>
</div>${foot(btn('Start my challenge', 'next'))}</div>`,

'''
rep("\ngoal: () => {\n", "\n" + NEW_ONB + "goal: () => {\n")

# paywall receipt
rep("${line('15-second pauses', 'unlimited')}${line('Shopping Passes', 'unlimited')}${line('Pausa cards, XP and ranks', 'included')}${line('Bank-limit guide', 'included')}${line('Bank links or account', 'none')}",
    "${line('15-second pauses', 'unlimited')}${line('Waiting room', 'unlimited')}${line('Shopping Passes', 'unlimited')}${line(`${CHALLENGES[S.challenge].len ? CHALLENGES[S.challenge].name : 'Challenges'} and treat nights`, 'included')}${line('Sticker parcels, XP and ranks', 'included')}${line('Bank links or account', 'none')}")

# ---------- shield: challenge line and waiting room count ----------
rep("const lines = [S.shieldMsg.trim() ? esc(S.shieldMsg.trim()) : S.goal ? `You’re saving for ${esc(S.goal)}.` : SHIELD_LINE[tag]];\n  if (budgetFor(id)) lines.push(`${nm(id)} budget: ${money(budgetFor(id))} a month`);\n  else if (budgetTotal()) lines.push(`Shopping budget: ${money(budgetTotal())} a month`);",
    "const chLine = CHALLENGES[S.challenge].line(challengeDay());\n  const lines = [S.shieldMsg.trim() ? esc(S.shieldMsg.trim()) : chLine ? chLine : S.goal ? `You’re saving for ${esc(S.goal)}.` : SHIELD_LINE[tag]];\n  if (budgetFor(id)) lines.push(`${nm(id)} budget: ${money(budgetFor(id))} a month`);\n  else if (budgetTotal()) lines.push(`Shopping budget: ${money(budgetTotal())} a month`);\n  else if (S.room.length) lines.push(`${S.room.length} thing${S.room.length === 1 ? ' is' : 's are'} already in your waiting room.`);")

# ---------- pause ----------
OLD_PAUSE_HEAD = "const q = ASK[S.tags[p.app] || 'Other'];\n  const total = p.secs * 1000"
rep(OLD_PAUSE_HEAD, "const ch = CHALLENGES[S.challenge], why = [p.risky ? 'risky hour' : '', p.sale ? 'sale week' : ''].filter(Boolean).join(', ');\n  const total = p.secs * 1000")
rep("<header class=\"flex-shrink-0 px-8 pt-14 flex justify-center\"><span class=\"chip chip-glass text-[13px]\">${ic('timer-bold', 'text-[15px]')} ${p.secs}-second pause for ${nm(p.app)}</span></header>",
    "<header class=\"flex-shrink-0 px-8 pt-14 flex justify-center\"><span class=\"chip chip-glass text-[13px]\">${ic('timer-bold', 'text-[15px]')} ${p.real || p.secs}-second pause for ${nm(p.app)}${why ? ` · ${why}` : ''}</span></header>")
rep("${S.askQuestion ? `<h1 class=\"mt-6 t-h1 text-center text-cream rise\" style=\"--d:120\">${q.q[0]}${q.q[1]}</h1>\n<div class=\"mt-5 flex flex-wrap justify-center gap-2 rise\" style=\"--d:200\" role=\"group\" aria-label=\"Your answer\">${q.a.map((a) => `<button class=\"tag lg\" aria-pressed=\"${p.answer === a}\" data-a=\"answer\" data-arg=\"${a}\">${a}</button>`).join('')}</div>` : `<h1 class=\"mt-6 t-h1 text-center text-cream rise\" style=\"--d:120\">Take a breath. Do you still want it?</h1>`}",
    "${S.note ? `<button class=\"wr-voice mt-5 rise\" style=\"--d:80\" data-a=\"playNote\"><span class=\"pl\">${ic('play-fill')}</span><span><small>Your note from calm you</small><span class=\"t\">“${esc(S.note)}”</span></span></button>` : ''}\n"
    "${S.askQuestion ? `<h1 class=\"mt-5 t-h2 text-[24px] text-center text-cream rise\" style=\"--d:120\">What’s this one about?</h1>\n<div class=\"mt-3 flex flex-wrap justify-center gap-2 rise\" style=\"--d:200\" role=\"group\" aria-label=\"Your answer\">${Object.entries(REASONS).map(([k, a]) => `<button class=\"tag lg\" aria-pressed=\"${p.answer === k}\" data-a=\"answer\" data-arg=\"${k}\">${a}</button>`).join('')}</div>${p.answer ? `<div class=\"wr-coach mt-4 popnow\"><span class=\"av\">${ic('sparkle-fill')}</span><span>${COACH[p.answer](S.reasons[p.answer] || 1)}</span></div>` : ''}` : `<h1 class=\"mt-6 t-h1 text-center text-cream rise\" style=\"--d:120\">Take a breath. Do you still want it?</h1>`}")
rep("<button class=\"pchoice btn btn-cream\" data-a=\"leave\"${done ? '' : ' disabled'}>I’ll leave it <span class=\"chip chip-mint\">+10 XP</span></button>\n<button class=\"pchoice btn btn-ghost\" data-a=\"remind\"${done ? '' : ' disabled'}>Remind me in 1 hour <span class=\"chip chip-sun\">+5 XP</span></button>\n<button class=\"pchoice btn btn-ghost\" data-a=\"shopPlan\"${done ? '' : ' disabled'}>${ic('ticket-bold', 'text-[20px]')} Shop with a plan <span class=\"chip chip-sun\">+5 XP</span></button></footer></div>`;",
    "<button class=\"pchoice btn btn-cream\" data-a=\"leave\"${done ? '' : ' disabled'}>I’ll leave it <span class=\"chip chip-mint\">+10 XP</span></button>\n<button class=\"pchoice btn btn-ghost\" data-a=\"park\"${done ? '' : ' disabled'}>${ic('hourglass-medium-bold', 'text-[20px]')} Park it till morning <span class=\"chip chip-sun\">+5 XP</span></button>\n<button class=\"pchoice btn btn-ghost\" data-a=\"shopPlan\"${done ? '' : ' disabled'}>${ic('ticket-bold', 'text-[20px]')} ${ch.allowed ? `It’s ${ch.allowed}` : 'Shop with a plan'} <span class=\"chip chip-sun\">+5 XP</span></button></footer></div>`;")
rep('<p id="phint" class="text-center text-[14px] font-semibold text-cream/75" aria-live="polite">${done ? \'Pick what feels right\' : \'Choices unlock when the timer ends\'}</p>',
    '<p id="phint" class="text-center text-[14px] font-semibold text-cream/75" aria-live="polite">${done ? \'Pick what feels right\' : \'Choices unlock when the timer ends\'}</p>')

# in-app: treat night bar
rep(": `<p class=\"mx-4 mt-3 text-[13px] text-[#8E8E93]\">${S.subscribed ? 'This app isn’t shielded right now.' : 'Pausa isn’t protecting any apps right now.'}</p>`}",
    ": S.subscribed && treatToday(id) ? `<div class=\"drop-in mx-4 mt-3 rounded-2xl wr-treatbar px-4 py-2.5 flex items-center gap-2 text-white\"><span class=\"text-xl flex wiggle-in\">${ic('heart-bold')}</span><span class=\"font-bold\">Treat night. You planned this, so no pause.</span></div>` : `<p class=\"mx-4 mt-3 text-[13px] text-[#8E8E93]\">${S.subscribed ? 'This app isn’t shielded right now.' : 'Pausa isn’t protecting any apps right now.'}</p>`}")

# pass from the waiting room: no pause, they already waited
rep('<h1 class="mt-5 t-h1 rise" style="--d:70">Why are you shopping?</h1>',
    '${d.fromRoom ? `<p class="mt-4 rounded-2xl bg-[#173A3A] border-[1.5px] border-[#2F7A66] px-4 py-3 text-[15px] font-bold text-mint rise">${ic(\'check-circle-fill\')} You waited, so this one’s on purpose. No pause this time.</p>` : \'\'}\n<h1 class="mt-5 t-h1 rise" style="--d:70">Why are you shopping?</h1>')

# ---------- new in-app screens ----------
NEW_SCREENS = r'''
parked: () => {
  const t = S.lastParked; if (!t) return V.home();
  const now = t.buddy, morning = /08:00/.test(t.when);
  return `<div class="h-full flex flex-col wr-full">
<div class="flex-1 scroll px-7 pt-16 pb-4 flex flex-col items-center text-center">
${bigTag(t, now ? 'Sam said yes' : 'Decide ' + t.when)}
<h1 class="mt-8 t-display rise" style="--d:260">${now ? 'Sam let it through' : morning ? 'Parked. Sleep on it.' : 'Parked. Give it time.'}</h1>
<p class="mt-3 t-body rise" style="--d:330">${now ? 'It’s ready to decide now, in your waiting room.' : `${nm(t.app)} stays shielded. ${morning ? 'Morning-you' : 'Later-you'} gets the final say. We’ll let you know when it’s ready.`}</p>
${t.xp ? `<span class="chip chip-mint mt-4 text-[14px] stamp" style="--d:420">+${t.xp} XP</span>` : ''}
</div>${foot(btn(t.from === 'share' || now ? 'Go to the waiting room' : 'Done', 'parkedDone'))}</div>`;
},

decide: () => {
  const t = S.room.find((x) => x.id === S.deciding); if (!t) return V.home();
  return `<div class="h-full flex flex-col wr-full">
<header class="flex-shrink-0 px-6 pt-14 pb-2 flex items-center"><button class="backbtn" data-a="decideBack" aria-label="Back">${ic('arrow-left-bold')}</button></header>
<div class="flex-1 scroll px-7 pt-3 pb-4 flex flex-col items-center text-center">
${bigTag(t, 'Ready')}
<h1 class="mt-8 t-display rise" style="--d:220">Still want it?</h1>
<p class="mt-3 t-body rise" style="--d:290">${t.buddy ? 'Sam let this one skip the wait.' : `You waited ${dur(t.waitMs / 60000)}.`} Any honest answer earns the same 10 XP.</p>
<p class="mt-3 t-small rise" style="--d:340">Let it go and it goes on your shelf, and you get a parcel. Still want it and you get a Shopping Pass with no pause.</p>
</div><footer class="flex-shrink-0 px-7 pt-3 pb-11 grid grid-cols-2 gap-3">${btn('Let it go', 'letGo', 'secondary')}${btn('Still want it', 'keep')}</footer></div>`;
},

parcel: () => {
  const st = S.parcelState, owned = S.owned || 0;
  const head = (plus) => `<header class="flex-shrink-0 px-6 pt-14 pb-2 flex items-center justify-between"><button class="backbtn" data-a="parcelClose" aria-label="Close">${ic('x-bold')}</button><span class="wr-xpill" aria-label="${owned} of ${STICKER_SLOTS} stickers"><i></i>${owned} of ${STICKER_SLOTS}${plus ? '<span class="plus">+1</span>' : ''}</span></header>`;
  if (st === null || st === undefined) return `<div class="h-full flex flex-col wr-burst dim on-dark">${head(false)}
<div class="flex-1 flex flex-col items-center justify-center text-center px-8 pb-10">
<h1 class="t-h1 text-cream rise">A parcel for you</h1>
<p class="mt-2 t-body rise" style="--d:80">${esc(S.parcelWhy || 'You let something go. Here’s the unboxing, without the spending.')}</p>
<button class="wr-pack mt-8" id="pack" data-a="openPack" aria-label="Tear open the parcel"><span class="body"><span>${ic('pause-bold')}</span></span><span class="strip"></span></button>
<span class="wr-tearpill mt-8">${ic('hand-pointing-bold')} Tear the top to open</span>
${S.parcels > 1 ? `<p class="mt-4 t-small">${S.parcels - 1} more after this one</p>` : ''}</div></div>`;
  if (st === 'done') return `<div class="h-full flex flex-col wr-burst dim on-dark">${head(false)}
<div class="flex-1 flex flex-col items-center justify-center text-center px-8">${img('legend', 'w-40 h-40 cut float', 'The full sticker set')}<h1 class="mt-6 t-h1 text-cream">Set complete for now</h1><p class="mt-2 t-body">You have every sticker in this set. The next set arrives with an update.</p></div>${foot(btn('Close', 'parcelClose', 'cream'))}</div>`;
  const [k, name] = STICKERS[st];
  const sparks = [[6, 18], [88, 12], [14, 80], [92, 72], [50, -6], [0, 48], [98, 42]].map(([x, y], i) => `<i class="wr-spark" style="left:${x}%;top:${y}%;animation-delay:${i * .2}s"></i>`).join('');
  return `<div class="h-full flex flex-col wr-burst on-dark">${head(true)}
<div class="flex-1 flex flex-col items-center justify-center text-center px-8">
<div class="wr-revealwrap">${sparks}<img class="wr-reveal" src="${IMG[k]}" alt="${esc(name)} sticker"></div>
<span class="chip chip-sun mt-6 text-[14px]">Sticker ${st + 1} of ${STICKER_SLOTS}</span>
<h1 class="mt-2 t-display text-cream">${esc(name)}</h1>
<p class="mt-2 t-body">Stickers come in a set order. You can’t buy them, only earn them.</p></div>
<footer class="flex-shrink-0 px-7 pt-3 pb-11 space-y-3">${btn('See my collection', 'seeStickers', 'cream')}${btn('Close', 'parcelClose', 'ghost')}</footer></div>`;
},

note: () => `<div class="h-full flex flex-col">
<header class="flex-shrink-0 px-6 pt-14 pb-2 flex items-center gap-3"><button class="backbtn" data-a="noteBack" aria-label="Back">${ic('arrow-left-bold')}</button><span class="t-h2">A note from calm you</span></header>
<div class="flex-1 scroll px-7 pt-2 pb-4 flex flex-col items-center text-center">
<p class="t-body rise">Record a few words while you feel calm. Pausa plays them in your pause, when the sale noise is loudest.</p>
<button class="wr-mic mt-8 flex-shrink-0${S.rec === 'on' ? ' on' : ''}" data-a="record" aria-label="${S.rec === 'on' ? 'Stop recording' : 'Record'}">${ic(S.rec === 'on' ? 'pause-bold' : 'microphone-bold')}</button>
<div class="mt-6">${waveHTML(S.rec === 'on')}</div>
<p class="mt-2 t-small" aria-live="polite">${S.rec === 'on' ? 'Recording… tap to stop' : S.noteDraft ? 'Recorded. Tap to record again.' : 'Tap to record'}</p>
<div class="w-full mt-6 text-left"><p class="t-label mb-2">Not sure what to say? Try one of these</p><div class="flex flex-wrap gap-2">${noteIdeas().map((t, i) => `<button class="tag text-left" aria-pressed="${S.noteDraft === t}" data-a="noteIdea" data-arg="${i}">${esc(t)}</button>`).join('')}</div></div>
${S.noteDraft ? `<div class="card mt-5 w-full p-4 text-left popnow"><p class="t-label">Your note</p><p class="mt-1 t-title">“${esc(S.noteDraft)}”</p></div>` : ''}
<p class="mt-4 t-small">Saved on this phone only. In this preview no microphone is used.</p>
</div>${foot(btn('Save my note', 'noteSave', 'primary', '', S.noteDraft ? '' : 'disabled'))}</div>`,

'''
rep("\npaused: () => `<div class=\"h-full flex flex-col\">", "\n" + NEW_SCREENS + "paused: () => `<div class=\"h-full flex flex-col\">")

# Today/home: the tabs
rep("home: () => `<div class=\"h-full flex flex-col top-glow relative\">${({ home: homeTab, apps: appsTab, progress: progressTab, settings: settingsTab }[S.tab] || homeTab)()}",
    "home: () => `<div class=\"h-full flex flex-col top-glow relative\">${({ home: homeTab, room: roomTab, plan: planTab, apps: appsTab, progress: progressTab, settings: settingsTab }[S.tab] || homeTab)()}")

# setup items: the note
rep("    ['bank', 'lock-key-bold', 'Add a bank limit (optional)', 'An extra barrier your bank enforces', !!S.bankLock]\n  ];",
    "    ['note', 'microphone-bold', 'Record a note from calm you', 'It plays in your pause', !!S.note],\n    ['bank', 'lock-key-bold', 'Add a bank limit (optional)', 'An extra barrier your bank enforces', !!S.bankLock]\n  ];")

# Home tab: hero card and tiles in place of the Pausa card
TODAY = r'''
/* Today: the hero streak card (Pausa card stamps lead to the parcel chest), then four colour tiles */
function heroCard(fxN) {
  if (!S.subscribed) return '';
  const n = S.stamps || 0, broken = S.dayBroken, ch = CHALLENGES[S.challenge], r = roomReady().length;
  const say = r ? `Morning-you has ${r} thing${r > 1 ? 's' : ''} to decide.` : S.parcels ? 'There’s a parcel for you. Tap the yellow tile.' : risky() ? 'It’s your risky hour, so I’ve made the pause longer.' : broken ? `No stamp today: ${esc(S.brokenWhy || 'your shields went off')}. Tomorrow is a fresh start.` : S.room.length ? `${S.room.length} thing${S.room.length > 1 ? 's are' : ' is'} waiting their turn. No rush.` : 'Quiet so far. Keep it that way!';
  const nodes = Array.from({ length: 10 }, (_, i) => {
    if (i < n) { const fr = fxN && i >= n - fxN; return `<span class="wr-node done${fr ? ' stamp-in' : ''}"${fr ? ` style="--d:${250 + (i - (n - fxN)) * 170}"` : ''}>${ic('check-bold')}</span>`; }
    if (i === n) return `<span class="wr-node ${broken ? 'missed' : 'now'}">${broken ? ic('x-bold') : ''}</span>`;
    return '<span class="wr-node"></span>';
  }).join('');
  return `<section class="wr-hero mt-5 rise" style="--d:30" aria-label="Pausa card, ${n} of 10 stamps">
<div class="top">${img('welcome', '', 'The Pausa mascot')}<div class="grid gap-1.5"><p class="wr-say">${say}</p><h2 class="t-h2">${ch.len ? `${ch.name} · day ${Math.min(challengeDay(), ch.len)}` : 'Shop on purpose'}</h2></div></div>
<div class="wr-track"><span class="fill" style="width:calc((100% - 46px) * ${(n / 10).toFixed(2)})"></span>${nodes}<span class="wr-chest" title="A parcel and 50 XP when the card is full"></span></div>
<p class="text-[13px] font-bold opacity-90 relative">${n} of 10 stamps, one for each day you shop on purpose. A full card gets +50 XP and a parcel.</p>
</section>`;
}
function todayTiles() {
  if (!S.subscribed) return '';
  const r = roomReady().length, w = roomWaiting().length, nt = nextTreat();
  return `<div class="wr-tiles mt-4 rise" style="--d:50">
<button class="wr-tile t-blue" data-a="tab" data-arg="room"><span class="arr">${ic('caret-right-bold')}</span><span class="ico">${ic('hourglass-medium-bold')}</span><span><b>Waiting room</b><span class="sub">${r ? `${r} ready to decide` : w ? `${w} waiting their turn` : 'Nothing waiting'}</span></span><span class="bgnum">${S.room.length}</span></button>
<button class="wr-tile t-purple" data-a="goto" data-arg="plan|wr-treats"><span class="arr">${ic('caret-right-bold')}</span><span class="ico">${ic('heart-bold')}</span><span><b>Treat night</b><span class="sub">${nt ? `Next: ${nt}` : 'None planned yet'}</span></span></button>
<button class="wr-tile t-coral" data-a="goto" data-arg="plan|wr-risk"><span class="arr">${ic('caret-right-bold')}</span><span class="ico">${ic('moon-stars-bold')}</span><span><b>${risky() ? 'Risky hour' : 'Calm hour'}</b><span class="sub">${risky() ? `Pauses are ${realPauseSecs()} seconds now` : 'Pauses get longer from 22:00'}</span></span></button>
<button class="wr-tile t-amber${S.parcels ? ' has' : ''}" data-a="openParcel"><span class="arr">${ic('caret-right-bold')}</span><span class="ico">${ic('package-bold')}</span><span><b>${S.parcels ? `${S.parcels} parcel${S.parcels > 1 ? 's' : ''}` : 'Parcels'}</b><span class="sub">${S.parcels ? 'Tap to open' : 'Let something go to earn one'}</span></span><span class="bgnum">${S.owned || 0}</span></button>
</div>`;
}
function coachCard() {
  if (!S.subscribed) return '';
  const top = Object.entries(S.reasons || {}).sort((a, b) => b[1] - a[1])[0];
  return `<section class="card mt-4 p-4 flex gap-3 items-start rise" style="--d:240"><span class="tile w-10 h-10 bg-lav text-[18px]">${ic('sparkle-fill')}</span><p class="t-small"><b class="text-ink">Coach note.</b> ${top ? `“${REASONS[top[0]]}” is behind most of your wants so far (${top[1]}). ${risky() ? 'And it’s your risky hour right now.' : 'Your risky time is 22:00 to midnight.'}` : 'Answer “What’s this one about?” in a pause, and the coach starts spotting your patterns. It all stays on your phone.'}</p></section>`;
}
'''
rep("function homeTab() { /* bottom padding leaves room for the try-it pill */", TODAY + "function homeTab() { /* bottom padding leaves room for the try-it pill */")
rep("${pausaCard(sfx)}\n", "${heroCard(sfx)}\n${S.subscribed && saleOn() ? `<div class=\"wr-sale mt-4 rise\" style=\"--d:40\"><b>It’s Black Friday week</b><span class=\"t-small\">Shops are at their loudest, so every wait is doubled and pauses are 15 seconds longer until Monday.</span></div>` : ''}\n${todayTiles()}\n")
rep("${setupCard()}\n<div class=\"mt-6 flex items-baseline justify-between rise\" style=\"--d:220\"><h2 class=\"t-h2\">Protected apps</h2>",
    "${setupCard()}\n${coachCard()}\n<div class=\"mt-6 flex items-baseline justify-between rise\" style=\"--d:220\"><h2 class=\"t-h2\">Protected apps</h2>")

# Apps tab gets a back button (it now opens from Settings)
rep('<h1 class="t-h1 rise">Your apps</h1><p class="mt-1 t-body rise" style="--d:50">Shielded apps show the Pausa shield when you open them.</p>',
    '<div class="flex items-center gap-3 rise"><button class="backbtn" data-a="tab" data-arg="settings" aria-label="Back to Settings">${ic(\'arrow-left-bold\')}</button><h1 class="t-h1">Your apps</h1></div><p class="mt-2 t-body rise" style="--d:50">Shielded apps show the Pausa shield when you open them.</p>')

# Me tab (was Progress)
rep('<h1 class="t-h1 rise">Progress</h1>\n<div class="mt-4 flex items-end gap-3 rise" style="--d:50"><p class="t-num text-[56px] leading-none">${fmtN(S.xp)}</p><p class="pb-1.5 t-small">XP so far. You’re a ${r.name} ${r.title}.</p></div>',
    '<h1 class="t-h1 rise">Me</h1>\n<div class="mt-4 flex items-end gap-3 rise" style="--d:50"><p class="t-num text-[56px] leading-none">${fmtN(S.xp)}</p><p class="pb-1.5 t-small">XP so far. You’re a ${r.name} ${r.title}.</p></div>\n${meExtras()}')
rep("${[['Close an app at the shield', '+2'], ['Finish the pause and leave', '+10'], ['Check in after a pass, any honest answer', '+10'], ['Fill a Pausa card (10 stamps)', '+50']].map(",
    "${[['Close an app at the shield', '+2'], ['Finish the pause and leave (and get a parcel)', '+10'], ['Park it in the waiting room', '+5'], ['Decide on a want after its wait, any answer', '+10'], ['Check in after a pass, any honest answer', '+10'], ['Fill a Pausa card (10 stamps), plus a parcel', '+50']].map(")
rep("Repeat opens of the same app earn XP once every 30 minutes. A third pass in a day means a short wait.</p></div>",
    "Repeat opens of the same app earn XP once every 30 minutes. A third pass in a day means a short wait. Up to 3 parcels a day.</p></div>")

TABS = r'''
function meExtras() {
  const owned = S.owned || 0, top = Object.entries(S.reasons || {}).sort((a, b) => b[1] - a[1]);
  return `<section class="card mt-5 p-4 rise" id="wr-stickers" style="--d:80"><div class="flex items-center justify-between"><h2 class="t-h2">Sticker collection</h2><span class="chip chip-sun">${owned} of ${STICKER_SLOTS}</span></div>
<div class="wr-stickers mt-3">${Array.from({ length: STICKER_SLOTS }, (_, n) => n < owned && STICKERS[n] ? `<div class="${n === S.freshSticker ? 'fresh' : ''}"><img src="${IMG[STICKERS[n][0]]}" alt="${STICKERS[n][1]}"></div>` : '<div class="lock" aria-hidden="true">?</div>').join('')}</div>
<p class="mt-3 t-small">Each parcel holds the next sticker, in a set order. You can never buy them.${S.parcels ? '' : ' Let something go to earn a parcel.'}</p>${S.parcels ? `<div class="mt-3">${btn(`${ic('package-bold', 'text-xl')} Open ${S.parcels > 1 ? `${S.parcels} parcels` : 'your parcel'}`, 'openParcel', 'secondary')}</div>` : ''}</section>
<section class="card mt-4 p-4 rise" id="wr-note" style="--d:120">${S.note ? `<div class="flex items-center justify-between gap-3"><h2 class="t-h2">Your note from calm you</h2><button class="chip chip-lilac text-[13px] py-1.5" data-a="playNote">${ic('play-fill')} Play</button></div><div class="mt-3" id="mewave">${waveHTML(false)}</div><p class="mt-2 t-small">“${esc(S.note)}” It plays in every pause.</p><button class="mt-2 text-[14px] font-bold text-azure-light underline" data-a="openNote">Record a new one</button>`
    : `<div class="flex items-center gap-3"><span class="tile w-11 h-11 bg-lav text-[22px]">${ic('microphone-bold')}</span><span class="flex-1 min-w-0"><span class="block t-title">A note from calm you</span><span class="block t-small">Record a few words. They play in your pause.</span></span><button class="link text-azure-light text-[15px]" data-a="openNote">Record</button></div>`}</section>
<section class="card mt-4 p-4 rise" style="--d:160"><h2 class="t-h2">What the coach has noticed</h2>${top.length ? `<div class="mt-2 space-y-2">${top.map(([k, n]) => `<div class="flex items-center justify-between"><span class="t-title">${REASONS[k]}</span><span class="chip ${k === 'need' ? 'chip-mint' : 'chip-lilac'}">${n} time${n === 1 ? '' : 's'}</span></div>`).join('')}</div>` : '<p class="mt-1 t-small">Nothing yet. Answer “What’s this one about?” in a pause to start.</p>'}
<p class="mt-3 t-small">Worked out on your phone. Nothing is sent anywhere. The real app uses Apple’s on-device AI on newer iPhones, and set questions on the rest.</p></section>`;
}
function roomTab() {
  const v = S.roomView || 'waiting', w = roomWaiting(), r = roomReady();
  let body = '';
  if (v === 'waiting') body = w.length ? w.map(tagHTML).join('') : wrEmpty('Nothing is waiting. Next time you want something, choose “Park it till morning” in the pause, or share it to Pausa from any shop.');
  if (v === 'ready') body = r.length ? r.map(tagHTML).join('') : wrEmpty('Nothing is ready yet. Wants come back here when their wait is over, often at 08:00.');
  if (v === 'letgo') body = S.shelf.length ? `<p class="t-small">Things you wanted, waited for and let go. Just the things, no money totals.</p><div class="wr-shelf mt-1">${S.shelf.map((x) => `<div class="${x.isNew ? 'new' : ''}" style="background:linear-gradient(135deg,${GRADS[x.g % GRADS.length]})">${esc(x.name)}</div>`).join('')}</div>` : wrEmpty('Your let-go shelf is empty. When you let something go, it lands here and you get a parcel.');
  return `<div class="flex-1 scroll px-6 pt-14 pb-24">
<div class="flex items-end justify-between gap-3 rise"><div><p class="t-small">Every want waits its turn</p><h1 class="t-h1">Waiting room</h1></div>${img('shieldm', 'w-14 h-14 cut', '')}</div>
<div class="wr-seg mt-4 rise" style="--d:60" role="tablist" aria-label="Waiting room">${[['waiting', 'Waiting', w.length], ['ready', 'Ready', r.length], ['letgo', 'Let go', S.shelf.length]].map(([k, l, n]) => `<button role="tab" aria-selected="${v === k}" data-a="roomView" data-arg="${k}">${l} ${n}</button>`).join('')}</div>
<div class="mt-4 grid gap-3 rise" style="--d:100">${body}</div>
${v !== 'letgo' ? `<button class="dashed mt-4 w-full py-4 flex items-center justify-center gap-2 font-bold rise" style="--d:140" data-a="shareSheet">${ic('share-network-bold', 'text-xl')} Park something from a shop’s Share button</button>` : ''}
<p class="mt-4 t-small text-center rise" style="--d:160">The rule: 1 hour for every £10, never ready at night${saleOn() ? ', doubled in sale week' : ''}. Set it in Plan.</p>
</div>`;
}
function planTab() {
  const ch = CHALLENGES[S.challenge], d = challengeDay(), p = S.rulePrice || 68, curH = vhour(), hrs = HOURLY.map((v, i) => v + S.history.filter((x) => x.app && new Date(x.at).getHours() === i).length);
  return `<div class="flex-1 scroll px-6 pt-14 pb-24">
<p class="t-small rise">Decide calmly, ahead of time</p><h1 class="t-h1 rise">Plan</h1>
<section class="card mt-5 p-4 rise" id="wr-ch" style="--d:40"><h2 class="t-h2">Your challenge</h2>
${ch.len ? segRing(Math.min(d, ch.len), ch.len) : ''}
<div class="mt-4 space-y-2" role="radiogroup" aria-label="Your challenge">${Object.entries(CHALLENGES).map(([k, c]) => `<button class="opt w-full px-4 py-3 flex items-center gap-3" role="radio" aria-checked="${S.challenge === k}" data-a="challenge" data-arg="${k}"><span class="flex-1 min-w-0"><span class="block t-title">${c.name}</span><span class="block t-small">${c.sub}</span></span><span class="check round"></span></button>`).join('')}</div></section>
<section class="card mt-4 p-4 rise" id="wr-treats" style="--d:80"><div class="flex items-center justify-between gap-2"><h2 class="t-h2">Treat nights</h2><span class="chip chip-lilac">${esc(treatAppNames())}</span></div>
<div class="wr-week mt-3" role="group" aria-label="Treat nights">${DAY_NAMES.map((n, i) => `<button data-a="treat" data-arg="${i}" aria-pressed="${!!(S.treats || {})[i]}" class="${i === dow() ? 'today' : ''}" aria-label="${n}${(S.treats || {})[i] ? ', treat night' : ''}">${n[0]}<small>${(S.treats || {})[i] ? 'Treat' : ''}</small></button>`).join('')}</div>
<p class="mt-3 t-small">On a treat night your takeaway apps open with a hello, not a pause. Plan them here while you’re calm. Today is outlined.</p></section>
<section class="card mt-4 p-4 rise" id="wr-risk" style="--d:120"><div class="flex items-center justify-between"><h2 class="t-h2">Your risky hours</h2>${risky() ? '<span class="chip chip-peach">Risky now</span>' : '<span class="chip chip-mint">Calm now</span>'}</div>
<div class="wr-hours mt-3" aria-hidden="true">${hrs.map((v, i) => `<i class="${v >= 7 ? 'hot' : ''}${i === curH ? ' nowh' : ''}" style="height:${10 + Math.min(v, 9) * 10}%"></i>`).join('')}</div>
<div class="wr-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
<p class="mt-2 t-small">Most of your wants start between 22:00 and midnight, so pauses get longer then: ${Math.max(S.pauseLen, 45)} seconds instead of ${S.pauseLen}. Pausa works this out on your phone.</p></section>
<section class="card mt-4 p-4 rise" id="wr-rule" style="--d:160"><h2 class="t-h2">The Pausa rule</h2><p class="mt-1 t-small">How long a want waits before you can decide.</p>
<div class="wr-rule mt-3"><div class="flex items-center justify-between"><span class="t-small">If it costs</span><b class="t-num text-[26px]" id="rp">£${p}</b></div><input type="range" class="wr-range mt-1" data-in="rulePrice" min="5" max="200" step="1" value="${p}" aria-label="Price in pounds"><div class="mt-2">${ruleInner(p, 'r')}</div></div></section>
<section class="card mt-4 p-4 rise" style="--d:200"><div class="flex items-center gap-3"><span class="flex-1 min-w-0"><span class="block t-title">Your take-home pay per hour</span><span class="block t-small">Shows prices as hours of work. Stays on your phone.</span></span><button class="backbtn w-9 h-9 text-[16px]" data-a="wage" data-arg="-1" aria-label="£1 less">−</button><span class="t-num text-[19px] w-12 text-center">£${S.wage}</span><button class="backbtn w-9 h-9 text-[16px]" data-a="wage" data-arg="1" aria-label="£1 more">${ic('plus-bold')}</button></div></section>
<section class="card mt-4 p-4 rise" style="--d:240"><div class="flex items-center gap-3"><span class="flex-1 min-w-0"><span class="block t-title">Sale seasons</span><span class="block t-small">Waits double by themselves in Black Friday week, Prime Day, 11.11 and the January sales.</span></span>${sw(S.sale, 'sale', '', 'Sale season shield')}</div>${S.sale ? '<p class="mt-2 text-[13.5px] font-bold text-[#FFAB98]">On now. This preview is pretending it’s Black Friday week.</p>' : ''}</section>
<section class="card mt-4 p-4 rise" style="--d:280"><div class="flex items-center gap-3"><span class="flex-1 min-w-0"><span class="block t-title">Spending buddy: Sam</span><span class="block t-small">For wants over £50, ask Sam to let one skip the wait. It goes through iCloud Messages: no Pausa account, but it does leave your phone.</span></span>${sw(S.buddy, 'buddy', '', 'Spending buddy')}</div></section>
</div>`;
}
'''
rep("function settingsTab() {", TABS + "function settingsTab() {")

# Settings: Your apps row, question wording
rep("<h1 class=\"t-h1 rise\">Settings</h1><p class=\"mt-1 t-body rise\" style=\"--d:40\">Make Pausa work your way.</p>",
    "<h1 class=\"t-h1 rise\">Settings</h1><p class=\"mt-1 t-body rise\" style=\"--d:40\">Make Pausa work your way.</p>\n<button class=\"card mt-5 w-full p-4 flex items-center gap-3 text-left rise\" style=\"--d:50\" data-a=\"tab\" data-arg=\"apps\"><span class=\"tile w-11 h-11 bg-lav text-[22px]\">${ic('squares-four-bold')}</span><span class=\"flex-1 min-w-0\"><span class=\"block t-title\">Your apps</span><span class=\"block t-small\">${S.picked.length} protected, with habits and budgets</span></span><span class=\"text-xl text-ink3\">${ic('caret-right-bold')}</span></button>")
rep("<span class=\"block t-small\">Like “Hungry, or just craving?” during the pause</span>",
    "<span class=\"block t-small\">“What’s this one about?” during the pause, with a coach reply</span>")

# tab bar: five tabs, a badge on the waiting room
rep("return `<nav aria-label=\"Pausa\" class=\"tabbar flex-shrink-0\">${[['home', 'house-bold', 'Home'], ['apps', 'squares-four-bold', 'Apps'], ['progress', 'trophy-bold', 'Progress'], ['settings', 'gear-six-bold', 'Settings']].map(([id, i, l]) => { const on = S.tab === id; return `<button data-a=\"tab\" data-arg=\"${id}\"${on ? ' aria-current=\"page\"' : ''}><span class=\"tabico\">${ic(i)}</span>${l}</button>`; }).join('')}</nav>`;",
    "const rc = roomReady().length;\n  return `<nav aria-label=\"Pausa\" class=\"tabbar flex-shrink-0\">${[['home', 'house-bold', 'Today'], ['room', 'hourglass-medium-bold', 'Waiting'], ['plan', 'calendar-check-bold', 'Plan'], ['progress', 'user-bold', 'Me'], ['settings', 'gear-six-bold', 'Settings']].map(([id, i, l]) => { const on = S.tab === id || (id === 'settings' && S.tab === 'apps'); return `<button data-a=\"tab\" data-arg=\"${id}\"${on ? ' aria-current=\"page\"' : ''}><span class=\"tabico\">${ic(i)}</span>${id === 'room' && rc ? `<span class=\"tabbadge\" aria-label=\"${rc} ready\">${rc}</span>` : ''}${l}</button>`; }).join('')}</nav>`;")

# ---------- sheets ----------
SHEETS_NEW = r'''
  park: () => { const k = S.park; if (!k) return ''; return `<div class="sheet-wrap items-end"><div class="sheet-in w-full max-h-[90%] overflow-y-auto bg-[#14173F] border-t-[1.5px] border-[#2E3374] rounded-t-[30px] px-6 pt-3 pb-10" role="dialog" aria-label="Park it in the waiting room"><div class="mx-auto mb-4 w-10 h-1.5 rounded-full bg-[#343A80]"></div>
${k.from === 'share' ? `<div class="flex items-center gap-2 mb-3">${logo(k.app, 'w-8 h-8')}<span class="t-small">Shared from ${nm(k.app)}: the link, title and picture only</span></div>` : ''}
<h2 class="t-h2 text-[24px]">Park it in the waiting room</h2><p class="mt-1 t-small">${nm(k.app)} stays shielded while it waits.</p>
<div class="mt-4 flex gap-3"><div class="flex-1 min-w-0"><label for="pname" class="block t-label mb-1.5">What is it?</label><input id="pname" data-in="parkName" value="${esc(k.name)}" maxlength="40" autocomplete="off" class="field w-full px-4 py-3 text-[17px] font-semibold"></div><div class="w-24 flex-shrink-0"><label for="pprice" class="block t-label mb-1.5">Price (£)</label><input id="pprice" data-in="parkPrice" value="${k.price}" inputmode="numeric" maxlength="4" autocomplete="off" class="field w-full px-4 py-3 text-[17px] font-semibold"></div></div>
<div class="wr-rule mt-4">${ruleInner(k.price, 'p')}</div>
<div class="mt-4 space-y-2">${btn(ic('hourglass-medium-bold', 'text-xl') + ' Park it', 'doPark')}<div id="buddyrow">${buddyRow(k.price)}</div><button class="w-full py-2 font-bold text-azure-light" data-a="parkCancel">Cancel</button></div></div></div>`; },
  buddy: () => `<div class="sheet-wrap px-6"><div class="dlg-in w-full bg-[#161942] border-[1.5px] border-[#2E3374] rounded-[28px] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,.55)]" role="dialog" aria-label="Asking your spending buddy">${img('bubble', 'w-24 h-24 mx-auto cut', 'The Pausa mascot thinking')}
<h2 class="mt-3 t-h2 text-[24px]">${S.buddyReply ? 'Sam replied' : 'Asking Sam…'}</h2>
<p class="mt-2 t-body" aria-live="polite">${S.buddyReply === 'yes' ? '<b class="text-mint">Sam: “Go for it, you’ve been good this month.”</b>' : S.buddyReply === 'no' ? '<b class="text-[#FFAB98]">Sam: “Sleep on it. It’ll still be there tomorrow.”</b>' : 'Sent through iCloud Messages. Waiting for a reply.'}</p>
${S.buddyReply ? `<div class="mt-5">${S.buddyReply === 'yes' ? btn('Put it straight through', 'buddyYes') : btn('OK, park it', 'buddyNo')}</div>` : '<p class="mt-4 t-small">Simulated: Sam answers in a moment.</p>'}</div></div>`,
'''
rep("  del: () => `<div class=\"sheet-wrap px-6\">", SHEETS_NEW + "  del: () => `<div class=\"sheet-wrap px-6\">")
rep("let bannerData = null, toastText = null, bannerTimer, toastTimer;",
    "const buddyRow = (price) => (S.buddy && price > 50 ? `<button class=\"btn btn-secondary\" data-a=\"buddyAsk\">${ic('chat-circle-bold', 'text-xl')} Ask Sam to let it skip the wait</button>` : '');\nlet bannerData = null, toastText = null, bannerTimer, toastTimer;")

# ---------- state changes ----------
rep("Object.assign(S, { permission: true, onboarded: true, subscribed: true, trialAt: Date.now(), tab: 'home' });",
    "Object.assign(S, { permission: true, onboarded: true, subscribed: true, trialAt: Date.now(), tab: 'home', challengeAt: S.challengeAt || Date.now() });\n  welcomeParcel();")
rep("function lapse() {", "function welcomeParcel() { if (!S.welcomed) { S.welcomed = true; S.parcels = (S.parcels || 0) + 1; S.parcelWhy = 'A welcome parcel, to show you how it works. From now on, letting something go earns one.'; } }\nfunction lapse() {")
rep("buyConfirm() { Object.assign(S, { subscribed: true, onboarded: true, protection: true, trialAt: S.trialAt || Date.now(), tab: 'home' }); fx = 'protect'; goT('home', 'fade'); },",
    "buyConfirm() { Object.assign(S, { subscribed: true, onboarded: true, protection: true, trialAt: S.trialAt || Date.now(), tab: 'home', challengeAt: S.challengeAt || Date.now() }); welcomeParcel(); fx = 'protect'; goT('home', 'fade'); },")

# the pause: longer in risky hours and sale week
rep("S.pause = { app: id, startedAt: Date.now(), secs: S.fast ? 5 : S.pauseLen, done: false, answer: null };",
    "S.pause = { app: id, startedAt: Date.now(), secs: pauseSecs(), real: realPauseSecs(), risky: risky(), sale: saleOn(), done: false, answer: null };")
rep("answer(arg) { if (S.pause) { S.pause.answer = arg; go('pause'); } },",
    "answer(arg) { if (!S.pause) return; if (!S.pause.counted) { S.reasons[arg] = (S.reasons[arg] || 0) + 1; S.pause.counted = arg; } else if (S.pause.counted !== arg) { S.reasons[S.pause.counted] = Math.max(0, (S.reasons[S.pause.counted] || 1) - 1); if (!S.reasons[S.pause.counted]) delete S.reasons[S.pause.counted]; S.reasons[arg] = (S.reasons[arg] || 0) + 1; S.pause.counted = arg; } S.pause.answer = arg; go('pause'); },")
rep("leave() { const { r, id } = finishPause(10, `Left ${nm(S.pause.app)} after a pause`); startCool(id); go('springboard'); toast(xpMsg(r, `You left ${nm(id)}`)); if (r.up) rankBanner(); },\n  remind() { const { r, id } = finishPause(5, 'Set a reminder instead of shopping'); startCool(id); go('springboard'); toast(xpMsg(r, 'Reminder set for 1 hour')); if (r.up) rankBanner(); },",
    "leave() { const { r, id } = finishPause(10, `Left ${nm(S.pause.app)} after a pause`); const got = giveParcel(); if (got) S.parcelWhy = ''; startCool(id); go('springboard'); toast(xpMsg(r, got ? `You left ${nm(id)} · a parcel is waiting in Pausa` : `You left ${nm(id)}`)); if (r.up) rankBanner(); },\n"
    "  park() { if (!S.pause) return; const id = S.pause.app, [n, pr] = SUGGEST[id] || [`Something from ${nm(id)}`, 25]; S.park = { app: id, name: n, price: pr, from: 'pause' }; S.sheet = 'park'; renderOverlays(); },\n"
    "  shareSheet() { const id = S.picked.find((x) => ['shein', 'amazon', 'asos', 'vinted', 'temu', 'ebay'].includes(x)) || 'shein', [n, pr] = SUGGEST[id]; S.park = { app: id, name: n, price: pr, from: 'share' }; S.sheet = 'park'; renderOverlays(); },\n"
    "  parkCancel() { S.park = null; S.sheet = null; renderOverlays(); },\n"
    "  doPark() { doPark(false); },\n"
    "  buddyAsk() { const k = S.park; if (!k) return; S.buddyAsks = (S.buddyAsks || 0) + 1; S.buddyReply = null; S.sheet = 'buddy'; renderOverlays(); const n = S.buddyAsks; setTimeout(() => { if (S.sheet !== 'buddy' || S.buddyAsks !== n) return; S.buddyReply = n % 2 ? 'yes' : 'no'; renderOverlays(); }, 1800); },\n"
    "  buddyYes() { doPark(true); },\n"
    "  buddyNo() { doPark(false); },\n"
    "  parkedDone() { const t = S.lastParked; S.lastParked = null; if (!t) return go('home'); if (t.from === 'share' || t.buddy) { S.tab = 'room'; S.roomView = t.buddy ? 'ready' : 'waiting'; goT('home', 'fade'); } else go('springboard'); toast(t.buddy ? 'Ready to decide in your waiting room' : `Parked till ${t.when}`); if (t.up) rankBanner(); },\n"
    "  roomView(arg) { S.roomView = arg; go('home'); },\n"
    "  goto(arg) { const [tab, anchor] = arg.split('|'); S.tab = tab; go('home'); setTimeout(() => { const el = document.getElementById(anchor), sc = $('#scr .scroll'); if (!el || !sc) return; const k = $('#host').getBoundingClientRect().width / 393 || 1; sc.scrollTo({ top: sc.scrollTop + (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / k - 12, behavior: calm() ? 'auto' : 'smooth' }); }, 140); },\n"
    "  decide(arg) { S.deciding = +arg; goT('decide', 'fwd'); },\n"
    "  decideBack() { S.tab = 'room'; goT('home', 'back'); },\n"
    "  letGo() { const t = S.room.find((x) => x.id === S.deciding); if (!t) return go('home'); const r = award(10, `Let ${t.name} go after the wait`, t.app); S.room = S.room.filter((x) => x.id !== t.id); S.shelf.forEach((x) => { x.isNew = false; }); S.shelf.unshift({ name: t.name, g: t.g, at: Date.now(), isNew: true }); const got = giveParcel(); if (got) S.parcelWhy = `You let ${t.name} go. Here’s the unboxing, without the spending.`; S.tab = 'room'; S.roomView = 'letgo'; goT('home', 'fade'); toast(xpMsg(r, got ? 'Let go · a parcel is waiting on Today' : 'Let go')); if (r.up) rankBanner(); },\n"
    "  keep() { const t = S.room.find((x) => x.id === S.deciding); if (!t) return go('home'); const r = award(10, `Still wanted ${t.name} after the wait`, t.app); S.room = S.room.filter((x) => x.id !== t.id); S.draft = { app: t.app, reason: 'specific', need: t.name, limit: String(t.price), minutes: passDefault(), custom: false, waitUntil: 0, fromRoom: true }; goT('pass', 'fwd'); toast(xpMsg(r, 'Decided after the wait')); if (r.up) rankBanner(); },\n"
    "  openParcel() { if (!S.parcels) { toast('No parcels yet. Let something go to get one.'); return; } S.parcelState = null; goT('parcel', 'fade'); },\n"
    "  openPack(arg, el) { const pk = el || $('#pack'); if (!pk || pk.classList.contains('torn') || !S.parcels) return; pk.classList.add('torn'); try { navigator.vibrate && navigator.vibrate(25); } catch (err) { /* no vibration */ } S.parcels -= 1; const idx = S.owned || 0; if (idx < STICKERS.length) { S.owned = idx + 1; S.freshSticker = idx; S.parcelState = idx; } else S.parcelState = 'done'; S.parcelWhy = ''; save(); setTimeout(() => { if (S.screen === 'parcel') go('parcel'); }, calm() ? 0 : 650); },\n"
    "  parcelClose() { S.parcelState = null; if (S.parcels) { go('parcel'); return; } goT('home', 'fade'); },\n"
    "  seeStickers() { S.parcelState = null; S.tab = 'progress'; goT('home', 'fade'); setTimeout(() => ACT.goto('progress|wr-stickers'), 0); },\n"
    "  challenge(arg) { if (!CHALLENGES[arg]) return; const was = S.challenge; S.challenge = arg; if (S.onboarded && was !== arg) { S.challengeAt = Date.now(); S.dayShift = 0; } go(S.screen); if (S.onboarded && was !== arg) toast(arg === 'none' ? 'No challenge. The waiting room still works.' : `${CHALLENGES[arg].name} starts today`); },\n"
    "  treat(arg) { const i = +arg; S.treats = { ...(S.treats || {}) }; if (S.treats[i]) delete S.treats[i]; else S.treats[i] = true; go('home'); toast(S.treats[i] ? `${DAY_NAMES[i]} is a treat night` : `${DAY_NAMES[i]} is a normal night again`); },\n"
    "  wage(arg) { S.wage = clamp(S.wage + +arg, 5, 60); go('home'); },\n"
    "  sale() { S.sale = !S.sale; go('home'); toast(S.sale ? 'Sale week: waits doubled, pauses longer' : 'Sale week is over'); },\n"
    "  buddy() { S.buddy = !S.buddy; go('home'); toast(S.buddy ? 'Sam is your spending buddy' : 'Spending buddy off'); },\n"
    "  openReady() { hideBanner(); S.tab = 'room'; S.roomView = 'ready'; goT('home', inPausa() ? 'fade' : 'zoom'); },\n"
    "  openNote() { S.noteReturn = S.screen === 'home' ? S.tab : 'home'; S.noteDraft = S.note || ''; S.rec = null; goT('note', 'fwd'); },\n"
    "  noteBack() { S.rec = null; S.tab = S.noteReturn || 'home'; goT('home', 'back'); },\n"
    "  record() { if (S.rec === 'on') { S.rec = null; if (!S.noteDraft) S.noteDraft = noteIdeas()[0]; go('note'); return; } S.rec = 'on'; go('note'); clearTimeout(window._recT); window._recT = setTimeout(() => { if (S.rec === 'on' && S.screen === 'note') ACT.record(); }, 3200); },\n"
    "  noteIdea(arg) { S.noteDraft = noteIdeas()[+arg] || ''; S.rec = null; go('note'); },\n"
    "  noteSave() { if (!S.noteDraft) return; S.note = S.noteDraft; S.rec = null; S.tab = S.noteReturn || 'home'; goT('home', 'back'); toast('Your note will play in every pause'); },\n"
    "  playNote() { document.querySelectorAll('#scr .wr-wave').forEach((w) => { w.classList.add('play'); setTimeout(() => w.classList.remove('play'), 3500); }); if (S.screen === 'pause') toast('Playing your note'); },")
rep("passCancel() { S.draft = null; go('springboard'); },",
    "passCancel() { const fr = S.draft && S.draft.fromRoom; S.draft = null; if (fr) { S.tab = 'room'; goT('home', 'back'); } else go('springboard'); },")

DOPARK = r'''
/* Park a want: it becomes a paper tag in the waiting room; the app stays shielded */
function doPark(skip) {
  const k = S.park; if (!k) return;
  const price = clamp(k.price, 1, 9999), name = (k.name || '').trim() || 'Something', w = waitFor(price);
  const t = { id: S.nextId++, app: k.app, name, price, parked: Date.now(), readyAt: skip ? Date.now() : Date.now() + w.ms / timeScale(), when: skip ? 'now' : w.when, waitMs: skip ? 0 : w.ms, g: S.nextId % GRADS.length, buddy: !!skip };
  S.room.push(t);
  if (skip) S.readySeen = [...(S.readySeen || []), t.id];
  let r;
  if (k.from === 'pause' && S.pause) { r = finishPause(5, `Parked ${name} in the waiting room`).r; startCool(t.app); }
  else r = award(5, `Parked ${name} in the waiting room`, t.app, { kind: 'pause' });
  S.lastParked = { ...t, xp: r.give, from: k.from, up: r.up }; S.park = null; S.sheet = null; S.buddyReply = null;
  goT('parked', 'fade');
}
'''
rep("\nconst ACT = {", DOPARK + "\nconst ACT = {")

# ---------- input handling ----------
rep("  if (k === 'need' && S.draft) S.draft.need = t.value.slice(0, 40);",
    "  if (k === 'parkName' && S.park) S.park.name = t.value.slice(0, 40);\n"
    "  if (k === 'parkPrice' && S.park) { const raw = t.value.replace(/[^0-9]/g, '').slice(0, 4); if (raw !== t.value) t.value = raw; S.park.price = clamp(raw || 1, 1, 9999); updateRule('p', S.park.price); const b = document.getElementById('buddyrow'); if (b) b.innerHTML = buddyRow(S.park.price); }\n"
    "  if (k === 'rulePrice') { S.rulePrice = +t.value; const rp = $('#rp'); if (rp) rp.textContent = '£' + S.rulePrice; updateRule('r', S.rulePrice); }\n"
    "  if (k === 'need' && S.draft) S.draft.need = t.value.slice(0, 40);")
# park price input lives in the overlay layer, outside #host? check: #ovl is inside #host, fine.

# ---------- timers: countdowns and the "ready" banner ----------
rep("  if (S.screen === 'pause') updatePause();",
    "  if (S.screen === 'pause') updatePause();\n"
    "  document.querySelectorAll('#scr [data-left]').forEach((el) => { const t = S.room.find((x) => x.id === +el.dataset.left); if (t) { const v = `${dur(leftMs(t) / 60000)} left`; if (el.textContent !== v) el.textContent = v; } });\n"
    "  if (S.subscribed && S.room.length) {\n"
    "    const newly = S.room.filter((t) => isReady(t) && !(S.readySeen || []).includes(t.id));\n"
    "    if (newly.length) {\n"
    "      S.readySeen = [...(S.readySeen || []), ...newly.map((t) => t.id)]; save();\n"
    "      const n = roomReady().length;\n"
    "      if (S.screen === 'home') render();\n"
    "      banner({ body: n > 1 ? `${n} wants are ready. Still want them? Tap to decide.` : `${newly[0].name} is ready. Still want it? Tap to decide.`, action: 'openReady' });\n"
    "    }\n"
    "  }")

# ---------- test panel ----------
rep("<li class=\"${S.onboarded ? 'done' : ''}\">Go through setup, or ${S.onboarded ? 'skip it' : '<button class=\"pbtn primary\" data-p=\"skip\" style=\"padding:4px 12px;font-size:13px\">Skip setup</button>'}.</li>\n<li>Tap the bar at the bottom of the phone to reach the iPhone home screen, then open Uber Eats.</li>\n<li>Choose “I still want to shop”, tap the notification, and wait out the pause.</li>\n<li>Start a Shopping Pass. When it runs out, the app locks again.</li>\n<li>Check in on the pass to earn XP and climb the ranks.</li></ol></section>",
    "<li class=\"${S.onboarded ? 'done' : ''}\">Go through setup from the first screen, or ${S.onboarded ? 'skip it' : '<button class=\"pbtn primary\" data-p=\"skip\" style=\"padding:4px 12px;font-size:13px\">Skip setup</button>'}. A welcome parcel waits on Today.</li>\n<li>Tap the bar at the bottom of the phone to reach the iPhone home screen, then open SHEIN or Amazon.</li>\n<li>Choose “I still want to shop”, wait out the pause, then “Park it till morning”.</li>\n<li>Use “Jump to the morning” below, then decide in the Waiting room. Letting go earns a parcel.</li>\n<li>Open the parcel on Today to get the next sticker. Or keep it and shop with a pass.</li></ol></section>")
rep("<div><dt>Shopping Pass</dt><dd>${S.pass ? `${nm(S.pass.app)} · <span data-countdown=\"pass\">${fmt(passLeft())}</span> left` : 'None'}</dd></div>",
    "<div><dt>Shopping Pass</dt><dd>${S.pass ? `${nm(S.pass.app)} · <span data-countdown=\"pass\">${fmt(passLeft())}</span> left` : 'None'}</dd></div>\n<div><dt>Waiting room</dt><dd>${S.room.length} waiting, ${roomReady().length} ready · ${S.parcels || 0} parcel${S.parcels === 1 ? '' : 's'}</dd></div>")
rep("<button class=\"pbtn\" data-p=\"pausa\">${ic('pause-bold')} Open Pausa</button>",
    "<button class=\"pbtn\" data-p=\"pausa\">${ic('pause-bold')} Open Pausa</button>${S.subscribed ? `<button class=\"pbtn\" data-p=\"room\">${ic('hourglass-medium-bold')} Waiting room</button>` : ''}")
rep("${S.subscribed ? `<div class=\"prow\"><button class=\"pbtn\" data-p=\"tomorrow\">${ic('calendar-check-bold')} Skip to tomorrow</button></div>` : ''}",
    "${S.subscribed ? `<div class=\"prow\"><button class=\"pbtn\" data-p=\"morning\">${ic('moon-stars-bold')} Jump to the morning: waits end</button><button class=\"pbtn\" data-p=\"tomorrow\">${ic('calendar-check-bold')} Skip to tomorrow</button></div>\n"
    "<div class=\"prow\"><button class=\"pbtn${S.night ? ' primary' : ''}\" data-p=\"night\" aria-pressed=\"${S.night}\">Pretend it’s 23:10: ${S.night ? 'on' : 'off'}</button><button class=\"pbtn${S.sale ? ' primary' : ''}\" data-p=\"sale\" aria-pressed=\"${S.sale}\">Black Friday week: ${S.sale ? 'on' : 'off'}</button></div>\n"
    "<div class=\"prow\"><button class=\"pbtn\" data-p=\"treat\">${(S.treats || {})[dow()] ? 'Make tonight a normal night' : 'Make tonight a treat night'}</button><button class=\"pbtn\" data-p=\"parcel\">${ic('plus-bold')} Add a parcel</button></div>\n"
    "<p class=\"fine\">Waits run 60 times faster with fast timers on. A treat night lifts the shield on ${esc(treatAppNames())}.</p>` : ''}")
rep("  else if (p === 'lock7')",
    "  else if (p === 'room') { hideBanner(); S.sheet = null; S.tab = 'room'; nextT = 'fade'; if (!inPausa()) nextT = 'zoom'; go('home'); }\n"
    "  else if (p === 'morning') { S.room.forEach((t) => { t.readyAt = Math.min(t.readyAt, Date.now()); }); S.night = false; save(); render(); toast(S.room.length ? '08:00. Morning-you has things to decide.' : '08:00. Nothing was waiting.'); }\n"
    "  else if (p === 'night') { S.night = !S.night; save(); render(); toast(S.night ? 'It’s 23:10 for Pausa: risky hour, longer pauses' : 'Back to the real time'); }\n"
    "  else if (p === 'sale') { S.sale = !S.sale; save(); render(); toast(S.sale ? 'Black Friday week: waits doubled' : 'Sale week is over'); }\n"
    "  else if (p === 'treat') { const d = dow(); S.treats = { ...(S.treats || {}) }; if (S.treats[d]) delete S.treats[d]; else S.treats[d] = true; save(); render(); toast(S.treats[d] ? `Tonight is a treat night: ${treatAppNames()} open with no pause` : 'Tonight is a normal night'); }\n"
    "  else if (p === 'parcel') { S.parcels = (S.parcels || 0) + 1; S.parcelWhy = 'A test parcel from the panel.'; save(); render(); toast('A parcel is waiting on Today'); }\n"
    "  else if (p === 'lock7')")
# skip to tomorrow also moves the challenge day on
rep("else if (p === 'tomorrow') { const before = S.cardsFilled || 0, had = S.dayBroken, add = endDay(1);",
    "else if (p === 'tomorrow') { const before = S.cardsFilled || 0, had = S.dayBroken, add = endDay(1); S.dayShift = (S.dayShift || 0) + 1;")
rep("toast((S.cardsFilled || 0) > before ? '+50 XP · Card full! Here’s a fresh one'",
    "toast((S.cardsFilled || 0) > before ? '+50 XP · Card full! A parcel and a fresh card'")

open(OUT, 'w', encoding='utf-8').write(s)
print('ok', len(s))
