import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FanProfileScreen } from '@/features/audience/ui/screens/FanProfileScreen';
import { GamificationScreen } from '@/features/audience/ui/screens/GamificationScreen';
import { LeaderboardScreen } from '@/features/audience/ui/screens/LeaderboardScreen';
import type { FanProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<FanProfileStackParamList>();

export function FanProfileStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="FanProfile" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FanProfile" component={FanProfileScreen} />
      <Stack.Screen name="Gamification" component={GamificationScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Stack.Navigator>
  );
}
