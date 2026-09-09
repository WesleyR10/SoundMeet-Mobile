import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFanNotificationsSocket } from '@/features/audience/application/useFanNotificationsSocket';
import { FanCelebrationHost } from '@/features/audience/ui/components/FanCelebrationHost';
import { PendingBoostHost } from '@/features/audience/ui/components/PendingBoostHost';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { FanTabBar } from './FanTabBar';
import { FanHomeStackNavigator } from './FanHomeStackNavigator';
import { FanExploreStackNavigator } from './FanExploreStackNavigator';
import { FanProfileStackNavigator } from './FanProfileStackNavigator';
import type { FanTabParamList } from './types';

const Tab = createBottomTabNavigator<FanTabParamList>();

// Tabs do fã (Bloco 10.4 shell → Bloco 11 telas reais). Cada tab é a própria
// nested stack (mesmo padrão da tab "Perfil" do músico, ProfileStackNavigator).
export function FanTabNavigator() {
  const audienceId = useAuthStore((s) => s.user?.audienceId ?? null);

  /*
   * Escopo de sessão, montado UMA vez — espelha `useRequestsSocket` no
   * navigator do músico. O socket é singleton não reference-counted: um
   * segundo par connect/disconnect derrubaria a conexão do outro lado numa
   * conta multi-role.
   */
  useFanNotificationsSocket(audienceId);

  return (
    <>
      <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <FanTabBar {...props} />}>
        <Tab.Screen name="Home" component={FanHomeStackNavigator} />
        <Tab.Screen name="Explore" component={FanExploreStackNavigator} />
        <Tab.Screen name="Profile" component={FanProfileStackNavigator} />
      </Tab.Navigator>

      {/*
        Fora do Navigator: a cobrança pendente e a comemoração chegam por
        socket a qualquer momento, em qualquer aba. Presas a uma tela, seriam
        perdidas exatamente no caso mais comum.
      */}
      <PendingBoostHost />
      <FanCelebrationHost />
    </>
  );
}
