#!/usr/bin/env python3
"""v18 round 20: one first-visit tip each for Waiting and Me. Shown once, never while the Today tour runs; tap anywhere to close."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


rep('<div class="wr-seg mt-4 rise" style="--d:60" role="tablist" aria-label="Waiting room">',
    '<div class="wr-seg mt-4 rise" data-tip="room" style="--d:60" role="tablist" aria-label="Waiting room">')
rep('return `<button class="rankcard relative mt-4 px-5 pt-5 pb-4 rise w-full text-left block"',
    'return `<button data-tip="progress" class="rankcard relative mt-4 px-5 pt-5 pb-4 rise w-full text-left block"')

rep("function startCoach() {", r"""const TAB_TIPS = {
  room: { t: 'Everything you park waits here', d: 'When it’s ready, you decide: let it go, or shop with a plan.' },
  progress: { t: 'Your rank, stickers and calm days', d: 'They only grow. Nothing here ever drops.' }
};
function maybeTabTip() {
  const k = S.tab;
  if (S.screen !== 'home' || !TAB_TIPS[k] || (S.tabTips || {})[k] || S.sheet || !S.subscribed) return;
  setTimeout(() => { if (S.screen !== 'home' || S.tab !== k || S.sheet || (S.tabTips || {})[k]) return; S.tipK = k; S.sheet = 'tabtip'; renderOverlays(); }, 450);
}
function startCoach() {""")

rep("  coach: () => {", r"""  tabtip: () => {
    const ov = $('#ovl'), k = S.tipK, tip = TAB_TIPS[k], el = $(`#scr [data-tip="${k}"]`); if (!ov || !tip || !el) return '';
    const o = ov.getBoundingClientRect(), r = el.getBoundingClientRect(), z = o.width / ov.offsetWidth || 1, pad = 6;
    const x = (r.left - o.left) / z - pad, y = (r.top - o.top) / z - pad, w = r.width / z + pad * 2, h = r.height / z + pad * 2, W = ov.offsetWidth;
    const cx = Math.max(36, Math.min(W - 36, x + w / 2)), rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 16;
    return `<div class="coach-wrap" data-a="tabTipDone" role="dialog" aria-label="${tip.t}"><div class="coach-hole" style="left:${Math.round(x)}px;top:${Math.round(y)}px;width:${Math.round(w)}px;height:${Math.round(h)}px;border-radius:${Math.round(rad + pad)}px"></div>
<div class="coach-tip" style="top:${Math.round(y + h + 14)}px"><i class="coach-arr" style="top:-7px;left:${Math.round(cx - 16)}px"></i><div class="flex gap-3 items-start"><span class="st-face" aria-hidden="true"><i></i></span><span class="flex-1 min-w-0"><b class="block text-[17px] leading-tight">${tip.t}</b><span class="block mt-1 text-[14.5px] font-semibold leading-snug text-[#4A4E7A]">${tip.d}</span></span></div>
<div class="mt-3 flex justify-end"><button class="coach-next" data-a="tabTipDone">Got it</button></div></div></div>`;
  },
  coach: () => {""")
rep("  coachNext() {", """  tabTipDone() { S.tabTips = { ...(S.tabTips || {}), [S.tipK]: true }; S.sheet = null; save(); renderOverlays(); },
  coachNext() {""")
# a tab tip waits until the Today tour is over
rep("  coachEnd() { S.coachDone = true; S.coachStep = 0; S.sheet = null; save(); renderOverlays(); },",
    "  coachEnd() { S.coachDone = true; S.coachStep = 0; S.sheet = null; save(); renderOverlays(); maybeTabTip(); },")
rep("  renderOverlays();\n  renderPanel();\n}", "  renderOverlays();\n  renderPanel();\n  maybeTabTip();\n}")

# panel: replay the tab tips too
rep("    else if (k === 'tut') { S.tab = 'home'; S.coachStep = 0;", "    else if (k === 'tut') { S.tabTips = {}; S.tab = 'home'; S.coachStep = 0;")
rep("['tut', 'hand-pointing-bold', 'Replay first-time tutorial']", "['tut', 'hand-pointing-bold', 'Replay first-time tips (Today, Waiting, Me)']")

open(F, 'w', encoding='utf-8').write(s)
print('patch18v ok')
