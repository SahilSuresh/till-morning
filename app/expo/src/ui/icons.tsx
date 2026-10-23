import Svg, { Circle, Path, Rect } from 'react-native-svg';

// A few Phosphor-style "bold" icons, drawn on a 24 grid with round strokes.
type P = { size?: number; color?: string };
const S = (size: number, color: string, children: React.ReactNode) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </Svg>
);

export const IconX = ({ size = 20, color = '#F3F2FF' }: P) => S(size, color, <Path d="M6 6l12 12M18 6L6 18" />);

export const IconCheck = ({ size = 20, color = '#FFFFFF' }: P) => S(size, color, <Path d="M5 12.5l4.5 4.5L19 7.5" />);

export const IconHourglass = ({ size = 20, color = '#FFFFFF' }: P) =>
  S(size, color, <Path d="M6.5 3h11M6.5 21h11M7.5 3c0 5 9 6 9 9s-9 4-9 9M16.5 3c0 5-9 6-9 9s9 4 9 9" />);

export const IconTicket = ({ size = 20, color = '#FFFFFF' }: P) =>
  S(
    size,
    color,
    <>
      <Path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v8a2 2 0 00-2 2H5a2 2 0 00-2-2z" />
      <Path d="M15 6v12" strokeDasharray="2 2.5" />
    </>,
  );

export const IconLock = ({ size = 16, color = '#B4B6E4' }: P) =>
  S(
    size,
    color,
    <>
      <Rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <Path d="M8 10.5V8a4 4 0 018 0v2.5" />
    </>,
  );

export const IconShield = ({ size = 16, color = '#74F0C1' }: P) =>
  S(size, color, <Path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" />);

export const IconTimer = ({ size = 16, color = '#FFFFFF' }: P) =>
  S(
    size,
    color,
    <>
      <Circle cx="12" cy="13.5" r="7.5" />
      <Path d="M12 13.5V10M9.5 2.5h5" />
    </>,
  );

export const IconMoon = ({ size = 20, color = '#93A5FF' }: P) =>
  S(size, color, <Path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />);

export const IconChevrons = ({ size = 18, color = '#FFFFFF' }: P) => S(size, color, <Path d="M6 6l6 6-6 6M13 6l6 6-6 6" />);

export const IconPlus = ({ size = 20, color = '#F3F2FF' }: P) => S(size, color, <Path d="M12 5v14M5 12h14" />);

export const IconMinus = ({ size = 20, color = '#F3F2FF' }: P) => S(size, color, <Path d="M5 12h14" />);

export const IconWarn = ({ size = 20, color = '#FFAB98' }: P) =>
  S(
    size,
    color,
    <>
      <Path d="M12 3.5L2.5 20h19z" />
      <Path d="M12 10v4.5M12 17.2v.3" />
    </>,
  );

export const IconReceipt = ({ size = 18, color = '#5D6192' }: P) =>
  S(size, color, <Path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM8.5 8h7M8.5 12h7" />);

export const IconClock = ({ size = 16, color = '#FFFFFF' }: P) =>
  S(
    size,
    color,
    <>
      <Circle cx="12" cy="12" r="8.5" />
      <Path d="M12 7.5V12l3 2" />
    </>,
  );

export const IconSun = ({ size = 22, color = '#B4B6E4' }: P) =>
  S(
    size,
    color,
    <>
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
    </>,
  );

export const IconUser = ({ size = 22, color = '#B4B6E4' }: P) =>
  S(
    size,
    color,
    <>
      <Circle cx="12" cy="8.5" r="4" />
      <Path d="M4 20.5c1.6-3.6 4.6-5.5 8-5.5s6.4 1.9 8 5.5" />
    </>,
  );

export const IconCaret = ({ size = 18, color = '#8A8EC6' }: P) => S(size, color, <Path d="M9 5l7 7-7 7" />);

export const IconGear =({ size = 22, color = '#B4B6E4' }: P) =>
  S(
    size,
    color,
    <>
      <Circle cx="12" cy="12" r="3" />
      <Path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </>,
  );
