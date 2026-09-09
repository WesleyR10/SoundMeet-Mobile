import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CalendarClock, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useAvailability, useAddUnavailability, useRemoveUnavailability } from '../../application/useAvailability';
import { useMonthBusy } from '../../application/useMonthBusy';
import { AgendaMonthGrid, type DayMarkers } from '../components/AgendaMonthGrid';
import { UnavailabilityList } from '../components/UnavailabilityList';
import { AddUnavailabilityModal } from '../components/AddUnavailabilityModal';
import { BlockSelectionBar } from '../components/BlockSelectionBar';
import { BlockPeriodModal } from '../components/BlockPeriodModal';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'Agenda'>;

const MONTH_LABELS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Agenda do músico (item 9, jul/2026) — calendário mensal com shows marcados
// (bookings confirmados, teal) e bloqueios/férias (coral). Toque num dia abre
// a barra contextual (bloquear 1 dia ou estender pra período); long-press é
// atalho direto pro bloqueio de 1 dia; o + da seção de bloqueios cobre datas
// distantes por digitação. Regras semanais na AvailabilityEditor.
const useStyles = makeStyles((colors) => ({
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
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.lg,
  },
  monthNav: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width:           48,
    height:          48,
    alignItems:      'center',
    justifyContent:  'center',
  },
  monthLabel: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.text.primary,
  },
  legend: {
    flexDirection: 'row',
    gap:            spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  legendDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  weeklyBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              spacing.md,
    padding:          spacing.lg,
    borderRadius:     radius.lg,
    borderWidth:       1,
    borderColor:      colors.border.brand,
    backgroundColor:  colors.brand.muted,
  },
  weeklyText: {
    flex: 1,
  },
  weeklyTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  weeklySubtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  blocksSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  addBlockBtn: {
    width:           40,
    height:          40,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:     radius.md,
    borderWidth:       1,
    borderColor:      colors.border.brand,
    backgroundColor:  colors.brand.muted,
  },
  sectionTitle: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    textTransform: 'uppercase',
    color:          colors.text.secondary,
  },
}));

export function AgendaScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd]     = useState<number | null>(null);
  const [awaitingEnd, setAwaitingEnd]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);

  const availabilityQuery = useAvailability(musicianId);
  const busyQuery         = useMonthBusy(musicianId, year, month);
  const addBlock          = useAddUnavailability(musicianId ?? '');
  const removeBlock       = useRemoveUnavailability(musicianId ?? '');

  const markers = useMemo(() => {
    const map = new Map<number, DayMarkers>();
    for (const interval of busyQuery.data?.busy ?? []) {
      const start = new Date(interval.start_at);
      const end   = new Date(interval.end_at);
      // percorre os dias locais cobertos pelo intervalo dentro do mês visível
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      while (cursor.getTime() < end.getTime()) {
        if (cursor.getFullYear() === year && cursor.getMonth() === month - 1) {
          const day = cursor.getDate();
          const current = map.get(day) ?? { hasBooking: false, hasBlock: false };
          map.set(day, {
            hasBooking: current.hasBooking || interval.kind === 'booking',
            hasBlock:   current.hasBlock || interval.kind === 'unavailability',
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [busyQuery.data, year, month]);

  const changeMonth = (delta: number) => {
    const base = new Date(year, month - 1 + delta, 1);
    setYear(base.getFullYear());
    setMonth(base.getMonth() + 1);
    setSelStart(null);
    setSelEnd(null);
    setAwaitingEnd(false);
  };

  const handlePressDay = (day: number) => {
    if (selStart === null) {
      setSelStart(day);
    } else if (selEnd === null && day !== selStart) {
      setSelEnd(day);
      setAwaitingEnd(false);
      setModalVisible(true);
    } else {
      setSelStart(day === selStart ? null : day);
      setSelEnd(null);
      setAwaitingEnd(false);
    }
  };

  // Atalho de usuário experiente: segurar num dia pula a barra contextual e
  // abre direto a confirmação de bloqueio daquele dia.
  const handleLongPressDay = (day: number) => {
    setSelStart(day);
    setSelEnd(null);
    setAwaitingEnd(false);
    setModalVisible(true);
  };

  const dayLabel = (day: number | null) =>
    day === null ? '' : `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;

  const shortDayLabel = (day: number) =>
    `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

  const handleConfirmBlock = async (reason: string | null) => {
    if (!musicianId || selStart === null) return;
    const first = Math.min(selStart, selEnd ?? selStart);
    const last  = Math.max(selStart, selEnd ?? selStart);
    try {
      await addBlock.mutateAsync({
        start_at: new Date(year, month - 1, first, 0, 0, 0).toISOString(),
        end_at:   new Date(year, month - 1, last, 23, 59, 59).toISOString(),
        reason,
      });
    } finally {
      setModalVisible(false);
      setSelStart(null);
      setSelEnd(null);
    }
  };

  const handleConfirmPeriod = async (payload: { start: Date; end: Date; reason: string | null }) => {
    if (!musicianId) return;
    const end = new Date(payload.end);
    end.setHours(23, 59, 59, 0);
    try {
      await addBlock.mutateAsync({
        start_at: payload.start.toISOString(),
        end_at:   end.toISOString(),
        reason:   payload.reason,
      });
    } finally {
      setPeriodModalVisible(false);
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
        <Text style={s.title}>Agenda</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.monthNav}>
          <Pressable onPress={() => changeMonth(-1)} style={s.navBtn} accessibilityRole="button" accessibilityLabel="Mês anterior" hitSlop={8}>
            <ChevronLeft size={20} color={colors.text.secondary} />
          </Pressable>
          <Text style={s.monthLabel}>{MONTH_LABELS[month - 1]} {year}</Text>
          <Pressable onPress={() => changeMonth(1)} style={s.navBtn} accessibilityRole="button" accessibilityLabel="Próximo mês" hitSlop={8}>
            <ChevronRight size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        <AgendaMonthGrid
          year={year}
          month={month}
          markers={markers}
          selectionStart={selStart}
          selectionEnd={selEnd}
          onPressDay={handlePressDay}
          onLongPressDay={handleLongPressDay}
        />

        {selStart !== null && selEnd === null && !modalVisible && (
          <BlockSelectionBar
            dayLabel={shortDayLabel(selStart)}
            awaitingEnd={awaitingEnd}
            onBlockSingle={() => setModalVisible(true)}
            onSelectUntil={() => setAwaitingEnd(true)}
          />
        )}

        <View style={s.legend}>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: colors.brand.primary }]} /><Text style={s.legendText}>Show marcado</Text></View>
          <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: colors.accent.coral }]} /><Text style={s.legendText}>Bloqueado</Text></View>
        </View>

        <Pressable
          onPress={() => navigation.navigate('AvailabilityEditor')}
          style={s.weeklyBtn}
          accessibilityRole="button"
          accessibilityLabel="Editar disponibilidade semanal"
        >
          <CalendarClock size={18} color={colors.brand.primary} />
          <View style={s.weeklyText}>
            <Text style={s.weeklyTitle}>Disponibilidade semanal</Text>
            <Text style={s.weeklySubtitle}>
              {availabilityQuery.data?.weekly_rules.length
                ? `${availabilityQuery.data.weekly_rules.length} janela(s) definida(s)`
                : 'Defina os dias e horários em que você quer tocar'}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.text.muted} />
        </Pressable>

        <View style={s.blocksSection}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Férias e bloqueios</Text>
            <Pressable
              onPress={() => setPeriodModalVisible(true)}
              style={s.addBlockBtn}
              accessibilityRole="button"
              accessibilityLabel="Adicionar bloqueio por datas"
              hitSlop={8}
            >
              <Plus size={18} color={colors.brand.primary} />
            </Pressable>
          </View>
          <UnavailabilityList
            unavailabilities={availabilityQuery.data?.unavailabilities ?? []}
            onRemove={(blockId) => removeBlock.mutate(blockId)}
            isRemoving={removeBlock.isPending}
          />
        </View>
      </ScrollView>

      <AddUnavailabilityModal
        visible={modalVisible}
        startLabel={dayLabel(selStart === null ? null : Math.min(selStart, selEnd ?? selStart))}
        endLabel={dayLabel(selStart === null ? null : Math.max(selStart, selEnd ?? selStart))}
        isSaving={addBlock.isPending}
        onConfirm={handleConfirmBlock}
        onCancel={() => { setModalVisible(false); setSelEnd(null); }}
      />

      <BlockPeriodModal
        visible={periodModalVisible}
        isSaving={addBlock.isPending}
        onConfirm={handleConfirmPeriod}
        onCancel={() => setPeriodModalVisible(false)}
      />
    </SafeAreaView>
  );
}
