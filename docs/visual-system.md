# Pausa · visual system v3 ("Pausa Night")

This replaces the light "paper and forest" system (v2). It is live in the clickable prototype (version 17, October 2026). Based on ScreensDesign research, October 2026.

**The idea:** the 11 PM scroll happens in the dark, so Pausa lives there too. A deep navy night, lit by one electric blue. Purple is kept for the Shopping Pass and the big moments.

## Six rules

1. **One action colour.** Electric blue for every main button, selected option, chosen tag, switch and active tab.
2. **Purple means Shopping Pass.** The ticket, the pass bar, the chosen reason and time on the Pass screen. It also gives the 15-second pause its aurora.
3. **Colour carries meaning.** Mint = protected or success. Amber = XP and rewards. Coral = impulse or warning. Purple = Shopping Pass. No decorative colour.
4. **Colour arrives as light.** Cards stay flat indigo. Colour shows up as glows (mascot halos, the breathing orb, a top glow on Home and the paywall) and as tinted icon tiles (a bright icon on a 15% tint of its colour).
5. **Full-screen colour is for moments.** Electric blue for the rhetorical question, a purple aurora for the pause, a starry purple night for the 11 PM story. Rank-up gets a purple glow with amber rays and confetti.
6. **Stickers have a white die-cut edge.** Mascots, medals and badges look like vinyl stickers on a dark laptop lid. Shopping-app logos sit on white squircles, like their real icons.

## Colour

| Token | Hex | Use |
|---|---|---|
| Night | #0D0F2E | Canvas |
| Surface | #161942 (border and edge #282C68) | Cards, options |
| Raised | #1E2256 / #1F2358 | Secondary buttons, neutral tiles, inputs (#12153A) |
| Text 1 / 2 / 3 | #F3F2FF / #B4B6E4 / #8A8EC6 | Text, secondary text, labels and hints |
| Electric blue | #4361FF (gradient from #5B76FF, edge #2A3BC0, light #93A5FF) | Buttons, selection, tabs, switches, links (light) |
| Purple | #8B5CF6; ticket #7E3FF2 to #B455F0 (edge #5427B8) | Shopping Pass |
| Pause aurora | #4E35DC to #2C24A3 to #15124F | The 15-second pause |
| Mint | #5EE9B5 (chip text #74F0C1) | Protected, success |
| Amber | #FFC94D (chip text #FFD46E) | XP, rewards, highlights |
| Coral | #FF8F78 (chip text #FFAB98) | Impulse, warnings |
| Paper | #F2F0FF (text #14163A, secondary #5D6192) | Receipts and the Pausa card |
| Ink on bright | #14163A | Text on amber, mint, paper and white |

Chips and tiles use their colour at 15 to 20% opacity with bright text. On full-colour screens, text is white, secondary text is 82% white, and buttons are white (indigo text) or a translucent ghost.

## Type (unchanged)

- **Fredoka 600**: headings, big numbers, buttons. Display 36/1.08, H1 29/1.13, H2 20/1.2.
- **Figtree 500 to 800**: everything else. Body 16.5/1.45 (500), titles 16.5 (700), small 14 (600), labels 13.5 (800).
- Sentence case everywhere. No all-caps labels.

## Components

- **Buttons**: pill, 19px Fredoka, 4px edge underneath that presses down on tap. Primary is the blue gradient. Secondary is raised indigo with a matching border. White and ghost go on full-colour screens. Danger is dark plum (#2A1638) with coral text.
- **Cards**: flat indigo with a hairline border and a 3px bottom edge in the same colour, so they still look pressable.
- **Option cards**: selected = blue outline, blue-tinted fill (#1C2468) and a blue check. On the Pass screen the outline and check are purple.
- **Tags and chips**: tags are indigo pills that turn solid blue when chosen. Status chips are tinted by meaning. The "Best value" chip on the paywall is solid amber.
- **Ticket**: the Shopping Pass is a purple gradient with notches cut in the night colour and a white dashed perforation. On the Pass screen the ticket is the start control: you drag its stub (#9B4CF4) to the right to tear it off. On Home it shows a stub with the time left and a thin bar that runs down. When no pass is running, Home has a "Need to shop?" ticket with a "Start" stub that starts one. At check-in it comes back with a red "Used" stamp (#D61F4B on #FFF0F3).
- **Paper**: the check-in "Your plan" card and the paywall receipt are off-white paper (#F2F0FF) with a zigzag edge. Paper is the only light material, on purpose.
- **Pausa card**: a paper stamp card on Home, tilted −1.2° with a lavender tape strip. Ten slots in two rows. Stamps are blue circles with a white pause glyph at slightly different angles. Today's slot is a dashed blue ring; a missed day shows a coral ✕.
- **Rank card**: blue gradient (#5A48F2 to #3D5AFE), white medal sticker, amber XP bar.
- **Check-in nudge**: solid amber card with dark text, so it's the first thing you see.
- **Setup progress bar**: blue-to-purple fill.
- **Tab bar**: translucent night with blur. The active tab is white with a blue pill behind the icon.
- **Pause**: purple aurora, a blue-white breathing orb, a light-blue ring (#B9CBFF), white question and answers.

## iOS-owned surfaces

- **Shield** (ShieldConfiguration): solid #101236 background, mascot icon, white title, #B4B6E4 subtitle, blue #4361FF primary button ("Close Uber Eats"), light-blue #93A5FF secondary text. No gradients, because iOS shields can't draw them.
- **App picker, Screen Time alert, notification banner, simulated shopping app**: iOS Dark Mode (#000, #1C1C1E, #2C2C2E, system blue #0A84FF).
- **Home screen**: dark wallpaper with blue and purple glows. The Pausa icon is a blue-to-purple gradient with a white pause glyph.

## Home order

Header with shield status, then the check-in nudge (if any), then the live Shopping Pass (if any), then the Pausa card, then the "Need to shop?" ticket (when no pass is running), then the rank card (with XP earned today), then the bank-limit seal card, then the "Finish setting up" checklist (until it's done), then Protected apps.

## Previous light version (v2)

Oat #FBF6EC canvas, forest #1F5C46 actions, pastel mint, sun, peach and lilac, and ink outlines on stickers. Layouts and components are the same, so the light look can come back as a token swap (for example, as a light mode).

## References (ScreensDesign)

- Dark dashboard with a gradient block button, Opal: https://screensdesign.com/apps/opal-screen-time-control/?vs=132801&utm_source=screensdesign&utm_medium=mcp&utm_content=screen_detail
- Dark break modal with a glowing gradient button, Opal: https://screensdesign.com/apps/opal-screen-time-control/?vs=132806&utm_source=screensdesign&utm_medium=mcp&utm_content=screen_detail
- Bright blue blocker home with a chunky blue button, BePresent: https://screensdesign.com/apps/bepresent-screen-time-control/?vs=257986&utm_source=screensdesign&utm_medium=mcp&utm_content=screen_detail
- Full-screen vivid blue intervention, one sec: https://screensdesign.com/apps/one-sec-screen-time-focus/?vs=744&utm_source=screensdesign&utm_medium=mcp&utm_content=screen_detail
- Deep blue gradient paywall with a white button, Friends: https://screensdesign.com/apps/pengu-raise-virtual-ai-pets/?vs=261006&utm_source=screensdesign&utm_medium=mcp&utm_content=screen_detail
- Deep purple gradient with neon accents, QUITTR: https://screensdesign.com/apps/quittr-quit-porn-now/?vs=202207&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Dark purple cards with glowing borders, Happy Baby: https://screensdesign.com/apps/happy-baby-sleep-tracker/?vs=260398&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Vivid indigo action card on a dark home, Shmoody: https://screensdesign.com/apps/shmoody-mood-habit-tracker/?vs=82025&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Dark breathing orb, Breathwrk: https://screensdesign.com/apps/breathwrk-breathing-exercises/?vs=176682&utm_source=screensdesign&utm_medium=mcp&utm_content=screen_detail
