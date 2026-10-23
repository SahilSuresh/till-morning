// Till Morning for Safari (prototype SHEETS.checkout, P:L2232).
// On a shop's checkout page it reads the basket total from the page — on this phone, nothing is
// sent anywhere — and offers to park the basket till morning. Shown once per checkout page.
(() => {
  if (window.top !== window) return;

  const CHECKOUT_PATH = /checkout|basket|\/cart|\/bag|shopping-?bag|payment|order-?summary|place-?order|secure/i;
  const CHECKOUT_TEXT = /place (your )?order|pay now|proceed to (checkout|payment)|order summary|complete purchase|buy now/i;
  const host = location.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const seenKey = () => `tm_seen_${location.pathname}`;

  // ---- Reading the total (same rules as the app's findTotal) --------------------------------
  const AMOUNT = /(?:£|GBP\s?|\$|€)\s?(\d{1,5}(?:[.,]\d{1,2})?)|(?:^|[^\d.,£$€])(\d{1,5}[.,]\d{2})(?!\d)/g;
  const amounts = (line) => {
    const out = [];
    for (const m of line.matchAll(AMOUNT)) {
      const v = parseFloat((m[1] || m[2] || '').replace(',', '.'));
      if (v > 0) out.push(v);
    }
    return out;
  };
  const findTotal = (lines) => {
    const isTotal = /\btotal\b|amount to pay|you pay|to pay/i;
    const notTotal = /sub-?total|items total|saving|discount|delivery|postage|shipping|vat|tax|before/i;
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i];
      if (!isTotal.test(l) || notTotal.test(l)) continue;
      const here = amounts(l);
      if (here.length) return here[here.length - 1];
      const next = amounts(lines[i + 1] || '');
      if (next.length) return next[0];
    }
    return null; // no fallback on web pages: product grids have too many prices
  };
  const itemCount = (lines) => {
    for (const l of lines) {
      const m = l.match(/\b(\d{1,2})\s+items?\b/i) || l.match(/\b(?:basket|bag|cart)\s*\((\d{1,2})\)/i);
      if (m) return parseInt(m[1], 10);
    }
    return undefined;
  };
  const money = (v) => (Number.isInteger(v) ? `£${v}` : `£${v.toFixed(2)}`);

  const ask = (message) =>
    new Promise((resolve) => {
      try {
        browser.runtime.sendMessage(message).then(resolve, () => resolve(null));
      } catch (e) {
        resolve(null);
      }
    });

  // ---- The sheet ------------------------------------------------------------------------------
  let shown = false;
  const css = `
    :host { all: initial; }
    .dim { position: fixed; inset: 0; background: rgba(6,6,28,.5); z-index: 2147483646; animation: fade .25s ease-out; }
    .sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 2147483647; background: #15183F; color: #F3F2FF;
      border-top: 1.5px solid #2E3374; border-radius: 28px 28px 0 0; padding: 10px 22px calc(18px + env(safe-area-inset-bottom));
      font-family: -apple-system, "SF Pro Rounded", system-ui, sans-serif; animation: up .34s cubic-bezier(.2,.8,.2,1); box-sizing: border-box; }
    .grab { width: 40px; height: 5px; border-radius: 3px; background: #3A3F86; margin: 0 auto 14px; }
    .brand { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #8A8EC6; }
    .dot { width: 22px; height: 22px; border-radius: 7px; background: linear-gradient(135deg,#5873FF,#4361FF); display: grid; place-items: center; color: #fff; font-size: 13px; }
    h2 { margin: 10px 0 0; font-size: 24px; line-height: 1.15; font-weight: 800; }
    p { margin: 8px 0 0; font-size: 16px; line-height: 1.4; color: #B4B6E4; }
    .rule { margin-top: 14px; background: #1C2057; border-radius: 20px; padding: 14px 16px; }
    .row { display: flex; justify-content: space-between; align-items: baseline; }
    .lab { font-size: 14px; color: #B4B6E4; font-weight: 600; }
    .big { font-size: 26px; font-weight: 800; color: #93A5FF; }
    .when { text-align: right; font-size: 13px; color: #B4B6E4; font-weight: 600; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .chip { background: #C4B5FD; color: #14163A; border-radius: 99px; padding: 4px 9px; font-size: 12px; font-weight: 800; }
    button { font: inherit; border: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
    .park { margin-top: 16px; width: 100%; padding: 16px; border-radius: 99px; background: #4361FF; color: #fff; font-size: 17px; font-weight: 800; box-shadow: 0 4px 0 #2A3BC0; }
    .park:active { transform: translateY(3px); box-shadow: 0 1px 0 #2A3BC0; }
    .carry { margin-top: 10px; width: 100%; padding: 10px; background: transparent; color: #93A5FF; font-size: 16px; font-weight: 700; }
    .fine { margin: 8px 0 0; font-size: 12.5px; color: #8A8EC6; text-align: center; }
    .done h2 { text-align: center; } .done p { text-align: center; }
    .moon { font-size: 46px; text-align: center; margin-top: 6px; }
    @keyframes up { from { transform: translateY(100%); } }
    @keyframes fade { from { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .dim, .sheet { animation: none; } }
  `;

  const show = async (total, items) => {
    if (shown) return;
    shown = true;
    try { sessionStorage.setItem(seenKey(), '1'); } catch (e) { /* private mode */ }

    const wait = (await ask({ type: 'wait', band: 'exact', price: total, host })) || {};
    const root = document.createElement('div');
    root.setAttribute('data-till-morning', '');
    const shadow = root.attachShadow({ mode: 'closed' });
    const what = `${host} basket${items ? `, ${items} items` : ''}`;
    const work = wait.work ? ` That’s about ${wait.work} of your work.` : '';
    shadow.innerHTML = `
      <style>${css}</style>
      <div class="dim"></div>
      <div class="sheet" role="dialog" aria-label="Till Morning at checkout">
        <div class="grab"></div>
        <div class="brand"><span class="dot">☾</span> Till Morning for Safari · ${host}</div>
        <h2>You’re at checkout</h2>
        <p>${items ? `${items} items, ` : ''}${money(total)}.${work} Sleep on it?</p>
        ${wait.waits ? `<div class="rule"><div class="row"><span class="lab">It waits</span><span class="big">${wait.waits}</span></div>
          <div class="when">Ready ${wait.ready}</div>
          <div class="chips">${(wait.why || []).map((c) => `<span class="chip">${c}</span>`).join('')}</div></div>` : ''}
        <button class="park">Park the basket till morning</button>
        <button class="carry">I planned this, carry on</button>
        <p class="fine">Read on this page, on your phone. Nothing is sent anywhere.</p>
      </div>`;
    document.documentElement.appendChild(root);
    const close = () => root.remove();
    shadow.querySelector('.dim').addEventListener('click', close);
    shadow.querySelector('.carry').addEventListener('click', close);
    shadow.querySelector('.park').addEventListener('click', async () => {
      const r = await ask({ type: 'park', band: 'exact', price: total, items, host, what });
      const sheet = shadow.querySelector('.sheet');
      sheet.classList.add('done');
      sheet.innerHTML = `
        <div class="grab"></div>
        <div class="moon">🌙</div>
        <h2>${r && r.ok ? 'Parked. Sleep on it.' : 'Couldn’t park it'}</h2>
        <p>${r && r.ok
          ? `Your basket stays in ${host}, and the checkout waits. It’s in your waiting room till ${r.ready}. Morning-you gets the final say.`
          : 'Open Till Morning once, then try again.'}</p>
        <button class="park">Close</button>`;
      sheet.querySelector('.park').addEventListener('click', close);
    });
  };

  // ---- Watching for checkout pages (also single-page shops) -------------------------------
  const check = () => {
    if (shown) return;
    try { if (sessionStorage.getItem(seenKey())) return; } catch (e) { /* ignore */ }
    const text = document.body ? document.body.innerText || '' : '';
    if (!CHECKOUT_PATH.test(location.pathname + location.search) && !CHECKOUT_TEXT.test(text.slice(0, 20000))) return;
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4000);
    const total = findTotal(lines);
    if (!total || total < 1) return;
    show(Math.round(total * 100) / 100, itemCount(lines));
  };

  let lastUrl = location.href;
  setTimeout(check, 1200);
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      shown = false;
      setTimeout(check, 1200);
    }
  }, 1000);
  // Totals often load late on checkout pages; only re-check there, never on every shop page.
  let pending = 0;
  new MutationObserver(() => {
    if (shown || !CHECKOUT_PATH.test(location.pathname + location.search)) return;
    clearTimeout(pending);
    pending = setTimeout(check, 800);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
