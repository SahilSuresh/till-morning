import { router } from 'expo-router';
import { Compass, Hourglass, ShareNetwork, ShieldCheck } from '../ui/ph';
import { Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, CircleButton } from '../ui/components';
import { IconChevrons } from '../ui/icons';
import { color, font, type } from '../ui/theme';

const SHOPS = 'SHEIN, Temu, ASOS, Amazon, Vinted, eBay, Etsy, Zara, H&M, boohoo, PrettyLittleThing, Next, Argos, John Lewis, Very, Currys, Primark, Nike, JD Sports, Boots and more';

/** How to switch on Till Morning for Safari (checkout pages) and the Share button. */
export default function SafariHelp() {
  const insets = useSafeAreaInsets();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/settings'));
  const step = (n: number, t: string, d: string) => (
    <View key={n} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: n > 1 ? 1.5 : 0, borderColor: color.divider }}>
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#23275E', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: font.display, fontSize: 15, color: color.text2 }}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={type.title}>{t}</Text>
        <Text style={[type.small, { marginTop: 2 }]}>{d}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top - 3, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back" onPress={back}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text style={type.h2}>Caught at checkout</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16, gap: 14 }}>
        <Text style={type.body}>
          Two ways to park a basket before you pay. Both read the total on your phone; nothing is sent anywhere.
        </Text>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(147,165,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={22} weight="bold" color="#93A5FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.title}>Till Morning for Safari</Text>
              <Text style={type.small}>When you reach a checkout page, it shows the total, the wait and “Park the basket till morning”.</Text>
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            {step(1, 'Open the Settings app', 'Then Apps → Safari → Extensions.')}
            {step(2, 'Tap Till Morning and turn it on', 'Allow it on the shop sites when Safari asks.')}
            {step(3, 'Shop as usual in Safari', `It only runs on shop sites: ${SHOPS}.`)}
          </View>
          <View style={{ marginTop: 8 }}>
            <Button variant="secondary" label="Open Settings" onPress={() => Linking.openSettings()} />
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(167,139,250,0.19)', alignItems: 'center', justifyContent: 'center' }}>
              <ShareNetwork size={22} weight="bold" color="#CBBBFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.title}>The Share button</Text>
              <Text style={type.small}>
                In any shop app or in Photos, tap Share and choose Till Morning. Share a basket screenshot and it reads the total, or share a link to park the item.
              </Text>
            </View>
          </View>
          <Text style={[type.small, { marginTop: 10 }]}>Don’t see Till Morning in the Share sheet? Scroll the app row to the end, tap More, and turn it on.</Text>
        </Card>

        <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Hourglass size={22} weight="bold" color="#93A5FF" />
          <Text style={[type.small, { flex: 1 }]}>Parked baskets wait by the usual rule: 1 hour for every £10, never ready at night.</Text>
        </Card>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
          <ShieldCheck size={16} weight="bold" color={color.text3} />
          <Text style={type.small}>No account, no bank links. Pages are read on your phone.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
