#!/usr/bin/env python3
"""v18 round 16b, market research changes 1 and 4 (recommended middle options):
1 the setup tour keeps 3 slides (Park it, Shop with a plan, Stickers); checkout catch, late nights and the note from calm you arrive as New cards on Today on days 2, 4 and 6.
4 Today's plan card becomes one tappable line."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# ---------- 1: shorter tour, the rest unlocks in week one ----------
rep("];\n\n/* Calm Today: one card, at most one next step, then the pass button. Everything else lives in Me. */",
    r"""];
/* Week one: three features arrive one at a time on Today instead of in setup */
const WEEK1 = [[1, 2, 'checkout'], [3, 4, 'risky'], [5, 6, 'note']].map(([i, day, k]) => ({ ...TOUR[i], day, k }));
[5, 3, 1].forEach((i) => TOUR.splice(i, 1));
const dayIn = () => (S.trialAt ? Math.floor((Date.now() - S.trialAt) / 86400000) + 1 + (S.dayShift || 0) : 1);
const nextUnlock = () => WEEK1.find((u) => dayIn() >= u.day && !(S.unlocked || []).includes(u.k));

/* Calm Today: one card, at most one next step, then the pass button. Everything else lives in Me. */""")
rep("  const out = [];\n  if (dow() === 6", "  const out = [], un = S.subscribed ? nextUnlock() : null;\n  if (un) out.push(`<button class=\"card new-card mt-4 w-full p-4 flex items-center gap-3 text-left rise\" style=\"--d:50\" data-a=\"openUnlock\" data-arg=\"${un.k}\"><span class=\"tile w-11 h-11 bg-sun text-[22px]\">${ic('sparkle-fill')}</span><span class=\"flex-1 min-w-0\"><span class=\"chip chip-sun text-[11px] mb-1\">New · day ${un.day}</span><span class=\"block t-title\">${un.t}</span><span class=\"block t-small\">${un.kick}</span></span><span class=\"text-xl text-ink3\">${ic('caret-right-bold')}</span></button>`);\n  if (dow() === 6")
rep("recap: () => {", r"""unlock: () => { const u = WEEK1.find((x) => x.k === S.unlockK) || WEEK1[0];
  return `<div class="h-full flex flex-col"><header class="flex-shrink-0 px-6 pt-14 pb-2 flex items-center gap-3"><button class="backbtn" data-a="unlockDone" aria-label="Back">${ic('arrow-left-bold')}</button><span class="chip chip-sun text-[13px]">${ic('sparkle-fill')} New for you · day ${u.day}</span></header>
<div class="flex-1 scroll px-7 pt-2 pb-2 tour-in">
<span class="chip chip-lilac text-[13px] tour-kick">${u.kick}</span>
<div class="tour-stage mt-4">${u.art()}</div>
<h1 class="mt-6 t-h1">${u.t}</h1>
<p class="mt-2 t-body">${u.d}</p>
</div>${foot(u.k === 'note' ? btn('Record my note', 'unlockGo', 'primary') + `<button class="w-full mt-2 py-2 text-[15px] font-bold text-azure-light" data-a="unlockDone">Maybe later</button>` : u.k === 'risky' ? btn('Got it', 'unlockDone') + `<button class="w-full mt-2 py-2 text-[15px] font-bold text-azure-light" data-a="unlockGo">See my rules</button>` : btn('Got it', 'unlockDone'))}</div>`;
},

recap: () => {""")
rep("  openRecap() {", r"""  openUnlock(k) { S.unlockK = k; goT('unlock', 'fwd'); },
  unlockDone() { S.unlocked = [...new Set([...(S.unlocked || []), S.unlockK])]; S.tab = 'home'; goT('home', 'back'); },
  unlockGo() { const k = S.unlockK; S.unlocked = [...new Set([...(S.unlocked || []), k])]; if (k === 'risky') { S.rulesFrom = 'home'; S.tab = 'plan'; goT('home', 'fwd'); } else if (k === 'note') { S.tab = 'progress'; goT('home', 'fwd'); toast('Your note is on Me, under “A note from calm you”'); } else ACT.unlockDone(); },
  openRecap() {""")
rep(".pfact {", ".new-card { border-color: #6B5A2A; background: linear-gradient(135deg, #2A2552, #1C2057); }\n.pfact {")

# ---------- 4: Today's plan becomes one line ----------
i = s.index("function planCard() {")
j = s.index("\n}\n", i) + 3
s = s[:i] + r"""function planCard() {
  const ch = CHALLENGES[S.challenge], d = Math.min(challengeDay(), ch.len || 0), nt = nextTreat(), on = S.picked.filter((id) => S.protection && !S.off.includes(id)).length;
  const bits = [ch.len ? `${ch.name}, day ${d}` : 'No challenge yet', (S.treats || {})[dow()] ? 'treat night tonight' : nt ? `treat night ${nt === 'Tomorrow' ? 'tomorrow' : nt}` : '', `${on} app${on === 1 ? '' : 's'} shielded`].filter(Boolean);
  return `<button class="card mt-4 w-full px-4 py-3 flex items-center gap-3 text-left rise" style="--d:90" data-a="openRules" data-arg="home" aria-label="Your plan: ${bits.join(', ')}"><span class="tile w-10 h-10 ${ch.len ? ch.bg : 'bg-hush text-azure-light'} text-[20px]">${ic(ch.len ? ch.icon : 'calendar-check-bold')}</span><span class="flex-1 min-w-0"><span class="block text-[13px] font-bold text-ink3">Your plan</span><span class="block t-title truncate">${bits[0]}</span><span class="block t-small truncate">${bits.slice(1).join(' · ')}</span></span><span class="text-lg text-ink3">${ic('caret-right-bold')}</span></button>`;
}
""" + s[j:]

# test panel: jump a few days to see the unlocks
rep("<button class=\"pbtn\" data-p=\"recap\">", "<button class=\"pbtn\" data-p=\"unlock\">${ic('sparkle-fill')} Next week-one unlock</button><button class=\"pbtn\" data-p=\"recap\">")
rep("  else if (p === 'recap')", "  else if (p === 'unlock') { const u = WEEK1.find((x) => !(S.unlocked || []).includes(x.k)); if (!u) { toast('All three are unlocked'); return; } S.dayShift = Math.max(S.dayShift || 0, u.day - 1 - Math.floor((Date.now() - (S.trialAt || Date.now())) / 86400000)); hideBanner(); S.tab = 'home'; save(); goT('home', 'fade'); toast(`It’s day ${u.day} of your trial`); }\n  else if (p === 'recap')")

open(F, 'w', encoding='utf-8').write(s)
print('ok r', len(s))
