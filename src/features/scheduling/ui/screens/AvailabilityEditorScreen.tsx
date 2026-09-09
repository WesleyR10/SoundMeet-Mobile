import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { SkeletonList } from '@/shared/components/Skeleton';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useAvailability, useSetWeeklyRules } from '../../application/useAvailability';
import { WeeklyRuleRow, isValidTime, type WeekdayDraft } from '../components/WeeklyRuleRow';
import { WEEKDAY_LABELS, type WeeklyRuleInput } from '../../domain/availability.types';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'AvailabilityEditor'>;

const EMPTY_DRAFTS: WeekdayDraft[] = WEEKDAY_LABELS.map(() => ({
  enabled: false, start_time: '', end_time: '',
}));

// Disponibilidade semanal (item 9, jul/2026): "sextas após as 18, sábados e
// domingos o dia todo" — toggle por dia + janela de horário. PUT rules
// substitui o conjunto inteiro no backend (uma janela por dia na v1).
const useStyles = makeStyles((colors) => ({
  // Mesmo respiro do conteúdo real — é o que evita o salto na troca.
  skeleton: { flex: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal:  spacing.md,
    paddingVertical:    spacing.sm,
  },
  backBtn: {
    width:           48,
    height:          48,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  loader: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.md,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
}));

export function AvailabilityEditorScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);

  const availabilityQuery = useAvailability(musicianId);
  const setRules          = useSetWeeklyRules(musicianId ?? '');

  const [drafts, setDrafts] = useState<WeekdayDraft[]>(EMPTY_DRAFTS);
  const [errors, setErrors] = useState<(string | undefined)[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hidrata os drafts UMA vez a partir do servidor (depois o estado é local
  // até salvar) — regra mais cedo do dia vence se houver múltiplas janelas.
  useEffect(() => {
    if (hydrated || !availabilityQuery.data) return;
    const next = EMPTY_DRAFTS.map((draft) => ({ ...draft }));
    for (const rule of availabilityQuery.data.weekly_rules) {
      if (rule.weekday < 0 || rule.weekday > 6 || !rule.is_available) continue;
      const current = next[rule.weekday];
      if (!current.enabled || rule.start_time < current.start_time) {
        next[rule.weekday] = { enabled: true, start_time: rule.start_time, end_time: rule.end_time };
      }
    }
    setDrafts(next);
    setHydrated(true);
  }, [availabilityQuery.data, hydrated]);

  const handleSave = async () => {
    setSaveError(null);
    const nextErrors: (string | undefined)[] = [];
    const rules: WeeklyRuleInput[] = [];

    drafts.forEach((draft, weekday) => {
      if (!draft.enabled) return;
      if (!isValidTime(draft.start_time) || !isValidTime(draft.end_time)) {
        nextErrors[weekday] = 'Horário inválido — use HH:MM (ex.: 18:00)';
        return;
      }
      if (draft.end_time <= draft.start_time) {
        nextErrors[weekday] = 'O fim deve ser depois do início';
        return;
      }
      rules.push({ weekday, start_time: draft.start_time, end_time: draft.end_time, is_available: true });
    });

    setErrors(nextErrors);
    if (nextErrors.some(Boolean)) return;

    try {
      await setRules.mutateAsync(rules);
      navigation.goBack();
    } catch {
      setSaveError('Não foi possível salvar sua disponibilidade. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title}>Disponibilidade</Text>
        <View style={s.backBtn} />
      </View>

      {availabilityQuery.isPending ? (
        <View style={s.skeleton}>
          {/* Sete linhas: a grade da semana. */}
          <SkeletonList count={7} itemHeight={64} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.subtitle}>
            Dias e horários em que você quer fazer shows — estabelecimentos só
            conseguem propor reservas dentro dessas janelas.
          </Text>

          {WEEKDAY_LABELS.map((label, weekday) => (
            <WeeklyRuleRow
              key={label}
              label={label}
              draft={drafts[weekday]}
              error={errors[weekday]}
              onChange={(draft) => {
                setDrafts((prev) => prev.map((d, i) => (i === weekday ? draft : d)));
              }}
            />
          ))}

          {!!saveError && <ErrorBanner message={saveError} />}

          <PrimaryButton
            label={setRules.isPending ? 'Salvando…' : 'Salvar disponibilidade'}
            onPress={handleSave}
            disabled={setRules.isPending}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
