import { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { FormField } from '@/shared/components/FormField';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { GENRE_OPTIONS, AMENITY_OPTIONS } from '../../domain/audience.constants';
import type { EstablishmentFilter } from '../../domain/establishment.types';

type Props = {
  visible: boolean;
  onClose: () => void;
  filter:  EstablishmentFilter;
  onApply: (filter: EstablishmentFilter) => void;
};

function toggle(list: string[] = [], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Sheet de filtro (Explorar/Busca, Bloco 11.4) — sem @gorhom/bottom-sheet
// instalado ainda (recomendado só a partir do Bloco 10.5.1), então é um
// `Modal` + slide manual via Reanimated, mesma filosofia de "hand-roll direto
// em Reanimated 4" já usada no resto do app.
const useStyles = makeStyles((colors) => ({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg.overlay,
  },
  sheet: {
    position:          'absolute',
    left: 0, right: 0, bottom: 0,
    maxHeight:         '82%',
    backgroundColor:  colors.bg.elevated,
    borderTopLeftRadius:  radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.lg,
    paddingBottom:     spacing.xxl,
    borderTopWidth:     1,
    borderColor:       colors.border.strong,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:    spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  scroll: { maxHeight: 420 },
  sectionLabel: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    textTransform: 'uppercase',
    color:         colors.text.muted,
    marginTop:      spacing.lg,
    marginBottom:   spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.lg,
    marginTop:      spacing.lg,
  },
  clearText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  applyBtn: { flex: 1 },
}));

export function FilterSheet({ visible, onClose, filter, onApply }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [draft, setDraft] = useState<EstablishmentFilter>(filter);
  const translateY = useSharedValue(400);

  useEffect(() => {
    if (visible) {
      setDraft(filter);
      translateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  function handleClose() {
    translateY.value = withTiming(400, { duration: 220, easing: Easing.in(Easing.cubic) });
    setTimeout(onClose, 200);
  }

  function handleClear() {
    setDraft({});
  }

  function handleApply() {
    onApply(draft);
    handleClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={s.backdrop} onPress={handleClose} accessibilityLabel="Fechar filtros" />

      <Animated.View style={[s.sheet, sheetStyle]}>
        <View style={s.header}>
          <Text style={s.title}>Filtros</Text>
          <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fechar">
            <X size={22} color={colors.text.secondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>
          <FormField
            label="Cidade"
            value={draft.location_city ?? ''}
            onChangeText={(v) => setDraft((d) => ({ ...d, location_city: v || undefined }))}
            placeholder="Ex.: São Paulo"
          />

          <Text style={s.sectionLabel}>Gêneros</Text>
          <View style={s.chipWrap}>
            {GENRE_OPTIONS.map((genre) => (
              <MultiSelectChip
                key={genre}
                label={genre}
                selected={(draft.preferred_genres ?? []).includes(genre)}
                accentColor={colors.accent.violet}
                onPress={() => setDraft((d) => ({ ...d, preferred_genres: toggle(d.preferred_genres, genre) }))}
              />
            ))}
          </View>

          <Text style={s.sectionLabel}>Comodidades</Text>
          <View style={s.chipWrap}>
            {AMENITY_OPTIONS.map((amenity) => (
              <MultiSelectChip
                key={amenity}
                label={amenity}
                selected={(draft.amenities ?? []).includes(amenity)}
                onPress={() => setDraft((d) => ({ ...d, amenities: toggle(d.amenities, amenity) }))}
              />
            ))}
          </View>

          <Text style={s.sectionLabel}>Outros</Text>
          <View style={s.chipWrap}>
            <MultiSelectChip
              label="Somente verificados"
              selected={!!draft.is_verified}
              accentColor={colors.status.success}
              onPress={() => setDraft((d) => ({ ...d, is_verified: !d.is_verified || undefined }))}
            />
          </View>
        </ScrollView>

        <View style={s.footer}>
          <Pressable onPress={handleClear} accessibilityRole="button" accessibilityLabel="Limpar filtros">
            <Text style={s.clearText}>Limpar</Text>
          </Pressable>
          <PrimaryButton label="Aplicar filtros" onPress={handleApply} style={s.applyBtn} />
        </View>
      </Animated.View>
    </Modal>
  );
}
