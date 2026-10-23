import { useEffect, useRef } from 'react';
import { Animated, Text, type TextStyle } from 'react-native';

import { springOut, useReduceMotion } from './components';

/**
 * A highlighted word inside a heading, like the prototype's .hl (P:L109): a rounded colour block,
 * dark text, a small bottom edge, a slight tilt, and the hl-in pop (opacity 0, scale .5, −8deg → in)
 * about 280 ms after the heading rises.
 *
 * It is an inline view (text spans can't rotate), so put it inside the heading's <Text> and pass
 * the heading's text style as `textStyle` so the font matches.
 */
export function Hl({
  children,
  bg,
  tilt = -1,
  delay = 280,
  textStyle,
}: {
  children: string;
  bg: string;
  tilt?: number;
  delay?: number;
  textStyle?: TextStyle | TextStyle[];
}) {
  const rm = useReduceMotion();
  const pop = useRef(new Animated.Value(rm ? 1 : 0)).current;
  useEffect(() => {
    if (rm) return;
    Animated.timing(pop, { toValue: 1, duration: 550, delay, easing: springOut, useNativeDriver: true }).start();
  }, [rm, delay, pop]);

  return (
    <Animated.View
      style={{
        backgroundColor: bg,
        borderRadius: 7,
        paddingHorizontal: 6,
        // .hl edge: box-shadow 0 .07em 0 rgba(2,3,18,.35)
        shadowColor: '#020312',
        shadowOpacity: 0.35,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 3 },
        opacity: pop,
        transform: [
          { translateY: 6 },
          { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
          { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', `${tilt}deg`] }) },
        ],
      }}
    >
      <Text style={[textStyle, { color: '#14163A' }]}>{children}</Text>
    </Animated.View>
  );
}
