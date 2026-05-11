import { Host, RNHostView, TabView } from '@expo/ui/swift-ui';
import { tabViewStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/lib/i18n';

import HistoryScreen from './history';
import TodayScreen from './index';
import SettingsScreen from './settings';

export default function TabLayout() {
  const t = useT();
  const palette = Colors[useColorScheme()];

  return (
    <Host style={styles.host} ignoreSafeArea="all">
      <TabView modifiers={[tabViewStyle({ type: 'automatic' }), tint(palette.leaf)]}>
        <TabView.Tab value="today" label={t('tabs.today')} systemImage="leaf.fill">
          <RNHostView>
            <TodayScreen />
          </RNHostView>
        </TabView.Tab>
        <TabView.Tab
          value="trend"
          label={t('tabs.trend')}
          systemImage="chart.line.uptrend.xyaxis">
          <RNHostView>
            <HistoryScreen />
          </RNHostView>
        </TabView.Tab>
        <TabView.Tab
          value="settings"
          label={t('tabs.settings')}
          systemImage="gearshape.fill">
          <RNHostView>
            <SettingsScreen />
          </RNHostView>
        </TabView.Tab>
      </TabView>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
});
