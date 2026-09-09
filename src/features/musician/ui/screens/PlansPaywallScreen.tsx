import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import { spacing, radius } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { ThemeColors } from '@/shared/services/ThemeContext';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusician } from '../../application/useMusician';
import {
  MUSICIAN_PLANS,
  hydratePlanPricing,
  suggestedUpgrade,
  type BillingCycle,
  type MusicianPlanTier,
} from '../../domain/plans.config';
import { usePlansCatalog } from '../../application/useSubscription';
import { PaywallHero } from '../components/paywall/PaywallHero';
import { BillingCycleToggle } from '../components/paywall/BillingCycleToggle';
import { PlanTierCard } from '../components/paywall/PlanTierCard';
import { PaywallFooter } from '../components/paywall/PaywallFooter';
import { CheckoutSheet } from '../components/paywall/CheckoutSheet';
import { ActiveSubscriptionCard } from '../components/paywall/ActiveSubscriptionCard';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'Plans'>;

// Contexto premium → violeta dominante (design-system.md, "Onboarding/Premium")
// com teal de apoio — o inverso do default teal+violeta das outras telas.
/*
 * Função do tema, não constante de módulo: array avaliado no carregamento
 * congelaria o glow do tema escuro sobre um fundo claro.
 */
const paywallGlows = (colors: ThemeColors) => [
  { color: `${colors.accent.violet}33`, size: 340, top: -120, right: -90, duration: 8000 },
  { color: colors.brand.glow,        size: 300, bottom: -80, left: -110, duration: 9500 },
];

// Paywall de planos do músico.
//
// O CTA avisava "em fase final de integração com o pagamento" porque o
// `plans-module` não tinha controller HTTP quando esta tela nasceu. Ele tem —
// 7 rotas, `AsaasSubscriptionGateway` real — e a auditoria de 06/ago/2026
// mostrou que o roadmap dizia o contrário do código. Hoje o CTA abre o checkout
// de verdade (item 11.14).
//
// Preços: `plans.config.ts` pinta a primeira tela e serve de fallback offline;
// `GET /plans` sobrescreve os VALORES quando responde (`hydratePlanPricing`).
// A copy (tagline, keyStats, features) segue local — o backend não a devolve.
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  closeBtn: {
    alignSelf:        'flex-end',
    marginTop:         spacing.md,
    marginRight:       spacing.xl,
    width:             40,
    height:            40,
    borderRadius:      radius.full,
    alignItems:       'center',
    justifyContent:   'center',
    backgroundColor:  'rgba(255,255,255,0.05)',
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xl,
    gap:                spacing.lg,
  },
}));

export function PlansPaywallScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId  = useAuthStore((s) => s.user?.musicianId ?? null);
  const musician    = useMusician(musicianId);
  const catalog     = usePlansCatalog();
  const currentTier = (musician.data?.plan_tier ?? 'free') as MusicianPlanTier;

  const plans = useMemo(
    () => hydratePlanPricing(MUSICIAN_PLANS, catalog.data?.musician),
    [catalog.data],
  );

  const [cycle, setCycle]       = useState<BillingCycle>('annual');
  const [selected, setSelected] = useState<MusicianPlanTier>(() => suggestedUpgrade(null));
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Pré-seleciona o upgrade natural quando o perfil resolve (cache do Home
  // costuma responder na hora) — sem atropelar uma escolha manual do usuário.
  const userPicked = useRef(false);
  useEffect(() => {
    if (!userPicked.current && musician.data) {
      setSelected(suggestedUpgrade((musician.data.plan_tier ?? 'free') as MusicianPlanTier));
    }
  }, [musician.data]);

  const selectedPlan = plans.find((p) => p.tier === selected) ?? plans[1];

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <AmbientGlowBackground glows={paywallGlows(colors)} />

      <Pressable
        onPress={() => navigation.goBack()}
        style={s.closeBtn}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        hitSlop={8}
      >
        <X size={20} color={colors.text.secondary} />
      </Pressable>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <PaywallHero />

        <ActiveSubscriptionCard musicianId={musicianId} />

        <BillingCycleToggle cycle={cycle} onChange={setCycle} />

        {plans.map((plan, index) => (
          <PlanTierCard
            key={plan.tier}
            plan={plan}
            cycle={cycle}
            index={index}
            selected={selected === plan.tier}
            isCurrent={currentTier === plan.tier}
            onSelect={() => { userPicked.current = true; setSelected(plan.tier); }}
          />
        ))}
      </ScrollView>

      <PaywallFooter
        plan={selectedPlan}
        cycle={cycle}
        isCurrent={currentTier === selectedPlan.tier}
        onPress={() => setCheckoutOpen(true)}
      />

      <CheckoutSheet
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        musicianId={musicianId}
        plan={selectedPlan}
        cycle={cycle}
        defaultName={musician.data?.name ?? ''}
        defaultEmail={musician.data?.email ?? ''}
        /*
          🔴 Só o CNPJ do MEI pode ser pré-preenchido. O CPF **não existe** no
          `MusicianPresenter` — nem para o dono —, então tentar prefixá-lo
          renderia um campo vazio de qualquer jeito.
        */
        defaultDocument={musician.data?.cnpj ?? null}
      />
    </SafeAreaView>
  );
}
