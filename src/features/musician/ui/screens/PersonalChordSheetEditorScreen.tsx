import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { ChordDiagramSheet } from '@/shared/components/ChordDiagramSheet';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { MusicianTabParamList, RepertoireScreenProps, RootStackParamList } from '@/navigation/types';
import { usePersonalChordSheet } from '../../application/usePersonalChordSheet';
import { usePersonalChordSheetView } from '../../application/usePersonalChordSheetView';
import { useMusicLibraryItem } from '../../application/useMusicLibraryItem';
import { usePersonalChordSheetEditorHandlers } from '../../application/usePersonalChordSheetEditorHandlers';
import {
  getPersonalChordSheetMutationErrorMessage,
  useRemoveChordEdit,
  useShareChordSheet,
  useUnshareChordSheet,
  useUpdateNotes,
  useUpdateViewSettings,
} from '../../application/usePersonalChordSheetMutations';
import type { ShareScope } from '../../domain/personal-chord-sheet.types';
import { PersonalChordSheetTopBar } from '../components/PersonalChordSheetTopBar';
import { PersonalChordSheetBody } from '../components/PersonalChordSheetBody';
import { ChordTokenActionSheet } from '../components/ChordTokenActionSheet';
import { ChordPickerSheet } from '../components/ChordPickerSheet';
import { AnnotationSheet } from '../components/AnnotationSheet';
import { PersonalNotesSheet } from '../components/PersonalNotesSheet';
import { PersonalChordSheetSettingsSheet } from '../components/PersonalChordSheetSettingsSheet';
import { ShareScopeSheet } from '../components/ShareScopeSheet';
import { ConflictsReviewSheet } from '../components/ConflictsReviewSheet';

type Props = RepertoireScreenProps<'PersonalChordSheetEditor'>;

export function PersonalChordSheetEditorScreen({ navigation, route }: Props) {
  const id = route.params.personalChordSheetId;
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const detail = usePersonalChordSheet(musicianId, id);
  const view = usePersonalChordSheetView(musicianId, id);
  const item = useMusicLibraryItem(detail.data?.music_library_id ?? null);
  const editor = usePersonalChordSheetEditorHandlers(musicianId, id);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState<'notes' | 'settings' | 'share' | 'conflicts' | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const updateNotes = useUpdateNotes(musicianId, id);
  const updateView = useUpdateViewSettings(musicianId, id);
  const share = useShareChordSheet(musicianId, id);
  const unshare = useUnshareChordSheet(musicianId, id);
  const removeEdit = useRemoveChordEdit(musicianId, id);
  const tabs = navigation.getParent<BottomTabNavigationProp<MusicianTabParamList>>();
  const root = tabs?.getParent<NativeStackNavigationProp<RootStackParamList>>();

  async function run(task: () => Promise<unknown>, close = true) {
    setMutationError(null);
    try {
      await task();
      if (close) setOpenSheet(null);
    } catch (error) {
      setMutationError(getPersonalChordSheetMutationErrorMessage(error));
    }
  }

  async function changeShareScope(scope: ShareScope) {
    if (scope === detail.data?.share_scope) return setOpenSheet(null);
    await run(() => scope === 'private' ? unshare.mutateAsync() : share.mutateAsync(scope));
  }

  if (detail.isPending || view.isPending) {
    return <ScreenState><ActivityIndicator size="large" color={colors.brand.primary} /></ScreenState>;
  }
  if (!detail.data || !view.data || !view.grid) {
    return (
      <ScreenState>
        <ErrorBanner message="Não conseguimos carregar esta cifra pessoal." />
        <Pressable onPress={() => { detail.refetch(); view.refetch(); }}><Text style={s.retry}>Tentar novamente</Text></Pressable>
      </ScreenState>
    );
  }

  const instrument = detail.data.view.instrument === 'keyboard' ? 'piano' : 'guitar';
  const preferFlats = detail.data.view.preferred_accidental === 'flat';
  const busy = updateNotes.isPending || updateView.isPending || share.isPending || unshare.isPending;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />
      <PersonalChordSheetTopBar
        title={item.data?.title ?? view.data.sheet.title}
        artist={item.data?.artist ?? view.data.sheet.artist}
        mode={mode}
        conflictCount={view.data.conflict_count}
        baseChanged={view.data.base_changed}
        onChangeMode={setMode}
        onBack={() => navigation.goBack()}
        onSettings={() => setOpenSheet('settings')}
        onNotes={() => setOpenSheet('notes')}
        onShare={() => setOpenSheet('share')}
        onConflicts={() => setOpenSheet('conflicts')}
      />
      {!!(mutationError || editor.error) && <ErrorBanner message={mutationError ?? editor.error!} style={s.banner} />}
      <PersonalChordSheetBody
        grid={view.grid}
        mode={mode}
        annotations={detail.data.edits}
        onPressChord={setSelectedChord}
        onPressToken={editor.selectToken}
      />

      <ChordDiagramSheet visible={!!selectedChord} chordSymbol={selectedChord} instrument={instrument} capoFret={detail.data.view.capo_fret || null} preferFlats={preferFlats} onClose={() => setSelectedChord(null)} />
      <ChordTokenActionSheet visible={editor.actionVisible} token={editor.selectedToken} onClose={editor.closeAction} onCorrectChord={() => editor.openPicker('replace')} onInsertChord={() => editor.openPicker('insert')} onRemoveChord={editor.removeChord} onAnnotate={editor.openAnnotation} />
      <ChordPickerSheet visible={!!editor.pickerMode} initialSymbol={editor.pickerMode === 'replace' ? editor.selectedToken?.chordSymbol : null} instrument={instrument} preferFlats={preferFlats} onConfirm={editor.confirmChord} onClose={editor.closePicker} />
      <AnnotationSheet visible={editor.annotationVisible} loading={editor.isSaving} onConfirm={editor.confirmAnnotation} onClose={editor.closeAnnotation} />
      <PersonalNotesSheet visible={openSheet === 'notes'} initialNotes={detail.data.notes} loading={updateNotes.isPending} onConfirm={(notes) => run(() => updateNotes.mutateAsync(notes))} onClose={() => setOpenSheet(null)} />
      <PersonalChordSheetSettingsSheet visible={openSheet === 'settings'} value={detail.data.view} loading={updateView.isPending} onSave={(patch) => run(() => updateView.mutateAsync(patch))} onClose={() => setOpenSheet(null)} />
      <ShareScopeSheet visible={openSheet === 'share'} currentScope={detail.data.share_scope} loading={busy} error={mutationError} onSelect={changeShareScope} onPressUpgrade={() => root?.navigate('Plans')} onClose={() => setOpenSheet(null)} />
      <ConflictsReviewSheet visible={openSheet === 'conflicts'} outcomes={view.data.outcomes} discardingEditId={removeEdit.variables ?? null} onDiscard={(editId) => run(() => removeEdit.mutateAsync(editId), false)} onClose={() => setOpenSheet(null)} />
    </SafeAreaView>
  );
}

function ScreenState({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={s.state} edges={['top', 'bottom']}>{children}</SafeAreaView>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.bg.primary },
  banner: { marginHorizontal: spacing.lg, marginBottom: spacing.xs },
  retry: { ...typography.body, fontFamily: 'Inter-SemiBold', color: colors.brand.primary },
});
