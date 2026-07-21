import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import { colors, spacing, radius } from '@/shared/design-system/tokens';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusician } from '../../application/useMusician';
import {
  MUSICIAN_PLANS,
  suggestedUpgrade,
  type BillingCycle,
  type MusicianPlanTier,
} from '../../domain/plans.config';
import { PaywallHero } from '../components/paywall/PaywallHero';
import { BillingCycleToggle } from '../components/paywall/BillingCycleToggle';
import { PlanTierCard } from '../components/paywall/PlanTierCard';
import { PaywallFooter } from '../components/paywall/PaywallFooter';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'Plans'>;

// Contexto premium → violeta dominante (design-system.md, "Onboarding/Premium")
// com teal de apoio — o inverso do default teal+violeta das outras telas.
const PAYWALL_GLOWS = [
  { color: 'rgba(124,58,237,0.20)', size: 340, top: -120, right: -90, duration: 8000 },
  { color: colors.brand.glow,        size: 300, bottom: -80, left: -110, duration: 9500 },
];

// Paywall de planos do músico (jul/2026) — valores espelhados do backend em
// domain/plans.config.ts. O checkout de assinatura ainda não existe no
// backend (plans-module sem controller; recorrência Asaas é o Bloco 4D.8),
// então o CTA informa que a cobrança está em finalização.
export function PlansPaywallScreen({ navigation }: Props) {
  const musicianId  = useAuthStore((s) => s.user?.musicianId ?? null);
  const musician    = useMusician(musicianId);
  const currentTier = (musician.data?.plan_tier ?? 'free') as MusicianPlanTier;

  const [cycle, setCycle]       = useState<BillingCycle>('annual');
  const [selected, setSelected] = useState<MusicianPlanTier>(() => suggestedUpgrade(null));

  // Pré-seleciona o upgrade natural quando o perfil resolve (cache do Home
  // costuma responder na hora) — sem atropelar uma escolha manual do usuário.
  const userPicked = useRef(false);
  useEffect(() => {
    if (!userPicked.current && musician.data) {
      setSelected(suggestedUpgrade((musician.data.plan_tier ?? 'free') as MusicianPlanTier));
    }
  }, [musician.data]);

  const selectedPlan = MUSICIAN_PLANS.find((p) => p.tier === selected) ?? MUSICIAN_PLANS[1];

  const handleSubscribe = () => {
    Alert.alert(
      'Quase lá!',
      `A assinatura do plano ${selectedPlan.name} está em fase final de integração com o pagamento. Você será avisado assim que estiver disponível.`,
      [{ text: 'Entendi' }],
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <AmbientGlowBackground glows={PAYWALL_GLOWS} />

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

        <BillingCycleToggle cycle={cycle} onChange={setCycle} />

        {MUSICIAN_PLANS.map((plan, index) => (
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
        onPress={handleSubscribe}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
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
});
