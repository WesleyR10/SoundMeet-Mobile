import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Coins, Music2, Send, Users } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { SkeletonList, SkeletonStatRow, SkeletonText } from '@/shared/components/Skeleton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import type { RootScreenProps } from '@/navigation/types';
import { usePerformanceReport } from '../../application/usePerformance';
import { ReportStatCard } from '../components/ReportStatCard';
import { ReportSongList } from '../components/ReportSongList';
import { ShowRecapSection } from '../components/ShowRecapSection';

type Props = RootScreenProps<'PerformanceReport'>;

/**
 * Relatório pós-show (F6) — "18 músicas, 6 pedidos aceitos, R$ 210 em gorjetas".
 *
 * Aberto automaticamente ao encerrar o set. É a recompensa imediata de ter
 * mantido o app ligado durante o show: sem esta tela, abrir e fechar o set
 * seria trabalho sem retorno visível, e o músico pararia de fazer — levando
 * junto o currículo (F4), o setlist inteligente (F5) e o "tocando agora" do fã.
 */
const useStyles = makeStyles((colors) => ({
  // Mesmo respiro do conteúdo real — é o que evita o salto na troca.
  skeleton: { flex: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  center: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: spacing.xl,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:               spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color:        colors.text.secondary,
    marginTop:    -spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           spacing.md,
  },
  backBtn: {
    marginTop: spacing.md,
  },
}));

export function PerformanceReportScreen({ route, navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { performanceId } = route.params;
  const { data: report, isPending, isError } = usePerformanceReport(performanceId);

  if (isPending) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.skeleton}>
          <SkeletonStatRow count={3} />
          <SkeletonText lines={2} />
          {/* Músicas tocadas na ordem em que subiram ao palco. */}
          <SkeletonList count={4} itemHeight={68} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !report) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.center}>
          <ErrorBanner message="Não conseguimos carregar o relatório deste show." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Show encerrado</Text>
        <Text style={s.subtitle}>{formatShowWindow(report.started_at, report.ended_at)}</Text>

        <View style={s.grid}>
          <ReportStatCard
            icon={Music2}
            value={String(report.songs_count)}
            label={report.songs_count === 1 ? 'música tocada' : 'músicas tocadas'}
            hint={
              report.unique_songs_count !== report.songs_count
                ? `${report.unique_songs_count} diferentes`
                : undefined
            }
            accentColor={colors.brand.primary}
          />
          <ReportStatCard
            icon={Send}
            value={String(report.requests_played)}
            label="pedidos atendidos"
            hint={`${report.requests_received} recebidos`}
            accentColor={colors.accent.violet}
          />
          <ReportStatCard
            icon={Coins}
            value={formatBRL(report.tips_total)}
            label="em gorjetas"
            hint={`${report.tips_count} ${report.tips_count === 1 ? 'envio' : 'envios'}`}
            accentColor={colors.accent.coral}
          />
          <ReportStatCard
            icon={Users}
            value={String(report.attendees_count)}
            label="pessoas presentes"
            accentColor={colors.accent.amber}
          />
        </View>

        <ReportSongList
          songs={report.songs}
          attributionNote={report.tips_attribution_note}
        />

        {/* Set aberto e fechado sem nenhuma música é um show que não
            aconteceu — oferecer "compartilhe" ali é oferecer ao músico um
            jeito de se expor à toa. */}
        {report.songs_count > 0 && <ShowRecapSection report={report} />}

        <PrimaryButton
          label="Voltar"
          onPress={() => navigation.goBack()}
          style={s.backBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatShowWindow(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const date = start.toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'long',
  });
  const time = (d: Date) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return `${date} · ${time(start)} às ${time(end)}`;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  });
}
