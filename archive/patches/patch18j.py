#!/usr/bin/env python3
"""v18 round 9: a read-at-a-glance 'Your plan' card on Today; When to shield moves to Your rules; Settings slimmer."""
import sys
F = sys.argv[1]
s = open(F, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit(f'expected {count}, found {n}: {old[:100]!r}')
    s = s.replace(old, new)


PLAN = r"""
/* Today: a glanceable summary of your plan. Reading only; every row opens Your rules. */
function planCard() {
  const ch = CHALLENGES[S.challenge], d = Math.min(challengeDay(), ch.len || 0), nt = nextTreat(), on = S.picked.filter((id) => S.protection && !S.off.includes(id)).length;
  const sched = { all: 'all day', evenings: 'evenings', weekends: 'at weekends' }[S.schedule];
  const tonight = (S.treats || {})[dow()] ? ['heart-bold', 'bg-lav', 'Treat night tonight', 'Takeaway apps open with a hello, not a pause'] : risky() ? ['moon-stars-bold', 'bg-peach', 'Risky hours now', `Pauses last ${realPauseSecs()} seconds until midnight`] : ['moon-stars-bold', 'bg-hush text-azure-light', 'Tonight', `Pauses get longer from 22:00${nt ? `. Next treat night: ${nt}` : ''}`];
  const row = (i, tile, t, sub, extra, first) => `<button class="w-full px-4 py-3 flex items-center gap-3 text-left${first ? '' : ' border-t-[1.5px] border-[#23275E]'}" data-a="openRules" data-arg="home"><span class="tile w-10 h-10 ${tile} text-[20px]">${ic(i)}</span><span class="flex-1 min-w-0"><span class="block t-title">${t}</span><span class="block t-small">${sub}</span>${extra || ''}</span><span class="text-lg text-ink3">${ic('caret-right-bold')}</span></button>`;
  return `<section class="card mt-5 overflow-hidden rise" style="--d:90" aria-label="Your plan"><div class="px-4 pt-3.5 pb-1 flex items-center justify-between"><h2 class="t-h2">Your plan</h2><button class="text-[14px] font-bold text-azure-light" data-a="openRules" data-arg="home">Edit</button></div>
${ch.len ? row(ch.icon, ch.bg, `${ch.name}`, `Day ${d} of ${ch.len}`, `<span class="gbar block mt-1.5 h-1.5 rounded-full bg-[#23275E] overflow-hidden"><i class="block h-full rounded-full bg-gradient-to-r from-[#4361FF] to-[#8B5CF6]" style="width:${Math.round(d / ch.len * 100)}%"></i></span>`, true) : row('lock-key-bold', 'bg-sun', 'No challenge yet', 'A no-buy month gives your wait real teeth', '', true)}
${row(...tonight)}
${row('shield-check-bold', 'bg-mint', `${on} app${on === 1 ? '' : 's'} shielded`, S.protection ? `Shields up ${sched}` : 'Shields are off', '')}
</section>`;
}
"""
rep("\nfunction calmHome() {", PLAN + "function calmHome() {")
rep("${S.subscribed ? nextStep() : ''}", "${S.subscribed ? nextStep() : ''}\n${S.subscribed ? planCard() : ''}")

# Your rules: remember where it was opened from; When to shield lives here now
rep("  tourNext() {", "  openRules(arg) { S.rulesFrom = arg || 'settings'; S.tab = 'plan'; go('home'); },\n  rulesBack() { S.tab = S.rulesFrom === 'home' ? 'home' : 'settings'; go('home'); },\n  tourNext() {")
rep("<button class=\"backbtn\" data-a=\"tab\" data-arg=\"settings\" aria-label=\"Back to Settings\">${ic('arrow-left-bold')}</button><h1 class=\"t-h1\">Your rules</h1>",
    "<button class=\"backbtn\" data-a=\"rulesBack\" aria-label=\"Back\">${ic('arrow-left-bold')}</button><h1 class=\"t-h1\">Your rules</h1>")
rep("<section class=\"card mt-5 p-4 rise\" id=\"wr-ch\" style=\"--d:40\"><h2 class=\"t-h2\">Your challenge</h2>",
    "<section class=\"card mt-5 p-4 rise\" id=\"wr-when\" style=\"--d:30\"><h2 class=\"t-h2\">When to shield</h2><div class=\"mt-3 grid grid-cols-3 gap-2\" role=\"group\" aria-label=\"When to shield\">${[['all', 'All day'], ['evenings', 'Evenings'], ['weekends', 'Weekends']].map(([v, l]) => `<button class=\"tag text-center px-2\" aria-pressed=\"${S.schedule === v}\" data-a=\"schedule\" data-arg=\"${v}\">${l}</button>`).join('')}</div><p class=\"mt-2 t-small\">${{ all: 'Shields are up all day, every day.', evenings: 'Shields go up from 6 pm to 6 am, when most impulse buys happen.', weekends: 'Shields are up on Saturdays and Sundays only.' }[S.schedule]}</p></section>\n"
    "<section class=\"card mt-4 p-4 rise\" id=\"wr-ch\" style=\"--d:40\"><h2 class=\"t-h2\">Your challenge</h2>")
rep("${link('tab', 'plan', 'calendar-check-bold', 'bg-sun', 'Your rules', 'Challenge, treat nights, how long wants wait')}",
    "${link('openRules', 'settings', 'calendar-check-bold', 'bg-sun', 'Your rules', 'Challenge, treat nights, when to shield')}")
rep("${row(`<p class=\"t-title\">When to shield</p>${seg('schedule', [['all', 'All day'], ['evenings', 'Evenings'], ['weekends', 'Weekends']], 'schedule', 'When to shield')}`)}\n", "")
# The tab bar lights the tab you came from
rep("const on = S.tab === id || (id === 'settings' && ['apps', 'plan'].includes(S.tab));",
    "const on = S.tab === id || (id === 'settings' && (S.tab === 'apps' || (S.tab === 'plan' && S.rulesFrom !== 'home'))) || (id === 'home' && S.tab === 'plan' && S.rulesFrom === 'home');")

rep('return `<div class="flex-1 scroll px-6 pt-14 pb-20">', 'return `<div class="flex-1 scroll px-6 pt-14 pb-32">', 2)
open(F, 'w', encoding='utf-8').write(s)
print('ok j', len(s))
