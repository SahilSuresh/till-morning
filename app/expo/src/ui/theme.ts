// "Till Morning Night" design tokens, taken from the v18 prototype (app/prototype/till-morning.html).
// Rules: blue is the only action colour; violet = Shopping Pass and big moments;
// mint = protected, amber = XP, coral = impulse/loss. Surfaces stay flat; colour arrives as light.

export const color = {
  night: '#0D0F2E',
  text: '#F3F2FF',
  text2: '#B4B6E4',
  text3: '#8A8EC6',
  line: '#2A2E6B',
  deep: '#14163A',
  hush: '#1F2358',

  card: '#161942',
  cardEdge: '#282C68',
  divider: '#23275E',
  field: '#12153A',
  fieldBorder: '#2E3374',
  fieldFocus: '#5B76FF',
  placeholder: '#6E72AA',

  blue: '#4361FF',
  blueTop: '#5B76FF',
  blueEdge: '#2A3BC0',
  blueLight: '#93A5FF',

  violet: '#8B5CF6',
  violetLight: '#C4B5FD',
  violetDeep: '#5B33D6',
  lav: '#A78BFA',

  mint: '#5EE9B5',
  mintText: '#74F0C1',
  sun: '#FFC94D',
  sunText: '#FFD46E',
  sunEdge: '#C9952A',
  coral: '#FF8F78',
  coralText: '#FFAB98',
  error: '#FF9C92',

  paper: '#F2F0FF',
  paperLabel: '#5D6192',
  inkOnBright: '#14163A',

  shieldBg: '#101236',
  sheet: '#14173F',
  toast: '#262A6A',
  toastBorder: '#3A3F8C',
  white: '#FFFFFF',
  white82: 'rgba(255,255,255,0.82)',
} as const;

export const gradient = {
  primary: ['#5B76FF', '#4361FF'] as const,
  ticket: ['#7E3FF2', '#B455F0'] as const,
  passPill: ['#7C4DFF', '#A066FF'] as const,
  pause: ['#4E35DC', '#2C24A3', '#15124F'] as const,
  volt: ['#3F5BFF', '#2730C9'] as const,
  rank: ['#5A48F2', '#3D5AFE'] as const,
  progress: ['#4361FF', '#8B5CF6'] as const,
  tabActive: ['#5873FF', '#4361FF'] as const,
};

export const font = {
  display: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  displayBold: 'Fredoka_700Bold',
  body: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  bodyHeavy: 'Figtree_800ExtraBold',
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 36, lineHeight: 39, letterSpacing: -0.36, color: color.text },
  h1: { fontFamily: font.display, fontSize: 29, lineHeight: 33, color: color.text },
  h2: { fontFamily: font.display, fontSize: 20, lineHeight: 24, color: color.text },
  title: { fontFamily: font.bodyBold, fontSize: 16.5, lineHeight: 21, color: color.text },
  body: { fontFamily: font.body, fontSize: 16.5, lineHeight: 24, color: color.text2 },
  small: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 19.6, color: color.text2 },
  label: { fontFamily: font.bodyHeavy, fontSize: 13.5, lineHeight: 17.5, color: color.text3 },
  num: { fontFamily: font.display, fontVariant: ['tabular-nums' as const] },
} as const;

export const radius = { card: 22, opt: 20, field: 16, tile: 14, pill: 999 } as const;

export const motion = {
  // cubic-bezier(.2,.8,.2,1) and the spring cubic-bezier(.34,1.56,.64,1)
  ease: [0.2, 0.8, 0.2, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
};
