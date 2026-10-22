#!/usr/bin/env python3
"""v18 round 15: the checkout screenshot is real. Pick a picture from Photos (or a built-in sample); Pausa reads it in the browser with Tesseract.js, finds the order total and compares it with the pass limit."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# ---------- the proof card on the check-in screen ----------
a = s.index("${(() => { const lim = parseFloat(c.limit); if (!(lim > 0)) return ''; const pr = c.proof;")
b = s.index("})()}", a) + len("})()}")
s = s[:a] + r"""${(() => { const lim = parseFloat(c.limit); if (!(lim > 0)) return ''; let pr = c.proof; if (pr === 'reading' && !proofBusy) pr = null;
  const thumb = proofThumb ? `<img src="${proofThumb}" alt="Your screenshot" class="w-12 h-[72px] rounded-xl object-cover object-top flex-shrink-0 border-[1.5px] border-[#2E3374]">` : '';
  const again = `<button class="mt-2 text-[13.5px] font-bold text-azure-light underline" data-a="proofReset">Try another screenshot</button>`;
  if (pr === 'reading') return `<div class="proof mt-4 w-full">${thumb || `<span class="tile w-11 h-11 bg-hush text-azure-light text-[22px]">${ic('camera-bold')}</span>`}<span class="flex-1"><b class="block t-title">Reading your screenshot… <span id="proofPct" class="tabular-nums text-ink3"></span></b><span class="block t-small">On this phone. The picture never leaves it.</span><span class="block mt-2 h-1.5 rounded-full bg-[#23275E] overflow-hidden"><i id="proofBar" class="block h-full w-[4%] rounded-full bg-gradient-to-r from-[#4361FF] to-[#8B5CF6] transition-all"></i></span></span></div>`;
  if (pr === 'fail') return `<div class="proof done mt-4 w-full">${thumb || `<span class="tile w-11 h-11 bg-peach text-[22px]">${ic('warning-circle-bold')}</span>`}<span class="flex-1 min-w-0"><b class="block t-title">${proofErr ? 'Couldn’t read it here' : 'Couldn’t find a total'}</b><span class="block t-small">${proofErr ? 'The screenshot reader didn’t load in this preview.' : 'Try a screenshot that shows the order total, like the last checkout page.'}</span>${again}${proofErr ? `<span class="block mt-3 t-small">Preview only: type the total you see.</span><span class="mt-1.5 flex gap-2"><input id="proofTyped" inputmode="decimal" autocomplete="off" placeholder="e.g. 12.99" class="field flex-1 min-w-0 px-3 py-2 text-[16px] font-semibold"><button class="tag px-3" data-a="proofTyped">Check</button></span>` : ''}</span></div>`;
  if (pr) return `<div class="proof done mt-4 w-full rise">${thumb || `<span class="tile w-11 h-11 ${pr.under ? 'bg-mint' : 'bg-peach'} text-[22px]">${ic(pr.under ? 'check-bold' : 'warning-circle-bold')}</span>`}<span class="flex-1 min-w-0"><b class="flex items-center gap-1.5 t-title">${pr.under ? `<span class="text-mint">${ic('check-circle-fill')}</span> Under your limit` : 'Over your limit'}</b><span class="block t-small tabular-nums">Checkout total ${money(pr.total)} · your limit ${money(lim)}</span><span class="block text-[13px] font-bold mt-1 ${pr.under ? 'text-mint' : 'text-[#FFAB98]'}">${pr.under ? 'Pick “Bought only what I planned” for +15 bonus XP and a step to a proof-only sticker.' : 'No bonus this time. An honest answer still earns 10 XP.'}</span>${again}</span></div>`;
  return `<label class="proof mt-4 w-full text-left cursor-pointer" for="proofFile"><span class="tile w-11 h-11 bg-hush text-azure-light text-[22px]">${ic('camera-bold')}</span><span class="flex-1 min-w-0"><b class="block t-title">Add your checkout screenshot <span class="font-semibold text-ink3">(optional)</span></b><span class="block t-small">Stayed under your ${money(lim)} limit? Prove it for +15 bonus XP and proof-only stickers.</span><span class="mt-2 flex gap-1.5"><img class="w-9 h-9" src="${IMG.receipt}" alt=""><img class="w-9 h-9" src="${IMG.wallet}" alt=""></span></span></label><input type="file" id="proofFile" accept="image/*" class="sr-only">
<button class="mt-2 w-full text-center text-[13.5px] font-bold text-ink3 underline" data-a="proofSample">No screenshot to hand? Try a sample</button>`;
})()}""" + s[b:]

# ---------- reading engine ----------
rep("  addProof() {", r"""  proofReset() { const c = S.checkin; if (!c) return; c.proof = null; proofThumb = null; proofErr = false; go('checkin'); },
  proofSample() { const c = S.checkin; if (!c) return; readProof(sampleCheckout(c), true); },
  proofTyped() { const c = S.checkin, v = parseFloat(($('#proofTyped') || {}).value); if (!c || !(v > 0)) { toast('Type the total, like 12.99'); return; } const lim = parseFloat(c.limit) || 0; c.proof = { total: v, under: v <= lim }; save(); go('checkin'); },
  addProof() {""")
rep("/* VoiceOver and Switch Control activate with a click and no drag: let that start the pass too */",
    r"""/* ---- Checkout proof: read a screenshot on the device (Tesseract.js, loaded only when needed) ---- */
let proofBusy = false, proofThumb = null, proofErr = false, tessP = null;
const TESS = { js: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js', corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1', langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int' };
const loadTess = () => tessP || (tessP = new Promise((res, rej) => { if (window.Tesseract) { res(window.Tesseract); return; } const sc = document.createElement('script'); sc.src = TESS.js; sc.onload = () => (window.Tesseract ? res(window.Tesseract) : rej(new Error('no engine'))); sc.onerror = () => { tessP = null; rej(new Error('engine blocked')); }; document.head.appendChild(sc); }));
/* the order total: a "total" line (not subtotal or delivery), else the line after it, else the biggest price on the page */
function findTotal(text) {
  const lines = String(text || '').split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const amts = (l) => [...l.replace(/(\d),(\d{2})(?!\d)/g, '$1.$2').matchAll(/(?:£|GBP|\$|€)\s?(\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\d{1,5}(?:\.\d{1,2})?)|(\d{1,5}\.\d{2})(?!\d)/gi)].map((m) => parseFloat((m[1] || m[2]).replace(/,/g, ''))).filter((n) => n > 0 && n < 100000);
  const isTotal = (l) => /\btotal\b|amount to pay|you pay|to pay/i.test(l) && !/sub\s?-?total|items?\s*total|saving|discount|delivery|postage|shipping|vat|tax|before/i.test(l);
  for (let i = lines.length - 1; i >= 0; i--) if (isTotal(lines[i])) { const a = amts(lines[i]); if (a.length) return a[a.length - 1]; const n = lines[i + 1] && amts(lines[i + 1]); if (n && n.length) return n[0]; }
  const all = lines.filter((l) => !/sub\s?-?total|saving|was\b|rrp|save/i.test(l)).flatMap(amts);
  return all.length ? Math.max(...all) : null;
}
/* shrink big phone screenshots before reading; also gives the little picture on the card */
const imgToCanvas = (file) => new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { const k = Math.min(1, 1400 / im.naturalWidth), cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u); res(cv); }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('not an image')); }; im.src = u; });
/* a made-up checkout page for people with no screenshot to hand, under the pass limit */
function sampleCheckout(c) {
  const lim = parseFloat(c.limit) || 15, tot = Math.max(1, Math.floor(lim * 0.87)) + 0.99 - (lim * 0.87 % 1 > 0.5 ? 0 : 1), cv = document.createElement('canvas'), x = cv.getContext('2d');
  cv.width = 900; cv.height = 1300; x.fillStyle = '#fff'; x.fillRect(0, 0, 900, 1300); x.fillStyle = '#131921'; x.fillRect(0, 0, 900, 120);
  x.fillStyle = '#fff'; x.font = 'bold 46px Arial'; x.fillText('Checkout', 50, 80);
  x.fillStyle = '#111'; x.font = 'bold 44px Arial'; x.fillText('Review your order', 50, 220);
  x.fillStyle = '#eee'; x.fillRect(50, 270, 170, 170); x.fillStyle = '#111'; x.font = '38px Arial'; x.fillText(String(c.need || 'Phone charger'), 250, 330); x.fillText('Qty: 1', 250, 390);
  const row = (l, r, y, bold) => { x.font = (bold ? 'bold ' : '') + (bold ? '48px' : '38px') + ' Arial'; x.fillStyle = bold ? '#B12704' : '#111'; x.fillText(l, 50, y); const w = x.measureText(r).width; x.fillText(r, 850 - w, y); };
  row('Items:', '£' + tot.toFixed(2), 560); row('Delivery:', 'FREE', 630); x.fillStyle = '#ddd'; x.fillRect(50, 680, 800, 3); row('Order total:', '£' + tot.toFixed(2), 770, true);
  x.fillStyle = '#FFD814'; x.fillRect(50, 860, 800, 110); x.fillStyle = '#111'; x.font = 'bold 40px Arial'; x.fillText('Place your order', 290, 930);
  return cv;
}
async function readProof(src, isSample) {
  const c = S.checkin; if (!c || proofBusy) return;
  proofBusy = true; proofErr = false; c.proof = 'reading';
  try { proofThumb = (src.toDataURL ? src : await imgToCanvas(src)).toDataURL('image/jpeg', 0.6); } catch (e) { proofThumb = null; }
  go('checkin');
  const bar = (k) => { const b = $('#proofBar'), t = $('#proofPct'); if (b) b.style.width = Math.max(4, Math.round(k * 100)) + '%'; if (t) t.textContent = Math.round(k * 100) + '%'; };
  const late = new Promise((_, rej) => setTimeout(() => rej(new Error('too slow')), 60000));
  let total = null;
  try {
    const cv = src.toDataURL ? src : await imgToCanvas(src); bar(0.05);
    const T = await Promise.race([loadTess(), late]); bar(0.1);
    const w = await Promise.race([T.createWorker('eng', 1, { workerPath: TESS.workerPath, corePath: TESS.corePath, langPath: TESS.langPath, logger: (m) => { if (m.status === 'recognizing text') bar(0.2 + m.progress * 0.8); else if (m.progress) bar(0.1 + m.progress * 0.1); } }), late]);
    const { data } = await Promise.race([w.recognize(cv), late]); w.terminate();
    total = findTotal(data && data.text);
  } catch (e) { proofErr = true; }
  proofBusy = false;
  if (S.checkin !== c) return;
  if (total == null && isSample && proofErr) { const lim = parseFloat(c.limit) || 15; total = Math.max(1, Math.floor(lim * 0.87)) + 0.99 - (lim * 0.87 % 1 > 0.5 ? 0 : 1); }
  const lim = parseFloat(c.limit) || 0;
  c.proof = total != null ? { total, under: total <= lim } : 'fail';
  save(); go('checkin');
}
$('#host').addEventListener('change', (e) => { if (e.target.id !== 'proofFile') return; const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) readProof(f, false); });
/* VoiceOver and Switch Control activate with a click and no drag: let that start the pass too */""")

open(F, 'w', encoding='utf-8').write(s)
print('ok p', len(s))
