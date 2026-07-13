import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RepertoireListScreen } from '@/features/musician/ui/screens/RepertoireListScreen';
import { RepertoireDetailScreen } from '@/features/musician/ui/screens/RepertoireDetailScreen';
import { CreateRepertoireScreen } from '@/features/musician/ui/screens/CreateRepertoireScreen';
import { EditRepertoireScreen } from '@/features/musician/ui/screens/EditRepertoireScreen';
import { RepertoireInvitesScreen } from '@/features/musician/ui/screens/RepertoireInvitesScreen';
import { CifraSearchScreen } from '@/features/musician/ui/screens/CifraSearchScreen';
import { PlayModeScreen } from '@/features/musician/ui/screens/PlayModeScreen';
import type { RepertoireStackParamList } from './types';

const Stack = createNativeStackNavigator<RepertoireStackParamList>();

// Nested stack da tab "Repertório" (Bloco 7) — mesmo padrão de
// ProfileStackNavigator: sempre native-stack, nunca @react-navigation/stack
// (InteractionManager, depreciado no RN 0.85+; ver CLAUDE.md).
export function RepertoireStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RepertoireList" component={RepertoireListScreen} />
      <Stack.Screen name="RepertoireDetail" component={RepertoireDetailScreen} />
      <Stack.Screen name="CreateRepertoire" component={CreateRepertoireScreen} />
      <Stack.Screen name="EditRepertoire" component={EditRepertoireScreen} />
      <Stack.Screen name="RepertoireInvites" component={RepertoireInvitesScreen} />
      <Stack.Screen name="CifraSearch" component={CifraSearchScreen} />
      <Stack.Screen name="PlayMode" component={PlayModeScreen} />
    </Stack.Navigator>
  );
}
