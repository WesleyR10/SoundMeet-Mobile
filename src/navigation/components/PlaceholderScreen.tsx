import { View, Text } from 'react-native';
import { colors } from '@/shared/design-system/tokens';

// Extraído de MusicianTabNavigator.tsx (Bloco 10.3) — reaproveitado também
// por FanTabNavigator.tsx (Bloco 10.4). Cada rota que usa isso é substituída
// por uma tela real no bloco correspondente.
export function makePlaceholder(label: string) {
  return function PlaceholderScreen() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
        <Text style={{ color: colors.brand.primary, fontSize: 20, fontFamily: 'SpaceGrotesk-Bold' }}>
          {label}
        </Text>
        <Text style={{ color: colors.text.muted, fontSize: 12, marginTop: 6, fontFamily: 'Inter-Regular' }}>
          Em desenvolvimento
        </Text>
      </View>
    );
  };
}
