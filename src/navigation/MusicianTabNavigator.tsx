import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useRequests } from '@/features/musician/application/useRequests';
import { useRequestsSocket } from '@/features/musician/application/useRequestsSocket';
import { usePushRegistration } from '@/features/musician/application/usePushRegistration';
import { useChatNotificationsSocket } from '@/features/scheduling/application/useChatNotificationsSocket';
import { LiveDashboardScreen } from '@/features/musician/ui/screens/LiveDashboardScreen';
import { HomeScreen } from '@/features/musician/ui/screens/HomeScreen';
import { WalletScreen } from '@/features/payment/ui/screens/WalletScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { RepertoireStackNavigator } from './RepertoireStackNavigator';
import { MusicianTabBar } from './MusicianTabBar';
import type { MusicianTabParamList } from './types';

const Tab = createBottomTabNavigator<MusicianTabParamList>();

// tabBar custom (Bloco 10, ver MusicianTabBar.tsx) — substitui a barra padrão
// do bottom-tabs; tabBarIcon/tabBarLabel dos Tab.Screen não se aplicam mais
// (o tab bar custom define seus próprios ícones/labels por nome de rota).
export function MusicianTabNavigator() {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);

  // Escopo de sessão (não de tela) — mesma query key que LiveDashboardScreen
  // usa, cache compartilhado (não duplica request); alimenta o badge/pulse
  // já pronto em MusicianTabBar/TabBarFabItem, hoje hardcoded em 0.
  const { data } = useRequests(musicianId, 'pending');
  useRequestsSocket(musicianId);
  usePushRegistration(musicianId);
  // Piggyback no mesmo socket /notifications já aberto acima — sem
  // connect/disconnect próprio (ver useChatNotificationsSocket.ts).
  useChatNotificationsSocket(musicianId);

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <MusicianTabBar {...props} pendingCount={data?.pending_count ?? 0} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="LiveDashboard" component={LiveDashboardScreen} />
      <Tab.Screen name="Repertoire" component={RepertoireStackNavigator} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
