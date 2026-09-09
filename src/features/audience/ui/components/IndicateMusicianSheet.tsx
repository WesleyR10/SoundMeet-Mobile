import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator, FlatList } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useQuery } from '@tanstack/react-query';
import { Check, Store } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { extractApiMessage } from '@/shared/services/http/types';
import { listEstablishments } from '../../infrastructure/establishment.api';
import { indicateMusician } from '../../infrastructure/indication.api';

const MESSAGE_MAX_LENGTH = 1000;

type Props = {
  musicianId:   string;
  musicianName: string;
  visible:      boolean;
  onClose:      () => void;
};

/**
 * "Indicar este artista para um local".
 *
 * ════════════════════════════════════════════════════════════════════════════
 * POR QUE ESTA TELA IMPORTA
 * ════════════════════════════════════════════════════════════════════════════
 *
 * É a única aquisição B2B que o SoundMeet consegue fazer e nenhum concorrente
 * consegue: o público apontando artista para a casa. O backend tinha o
 * use-case desde sempre, mas a indicação era DESCARTADA — nada era gravado, e
 * o lado do estabelecimento não existia. Agora o ciclo fecha.
 *
 * ⚠️ **Indicar duas vezes o mesmo par não é erro.** O backend é idempotente
 * por (fã, músico, estabelecimento); a UI reflete isso confirmando normalmente
 * em vez de inventar uma mensagem de "já indicado" que sugeriria falha.
 */
const useStyles = makeStyles((colors) => ({
  sheetBg: { backgroundColor: colors.bg.elevated, borderRadius: radius.xl },
  handle:  { backgroundColor: colors.border.strong },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
    paddingTop:        spacing.sm,
    gap:               spacing.md,
    maxHeight:         560,
  },
  title: { ...typography.title, color: colors.text.primary },
  helper: { ...typography.bodySm, color: colors.text.secondary },
  sectionLabel: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  list: { maxHeight: 220 },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border.default,
    marginBottom:    spacing.sm,
  },
  rowOn: {
    borderColor:     colors.brand.primary,
    backgroundColor: colors.brand.muted,
  },
  rowName: { ...typography.body, color: colors.text.primary, flex: 1 },
  input: {
    minHeight:         80,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.border.default,
    padding:           spacing.md,
    ...typography.body,
    color:             colors.text.primary,
    textAlignVertical: 'top',
  },
  cancel: {
    ...typography.bodySm,
    color:              colors.text.muted,
    textDecorationLine: 'underline',
    textAlign:          'center',
  },
  empty: { ...typography.bodySm, color: colors.text.muted, textAlign: 'center' },
}));

export function IndicateMusicianSheet({ musicianId, musicianName, visible, onClose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const audienceId = useAuthStore((state) => state.user?.audienceId ?? null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const establishments = useQuery({
    queryKey: ['establishments', 'for-indication'],
    queryFn:  () => listEstablishments({ per_page: 30 }),
    enabled:  visible,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  // Ajuste durante o render (padrão do React para "prop mudou"), não
  // useEffect: um efeito renderizaria uma vez com o estado do artista
  // anterior, e a regra react-hooks/set-state-in-effect reprova.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setSelectedId(null);
      setMessage('');
      setError(null);
      setDone(false);
    }
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  async function handleSubmit() {
    if (!audienceId || !selectedId) return;
    setSending(true);
    setError(null);
    try {
      await indicateMusician({
        audienceId,
        musicianId,
        establishmentId: selectedId,
        message,
      });
      setDone(true);
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      snapPoints={['80%']}
    >
      <View style={s.content}>
        {done ? (
          <>
            <Text style={s.title}>Indicação enviada</Text>
            <Text style={s.helper}>
              O local vai ver que você indicou {musicianName}. Obrigado — é assim que artista bom
              chega em palco novo.
            </Text>
            <PrimaryButton label="Fechar" onPress={onClose} />
          </>
        ) : (
          <>
            <Text style={s.title}>Indicar {musicianName}</Text>
            <Text style={s.helper}>
              Escolha o local que deveria chamar esse artista. Quem recebe é o dono da casa.
            </Text>

            {!!error && <ErrorBanner message={error} />}

            <Text style={s.sectionLabel}>Para qual local?</Text>
            {establishments.isPending ? (
              <ActivityIndicator color={colors.brand.primary} />
            ) : establishments.data?.data.length ? (
              <FlatList
                style={s.list}
                data={establishments.data.data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const on = selectedId === item.id;
                  return (
                    <Pressable
                      onPress={() => setSelectedId(item.id)}
                      style={[s.row, on && s.rowOn]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={item.name}
                    >
                      <Store size={16} color={on ? colors.brand.primary : colors.text.muted} />
                      <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
                      {on && <Check size={16} color={colors.brand.primary} />}
                    </Pressable>
                  );
                }}
              />
            ) : (
              <Text style={s.empty}>Nenhum local disponível no momento.</Text>
            )}

            <Text style={s.sectionLabel}>Por quê? (opcional)</Text>
            <TextInput
              value={message}
              onChangeText={(v) => setMessage(v.slice(0, MESSAGE_MAX_LENGTH))}
              placeholder="Ex.: lotou o bar da esquina no mês passado"
              placeholderTextColor={colors.text.muted}
              style={s.input}
              multiline
              maxLength={MESSAGE_MAX_LENGTH}
              editable={!sending}
              accessibilityLabel="Motivo da indicação"
            />

            <PrimaryButton
              label="Enviar indicação"
              onPress={handleSubmit}
              loading={sending}
              disabled={!selectedId || sending || !audienceId}
            />
            <Pressable onPress={onClose} disabled={sending} accessibilityRole="button" hitSlop={8}>
              <Text style={s.cancel}>Agora não</Text>
            </Pressable>
          </>
        )}
      </View>
    </BottomSheetModal>
  );
}
