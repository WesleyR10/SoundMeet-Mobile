import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { colors } from '@/shared/design-system/tokens';
import { AuthNavigator } from './AuthNavigator';
import { MusicianTabNavigator } from './MusicianTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);

  // [BLOCO 1] isLoading ficará true na startup enquanto verifica token no SecureStore
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/*
          [BLOCO 1] Substituir por condicional baseada em isAuthenticated:
          {isAuthenticated
            ? <Stack.Screen name="MusicianTabs" component={MusicianTabNavigator} />
            : <Stack.Screen name="AuthStack" component={AuthNavigator} />
          }
        */}
        <Stack.Screen name="MusicianTabs" component={MusicianTabNavigator} />
        <Stack.Screen name="AuthStack"    component={AuthNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
