#!/usr/bin/env python3
"""v18 round 4: floating 3-tab bar, slower ranks, stickers earned by finishing sticker goals."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


# ---------- Bottom navigation: a floating pill with 3 evenly spaced tabs ----------
rep(".tabbar { height: 88px; background: rgba(13, 15, 46, .92); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border-top: 1px solid #20245A; display: grid; grid-template-columns: repeat(5, 1fr); padding: 7px 0 30px; }",
    ".tabbar { margin: 4px 20px 30px; height: 64px; padding: 6px; border-radius: 999px; background: rgba(27, 31, 85, .94); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border: 1px solid #2E3374; box-shadow: 0 12px 30px rgba(4, 5, 24, .55), inset 0 1px 0 rgba(255, 255, 255, .06); display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }")
rep(".tabbar button { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 11.5px; font-weight: 700; color: #7D81BA; }",
    ".tabbar button { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 7px; border-radius: 999px; font-size: 14.5px; font-weight: 800; color: #8E93CC; transition: background .25s, color .25s; }")
rep('.tabbar button[aria-current="page"] { color: #FFFFFF; }',
    '.tabbar button[aria-current="page"] { color: #FFFFFF; background: linear-gradient(180deg, #5873FF, #4361FF); box-shadow: 0 4px 14px rgba(67, 97, 255, .45), inset 0 1px 0 rgba(255, 255, 255, .25); }')
rep(".tabico { font-size: 22px; padding: 3px 13px; border-radius: 999px; display: flex; }", ".tabico { font-size: 21px; display: flex; }")
rep('.tabbar button[aria-current="page"] .tabico { background: rgba(67, 97, 255, .3); color: #AEBBFF; }', '.tabbar button[aria-current="page"] .tabico { color: #FFFFFF; }')
rep(".tabbadge { position: absolute; top: -2px; left: 50%; margin-left: 9px;", ".tabbadge { position: absolute; top: -6px; right: 6px; left: auto; margin-left: 0;")
rep("box-shadow: 0 0 0 2px #0D0F2E; }", "box-shadow: 0 0 0 2px #1B1F55; }")

# ---------- Ranks: slower. At the 60 XP daily cap, Legend takes 100+ days ----------
rep("{ name: 'Silver', title: 'Mindful Browser', xp: 100,", "{ name: 'Silver', title: 'Mindful Browser', xp: 300,")
rep("{ name: 'Gold', title: 'Cart Controller', xp: 300,", "{ name: 'Gold', title: 'Cart Controller', xp: 900,")
rep("{ name: 'Platinum', title: 'Checkout Guardian', xp: 650,", "{ name: 'Platinum', title: 'Checkout Guardian', xp: 2000,")
rep("{ name: 'Diamond', title: 'Impulse Breaker', xp: 1100,", "{ name: 'Diamond', title: 'Impulse Breaker', xp: 3500,")
rep("{ name: 'Legend', title: 'Spending Strategist', xp: 1800,", "{ name: 'Legend', title: 'Spending Strategist', xp: 6000,")

# ---------- Stickers: each one is a goal you finish ----------
rep("const STICKER_SLOTS = 12, PARCELS_A_DAY = 3;", r"""const STICKER_SLOTS = 7, PARCELS_A_DAY = 3;
/* Each sticker is a goal built only on things Pausa can check. Finish it and a parcel with that sticker arrives. */
const SGOALS = [
  { k: 'welcome', task: 'Leave at the pause 5 times', n: 5, get: () => cnt('leave') },
  { k: 'shieldm', task: 'Decide on 3 parked wants in the morning', n: 3, get: () => cnt('decided') },
  { k: 'ticket', task: 'Finish 3 Shopping Passes and check in', n: 3, get: () => cnt('checkin') },
  { k: 'puzzle', task: 'Let go of 5 things', n: 5, get: () => S.shelf.length },
  { k: 'cape', task: 'Fill a Pausa card: 10 calm days', n: 10, get: () => (S.cardsFilled || 0) * 10 + (S.stamps || 0) },
  { k: 'bubble', task: 'Let go of 15 things', n: 15, get: () => S.shelf.length },
  { k: 'legend', task: 'Finish a 30-day challenge', n: 30, get: () => (CHALLENGES[S.challenge] && CHALLENGES[S.challenge].len ? Math.max(0, challengeDay() - 1) : 0) }
];
const cnt = (k) => (S.cnt || {})[k] || 0;
function bump(k) { S.cnt = S.cnt || {}; S.cnt[k] = (S.cnt[k] || 0) + 1; }
const stickerName = (k) => (STICKERS.find((x) => x[0] === k) || [k, k])[1];
function checkGoals() {
  if (!S.subscribed) return;
  S.got = S.got || []; S.queue = S.queue || [];
  SGOALS.forEach((g) => {
    if (S.got.includes(g.k) || S.queue.includes(g.k) || g.get() < g.n) return;
    S.queue.push(g.k); S.parcelWhy = `You finished “${g.task}”. This sticker is yours.`;
    setTimeout(() => toast(`Sticker goal done: ${stickerName(g.k)} · a parcel is on Today`), 1900);
  });
  S.parcels = S.queue.length; S.owned = S.got.length;
}""")
rep("function save() { try {", "function save() { try { checkGoals(); } catch (e) { /* state not ready */ } try {")
rep("parcels: 0, parcelsToday: 0, owned: 0,", "parcels: 0, parcelsToday: 0, owned: 0, cnt: {}, got: [], queue: [],")

# No more free parcels: not for leaving, letting go, a full card or signing up
rep("const got = giveParcel(); if (got) S.parcelWhy = ''; startCool(id);", "bump('leave'); const got = false; startCool(id);")
rep("const got = giveParcel(); if (got) S.parcelWhy = `You let ${t.name} go. Here’s the unboxing, without the spending.`;", "bump('decided'); const got = false;")
rep("const r = award(10, `Still wanted ${t.name} after the wait`, t.app);", "bump('decided'); const r = award(10, `Still wanted ${t.name} after the wait`, t.app);")
rep("award(50, 'Filled a Pausa card', null, { free: true }); S.parcels = (S.parcels || 0) + 1;", "award(50, 'Filled a Pausa card', null, { free: true });")
rep("function welcomeParcel() { if (!S.welcomed) {", "function welcomeParcel() { return; if (!S.welcomed) {")
rep("  checkin(arg) {", "  checkin(arg) { bump('checkin');")
rep("'+50 XP · Card full! A parcel and a fresh card'", "'+50 XP · Card full! A fresh card'")
rep("A parcel and 50 XP when the card is full", "50 XP when the card is full")
rep("toast('No parcels yet. Let something go to get one.')", "toast('No parcels yet. Finish a sticker goal in Me to get one.')")

# Opening a parcel reveals the sticker of the goal you finished
rep("S.parcels -= 1; const idx = S.owned || 0; if (idx < STICKERS.length) { S.owned = idx + 1; S.freshSticker = idx; S.parcelState = idx; } else S.parcelState = 'done';",
    "const k = (S.queue || []).shift(); const idx = STICKERS.findIndex((x) => x[0] === k); if (idx >= 0) { S.got = [...(S.got || []), k]; S.freshSticker = idx; S.parcelState = idx; } else S.parcelState = 'done'; S.parcels = S.queue.length; S.owned = S.got.length;")
rep("<span class=\"chip chip-sun mt-6 text-[14px]\">Sticker ${st + 1} of ${STICKER_SLOTS}</span>",
    "<span class=\"chip chip-sun mt-6 text-[14px]\">Sticker ${owned} of ${STICKER_SLOTS}</span>")
rep("<p class=\"mt-2 t-body\">Stickers come in a set order. You can’t buy them, only earn them.</p></div>",
    "<p class=\"mt-2 t-body\">For: ${esc((SGOALS.find((g) => g.k === k) || {}).task || '')}. You can’t buy stickers, only earn them.</p></div>")
rep("${esc(S.parcelWhy || 'You let something go. Here’s the unboxing, without the spending.')}", "${esc(S.parcelWhy || 'You finished a sticker goal.')}")
rep("else if (p === 'parcel') { S.parcels = (S.parcels || 0) + 1; S.parcelWhy = 'A test parcel from the panel.'; save(); render(); toast('A parcel is waiting on Today'); }",
    "else if (p === 'parcel') { const g = SGOALS.find((x) => !(S.got || []).includes(x.k) && !(S.queue || []).includes(x.k)); if (g) { S.queue = [...(S.queue || []), g.k]; S.parcels = S.queue.length; S.parcelWhy = `A test parcel: pretend you finished “${g.task}”.`; } save(); render(); toast('A parcel is waiting on Today'); }")

# Me: the collection becomes a list of goals with progress
i = s.index("<section class=\"card mt-5 p-4 rise\" id=\"wr-stickers\"")
j = s.index("<section class=\"card mt-4 p-4 rise\" id=\"wr-note\"", i)
s = s[:i] + r"""<section class="card mt-5 p-4 rise" id="wr-stickers" style="--d:80"><div class="flex items-center justify-between"><h2 class="t-h2">Sticker goals</h2><span class="chip chip-sun">${owned} of ${STICKER_SLOTS}</span></div>
<p class="mt-1 t-small">Finish a goal to earn its sticker. They can’t be bought.</p>
<div class="mt-2">${SGOALS.map((g, n) => { const got = (S.got || []).includes(g.k), wait = (S.queue || []).includes(g.k), v = Math.min(g.get(), g.n); return `<div class="wr-goal${got ? ' got' : ''}${n ? ' border-t-[1.5px] border-[#23275E]' : ''}"><span class="gimg${(S.freshSticker === STICKERS.findIndex((x) => x[0] === g.k)) && got ? ' fresh' : ''}"><img src="${IMG[g.k]}" alt=""></span><span class="flex-1 min-w-0"><span class="block t-title">${got ? stickerName(g.k) : g.task}</span>${got ? `<span class="block t-small">${g.task}</span>` : wait ? '<span class="block t-small text-sun">Done! Open your parcel on Today</span>' : `<span class="gbar"><i style="width:${Math.round(v / g.n * 100)}%"></i></span>`}</span><span class="t-small tabular-nums flex-shrink-0">${got || wait ? `<span class="text-mint text-xl flex">${ic('check-circle-fill')}</span>` : `${v} / ${g.n}`}</span></div>`; }).join('')}</div>
${S.parcels ? `<div class="mt-3">${btn(`${ic('package-bold', 'text-xl')} Open ${S.parcels > 1 ? `${S.parcels} parcels` : 'your parcel'}`, 'openParcel', 'secondary')}</div>` : ''}</section>
""" + s[j:]
rep("/* Calm Today:", """/* sticker goal rows */
(() => { const st = document.createElement('style'); st.textContent = `.wr-goal { display: flex; align-items: center; gap: 12px; padding: 10px 2px; }
.wr-goal .gimg { width: 46px; height: 46px; flex-shrink: 0; border-radius: 14px; background: #1C2057; display: flex; align-items: center; justify-content: center; }
.wr-goal .gimg img { width: 40px; height: 40px; object-fit: contain; filter: grayscale(1) brightness(.55); opacity: .45; }
.wr-goal.got .gimg { background: #FFF6D8; }
.wr-goal.got .gimg img { filter: none; opacity: 1; }
.wr-goal .gimg.fresh { box-shadow: 0 0 0 2px #FFC94D; }
.wr-goal .gbar { display: block; margin-top: 6px; height: 6px; border-radius: 99px; background: #23275E; overflow: hidden; }
.wr-goal .gbar i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #4361FF, #8B5CF6); }`; document.head.appendChild(st); })();
/* Calm Today:""")

# Copy that promised parcels for letting go
rep("No name or price needed. Let it go and you get a little parcel.", "No name or price needed. Every want you let go counts toward a sticker.")
rep("Let it go and it goes on your shelf, and you get a parcel. Still want it and you get a Shopping Pass with no pause.", "Let it go and it goes on your shelf. Still want it and you get a Shopping Pass with no pause.")
rep("Use “Jump to the morning” below, then decide in the Waiting room. Letting go earns a parcel.", "Use “Jump to the morning” below, then decide in the Waiting room.")
rep("Finish the pause and leave (and get a parcel)", "Finish the pause and leave")
rep("Fill a Pausa card (10 stamps), plus a parcel", "Fill a Pausa card (10 calm days)")
rep(" Up to 3 parcels a day.</p>", " Ranks take months, not days.</p>")
rep("When you let something go, it lands here and you get a parcel.", "When you let something go, it lands here and counts toward a sticker.")
rep("A sticker, for letting go", "You finished a sticker goal")
rep("and letting go earns a sticker parcel.", "and finishing goals earns stickers.")

rep("  if (r) return row('hourglass-medium-bold', 'bg-mint',", "  const out = [];\n  if (S.parcels) out.push(row('package-bold', 'bg-sun', S.parcels > 1 ? `${S.parcels} parcels to open` : 'A parcel to open', 'You finished a sticker goal', 'openParcel', ''));\n  if (r) return out.join('') + row('hourglass-medium-bold', 'bg-mint',")
rep("  if (S.parcels) return row('package-bold', 'bg-sun', S.parcels > 1 ? `${S.parcels} parcels to open` : 'A parcel to open', 'You finished a sticker goal', 'openParcel', '');\n  if (w.length) return row(", "  if (w.length) return out.join('') + row(")
rep("Next one ready ${w[0].when}`, 'openRoom', 'waiting');\n  return '';", "Next one ready ${w[0].when}`, 'openRoom', 'waiting');\n  return out.join('');")

open(F, 'w', encoding='utf-8').write(s)
print('ok e', len(s))
