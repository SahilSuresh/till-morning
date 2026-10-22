#!/usr/bin/env python3
"""v18 round 16, market research changes 2, 3, 5, 6, 7, 8:
2 trial reminder up front on the paywall, 3 a true line that changes in every pause, 5 no XP for choosing to shop (XP at check-in),
6 a shield that knows it's late, 7 UK apps and pay-later on the Screen Time screen + UK banks in the guide, 8 a Sunday recap with counts only."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# ---------- shared: a small event log the pause line, the shield and the recap read from ----------
rep("function bump(k) {", r"""function logEv(k, app) { S.log = [{ at: vnow(), k, app: app || null }, ...(S.log || [])].slice(0, 300); }
const weekLog = () => (S.log || []).filter((e) => vnow() - e.at < 7 * 86400000);
const hhmm = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
/* the last few pauses for one app: how many ended with leaving */
function leftOf(app, n = 5) { const p = (S.log || []).filter((e) => e.app === app && ['leave', 'park', 'shop'].includes(e.k)).slice(0, n); return { left: p.filter((e) => e.k === 'leave').length, of: p.length }; }
function bump(k) {""")
rep("  leave() { const { r, id } = finishPause(10,", "  leave() { logEv('leave', S.pause && S.pause.app); const { r, id } = finishPause(10,")
rep("  if (k.from === 'pause' && S.pause) { r = finishPause(5,", "  logEv('park', t.app);\n  if (k.from === 'pause' && S.pause) { r = finishPause(5,")
rep("  letGo() { const t = S.room.find((x) => x.id === S.deciding); if (!t) return go('home');", "  letGo() { const t = S.room.find((x) => x.id === S.deciding); if (!t) return go('home'); logEv('letgo', t.app);")
rep("  checkin(arg) { bump('checkin');", "  checkin(arg) { bump('checkin'); logEv('checkin:' + arg, S.checkin && S.checkin.app);")

# ---------- 5: choosing to shop earns nothing; the reward is the honest check-in ----------
rep("  shopPlan() { const { r, id } = finishPause(5, 'Chose to shop with a plan');", "  shopPlan() { logEv('shop', S.pause && S.pause.app); const { r, id } = finishPause(0, 'Chose to shop with a plan');")
rep("passDefault()), waitUntil: (S.passesToday || 0) >= LOSS.freePasses ? Date.now() + LOSS.extraWait * 1000 : 0 }; go('pass'); toast(xpMsg(r)); if (r.up) rankBanner(); },",
    "passDefault()), waitUntil: (S.passesToday || 0) >= LOSS.freePasses ? Date.now() + LOSS.extraWait * 1000 : 0 }; go('pass'); },")
rep("${timePick({ opts: passOpts(), val: d.minutes, custom: !!d.custom, a: 'mins', step: 5, inKey: 'passCustomMin', unit: 'min', unitLong: 'minutes', lo: 1, hi: 120, d0: 420, label: 'How long?' })}\n</div>",
    "${timePick({ opts: passOpts(), val: d.minutes, custom: !!d.custom, a: 'mins', step: 5, inKey: 'passCustomMin', unit: 'min', unitLong: 'minutes', lo: 1, hi: 120, d0: 420, label: 'How long?' })}\n<p class=\"mt-4 t-small flex items-center gap-1.5 rise\" style=\"--d:460\"><span class=\"text-mint\">${ic('check-circle-fill')}</span> Check in afterwards: +10 XP for an honest answer</p>\n</div>")

# ---------- 3: one true line in every pause, a different one each time ----------
rep("  startPause() { const id = S.shieldApp || S.inApp; hideBanner(); S.pause = { app: id,",
    "  startPause() { const id = S.shieldApp || S.inApp; hideBanner(); S.factI = (S.factI || 0) + 1; S.pause = { fact: pauseFact(id, S.factI), app: id,")
rep("function finishPause(n, what, extra) {", r"""/* Only facts Pausa can check: your own history, your parked wants, your plan, the clock */
function pauseFact(app, i) {
  const f = [], lo = leftOf(app), w = roomWaiting(), ch = CHALLENGES[S.challenge], nt = nextTreat(), h = vhour();
  if (lo.of >= 2 && lo.left) f.push(`You left ${nm(app)} ${lo.left} of the last ${lo.of} times.`);
  if (w.length) f.push(w.length === 1 ? `1 thing is already parked, ready ${w[0].when}.` : `${w.length} things are already parked, waiting their turn.`);
  if (ch.len) f.push(`Day ${Math.min(challengeDay(), ch.len)} of ${ch.len} of your ${ch.name.toLowerCase()}.`);
  if (nt && nt !== 'Tonight') { const d = [0, 1, 2, 3, 4, 5, 6].find((k) => (S.treats || {})[(dow() + k) % 7]); f.push(`Your next treat night is ${nt}${d > 1 ? `, ${d} days away` : ''}.`); }
  if (h >= 22 || h < 5) f.push(`It’s ${hhmm(vnow())}. Most of your wants start after 22:00.`);
  const wk = weekLog().filter((e) => e.k === 'leave').length;
  if (wk) f.push(`You’ve walked away ${wk} time${wk === 1 ? '' : 's'} this week.`);
  if (!f.length) f.push('Wants usually fade in a few minutes. Watch this one.');
  return f[i % f.length];
}
function finishPause(n, what, extra) {""")
rep("`<h1 class=\"mt-6 t-h1 text-center text-cream rise\" style=\"--d:120\">Take a breath. Do you still want it?</h1>`}",
    "`<h1 class=\"mt-6 t-h1 text-center text-cream rise\" style=\"--d:120\">Take a breath. Do you still want it?</h1>`}\n${p.fact ? `<p class=\"pfact mt-4 rise\" style=\"--d:200\"><span class=\"text-[18px] flex-shrink-0\">${ic('timer-bold')}</span><span>${esc(p.fact)}</span></p>` : ''}")
rep(".proof { display: flex;", ".pfact { display: flex; gap: 10px; align-items: flex-start; max-width: 330px; padding: 12px 14px; border-radius: 18px; background: rgba(0,0,0,.22); color: #F3F2FF; font-weight: 700; font-size: 15px; line-height: 1.35; text-align: left; }\n.proof { display: flex;")

# ---------- 6: after 22:00 the shield names the hour and the app ----------
rep("<h1 class=\"mt-6 text-[28px] font-bold leading-tight text-ink\" style=\"font-family:inherit\">Hold on. Think twice.</h1>\n<p class=\"mt-3 text-[17px] leading-snug text-ink2 whitespace-pre-line\">${lines.join('\\n')}</p></div>\n<div class=\"w-full pb-14 flex flex-col gap-2\"><button class=\"w-full h-[50px] rounded-[14px] bg-azure text-white text-[17px] font-semibold\" data-a=\"shieldClose\">Close ${nm(id)}</button><button class=\"w-full h-[44px] text-[17px] text-azure-light\" data-a=\"shieldContinue\">I still want to shop</button></div>",
    "<h1 class=\"mt-6 text-[28px] font-bold leading-tight text-ink\" style=\"font-family:inherit\">${late ? `It’s ${hhmm(vnow())}.` : 'Hold on. Think twice.'}</h1>\n<p class=\"mt-3 text-[17px] leading-snug text-ink2 whitespace-pre-line\">${late ? [`${nm(id)} will still be there at 8.`, lo.of >= 2 && lo.left ? `You left it ${lo.left} of ${lo.of} times this week.` : lines[1] || ''].filter(Boolean).join('\\n') : lines.join('\\n')}</p></div>\n<div class=\"w-full pb-14 flex flex-col gap-2\"><button class=\"w-full h-[50px] rounded-[14px] bg-azure text-white text-[17px] font-semibold\" data-a=\"shieldClose\">Close ${nm(id)}</button><button class=\"w-full h-[44px] text-[17px] text-azure-light\" data-a=\"shieldContinue\">${late ? 'I still want it' : 'I still want to shop'}</button></div>")
rep("  const cool = coolLeft(id);\n  if (cool > 0)", "  const cool = coolLeft(id), h = vhour(), late = h >= 22 || h < 5, lo = leftOf(id);\n  if (cool > 0)")

# ---------- 7: built for the UK ----------
rep("<span class=\"block t-title text-ink\">No guessing which apps you have</span>Apple’s list shows the apps on your phone, grouped by type. Shopping &amp; Food holds just your shopping and takeaway apps.</p></div>",
    "<span class=\"block t-title text-ink\">Tick Shopping &amp; Food</span>It already holds Deliveroo, Just Eat, Uber Eats, SHEIN, Temu, ASOS and Vinted.</p></div>\n<div class=\"card mt-3 p-4 flex gap-3 items-start rise\" style=\"--d:140\"><span class=\"tile w-10 h-10 bg-sun text-[20px]\">${ic('piggy-bank-bold')}</span><p class=\"t-small\"><span class=\"block t-title text-ink\">Also worth shielding</span>Klarna, Clearpay and PayPal, under Finance. Pay later makes it feel free. Shielding the app won’t stop pay-later at checkout inside a shop app.</p></div>")
rep("${other.map(([i, l, c]) =>", "<button class=\"w-full flex items-center gap-3 px-4 py-2.5 text-left border-t border-[#38383A]\" data-a=\"pickFinance\" role=\"checkbox\" aria-checked=\"${!!S.payLater}\">${box(!!S.payLater)}<span class=\"w-8 h-8 rounded-[8px] bg-[#34C759] flex items-center justify-center text-[18px]\">${ic('piggy-bank-bold')}</span><span class=\"flex-1 text-[17px]\">Finance<span class=\"block text-[13px] text-[#8E8E93]\">Klarna, Clearpay, PayPal</span></span></button>\n${other.map(([i, l, c]) =>")
rep("  checkin(arg) {", "  pickFinance() { S.payLater = !S.payLater; go(S.screen); },\n  checkin(arg) {")
rep("['device-mobile-bold', 'Open your bank app', 'Go to Cards. Revolut and some other banks offer this. If yours doesn’t, a free extra account works.'],",
    "['device-mobile-bold', 'Open your bank app', 'Monzo and Starling can block spending types, Barclays lets you switch off some spending, and Revolut has card limits. If yours can’t, a free extra account works.'],")

# ---------- 2: the reminder promise up front on the paywall ----------
rep("<p class=\"mt-2 t-body text-center rise\" style=\"--d:110\">Here’s your order. Nothing to pay today.</p>",
    r"""<p class="mt-2 t-body text-center rise" style="--d:110">Here’s your order. Nothing to pay today.</p>
<div class="card w-full mt-5 p-4 rise" style="--d:150" aria-label="Your free week"><p class="t-label mb-3">Your free week</p><ol class="trial-tl">${[['shield-check-bold', 'bg-mint', 'Today', `Shields go up on ${apps.length} app${apps.length === 1 ? '' : 's'}`], ['bell-ringing-bold', 'bg-sun', `Day 5 · ${d5}`, S.trialRemind !== false ? 'We remind you the plan starts soon' : 'No reminder (you turned it off)'], ['calendar-check-bold', 'bg-lav', `Day 7 · ${d7}`, `${y ? '£29.88 a year' : '£4.99 a month'} starts. Cancel any time before.`]].map(([i, b, t, d]) => `<li><span class="tile w-9 h-9 ${b} text-deep text-[17px]">${ic(i)}</span><span><b class="block t-title">${t}</b><span class="block t-small">${d}</span></span></li>`).join('')}</ol></div>""")
rep("  const due = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });",
    "  const due = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });\n  const d5 = new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), d7 = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });")
# the old timeline further down goes (it's now at the top)
a = s.index("<div class=\"w-full mt-8 reveal\"><h2 class=\"t-h2 mb-4\">How your free week works</h2>")
b = s.index("</div></div>\n</div>\n<footer class=\"flex-shrink-0 px-7 pt-3 pb-10 flex flex-col items-center gap-2\">${btn('Start my free week', 'buy')}", a)
s = s[:a] + s[b + len("</div></div>\n"):]
rep("<footer class=\"flex-shrink-0 px-7 pt-3 pb-10 flex flex-col items-center gap-2\">${btn('Start my free week', 'buy')}",
    "<footer class=\"flex-shrink-0 px-7 pt-3 pb-10 flex flex-col items-center gap-2\"><div class=\"w-full flex items-center gap-3 px-1 pb-1\"><span class=\"text-sun text-[20px]\">${ic('bell-ringing-bold')}</span><span class=\"flex-1 t-title\">Remind me on day 5</span>${sw(S.trialRemind !== false, 'trialRemind', '', 'Remind me on day 5')}</div>${btn('Start my free week', 'buy')}")
rep("  pickFinance() {", "  trialRemind() { S.trialRemind = S.trialRemind === false; go(S.screen); },\n  pickFinance() {")
rep(".pfact {", ".trial-tl { display: flex; flex-direction: column; gap: 12px; position: relative; }\n.trial-tl li { display: flex; gap: 12px; align-items: flex-start; }\n.pfact {")

# ---------- 8: a Sunday recap, counts only ----------
rep("checkin: () => {", r"""recap: () => {
  const L = weekLog(), n = (k) => L.filter((e) => e.k === k).length;
  const pauses = n('leave') + n('park') + n('shop'), parked = n('park'), letgo = n('letgo'), passes = L.filter((e) => e.k.startsWith('checkin:')).length, kept = n('checkin:plan') + n('checkin:nothing');
  const r = RANKS[S.rank], nx = RANKS[S.rank + 1], late = L.filter((e) => ['leave', 'park', 'shop'].includes(e.k) && (new Date(e.at).getHours() >= 22 || new Date(e.at).getHours() < 5));
  const byDay = [0, 1, 2, 3, 4, 5, 6].map((d) => late.filter((e) => (new Date(e.at).getDay() + 6) % 7 === d).length), top = byDay.indexOf(Math.max(...byDay));
  const end = new Date(vnow()).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  const row = (t, v, sub) => `<div class="flex items-center justify-between gap-3 py-3 border-t-[1.5px] border-[#2E3374] first:border-0"><span><span class="block t-title">${t}</span>${sub ? `<span class="block t-small">${sub}</span>` : ''}</span><b class="t-num text-[26px] tabular-nums">${v}</b></div>`;
  return `<div class="h-full flex flex-col">
<header class="flex-shrink-0 px-6 pt-14 pb-2 flex items-center gap-3"><button class="backbtn" data-a="recapDone" aria-label="Back">${ic('arrow-left-bold')}</button><span class="t-label">${end}</span></header>
<div class="flex-1 scroll px-6 pb-6">
<h1 class="t-h1 rise">Your week with Pausa</h1><p class="mt-1 t-small rise">Counts from the last 7 days. No pounds, just what happened.</p>
<div class="card recap mt-5 px-4 py-1 rise" style="--d:60" id="recapCard">
${row('Pauses', pauses)}${row('You left it', n('leave'))}${row('Parked, then let go', `${letgo} of ${parked}`)}${row('Passes kept to plan', `${kept} of ${passes}`)}
</div>
<div class="rankcard mt-4 px-4 py-3 flex items-center gap-3 rise" style="--d:100">${medal(r, 44)}<span class="flex-1 min-w-0"><span class="block text-[13px] font-bold">${r.name}</span><b class="block t-title">${nx ? `${nx.name} next · ${fmtN(nx.xp - S.xp)} XP to go` : 'Top rank'}</b></span><span class="text-[13px] font-bold">${(S.got || []).length} sticker${(S.got || []).length === 1 ? '' : 's'}</span></div>
${late.length ? `<p class="mt-4 t-small text-center rise" style="--d:140">${ic('moon-stars-bold')} Busiest night: ${DAY_NAMES[top]} after 22:00.</p>` : ''}
</div>${foot(btn(`${ic('share-network-bold', 'text-xl')} Share my week`, 'shareWeek') + `<button class="w-full mt-2 py-2 text-[15px] font-bold text-azure-light" data-a="recapDone">Done</button>`)}</div>`;
},

checkin: () => {""")
rep("  trialRemind() {", "  openRecap() { S.recapSeen = Math.floor(vnow() / (7 * 86400000)); goT('recap', 'fwd'); },\n  recapDone() { S.tab = 'home'; goT('home', 'back'); },\n  shareWeek() { toast('Opens the share sheet with your week as a picture. Counts only, no pounds.'); },\n  trialRemind() {")
rep("  const out = [];\n  if (S.parcels)", "  const out = [];\n  if (dow() === 6 && S.recapSeen !== Math.floor(vnow() / (7 * 86400000)) || S.recapDemo) out.push(row('calendar-check-bold', 'bg-lav', 'Your week with Pausa', 'Sunday recap: pauses, waits and passes', 'openRecap', ''));\n  if (S.parcels)")
# test panel: fill a sample week and open the recap
rep("<button class=\"pbtn\" data-p=\"passend\">", "<button class=\"pbtn\" data-p=\"recap\">${ic('calendar-check-bold')} Sunday recap</button><button class=\"pbtn\" data-p=\"passend\">")
rep("  else if (p === 'passend')", r"""  else if (p === 'recap') { hideBanner(); S.sheet = null; if (weekLog().length < 6) { const day = 86400000, base = vnow(); [['leave', 'ubereats', 1, 23], ['leave', 'shein', 2, 22], ['park', 'amazon', 2, 23], ['letgo', 'amazon', 1, 9], ['leave', 'ubereats', 3, 23], ['shop', 'amazon', 4, 13], ['checkin:plan', 'amazon', 4, 14], ['park', 'shein', 5, 22], ['leave', 'deliveroo', 5, 23], ['leave', 'ubereats', 2, 23]].forEach(([k, a, ago, hr]) => { const t = new Date(base - ago * day); t.setHours(hr, 10); S.log = [{ at: t.getTime(), k, app: a }, ...(S.log || [])]; }); S.log.sort((x, y) => y.at - x.at); } S.recapDemo = true; save(); ACT.openRecap(); }
  else if (p === 'passend')""")

open(F, 'w', encoding='utf-8').write(s)
print('ok q', len(s))
