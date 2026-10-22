#!/usr/bin/env python3
"""v18 round 10: tiered ranks (Bronze III to Legend I) and a ranks screen from the rank card."""
import sys, re
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


i = s.index("const RANKS = [")
j = s.index("];", i) + 2
s = s[:i] + r"""/* Six metals, three tiers each: III is the first step, I the last. 60 XP a day at most, so Legend I takes 150+ days. */
const METALS = [
  { metal: 'Bronze', title: 'Window Shopper', icon: 'medal-bold', chip: 'bg-orange-100', c: ['#F2B27A', '#A85F2B'], xp: [0, 100, 200] },
  { metal: 'Silver', title: 'Mindful Browser', icon: 'shield-bold', chip: 'bg-slate-100', c: ['#EEF2F8', '#8E99B0'], xp: [300, 500, 700] },
  { metal: 'Gold', title: 'Cart Controller', icon: 'crown-bold', chip: 'bg-yellow-100', c: ['#FFE38F', '#D4911A'], xp: [900, 1250, 1600] },
  { metal: 'Platinum', title: 'Checkout Guardian', icon: 'shield-star-bold', chip: 'bg-cyan-100', c: ['#C4F6F2', '#3AA9A4'], xp: [2000, 2500, 3000] },
  { metal: 'Diamond', title: 'Impulse Breaker', icon: 'diamond-bold', chip: 'bg-sky-100', c: ['#CFE0FF', '#4F7BEA'], xp: [3500, 4300, 5100] },
  { metal: 'Legend', title: 'Spending Strategist', icon: 'trophy-bold', chip: 'bg-lav', c: ['#E6D3FF', '#8248F0'], xp: [6000, 7500, 9000] }
];
const ROMAN = ['III', 'II', 'I'];
const RANKS = METALS.flatMap((m, mi) => m.xp.map((xp, t) => ({ name: `${m.metal} ${ROMAN[t]}`, metal: m.metal, tier: ROMAN[t], mi, title: m.title, xp, icon: m.icon, chip: m.chip, c: m.c })));
const medal = (r, px = 56, locked = false) => `<span class="rk-medal${locked ? ' locked' : ''}" style="--a:${r.c[0]};--b:${r.c[1]};width:${px}px;height:${px}px;font-size:${Math.round(px * .46)}px">${ic(locked ? 'lock-key-bold' : r.icon)}${r.tier ? `<b style="font-size:${Math.max(9, Math.round(px * .2))}px">${r.tier}</b>` : ''}</span>`;""" + s[j:]

CSS = """.rk-medal { position: relative; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(20, 22, 58, .78); background: radial-gradient(circle at 32% 26%, rgba(255, 255, 255, .85), transparent 38%), linear-gradient(150deg, var(--a), var(--b)); box-shadow: inset 0 -3px 0 rgba(0, 0, 0, .18), 0 0 0 3px rgba(255, 255, 255, .18), 0 6px 16px rgba(4, 5, 24, .35); }
.rk-medal b { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); background: #14163A; color: #FFFFFF; border: 1.5px solid var(--a); border-radius: 999px; padding: 1px 7px; font-weight: 800; letter-spacing: .04em; font-family: Georgia, 'Times New Roman', serif; line-height: 1.3; white-space: nowrap; }
.rk-medal.locked { filter: grayscale(.55) brightness(.5); color: rgba(255, 255, 255, .85); }
.rk-medal.locked b { color: #C9CDF0; }
.rk-row { display: flex; align-items: center; gap: 14px; padding: 14px 4px 16px; }
.rk-row.here { background: rgba(67, 97, 255, .14); border-radius: 18px; padding-left: 10px; padding-right: 10px; box-shadow: inset 0 0 0 1.5px rgba(147, 165, 255, .55); }
"""
rep(".wr-bigtag { background:", CSS + ".wr-bigtag { background:")

# Rank card: the medal with its numeral, and it opens the ranks screen
rep("""  return `<div class="rankcard relative mt-4 px-5 pt-5 pb-4 rise" style="--d:40"><div class="flex items-center gap-4"><span class="w-14 h-14 bg-white sticker rounded-full flex items-center justify-center text-[28px]">${ic(r.icon)}</span><div class="flex-1 min-w-0"><p class="text-[14px] font-bold">${r.name}</p><p class="t-h2">${r.title}</p></div></div>""",
    """  return `<button class="rankcard relative mt-4 px-5 pt-5 pb-4 rise w-full text-left block" style="--d:40" data-a="openRanks" aria-label="${r.name}, see all ranks"><div class="flex items-center gap-4">${medal(r, 58)}<div class="flex-1 min-w-0"><p class="text-[14px] font-bold">${r.name}</p><p class="t-h2">${r.title}</p></div><span class="text-[13px] font-bold flex items-center gap-1 opacity-90">All ranks ${ic('caret-right-bold')}</span></div>""")
rep("""<span>${nx ? `${fmtN(nx.xp - S.xp)} XP to ${nx.name}` : 'Top rank'}</span></div></div>`;
}
function heroCard(""", """<span>${nx ? `${fmtN(nx.xp - S.xp)} XP to ${nx.name}` : 'Top rank'}</span></div></button>`;
}
function ranksTab() {
  const r = RANKS[S.rank], nx = RANKS[S.rank + 1];
  const pct = nx ? Math.round(Math.max(0, Math.min(1, (S.xp - r.xp) / (nx.xp - r.xp))) * 100) : 100;
  return `<div class="flex-1 scroll px-6 pt-14 pb-28">
<div class="flex items-center gap-3 rise"><button class="backbtn" data-a="tab" data-arg="progress" aria-label="Back to Me">${ic('arrow-left-bold')}</button><h1 class="t-h1">Ranks</h1></div>
<section class="rankcard mt-5 px-5 pt-6 pb-5 flex flex-col items-center text-center rise" style="--d:40">${medal(r, 96)}<p class="mt-5 text-[14px] font-bold">You’re here</p><h2 class="t-h1 text-[30px]">${r.name}</h2><p class="text-[15px] font-semibold opacity-90">${r.title}</p>
<div class="mt-4 w-full h-3 bg-white/25 rounded-full overflow-hidden"><div class="h-full bg-sun rounded-full" style="width:${pct}%"></div></div>
<p class="mt-2 text-[14px] font-bold tabular-nums">${nx ? `${fmtN(nx.xp - S.xp)} XP to unlock ${nx.name}` : 'You’ve reached the top rank'}</p></section>
<p class="mt-4 t-small text-center rise" style="--d:60">Ranks never drop. You can earn up to 60 XP a day.</p>
${METALS.map((m, mi) => `<section class="card mt-4 p-3 rise" style="--d:${80 + mi * 30}"><div class="flex items-center gap-3 px-1 pb-1"><h3 class="t-h2">${m.metal}</h3><span class="t-small">${m.title}</span></div>
${RANKS.filter((k) => k.mi === mi).map((k) => { const i = RANKS.indexOf(k), done = i < S.rank, cur = i === S.rank, need = k.xp - S.xp; return `<div class="rk-row${cur ? ' here' : ''}"${cur ? ' aria-current="step"' : ''}>${medal(k, 44, !done && !cur)}<span class="flex-1 min-w-0"><span class="block t-title">${k.name}</span><span class="block t-small tabular-nums">${fmtN(k.xp)} XP</span></span>${done ? `<span class="t-small flex items-center gap-1"><span class="text-mint text-lg flex">${ic('check-circle-fill')}</span> Unlocked</span>` : cur ? '<span class="chip chip-sun">You’re here</span>' : `<span class="t-small tabular-nums">${fmtN(need)} XP to go</span>`}</div>`; }).join('')}</section>`).join('')}
</div>`;
}
function heroCard(""")
rep("progress: progressTab, settings: settingsTab }[S.tab] || calmHome)", "progress: progressTab, settings: settingsTab, ranks: ranksTab }[S.tab] || calmHome)")
rep("const on = S.tab === id ||", "const on = S.tab === id || (id === 'progress' && S.tab === 'ranks') ||")
rep("  tourNext() {", "  openRanks() { S.tab = 'ranks'; go('home'); },\n  tourNext() {")

# Rank-up screen: show the six metals, not all 18 steps
rep("""<ol class="mt-7 w-full grid grid-cols-6 gap-1" aria-label="Your ranks">${RANKS.map((k, i) => { const done = i < S.rank, cur = i === S.rank;""",
    """<ol class="mt-7 w-full grid grid-cols-6 gap-1" aria-label="Your ranks">${METALS.map((k, i) => { const done = i < RANKS[S.rank].mi, cur = i === RANKS[S.rank].mi;""")
rep("""text-xl">${ic(done ? 'check-bold' : cur ? k.icon : 'lock-key-bold')}</span><span class="text-[11px] font-bold${!done && !cur ? ' text-ink3' : ''}">${k.name}</span></li>""",
    """text-xl">${ic(done ? 'check-bold' : cur ? k.icon : 'lock-key-bold')}</span><span class="text-[11px] font-bold${!done && !cur ? ' text-ink3' : ''}">${k.metal}</span></li>""")
rep('aria-label="The six ranks">${RANKS.map(', 'aria-label="The six ranks">${RANKS.filter((x) => x.tier === \'III\').map(')
rep("<div class=\"relative pop-in\" style=\"--d:60\">${img('legend', 'w-48 h-48 float cut', 'Stickers of a golden shield, a caped star and a trophy')}</div>",
    "<div class=\"relative pop-in\" style=\"--d:60\">${medal(r, 150)}</div>")

open(F, 'w', encoding='utf-8').write(s)
print('ok k', len(s))
