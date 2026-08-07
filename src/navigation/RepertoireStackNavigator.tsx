import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RepertoireListScreen } from '@/features/musician/ui/screens/RepertoireListScreen';
import { RepertoireDetailScreen } from '@/features/musician/ui/screens/RepertoireDetailScreen';
import { CreateRepertoireScreen } from '@/features/musician/ui/screens/CreateRepertoireScreen';
import { EditRepertoireScreen } from '@/features/musician/ui/screens/EditRepertoireScreen';
import { RepertoireInvitesScreen } from '@/features/musician/ui/screens/RepertoireInvitesScreen';
import { CifraSearchScreen } from '@/features/musician/ui/screens/CifraSearchScreen';
import { PlayModeScreen } from '@/features/musician/ui/screens/PlayModeScreen';
import { PersonalChordSheetListScreen } from '@/features/musician/ui/screens/PersonalChordSheetListScreen';
import { AddPersonalChordSheetScreen } from '@/features/musician/ui/screens/AddPersonalChordSheetScreen';
import { PersonalChordSheetEditorScreen } from '@/features/musician/ui/screens/PersonalChordSheetEditorScreen';
import { CommunityChordSheetListScreen } from '@/features/musician/ui/screens/CommunityChordSheetListScreen';
import { CommunityChordSheetDetailScreen } from '@/features/musician/ui/screens/CommunityChordSheetDetailScreen';
import { ImportCommunityChordSheetScreen } from '@/features/musician/ui/screens/ImportCommunityChordSheetScreen';
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
      <Stack.Screen name="PersonalChordSheetList" component={PersonalChordSheetListScreen} />
      <Stack.Screen name="AddPersonalChordSheet" component={AddPersonalChordSheetScreen} />
      <Stack.Screen name="PersonalChordSheetEditor" component={PersonalChordSheetEditorScreen} />
      <Stack.Screen name="CommunityChordSheetList" component={CommunityChordSheetListScreen} />
      <Stack.Screen name="CommunityChordSheetDetail" component={CommunityChordSheetDetailScreen} />
      <Stack.Screen name="ImportCommunityChordSheet" component={ImportCommunityChordSheetScreen} />
    </Stack.Navigator>
  );
}
