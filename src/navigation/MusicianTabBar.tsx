import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Radio, Music, Wallet, User, type LucideIcon } from 'lucide-react-native';
import { colors, spacing } from '@/shared/design-system/tokens';
import { TabBarItem } from './components/TabBarItem';
import { TabBarFabItem } from './components/TabBarFabItem';

// Barra de navegação custom (Bloco 10) — substitui o tabBar padrão do
// bottom-tabs. Inspirada na referência visual `Claude Design/project/Home do
// Músico.dc.html`.
//
// O destaque de FAB (círculo coral elevado acima da barra) segue a aba
// SELECIONADA, seja qual for — antes era fixo em "Ao Vivo", que ficava
// elevado o tempo todo mesmo estando em outra tela e não dava nenhuma pista
// de onde o músico realmente estava.
//
// O contador de pedidos pendentes continua ancorado em "Ao Vivo"
// independentemente do foco: quando ele não é a aba ativa, o badge aparece no
// TabBarItem comum. Sem isso o alerta de pedido sumiria justamente durante o
// show, que é quando importa.
//
// Diferença deliberada da referência: lá o glow pulsante do FAB é constante;
// aqui só pulsa quando `pendingCount > 0` — pulso infinito o show inteiro
// vira ruído visual (e gasto de bateria) sem sinalizar nada de novo.
const ICONS: Record<string, LucideIcon> = {
  Home:          Home,
  LiveDashboard: Radio,
  Repertoire:    Music,
  Wallet:        Wallet,
  Profile:       User,
};

const LABELS: Record<string, string> = {
  Home:          'Início',
  LiveDashboard: 'Ao Vivo',
  Repertoire:    'Repertório',
  Wallet:        'Carteira',
  Profile:       'Perfil',
};

// Aba dona do contador de pedidos — o badge acompanha esta rota, não o FAB.
const PENDING_BADGE_ROUTE = 'LiveDashboard';

type Props = BottomTabBarProps & {
  // Contagem de pedidos pendentes — sem fonte de dados real ainda (Bloco 4,
  // "Pedidos ao Vivo", não implementado). Fica em 0 (sem badge, sem pulse)
  // até esse bloco existir; ponto de integração já pronto pra quando vier.
  pendingCount?: number;
};

export function MusicianTabBar({ state, navigation, insets, pendingCount = 0 }: Props) {
  return (
    <View style={[s.root, { paddingBottom: insets.bottom || spacing.sm }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        // O FAB é a aba ativa, não uma rota fixa.
        const isFab = isFocused;
        const badgeCount = route.name === PENDING_BADGE_ROUTE ? pendingCount : 0;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          Haptics.impactAsync(isFab ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return isFab ? (
          <TabBarFabItem
            key={route.key}
            label={LABELS[route.name]}
            icon={ICONS[route.name]}
            isFocused={isFocused}
            pendingCount={badgeCount}
            onPress={onPress}
          />
        ) : (
          <TabBarItem
            key={route.key}
            label={LABELS[route.name]}
            icon={ICONS[route.name]}
            isFocused={isFocused}
            pendingCount={badgeCount}
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
