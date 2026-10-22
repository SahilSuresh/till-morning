#!/usr/bin/env python3
"""v18 round 18: App Store review request at a calm moment.
Apple's own rating pop-up appears about a second after you let go of a parked want, from day 4, after at least 2 let-gos,
never on a day you switched shields off, at most once every 4 months (Apple also caps it at 3 a year).
Settings gets a quiet "Rate Pausa" row; the test panel gets a button that sets up the moment."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# when to ask
rep("/* Calm Today: one card, at most one next step, then the pass button. Everything else lives in Me. */",
    r"""/* Review request: Apple's own pop-up, right after a calm win (letting a parked want go). Never in setup, the shield, the pause, the paywall or after a slip. */
function canAskReview() {
  if (S.rateDemo) return true;
  const asked = (S.rateAsked || []).filter((t) => Date.now() - t < 365 * 86400000), lets = (S.log || []).filter((e) => e.k === 'letgo').length;
  return S.subscribed && !S.rated && dayIn() >= 4 && lets >= 2 && !S.dayBroken && asked.length < 3 && !asked.some((t) => Date.now() - t < 120 * 86400000);
}
function maybeAskReview() {
  if (!canAskReview()) return;
  setTimeout(() => { if (S.screen !== 'home' || S.tab !== 'room' || S.sheet) return; S.rateDemo = false; S.rateAsked = [...(S.rateAsked || []), Date.now()]; S.rateStars = 0; S.sheet = 'rate'; save(); renderOverlays(); }, 1400);
}

/* Calm Today: one card, at most one next step, then the pass button. Everything else lives in Me. */""")
rep("toast(xpMsg(r, got ? 'Let go · a parcel is waiting on Today' : 'Let go')); if (r.up) rankBanner(); },",
    "toast(xpMsg(r, got ? 'Let go · a parcel is waiting on Today' : 'Let go')); if (r.up) rankBanner(); else maybeAskReview(); },")

# Apple's rating pop-up (simulated)
rep("  del: () =>", r"""  rate: () => { const n = S.rateStars || 0; return `<div class="sheet-wrap"><div class="flex flex-col items-center gap-3 alert-in"><p class="bg-black/75 text-white text-xs font-semibold rounded-full px-3 py-1">Simulated Apple rating pop-up</p><div class="w-[270px] rounded-[14px] bg-[#2C2C2E] text-white text-center font-ios overflow-hidden" role="dialog" aria-label="Enjoying Pausa?"><div class="px-4 pt-5 pb-3"><span class="mx-auto w-[60px] h-[60px] rounded-[14px] pausa-icon flex items-center justify-center text-[30px]">${ic('pause-bold')}</span><p class="mt-3 text-[17px] font-semibold leading-snug">Enjoying Pausa?</p><p class="mt-1 text-[13px] leading-snug">Tap a star to rate it on the App Store.</p></div><div class="flex justify-center gap-1.5 pb-3 border-t border-[#48484A] pt-3" role="group" aria-label="Rating">${[1, 2, 3, 4, 5].map((k) => `<button class="text-[30px] ${k <= n ? 'text-[#0A84FF]' : 'text-[#5A5A5E]'}" data-a="rateStar" data-arg="${k}" aria-label="${k} star${k > 1 ? 's' : ''}" aria-pressed="${k <= n}">${ic('star-fill')}</button>`).join('')}</div>${n ? `<div class="grid grid-cols-2 border-t border-[#48484A] text-[17px] text-[#0A84FF]"><button class="py-3 border-r border-[#48484A]" data-a="rateNot">Cancel</button><button class="py-3 font-semibold" data-a="rateSubmit">Submit</button></div>` : `<button class="w-full py-3 border-t border-[#48484A] text-[17px] text-[#0A84FF]" data-a="rateNot">Not Now</button>`}</div></div></div>`; },
  del: () =>""")
rep("  closeSheet() {", """  rateStar(k) { S.rateStars = +k; renderOverlays(); },
  rateSubmit() { S.rated = true; S.sheet = null; save(); renderOverlays(); toast('Thanks for your feedback!'); },
  rateNot() { S.sheet = null; save(); renderOverlays(); },
  rateApp() { toast('Opens Pausa’s App Store page so you can write a review'); },
  closeSheet() {""")

# quiet Settings row
rep("""<button class="mt-6 w-full py-2 font-bold text-[#FF9F8A] rise" style="--d:160" data-a="askDelete">Delete all data</button>""",
    """<div class="card mt-4 overflow-hidden rise" style="--d:150">${link('rateApp', '', 'star-fill', 'bg-sun', 'Rate Pausa', 'Write a review on the App Store', true)}</div>
<button class="mt-6 w-full py-2 font-bold text-[#FF9F8A] rise" style="--d:160" data-a="askDelete">Delete all data</button>""")

# test panel
rep("['8', 'calendar-check-bold', '8 · Sunday recap']]", "['8', 'calendar-check-bold', '8 · Sunday recap'], ['9', 'star-fill', 'Review pop-up (let a want go)']]")
rep("    else if (k === '8') {", r"""    else if (k === '9') { let t = roomReady()[0]; if (!t) { t = { id: S.nextId++, app: app('shein'), name: 'Slip dress', price: 28, band: 'exact', parked: Date.now() - 9 * 3600000, readyAt: Date.now() - 1000, when: '08:00 today', waitMs: 9 * 3600000, g: 1, buddy: false }; S.room.push(t); } S.readySeen = [...(S.readySeen || []), t.id]; S.rateDemo = true; S.deciding = t.id; save(); goT('decide', 'fade'); toast('Tap “Let it go” to see when the review pop-up appears'); }
    else if (k === '8') {""")

open(F, 'w', encoding='utf-8').write(s)
print('patch18t ok')
