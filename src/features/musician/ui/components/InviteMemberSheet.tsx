import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Search } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useMusicianSearch } from '../../application/useMusicianSearch';
import { useInviteBandMember, getInviteBandMemberErrorMessage } from '../../application/useInviteBandMember';
import { INSTRUMENT_OPTIONS } from '../../domain/musician.constants';
import type { MusicianSearchResult } from '../../domain/musician-search.types';

type Props = {
  visible:           boolean;
  onClose:            () => void;
  bandId:             string;
  musicianId:         string | null;
  // Some da busca quem já é membro/convite pending/accepted dessa banda —
  // um musician_id "declined" some daqui de propósito (reativar convite é
  // um botão dedicado na própria linha do membro, ver BandMemberRow).
  existingMemberIds:  string[];
};

// Bottom sheet de convite de banda, mesmo molde de RoleSwitchSheet.tsx —
// busca reaproveitando useMusicianSearch/musician-search.api.ts (já usado
// por EditRepertoireInviteSection para outro fluxo de convite), + escolha de
// instrumento e papel de governança (líder/membro) antes de enviar.
export function InviteMemberSheet({ visible, onClose, bandId, musicianId, existingMemberIds }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MusicianSearchResult | null>(null);
  const [instrumentId, setInstrumentId] = useState<string | null>(null);
  const [role, setRole] = useState<'member' | 'leader'>('member');

  const { data: results, isPending: isSearching } = useMusicianSearch(query);
  const invite = useInviteBandMember(bandId, musicianId);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const reset = () => {
    setQuery('');
    setSelected(null);
    setInstrumentId(null);
    setRole('member');
  };

  const handleDismiss = () => {
    reset();
    onClose();
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const filteredResults = (results ?? []).filter((m) => !existingMemberIds.includes(m.id));

  const handleSubmit = async () => {
    if (!selected || !instrumentId) return;
    const instrumentLabel = INSTRUMENT_OPTIONS.find((o) => o.id === instrumentId)?.label ?? instrumentId;
    try {
      await invite.mutateAsync({ musician_id: selected.id, role, instrument: instrumentLabel });
      handleDismiss();
    } catch {
      // Erro já fica visível via invite.error (ErrorBanner abaixo) — sheet
      // continua aberto pra tentar de novo.
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      enableDynamicSizing
    >
      <BottomSheetView style={s.content}>
        <Text style={s.title}>Convidar membro</Text>

        {!selected ? (
          <>
            <View style={s.searchWrap}>
              <Search size={16} color={colors.text.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Nome artístico"
                placeholderTextColor={colors.text.muted}
                style={s.searchInput}
                cursorColor={colors.brand.primary}
                autoCapitalize="none"
                accessibilityLabel="Buscar músico pra convidar"
              />
              {isSearching && <ActivityIndicator size="small" color={colors.brand.primary} />}
            </View>

            {query.trim().length >= 2 && (
              <View style={s.resultsWrap}>
                {filteredResults.length === 0 && !isSearching ? (
                  <Text style={s.emptyText}>Nenhum músico encontrado.</Text>
                ) : (
                  filteredResults.map((musician) => (
                    <Pressable
                      key={musician.id}
                      onPress={() => setSelected(musician)}
                      style={s.resultRow}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar ${musician.display_name}`}
                    >
                      <Text style={s.resultName} numberOfLines={1}>{musician.display_name}</Text>
                      {musician.instruments.length > 0 && (
                        <Text style={s.resultMeta} numberOfLines={1}>{musician.instruments.join(', ')}</Text>
                      )}
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={s.selectedRow}>
              <Text style={s.selectedName} numberOfLines={1}>{selected.display_name}</Text>
              <Pressable onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="Trocar músico" hitSlop={8}>
                <Text style={s.changeLabel}>Trocar</Text>
              </Pressable>
            </View>

            <Text style={s.fieldLabel}>Instrumento nessa banda</Text>
            <View style={s.chipsRow}>
              {INSTRUMENT_OPTIONS.map((option) => {
                const active = instrumentId === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setInstrumentId(option.id)}
                    style={[s.chip, active && s.chipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[s.chipLabel, active && s.chipLabelActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.fieldLabel}>Papel na banda</Text>
            <View style={s.segmentRow}>
              <Pressable
                onPress={() => setRole('member')}
                style={[s.segment, role === 'member' && s.segmentActive]}
                accessibilityRole="button"
                accessibilityLabel="Membro"
                accessibilityState={{ selected: role === 'member' }}
              >
                <Text style={[s.segmentLabel, role === 'member' && s.segmentLabelActive]}>Membro</Text>
              </Pressable>
              <Pressable
                onPress={() => setRole('leader')}
                style={[s.segment, role === 'leader' && s.segmentActive]}
                accessibilityRole="button"
                accessibilityLabel="Líder"
                accessibilityState={{ selected: role === 'leader' }}
              >
                <Text style={[s.segmentLabel, role === 'leader' && s.segmentLabelActive]}>Líder</Text>
              </Pressable>
            </View>

            {!!invite.error && <ErrorBanner message={getInviteBandMemberErrorMessage(invite.error)} />}

            <PrimaryButton
              label="Enviar convite"
              onPress={handleSubmit}
              loading={invite.isPending}
              disabled={!instrumentId}
              style={s.submitBtn}
            />
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const s = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.bg.elevated,
    borderRadius:     radius.xl,
  },
  handle: {
    backgroundColor: colors.border.strong,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom:      spacing.xxl,
    gap:                 spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  searchWrap: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.sm,
    height:              44,
    borderRadius:        radius.md,
    borderWidth:          1,
    borderColor:         colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.04)',
    paddingHorizontal:   spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySm,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  resultsWrap: {
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  resultRow: {
    borderRadius:      radius.md,
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor:  'rgba(255,255,255,0.03)',
  },
  resultName: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  resultMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  selectedRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderRadius:      radius.md,
    borderWidth:        1,
    borderColor:       colors.border.brand,
    backgroundColor:   colors.brand.muted,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
  },
  selectedName: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    flex:        1,
  },
  changeLabel: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  fieldLabel: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    textTransform: 'uppercase',
    color:          colors.text.secondary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderRadius:      radius.full,
    borderWidth:        1,
    borderColor:       colors.border.default,
  },
  chipActive: {
    borderColor:      colors.brand.primary,
    backgroundColor: colors.brand.muted,
  },
  chipLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  chipLabelActive: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius:  radius.lg,
    borderWidth:    1,
    borderColor:   colors.border.default,
    overflow:      'hidden',
  },
  segment: {
    flex:           1,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.brand.muted,
  },
  segmentLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  segmentLabelActive: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
