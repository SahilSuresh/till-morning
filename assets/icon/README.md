# Till Morning app icon: Sleepy bag (chosen by andrejsah, 2026-10-22)

A white shopping bag with closed eyes and a small "zz", on electric blue (#5B76FF to #3241D6, diagonal).

## Files
- `Till Morning icon 1024.png`: App Store / Xcode icon, 1024 x 1024, square with no rounded corners (iOS adds the mask).
- `Till Morning icon dark 1024.png`: dark home screen version.
- `Till Morning icon tinted 1024.png`: tinted version (greyscale on black; iOS adds the tint colour).
- `.svg` copies of all three (100 x 100 viewBox, scale freely).
- `layers/`: background, shadow, bag, sleepy eyes and zz as separate SVGs, for Apple's Icon Composer (iOS 26 Liquid Glass icons). Stack them in that order.

## Prototype snippet (inline SVG, 100 x 100)
Background gradient #5B76FF -> #3241D6 (top-left to bottom-right), then:
- shadow: `<ellipse cx="50" cy="86" rx="26" ry="4" fill="#1C2399" opacity=".45"/>`
- handle: `<path d="M38.5 42 v-6.5 a11.5 11.5 0 0 1 23 0 V42" fill="none" stroke="#F3F2FF" stroke-width="5" stroke-linecap="round"/>`
- bag: `<path d="M26 40 h48 l-3.4 40.5 a5 5 0 0 1 -5 4.5 h-31.2 a5 5 0 0 1 -5 -4.5 Z" fill="#F3F2FF"/>`
- eyes: `<path d="M33 57.5 q5 4.6 10 0 M57 57.5 q5 4.6 10 0" fill="none" stroke="#1B2266" stroke-width="3.4" stroke-linecap="round"/>`
- zz: `<path d="M68 20 h8.5 l-8.5 9 h8.5" fill="none" stroke="#C9D3FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M79.5 12 h4.5 l-4.5 4.8 h4.5" fill="none" stroke="#C9D3FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`

Full file: `Till Morning icon.svg`.
