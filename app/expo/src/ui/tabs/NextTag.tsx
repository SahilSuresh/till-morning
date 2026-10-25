import { View } from 'react-native';

import { ShelfTag, TagTitle } from '../ShelfTag';
import type { NextStep } from './TodayParts';
import { Pressable } from '../Pressable';

// Night Trolley · Part 1, option 1F in our colours: the one next step hangs from a little star
// as a purple shelf tag, with a moon-yellow "price" on a tear-off stub ("1 min").

export function NextTag({ step }: { step: NextStep }) {
  const tag = step.tag ?? step.chip ?? 'Next up';
  const stub = step.stub ?? { label: 'Takes', value: '1 min' };
  return (
    <Pressable onPress={step.go} accessibilityRole="button" accessibilityLabel={`${tag}. ${step.title}. ${step.sub}. ${stub.label} ${stub.value}`}>
      {({ pressed }) => (
        <View style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
          <ShelfTag label={tag} stubLabel={stub.label} stubValue={stub.value} motion="nudge">
            <TagTitle title={step.title} sub={step.sub} />
          </ShelfTag>
        </View>
      )}
    </Pressable>
  );
}
