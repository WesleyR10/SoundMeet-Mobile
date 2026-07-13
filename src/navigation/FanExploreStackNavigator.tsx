import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FanExploreScreen } from '@/features/audience/ui/screens/FanExploreScreen';
import { EstablishmentDetailScreen } from '@/features/audience/ui/screens/EstablishmentDetailScreen';
import { EventPerformersScreen } from '@/features/audience/ui/screens/EventPerformersScreen';
import { MusicianPublicProfileScreen } from '@/features/audience/ui/screens/MusicianPublicProfileScreen';
import { SongRequestScreen } from '@/features/audience/ui/screens/SongRequestScreen';
import { TipMusicianScreen } from '@/features/audience/ui/screens/TipMusicianScreen';
import type { FanSharedStackParamList } from './types';

const Stack = createNativeStackNavigator<FanSharedStackParamList>();

// Mesmo FanSharedStackParamList de FanHomeStackNavigator — ver comentário lá
// e em types.ts. Sem QRScanner aqui (entrada só pela Home).
export function FanExploreStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="FanExplore" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FanExplore" component={FanExploreScreen} />
      <Stack.Screen name="EstablishmentDetail" component={EstablishmentDetailScreen} />
      <Stack.Screen name="EventPerformers" component={EventPerformersScreen} />
      <Stack.Screen name="MusicianPublicProfile" component={MusicianPublicProfileScreen} />
      <Stack.Screen name="SongRequest" component={SongRequestScreen} />
      <Stack.Screen name="TipMusician" component={TipMusicianScreen} />
    </Stack.Navigator>
  );
}
