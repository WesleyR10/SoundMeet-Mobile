import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FanHomeScreen } from '@/features/audience/ui/screens/FanHomeScreen';
import { EstablishmentDetailScreen } from '@/features/audience/ui/screens/EstablishmentDetailScreen';
import { EventPerformersScreen } from '@/features/audience/ui/screens/EventPerformersScreen';
import { MusicianPublicProfileScreen } from '@/features/audience/ui/screens/MusicianPublicProfileScreen';
import { SongRequestScreen } from '@/features/audience/ui/screens/SongRequestScreen';
import { TipMusicianScreen } from '@/features/audience/ui/screens/TipMusicianScreen';
import { QRScannerScreen } from '@/features/audience/ui/screens/QRScannerScreen';
import type { FanSharedStackParamList } from './types';

const Stack = createNativeStackNavigator<FanSharedStackParamList>();

// Stack da tab "Início" do fã (Bloco 11) — registra o MESMO
// FanSharedStackParamList que FanExploreStackNavigator (ver types.ts), então
// EstablishmentDetail/MusicianPublicProfile/SongRequest/TipMusician tipam
// idêntico nas duas entradas de tab.
export function FanHomeStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="FanHome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FanHome" component={FanHomeScreen} />
      <Stack.Screen name="EstablishmentDetail" component={EstablishmentDetailScreen} />
      <Stack.Screen name="EventPerformers" component={EventPerformersScreen} />
      <Stack.Screen name="MusicianPublicProfile" component={MusicianPublicProfileScreen} />
      <Stack.Screen name="SongRequest" component={SongRequestScreen} />
      <Stack.Screen name="TipMusician" component={TipMusicianScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
    </Stack.Navigator>
  );
}
