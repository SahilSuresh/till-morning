import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { color, gradient } from './theme';

/** radial-gradient(130% 60% at 50% 27%, rgba(132,150,255,.5) → 0 at 62%) over the pause aurora. */
export function PauseBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={gradient.pause} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="g" cx="50" cy="27" rx="130" ry="60" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="rgb(132,150,255)" stopOpacity={0.5} />
            <Stop offset="0.62" stopColor="rgb(132,150,255)" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#g)" />
      </Svg>
    </View>
  );
}

/** Home's top glow: radial-gradient(120% 36% at 50% 0%, rgba(124,92,255,.3), transparent 72%). */
export function TopGlow() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color.night }]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="t" cx="50" cy="0" rx="120" ry="36" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="rgb(124,92,255)" stopOpacity={0.3} />
            <Stop offset="0.72" stopColor="rgb(124,92,255)" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#t)" />
      </Svg>
    </View>
  );
}

/** The volt screen (full-colour blue) used for big statements. */
export function VoltBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={gradient.volt} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="v" cx="50" cy="0" rx="120" ry="60" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#7088FF" stopOpacity={1} />
            <Stop offset="0.62" stopColor="#7088FF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#v)" />
      </Svg>
    </View>
  );
}
