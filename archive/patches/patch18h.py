#!/usr/bin/env python3
"""v18 round 7: a 6-slide feature tour in setup (replaces the waiting room intro)."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


rep("'demo', 'roomIntro', 'rules', 'paywall'];", "'demo', 'tour', 'rules', 'paywall'];")
rep("roomIntro: 'The waiting room (intro)', rules: 'Set your rules',", "roomIntro: 'The waiting room (intro)', tour: 'Feature tour', rules: 'Set your rules',")
rep("['I’ll leave it', '+10 XP and a parcel', 'chip-mint']", "['I’ll leave it', '+10 XP', 'chip-mint']")
rep("tourI: 0,", "tourI: 0,", 0)
rep("parcels: 0, parcelsToday: 0,", "tourI: 0, parcels: 0, parcelsToday: 0,")

CSS = """.tour-stage { position: relative; height: 300px; border-radius: 30px; background: radial-gradient(120% 90% at 50% 0%, #2B318C 0%, #171A4A 62%, #12153A 100%); border: 1.5px solid #2E3374; overflow: hidden; display: flex; flex-direction: column; align-items: stretch; justify-content: center; gap: 12px; padding: 20px 18px; }
.tour-in { animation: tour-in .4s var(--ease) both; }
@keyframes tour-in { from { opacity: 0; transform: translateX(26px); } to { opacity: 1; transform: none; } }
.tour-dots { display: flex; gap: 6px; justify-content: center; }
.tour-dots button { width: 8px; height: 8px; border-radius: 99px; background: #343A80; transition: width .25s, background .25s; }
.tour-dots button[aria-current="true"] { width: 26px; background: #93A5FF; }
.tour-kick { align-self: flex-start; }
.mini-card { background: #1C2057; border: 1.5px solid #2E3374; border-radius: 20px; padding: 12px 14px; }
.mini-btn { border-radius: 999px; background: linear-gradient(180deg, #5873FF, #4361FF); color: #FFFFFF; font-weight: 800; font-size: 15px; padding: 11px 16px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 7px; box-shadow: 0 3px 0 #2D44C7; }
"""
rep(".wr-mini { display: flex;", CSS + ".wr-mini { display: flex;")

TOUR = r"""
/* Feature tour in setup: one feature per slide, each with a small preview of the real screen */
const TOUR = [
  { kick: 'When a want hits', t: 'Park it till morning', d: 'No name or price needed. The app stays shielded, and you decide tomorrow with a clear head.', art: () => `<div class="wr-mini">${[['Something from SHEIN', 'price not known · 08:00', 1, '-3deg'], ['Robot vacuum', '£95 · ready 08:00', 0, '2.5deg']].map(([n, m, g, r]) => `<div class="wr-minitag" style="--r:${r}"><span class="im" style="background:linear-gradient(135deg,${GRADS[g]})"></span><b>${n}</b><span>${m}</span></div>`).join('')}</div><div class="mini-btn mx-6">${ic('hourglass-medium-bold')} Park it</div>` },
  { kick: 'At checkout', t: 'Caught at checkout', d: 'Screenshot your basket and share it to Pausa, or let the Safari extension spot checkout pages. Read on your phone, never sent anywhere.', art: () => `<div class="mini-card flex items-center gap-3"><span class="tile w-11 h-11 bg-hush text-azure-light text-[22px]">${ic('camera-bold')}</span><span><b class="block t-title">Snap your basket</b><span class="block t-small">3 items · £46.97 read from your screenshot</span></span></div>
<div class="mini-card flex items-center gap-3"><span class="tile w-11 h-11 bg-white text-[#0A84FF] text-[24px]">${ic('compass-bold')}</span><span><b class="block t-title">You’re at checkout</b><span class="block t-small">Pausa for Safari · shein.co.uk</span></span></div>
<div class="mini-btn">${ic('hourglass-medium-bold')} Park the basket till morning</div>` },
  { kick: 'When you really need something', t: 'Shop with a plan', d: 'Say what you need and set a limit, then tear the ticket. The app opens for a set time and locks again by itself.', art: () => `<div class="ticket w-full px-5 py-5 flex items-center gap-4"><span class="w-12 h-12 bg-white rounded-full p-1.5 flex-shrink-0">${appArt('amazon', 'w-full h-full')}</span><span class="flex-1 min-w-0"><b class="block t-title">Amazon pass</b><span class="block text-[14px] font-semibold opacity-85">Phone charger · £15 limit</span></span><span class="text-right"><b class="block t-num text-[26px] leading-none">15</b><span class="text-[12px] font-bold">min</span></span></div>
<div class="flex items-center justify-center gap-2 text-[14px] font-bold text-cream/80">${ic('hand-pointing-bold')} Tear the ticket to start</div>` },
  { kick: 'Late nights and sale weeks', t: 'Tougher when you’re weakest', d: 'After 22:00 and in sale weeks, the pause gets longer and wants wait longer. Pausa learns your risky hours on your phone.', art: () => `<div class="mini-card"><div class="flex items-center justify-between"><b class="t-title">Your risky hours</b><span class="chip chip-peach">22:00 to 00:00</span></div><div class="wr-hours mt-3" aria-hidden="true">${HOURLY.map((v, i) => `<i class="${v >= 7 ? 'hot' : ''}" style="height:${10 + Math.min(v, 9) * 10}%"></i>`).join('')}</div><div class="wr-axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></div>
<div class="grid grid-cols-2 gap-2"><div class="mini-card text-center"><b class="block t-num text-[22px]">45 s</b><span class="t-small">pause after 22:00</span></div><div class="mini-card text-center"><b class="block t-num text-[22px]">×2</b><span class="t-small">waits on Black Friday</span></div></div>` },
  { kick: 'Rewards you earn', t: 'Earn stickers, rank up', d: 'Finish real goals, like letting go of 5 things, to win stickers. Ranks take months to climb, and they never drop.', art: () => `<div class="rankcard px-4 py-3 flex items-center gap-3"><span class="w-11 h-11 bg-white sticker rounded-full flex items-center justify-center text-[22px]">${ic('medal-bold')}</span><span class="flex-1"><span class="block text-[13px] font-bold">Bronze</span><b class="block t-title">Window Shopper</b></span><span class="text-[13px] font-bold">0 / 300 XP</span></div>
<div class="mini-card py-1">${[['welcome', 'Leave at the pause 5 times', 3, 5], ['puzzle', 'Let go of 5 things', 1, 5]].map(([k, t, v, n], i) => `<div class="wr-goal${i ? ' border-t-[1.5px] border-[#2E3374]' : ''}"><span class="gimg"><img src="${IMG[k]}" alt=""></span><span class="flex-1 min-w-0"><span class="block t-title">${t}</span><span class="gbar"><i style="width:${v / n * 100}%"></i></span></span><span class="t-small tabular-nums">${v} / ${n}</span></div>`).join('')}</div>` },
  { kick: 'In every pause', t: 'A note from calm you', d: 'Record a few words while you feel calm. They play in your pause, right when the shops are loudest.', art: () => `<div class="flex justify-center">${img('bubble', 'w-24 h-24 cut', '')}</div><div class="wr-voice"><span class="pl">${ic('play-fill')}</span><span><small>Your note from calm you</small><span class="t">“Is this worth four hours of work? Sleep on it.”</span></span></div><div class="flex justify-center">${waveHTML(false)}</div>` }
];
"""
rep("\n/* Calm Today:", TOUR + "\n/* Calm Today:")

rep("rules: () => `", r"""tour: () => { const i = Math.min(S.tourI || 0, TOUR.length - 1), t = TOUR[i], last = i === TOUR.length - 1;
  return `<div class="h-full flex flex-col"><header class="flex-shrink-0 px-6 pt-14 pb-2 flex items-center gap-3"><button class="backbtn" data-a="tourPrev" aria-label="Back">${ic('arrow-left-bold')}</button>${progress(5)}</header>
<div class="flex-1 scroll px-7 pt-2 pb-2 tour-in" aria-live="polite">
<span class="chip chip-lilac text-[13px] tour-kick">${i + 1} of ${TOUR.length} · ${t.kick}</span>
<div class="tour-stage mt-4">${t.art()}</div>
<h1 class="mt-6 t-h1">${t.t}</h1>
<p class="mt-2 t-body">${t.d}</p>
</div>
<footer class="flex-shrink-0 px-7 pt-3 pb-9 space-y-3"><div class="tour-dots" role="group" aria-label="Feature tour">${TOUR.map((x, k) => `<button data-a="tourGo" data-arg="${k}" aria-label="${x.t}" aria-current="${k === i}"></button>`).join('')}</div>
${btn(last ? 'Set my rules' : 'Next', 'tourNext')}<button class="w-full py-1 font-bold text-ink3" data-a="tourSkip">Skip the tour</button></footer></div>`;
},

rules: () => `""")

rep("  back() {", "  tourNext() { if ((S.tourI || 0) < TOUR.length - 1) { S.tourI = (S.tourI || 0) + 1; go('tour'); } else ACT.next(); },\n  tourPrev() { if ((S.tourI || 0) > 0) { S.tourI -= 1; go('tour'); } else ACT.back(); },\n  tourGo(arg) { S.tourI = +arg; go('tour'); },\n  tourSkip() { ACT.next(); },\n  back() {")

open(F, 'w', encoding='utf-8').write(s)
print('ok h', len(s))
