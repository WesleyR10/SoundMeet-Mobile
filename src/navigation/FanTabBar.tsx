import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Compass, User, type LucideIcon } from 'lucide-react-native';
import { spacing } from '@/shared/design-system/tokens';
import { TabBarItem } from './components/TabBarItem';

// Barra de navegação do fã (Bloco 10.4) — shell mínimo, componente próprio
// (não reaproveita MusicianTabBar.tsx, que é hardcoded pras 5 rotas do
// músico + FAB "Ao Vivo" de propósito). Sem FAB, sem badge de pendências —
// a Home/Explore/Perfil reais do fã ficam pro Bloco 11.
const ICONS: Record<string, LucideIcon> = {
  Home:    Home,
  Explore: Compass,
  Profile: User,
};

const LABELS: Record<string, string> = {
  Home:    'Início',
  Explore: 'Explorar',
  Profile: 'Perfil',
};

export function FanTabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[s.root, { paddingBottom: insets.bottom || spacing.sm }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabBarItem
            key={route.key}
            label={LABELS[route.name]}
            icon={ICONS[route.name]}
            isFocused={isFocused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection:      'row',
    alignItems:         'flex-start',
    justifyContent:     'space-around',
    paddingTop:          spacing.md,
    paddingHorizontal:  spacing.sm,
    minHeight:           64,
    backgroundColor:    'rgba(12,12,20,0.94)',
    borderTopWidth:      1,
    borderTopColor:     'rgba(255,255,255,0.06)',
  },
});
