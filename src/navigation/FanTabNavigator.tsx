import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FanTabBar } from './FanTabBar';
import { FanHomeStackNavigator } from './FanHomeStackNavigator';
import { FanExploreStackNavigator } from './FanExploreStackNavigator';
import { FanProfileStackNavigator } from './FanProfileStackNavigator';
import type { FanTabParamList } from './types';

const Tab = createBottomTabNavigator<FanTabParamList>();

// Tabs do fã (Bloco 10.4 shell → Bloco 11 telas reais). Cada tab é a própria
// nested stack (mesmo padrão da tab "Perfil" do músico, ProfileStackNavigator).
export function FanTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <FanTabBar {...props} />}>
      <Tab.Screen name="Home" component={FanHomeStackNavigator} />
      <Tab.Screen name="Explore" component={FanExploreStackNavigator} />
      <Tab.Screen name="Profile" component={FanProfileStackNavigator} />
    </Tab.Navigator>
  );
}
