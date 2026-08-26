import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Heart } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { QRFrame } from '@/shared/components/QRFrame';
import { extractApiMessage } from '@/shared/services/http/types';
import type { FanStackScreenProps } from '@/navigation/types';
import { useSendTip } from '../../application/useSendTip';
import { TipAmountSelector } from '../components/TipAmountSelector';

type Props = FanStackScreenProps<'TipMusician'>;

// Gorjeta PIX (Bloco 11.10) — POST /tips direto (payment-module), não o
// wrapper /audiences/:id/tips. Gateway: Mercado Pago (`MercadoPagoPixGateway`).
// Sem conta do músico vinculada a API recusa; com vínculo devolve QR real.
export function TipMusicianScreen({ route, navigation }: Props) {
  const { musicianId, eventId } = route.params;

  const [amount, setAmount]   = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const tipMutation = useSendTip();

  function handleSubmit() {
    if (!amount) return;
    tipMutation.mutate({
      musician_id: musicianId,
      amount,
      message: message.trim() || undefined,
      payment_method: 'pix',
      event_id: eventId,
    });
  }

  if (tipMutation.isSuccess) {
    const result = tipMutation.data;
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={s.successScroll} showsVerticalScrollIndicator={false}>
          <Heart size={48} color={colors.accent.coral} fill={colors.accent.coral} />
          <Text style={s.successTitle}>Quase lá!</Text>
          <Text style={s.successSubtitle}>Escaneie o QR ou copie o código pra concluir o PIX de R$ {amount?.toFixed(2)}.</Text>

          {!!result.qr_code && (
            <View style={s.qrWrap}>
              <QRFrame value={result.qr_code} size={220} />
            </View>
          )}

          {!!result.copy_paste_code && (
            <View style={s.copyBox}>
              <Text style={s.copyLabel}>Código copia e cola</Text>
              <Text selectable style={s.copyText}>{result.copy_paste_code}</Text>
              <Text style={s.copyHint}>Toque e segure pra copiar</Text>
            </View>
          )}

          <View style={s.mockNotice}>
            <Text style={s.mockNoticeText}>
              Ambiente de testes — o gateway PIX real ainda não está ativo (ver roadmap do backend).
            </Text>
          </View>

          <PrimaryButton label="Voltar ao perfil" onPress={() => navigation.goBack()} style={s.successBtn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Enviar gorjeta</Text>
        <Text style={s.subtitle}>Mostre seu apoio direto pro músico via PIX.</Text>

        <TipAmountSelector value={amount} onChange={setAmount} />

        <FormField
          label="Mensagem (opcional)"
          value={message}
          onChangeText={setMessage}
          placeholder="Deixe um recado pro músico..."
          autoCapitalize="sentences"
          multiline
        />

        {tipMutation.isError && <ErrorBanner message={extractApiMessage(tipMutation.error)} />}

        <PrimaryButton
          label={amount ? `Enviar R$ ${amount.toFixed(2)}` : 'Escolha um valor'}
          variant="coral"
          onPress={handleSubmit}
          disabled={!amount || tipMutation.isPending}
          loading={tipMutation.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  successScroll: {
    alignItems:        'center',
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xxl,
    paddingBottom:     spacing.xxxl,
    gap:                spacing.md,
  },
  successTitle: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  successSubtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  qrWrap: { marginTop: spacing.md },
  successBtn: {
    marginTop: spacing.md,
    width:     '100%',
  },
  copyBox: {
    width:              '100%',
    borderRadius:       radius.lg,
    borderWidth:          1,
    borderColor:        colors.border.default,
    backgroundColor:   'rgba(255,255,255,0.03)',
    padding:              spacing.md,
    gap:                  spacing.xs,
  },
  copyLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  copyText: {
    ...typography.mono,
    color: colors.text.primary,
  },
  copyHint: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  mockNotice: {
    borderRadius:      radius.md,
    backgroundColor:  `${colors.accent.amber}14`,
    padding:            spacing.md,
  },
  mockNoticeText: {
    ...typography.bodySm,
    color:     colors.accent.amber,
    textAlign: 'center',
  },
});
