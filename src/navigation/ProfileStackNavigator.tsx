import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ViewProfileScreen } from '@/features/musician/ui/screens/ViewProfileScreen';
import { EditProfileScreen } from '@/features/musician/ui/screens/EditProfileScreen';
import { QRCodeScreen } from '@/features/musician/ui/screens/QRCodeScreen';
import { AnalyticsScreen } from '@/features/musician/ui/screens/AnalyticsScreen';
import { TunerScreen } from '@/features/musician/ui/screens/TunerScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

// Nested stack da tab "Perfil" (Bloco 2/3/6/8) — nunca @react-navigation/stack
// (usa InteractionManager, depreciado no RN 0.85+; ver CLAUDE.md).
export function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ViewProfile" component={ViewProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="QRCode" component={QRCodeScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Tuner" component={TunerScreen} />
    </Stack.Navigator>
  );
}
