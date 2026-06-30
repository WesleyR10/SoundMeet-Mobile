import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import { colors } from '@/shared/design-system/tokens';
import type { AuthStackParamList } from './types';

const Stack = createStackNavigator<AuthStackParamList>();

// Placeholders — substituídos no Bloco 1 (Keycloak PKCE)
function OnboardingPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.brand.primary, fontSize: 20, fontFamily: 'SpaceGrotesk-Bold' }}>
        Onboarding
      </Text>
      <Text style={{ color: colors.text.muted, fontSize: 13, marginTop: 8, fontFamily: 'Inter-Regular' }}>
        Bloco 1 — Login Keycloak PKCE
      </Text>
    </View>
  );
}

function LoginPlaceholder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
      <Text style={{ color: colors.brand.primary, fontSize: 20, fontFamily: 'SpaceGrotesk-Bold' }}>
        Login
      </Text>
    </View>
  );
}

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingPlaceholder} />
      <Stack.Screen name="Login"      component={LoginPlaceholder} />
    </Stack.Navigator>
  );
}
