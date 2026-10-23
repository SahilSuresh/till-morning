import {
  CaretDoubleRightIcon,
  CaretRightIcon,
  CheckIcon,
  ClockIcon,
  GearSixIcon,
  HourglassMediumIcon,
  LockKeyIcon,
  MinusIcon,
  MoonStarsIcon,
  PlusIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SunIcon,
  TicketIcon,
  TimerIcon,
  UserIcon,
  WarningCircleIcon,
  XIcon,
} from 'phosphor-react-native';

// The app's named icons, drawn with Phosphor's bold glyphs (the prototype's ic() set, P:L754).
// Names, sizes and default colours are unchanged, so every screen keeps working.
type P = { size?: number; color?: string };

export const IconX = ({ size = 20, color = '#F3F2FF' }: P) => <XIcon size={size} color={color} weight="bold" />;

export const IconCheck = ({ size = 20, color = '#FFFFFF' }: P) => <CheckIcon size={size} color={color} weight="bold" />;

export const IconHourglass = ({ size = 20, color = '#FFFFFF' }: P) => <HourglassMediumIcon size={size} color={color} weight="bold" />;

export const IconTicket = ({ size = 20, color = '#FFFFFF' }: P) => <TicketIcon size={size} color={color} weight="bold" />;

export const IconLock = ({ size = 16, color = '#B4B6E4' }: P) => <LockKeyIcon size={size} color={color} weight="bold" />;

export const IconShield = ({ size = 16, color = '#74F0C1' }: P) => <ShieldCheckIcon size={size} color={color} weight="bold" />;

export const IconTimer = ({ size = 16, color = '#FFFFFF' }: P) => <TimerIcon size={size} color={color} weight="bold" />;

export const IconMoon = ({ size = 20, color = '#93A5FF' }: P) => <MoonStarsIcon size={size} color={color} weight="bold" />;

export const IconChevrons = ({ size = 18, color = '#FFFFFF' }: P) => <CaretDoubleRightIcon size={size} color={color} weight="bold" />;

export const IconPlus = ({ size = 20, color = '#F3F2FF' }: P) => <PlusIcon size={size} color={color} weight="bold" />;

export const IconMinus = ({ size = 20, color = '#F3F2FF' }: P) => <MinusIcon size={size} color={color} weight="bold" />;

export const IconWarn = ({ size = 20, color = '#FFAB98' }: P) => <WarningCircleIcon size={size} color={color} weight="bold" />;

export const IconReceipt = ({ size = 18, color = '#5D6192' }: P) => <ReceiptIcon size={size} color={color} weight="bold" />;

export const IconClock = ({ size = 16, color = '#FFFFFF' }: P) => <ClockIcon size={size} color={color} weight="bold" />;

export const IconSun = ({ size = 22, color = '#B4B6E4' }: P) => <SunIcon size={size} color={color} weight="bold" />;

export const IconUser = ({ size = 22, color = '#B4B6E4' }: P) => <UserIcon size={size} color={color} weight="bold" />;

export const IconCaret = ({ size = 18, color = '#8A8EC6' }: P) => <CaretRightIcon size={size} color={color} weight="bold" />;

export const IconGear = ({ size = 22, color = '#B4B6E4' }: P) => <GearSixIcon size={size} color={color} weight="bold" />;
