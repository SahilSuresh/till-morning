#!/usr/bin/env python3
"""v18 round 11: proof at check-in. A checkout screenshot under your limit earns bonus XP and proof-only stickers."""
import sys, urllib.parse
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


RECEIPT = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE38F"/><stop offset=".45" stop-color="#FFF6D6"/><stop offset=".7" stop-color="#F5B83D"/><stop offset="1" stop-color="#C9861A"/></linearGradient></defs>
<circle cx="100" cy="100" r="92" fill="#FFFFFF"/><circle cx="100" cy="100" r="84" fill="url(#f)"/>
<g transform="rotate(-8 100 100)"><path d="M62 40h76v112l-9.5-8-9.5 8-9.5-8-9.5 8-9.5-8-9.5 8-9.5-8-9.5 8z" fill="#FFFFFF" stroke="#14163A" stroke-width="5" stroke-linejoin="round"/>
<rect x="76" y="58" width="48" height="7" rx="3.5" fill="#C9CDF0"/><rect x="76" y="74" width="34" height="7" rx="3.5" fill="#C9CDF0"/><rect x="76" y="90" width="42" height="7" rx="3.5" fill="#C9CDF0"/>
<rect x="76" y="110" width="48" height="10" rx="5" fill="#14163A"/></g>
<circle cx="138" cy="128" r="26" fill="#1FBF86" stroke="#14163A" stroke-width="5"/><path d="M126 128l8 8 16-17" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M52 56l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#FFFFFF" stroke="#14163A" stroke-width="4" stroke-linejoin="round"/></svg>'''
WALLET = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9B0FF"/><stop offset=".5" stop-color="#F1E8FF"/><stop offset=".75" stop-color="#9C6BFF"/><stop offset="1" stop-color="#5B2BD6"/></linearGradient></defs>
<circle cx="100" cy="100" r="92" fill="#FFFFFF"/><circle cx="100" cy="100" r="84" fill="url(#g)"/>
<rect x="44" y="66" width="112" height="78" rx="16" fill="#4361FF" stroke="#14163A" stroke-width="5"/><path d="M56 66l60-22 10 22" fill="#93A5FF" stroke="#14163A" stroke-width="5" stroke-linejoin="round"/>
<rect x="118" y="90" width="44" height="30" rx="10" fill="#FFFFFF" stroke="#14163A" stroke-width="5"/><circle cx="132" cy="105" r="5" fill="#14163A"/>
<rect x="68" y="98" width="38" height="32" rx="7" fill="#FFC94D" stroke="#14163A" stroke-width="5"/><path d="M76 98v-8a11 11 0 0 1 22 0v8" fill="none" stroke="#14163A" stroke-width="5"/><circle cx="87" cy="113" r="4" fill="#14163A"/>
<path d="M150 46l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#FFFFFF" stroke="#14163A" stroke-width="4" stroke-linejoin="round"/></svg>'''
uri = lambda x: 'data:image/svg+xml,' + urllib.parse.quote(' '.join(x.split()), safe=':/=,; ')

# Two proof-only stickers
rep("const STICKERS = [['welcome', 'Pause button'], ['shieldm', 'Wait sign'], ['ticket', 'Access ticket'], ['puzzle', 'Puzzle shield'], ['cape', 'Caped saver'], ['bubble', 'Garden thinker'], ['legend', 'Legend set']];",
    "const STICKERS = [['welcome', 'Pause button'], ['shieldm', 'Wait sign'], ['ticket', 'Access ticket'], ['puzzle', 'Puzzle shield'], ['cape', 'Caped saver'], ['bubble', 'Garden thinker'], ['legend', 'Legend set'], ['receipt', 'Receipt hero'], ['wallet', 'Iron wallet']];\n"
    f"IMG.receipt = {repr(uri(RECEIPT))}; IMG.wallet = {repr(uri(WALLET))};")
rep("const STICKER_SLOTS = 7,", "const STICKER_SLOTS = 9,")
rep("  { k: 'legend', task: 'Finish a 30-day challenge', n: 30,",
    "  { k: 'receipt', task: 'Prove you stayed under your limit', n: 1, get: () => cnt('underLimit'), special: true },\n"
    "  { k: 'wallet', task: 'Prove it 5 times: under your limit, with a screenshot', n: 5, get: () => cnt('underLimit'), special: true },\n"
    "  { k: 'legend', task: 'Finish a 30-day challenge', n: 30,")

# Me: mark proof-only goals
rep("<span class=\"gimg${(S.freshSticker === STICKERS.findIndex((x) => x[0] === g.k)) && got ? ' fresh' : ''}\">",
    "<span class=\"gimg${g.special ? ' special' : ''}${(S.freshSticker === STICKERS.findIndex((x) => x[0] === g.k)) && got ? ' fresh' : ''}\">")
rep("<span class=\"block t-title\">${got ? stickerName(g.k) : g.task}</span>",
    "${g.special ? '<span class=\"sp-chip\">Proof only</span>' : ''}<span class=\"block t-title\">${got ? stickerName(g.k) : g.task}</span>")
rep(".wr-goal .gimg.fresh {", ".wr-goal .gimg.special { background: linear-gradient(135deg, #FFE38F, #B48CFF); box-shadow: 0 0 0 1.5px rgba(255, 227, 143, .6); }\n.wr-goal .gimg.special img { filter: grayscale(.4) brightness(.8); opacity: .75; }\n.wr-goal.got .gimg.special img { filter: none; opacity: 1; }\n.sp-chip { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 3px; padding: 1px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 800; letter-spacing: .02em; color: #14163A; background: linear-gradient(90deg, #FFE38F, #F3D1FF, #FFE38F); background-size: 200% 100%; animation: foil 3s linear infinite; }\n@keyframes foil { to { background-position: -200% 0; } }\n.wr-goal .gimg.fresh {")

# Check-in: optional proof card
PROOF = r"""${(() => { const lim = parseFloat(c.limit); if (!(lim > 0)) return ''; const pr = c.proof;
  if (pr === 'reading') return `<div class="proof mt-4 w-full"><span class="tile w-11 h-11 bg-hush text-azure-light text-[22px]">${ic('camera-bold')}</span><span class="flex-1"><b class="block t-title">Reading your screenshot…</b><span class="block t-small">On this phone. The picture never leaves it.</span></span></div>`;
  if (pr) return `<div class="proof done mt-4 w-full rise"><span class="tile w-11 h-11 ${pr.under ? 'bg-mint' : 'bg-peach'} text-[22px]">${ic(pr.under ? 'check-bold' : 'warning-circle-bold')}</span><span class="flex-1 min-w-0"><b class="block t-title">${pr.under ? 'Under your limit' : 'Over your limit'}</b><span class="block t-small tabular-nums">Checkout total ${money(pr.total)} · your limit ${money(lim)}</span><span class="block text-[13px] font-bold mt-1 ${pr.under ? 'text-mint' : 'text-[#FFAB98]'}">${pr.under ? 'Pick “Bought only what I planned” for +15 bonus XP and a step to a proof-only sticker.' : 'No bonus this time. An honest answer still earns 10 XP.'}</span></span></div>`;
  return `<button class="proof mt-4 w-full text-left" data-a="addProof"><span class="tile w-11 h-11 bg-hush text-azure-light text-[22px]">${ic('camera-bold')}</span><span class="flex-1 min-w-0"><b class="block t-title">Add your checkout screenshot <span class="font-semibold text-ink3">(optional)</span></b><span class="block t-small">Stayed under your ${money(lim)} limit? Prove it for +15 bonus XP and proof-only stickers.</span><span class="mt-2 flex gap-1.5"><img class="w-9 h-9" src="${IMG.receipt}" alt=""><img class="w-9 h-9" src="${IMG.wallet}" alt=""></span></span></button>`;
})()}"""
rep("<p class=\"mt-1 t-title\">${esc(passLine(c))}</p></div></div>", "<p class=\"mt-1 t-title\">${esc(passLine(c))}</p></div></div>\n" + PROOF)
rep(".wr-goal .gimg.special {", ".proof { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 20px; border: 1.5px dashed #3A4096; background: #161942; }\n.proof.done { border-style: solid; border-color: #2E3374; background: #1C2057; }\n.wr-goal .gimg.special {")
rep("  checkinSkip() {", "  addProof() { const c = S.checkin; if (!c || c.proof) return; c.proof = 'reading'; go('checkin'); setTimeout(() => { if (S.checkin !== c) return; const lim = parseFloat(c.limit) || 0, total = c.overDemo ? Math.round(lim * 1.25 * 100 + 49) / 100 : Math.max(1, Math.floor(lim * .87) + .99 - (lim * .87 % 1 > .5 ? 0 : 1)); c.proof = { total, under: total <= lim }; save(); go('checkin'); }, 1300); },\n  checkinSkip() {")
rep("    const r = award(10, `Checked in: ${w.toLowerCase()}`, c.app); S.checkin = null; S.tab = 'home';\n    goT(S.rankUp ? 'rankup' : 'home', 'fade'); toast(xpMsg(r, 'Thanks for being honest'));",
    "    let r = award(10, `Checked in: ${w.toLowerCase()}`, c.app); const proved = arg === 'plan' && c.proof && c.proof.under;\n"
    "    if (proved) { bump('underLimit'); r = award(15, 'Proved you stayed under your limit', c.app); }\n"
    "    S.checkin = null; S.tab = 'home';\n    goT(S.rankUp ? 'rankup' : 'home', 'fade'); toast(xpMsg(r, proved ? 'Under your limit, with proof. Great self-control' : 'Thanks for being honest'));")
# Panel shortcut to try it
rep("<button class=\"pbtn\" data-p=\"safari\">${ic('compass-bold')} Shop in Safari</button>",
    "<button class=\"pbtn\" data-p=\"safari\">${ic('compass-bold')} Shop in Safari</button><button class=\"pbtn\" data-p=\"passend\">${ic('ticket-bold')} End a pass (check-in)</button>")
rep("  else if (p === 'safari')", "  else if (p === 'passend') { hideBanner(); S.sheet = null; S.pass = null; S.checkin = { app: 'amazon', need: 'Phone charger', limit: '15', reason: 'specific', minutes: 15 }; S.passCount = (S.passCount || 0) + 1; save(); goT('checkin', 'fade'); }\n  else if (p === 'safari')")

open(F, 'w', encoding='utf-8').write(s)
print('ok l', len(s))
