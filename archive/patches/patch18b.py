#!/usr/bin/env python3
"""v18 round 2: park a want without knowing the item or price; snap your basket; catch checkout in Safari."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# ---------- price bands and the wait rule ----------
rep("function waitFor(price) {\n  const why = [], base = vnow();\n  let h = price <= 20 ? 1 : Math.round(price / 10);\n  why.push(price <= 20 ? '£20 or less: 1 h' : `£${price}: ${h} h`);",
    "/* Not sure what it is or what it costs? Pick a rough band, or nothing: an unknown want waits till 08:00 */\n"
    "const BANDS = { unsure: ['Not sure', 0], u20: ['Under £20', 1], b50: ['£20 to £50', 3], b100: ['£50 to £100', 8], o100: ['Over £100', 12] };\n"
    "const priceText = (t) => (t.price ? `£${t.price}` : t.band && BANDS[t.band] && t.band !== 'unsure' ? BANDS[t.band][0] : 'price not known');\n"
    "const workText = (t) => (t.price ? ` · about ${workTime(t.price)} of work` : '');\n"
    "const parkPrice = (k) => (k.band === 'exact' ? k.price : { b100: 75, o100: 150 }[k.band] || 0);\n"
    "function waitFor(price, band) {\n  const why = [], base = vnow();\n"
    "  if (band === 'unsure') { const u = new Date(base); if (u.getHours() >= 8) u.setDate(u.getDate() + 1); u.setHours(8, 0, 0, 0); why.push('Not sure? It waits till 08:00'); return { h: 0, ms: u.getTime() - base, why, when: whenLabel(u.getTime(), base) }; }\n"
    "  let h;\n"
    "  if (band && band !== 'exact' && BANDS[band]) { h = BANDS[band][1]; why.push(`${BANDS[band][0]}: ${h} h`); }\n"
    "  else { h = price <= 20 ? 1 : Math.round(price / 10); why.push(price <= 20 ? '£20 or less: 1 h' : `£${price}: ${h} h`); }")
rep("function ruleInner(price, pre) {\n  const w = waitFor(price);",
    "function ruleInner(price, pre, band) {\n  const w = waitFor(price, band);")
rep("<p class=\"mt-2 t-small\" id=\"${pre}work\">That’s about ${workTime(price)} of your work.</p>`;",
    "<p class=\"mt-2 t-small\" id=\"${pre}work\">${workLine(price, band)}</p>`;")
rep("function updateRule(pre, price) {\n  const w = waitFor(price), set",
    "const workLine = (price, band) => (band && band !== 'exact' ? 'Snap your basket to see the price and the hours of work.' : `That’s about ${workTime(price)} of your work.`);\n"
    "function updateRule(pre, price, band) {\n  const w = waitFor(price, band), set")
rep("set('work', `That’s about ${workTime(price)} of your work.`);", "set('work', workLine(price, band));")
rep("<p class=\"meta\">${nm(t.app)} · £${t.price} · about ${workTime(t.price)} of work</p>",
    "<p class=\"meta\">${nm(t.app)} · ${priceText(t)}${workText(t)}</p>")
rep("<span class=\"meta\">${nm(t.app)} · £${t.price} · about ${workTime(t.price)} of work</span>",
    "<span class=\"meta\">${nm(t.app)} · ${priceText(t)}${workText(t)}</span>")

# ---------- the park sheet: nothing required ----------
OLD_START = "  park: () => { const k = S.park; if (!k) return ''; return `"
i = s.index(OLD_START)
j = s.index("  buddy: () => `", i)
PARK = r'''  park: () => { const k = S.park; if (!k) return ''; const ex = k.band === 'exact'; return `<div class="sheet-wrap items-end"><div class="sheet-in w-full max-h-[92%] overflow-y-auto bg-[#14173F] border-t-[1.5px] border-[#2E3374] rounded-t-[30px] px-6 pt-3 pb-9" role="dialog" aria-label="Park it in the waiting room"><div class="mx-auto mb-4 w-10 h-1.5 rounded-full bg-[#343A80]"></div>
${k.from === 'share' ? `<div class="flex items-center gap-2 mb-3">${logo(k.app, 'w-8 h-8')}<span class="t-small">Shared from ${nm(k.app)}: the link, title and picture only</span></div>` : ''}
<h2 class="t-h2 text-[24px]">Park it till morning</h2><p class="mt-1 t-small">Don’t know exactly what, or what it costs? That’s fine, nothing here is required. ${nm(k.app)} stays shielded while it waits.</p>
<label for="pname" class="mt-4 flex justify-between t-label mb-1.5"><span>What is it?</span><span class="font-semibold">optional</span></label><input id="pname" data-in="parkName" value="${esc(k.name)}" maxlength="40" autocomplete="off" placeholder="Something from ${esc(nm(k.app))}" class="field w-full px-4 py-3 text-[17px] font-semibold">
<p class="mt-4 mb-2 t-label">Roughly how much?</p>
<div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Roughly how much?">${ex ? `<button class="tag" role="radio" aria-checked="true" aria-pressed="true" data-a="parkBand" data-arg="exact">£${k.price}${k.items ? `, ${k.items} items` : ''}</button>` : ''}${Object.entries(BANDS).map(([b, [l]]) => `<button class="tag" role="radio" aria-checked="${k.band === b}" aria-pressed="${k.band === b}" data-a="parkBand" data-arg="${b}">${l}</button>`).join('')}</div>
${k.from === 'pause' ? `<button class="dashed mt-3 w-full py-3 px-4 flex items-center gap-3 text-left" data-a="snapBasket"${k.snapping ? ' disabled' : ''}><span class="text-[24px] text-azure-light flex">${ic('camera-bold')}</span><span class="flex-1 min-w-0"><span class="block t-title text-ink">${k.snapping ? 'Reading your screenshot…' : k.snapped ? 'Basket read from your screenshot' : 'Snap your basket'}</span><span class="block t-small">${k.snapped ? 'Read on this phone. The picture never leaves it.' : 'Screenshot the basket, share it to Pausa, and it fills this in'}</span></span></button>` : ''}
<div class="wr-rule mt-4">${ruleInner(ex ? k.price : 0, 'p', k.band)}</div>
<div class="mt-4 space-y-2">${btn(ic('hourglass-medium-bold', 'text-xl') + ' Park it', 'doPark')}<div id="buddyrow">${buddyRow(parkPrice(k))}</div><button class="w-full py-2 font-bold text-azure-light" data-a="parkCancel">Cancel</button></div></div></div>`; },
  checkout: () => `<div class="sheet-wrap items-end"><div class="sheet-in w-full bg-[#14173F] border-t-[1.5px] border-[#2E3374] rounded-t-[30px] px-6 pt-3 pb-9" role="dialog" aria-label="Pausa at checkout"><div class="mx-auto mb-4 w-10 h-1.5 rounded-full bg-[#343A80]"></div>
<div class="flex items-center gap-2"><span class="bicon">${ic('pause-bold')}</span><span class="t-small">Pausa for Safari · shein.co.uk</span></div>
<h2 class="mt-3 t-h2 text-[24px]">You’re at checkout</h2>
<p class="mt-1 t-body">3 items, £46.97. That’s about ${workTime(47)} of your work. Sleep on it?</p>
<div class="wr-rule mt-4">${ruleInner(47, 'c', 'exact')}</div>
<div class="mt-4 space-y-2">${btn(ic('hourglass-medium-bold', 'text-xl') + ' Park the basket till morning', 'checkoutPark')}${btn('I planned this, carry on', 'checkoutPay', 'secondary')}</div>
<p class="mt-3 t-small text-center">Works in Safari when you turn the Pausa extension on. It reads the checkout page on your phone, and nothing is sent anywhere.</p></div></div>`,
'''
s = s[:i] + PARK + s[j:]

rep("  park() { if (!S.pause) return; const id = S.pause.app, [n, pr] = SUGGEST[id] || [`Something from ${nm(id)}`, 25]; S.park = { app: id, name: n, price: pr, from: 'pause' }; S.sheet = 'park'; renderOverlays(); },",
    "  park() { if (!S.pause) return; S.park = { app: S.pause.app, name: '', price: 0, band: 'unsure', from: 'pause' }; S.sheet = 'park'; renderOverlays(); },\n"
    "  parkBand(arg) { const k = S.park; if (!k) return; k.band = arg; document.querySelectorAll('#ov-sheet [data-a=\"parkBand\"]').forEach((b) => { const on = b.dataset.arg === arg; b.setAttribute('aria-pressed', on); b.setAttribute('aria-checked', on); }); updateRule('p', k.band === 'exact' ? k.price : 0, k.band); const br = document.getElementById('buddyrow'); if (br) br.innerHTML = buddyRow(parkPrice(k)); syncSheet(); },\n"
    "  snapBasket() { const k = S.park; if (!k || k.snapping) return; k.snapping = true; renderOverlays(); setTimeout(() => { if (S.park !== k) return; const [n, pr, items] = SNAP[k.app] || [`${nm(k.app)} basket`, 39, 2]; k.snapping = false; k.snapped = true; k.name = n; k.price = pr; k.items = items; k.band = 'exact'; renderOverlays(); }, 1300); },\n"
    "  safariCheckout() { S.sheet = 'checkout'; renderOverlays(); },\n"
    "  checkoutPark() { S.park = { app: 'shein', name: 'SHEIN basket, 3 items', price: 47, band: 'exact', from: 'checkout' }; doPark(false); },\n"
    "  checkoutPay() { S.sheet = null; renderOverlays(); toast('Checkout carries on. You planned this one.'); },")
rep("S.park = { app: id, name: n, price: pr, from: 'share' };", "S.park = { app: id, name: n, price: pr, band: 'exact', from: 'share' };")
rep("const buddyRow = (price) =>",
    "const SNAP = { shein: ['Satin slip dress and 2 more', 47, 3], amazon: ['Robot vacuum and 1 more', 82, 2], temu: ['Galaxy projector and 4 more', 31, 5], ubereats: ['Pizza and wings', 26, 2], deliveroo: ['Burger meal', 22, 1], justeat: ['Curry for two', 31, 3], ebay: ['Vintage camera', 85, 1], vinted: ['Denim jacket', 24, 1], asos: ['White trainers and 1 more', 96, 2] };\n"
    "/* after an in-place change, tell the overlay layer its HTML is current, so it doesn't redraw and replay the slide-up */\n"
    "function syncSheet() { const el = document.getElementById('ov-sheet'); if (el && S.sheet) el._h = SHEETS[S.sheet](); }\n"
    "const buddyRow = (price) =>")

# doPark: no price needed
rep("const price = clamp(k.price, 1, 9999), name = (k.name || '').trim() || 'Something', w = waitFor(price);\n  const t = { id: S.nextId++, app: k.app, name, price,",
    "const band = k.band || 'exact', price = band === 'exact' ? clamp(k.price, 1, 9999) : 0, name = (k.name || '').trim() || `Something from ${nm(k.app)}`, w = waitFor(price, band);\n  const t = { id: S.nextId++, app: k.app, name, price, band,")
rep("if (k === 'parkName' && S.park) S.park.name = t.value.slice(0, 40);",
    "if (k === 'parkName' && S.park) { S.park.name = t.value.slice(0, 40); syncSheet(); }")

# parked screen: say what happens next when the price wasn't known
rep("${now ? 'It’s ready to decide now, in your waiting room.' : `${nm(t.app)} stays shielded. ${morning ? 'Morning-you' : 'Later-you'} gets the final say. We’ll let you know when it’s ready.`}",
    "${now ? 'It’s ready to decide now, in your waiting room.' : t.from === 'checkout' ? 'Your basket stays in SHEIN, and the checkout waits. Morning-you gets the final say.' : `${nm(t.app)} stays shielded. ${morning ? 'Morning-you' : 'Later-you'} gets the final say. We’ll let you know when it’s ready.`}")

# ---------- Safari: a simulated shop website with a checkout ----------
rep("Object.assign(ICONS, {",
    "Object.assign(ICONS, {\n  'compass-bold': '<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"18\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"128\" cy=\"128\" r=\"96\"/><path d=\"M168 88l-24 56-56 24 24-56z\"/></g>',")
rep("function openApp(id) {\n  if (id === 'pausa') return openPausa();",
    "function openApp(id) {\n  if (id === 'pausa') return openPausa();\n  if (id === 'safari') return go('safari');")
rep("const appOf = (s) => (s === 'shield' ? S.shieldApp : s === 'inapp' ? S.inApp : 'pausa');",
    "const appOf = (s) => (s === 'shield' ? S.shieldApp : s === 'inapp' ? S.inApp : s === 'safari' ? 'safari' : 'pausa');")
rep("const inPausa = () => !['springboard', 'shield', 'inapp'].includes(S.screen);",
    "const inPausa = () => !['springboard', 'shield', 'inapp', 'safari'].includes(S.screen);")
rep("$('#homebar').classList.toggle('light', !!(root && root.classList.contains('on-dark')));",
    "$('#homebar').classList.toggle('light', !!(root && root.classList.contains('on-dark'))); $('#homebar').classList.toggle('dark', S.screen === 'safari');")
rep(".homebar.light span { background: #FFFFFF; }", ".homebar.light span { background: #FFFFFF; }\n.homebar.dark span { background: #111111; }")
rep("${appIcon('pausa', 'Pausa', `<span class=\"w-[60px] h-[60px] rounded-[15px] pausa-icon flex items-center justify-center text-[30px] shadow-sm\">${ic('pause-bold')}</span>`)}",
    "${appIcon('pausa', 'Pausa', `<span class=\"w-[60px] h-[60px] rounded-[15px] pausa-icon flex items-center justify-center text-[30px] shadow-sm\">${ic('pause-bold')}</span>`)}\n"
    "${appIcon('safari', 'Safari', `<span class=\"w-[60px] h-[60px] rounded-[15px] bg-white text-[#0A84FF] flex items-center justify-center text-[38px] shadow-sm\">${ic('compass-bold')}</span>`)}")
SAFARI = r'''
safari: () => { const items = [['Satin slip dress', '£27.99', 1], ['Platform trainers', '£12.49', 3], ['Hair claw set', '£6.49', 5]]; return `<div class="h-full flex flex-col font-ios bg-[#F2F2F7] text-[#111111]">
<div class="pt-14 px-4 pb-2 bg-[#F9F9FB] border-b border-[#D1D1D6]"><div class="rounded-[12px] bg-[#E3E3E8] px-3 py-2 text-center text-[15px] flex items-center justify-center gap-1.5">${ic('lock-key-bold', 'text-[12px]')} shein.co.uk/cart</div></div>
<div class="flex-1 scroll px-4 pt-4 pb-4"><p class="text-[22px] font-bold">Your bag (3)</p>
${items.map(([n, p, g]) => `<div class="mt-3 flex gap-3 bg-white rounded-2xl p-3"><span class="w-16 h-20 rounded-xl flex-shrink-0" style="background:linear-gradient(135deg,${GRADS[g]})"></span><div class="flex-1"><p class="font-semibold">${n}</p><p class="text-[13px] text-[#6C6C70]">Qty 1</p><p class="mt-1 font-bold">${p}</p></div></div>`).join('')}
<div class="mt-4 bg-white rounded-2xl p-4 flex justify-between font-bold text-[17px]"><span>Total</span><span>£46.97</span></div>
<p class="mt-3 text-[12.5px] text-[#6C6C70] text-center leading-snug">A simulated shop website in Safari. Shop apps keep their screens private, but a Safari extension can read the page you’re on, if you let it.</p></div>
<div class="px-4 pt-3 pb-12 bg-[#F9F9FB] border-t border-[#D1D1D6]"><button class="w-full h-[52px] rounded-full bg-black text-white text-[17px] font-bold" data-a="safariCheckout">Checkout · £46.97</button></div></div>`; },
'''
rep("\nparked: () => {", "\n" + SAFARI + "parked: () => {")
rep("decide: 'Morning review',", "decide: 'Morning review', safari: 'Safari: a shop website (simulated)',")

# panel: a jump to Safari and a step about it
rep("<li>Open the parcel on Today to get the next sticker. Or keep it and shop with a pass.</li></ol></section>",
    "<li>Open the parcel on Today to get the next sticker. Or keep it and shop with a pass.</li>\n<li>Shopping on a website? Open Safari on the home screen and tap Checkout: Pausa catches it there.</li></ol></section>")
rep("${S.subscribed ? `<button class=\"pbtn\" data-p=\"room\">${ic('hourglass-medium-bold')} Waiting room</button>` : ''}",
    "${S.subscribed ? `<button class=\"pbtn\" data-p=\"room\">${ic('hourglass-medium-bold')} Waiting room</button><button class=\"pbtn\" data-p=\"safari\">${ic('compass-bold')} Shop in Safari</button>` : ''}")
rep("  else if (p === 'room') {",
    "  else if (p === 'safari') { hideBanner(); S.sheet = null; if (S.screen !== 'springboard') go('springboard'); nextT = 'zoom'; openApp('safari'); }\n  else if (p === 'room') {")
rep("if (s.screen === 'inapp' && !s.inApp) s.screen = 'springboard';", "if (s.screen === 'inapp' && !s.inApp) s.screen = 'springboard';\n  if (s.screen === 'safari') s.screen = 'springboard';")

open(F, 'w', encoding='utf-8').write(s)
print('ok b', len(s))
