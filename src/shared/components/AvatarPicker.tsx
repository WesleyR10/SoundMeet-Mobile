import { useState } from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { VinylRecord } from '@/shared/components/VinylRecord';
import { AvatarPlacementPreview } from '@/shared/components/AvatarPlacementPreview';

// Extraído de StepThreePhoto.tsx (Bloco 1.13) para ser reaproveitado também
// pelo EditProfileScreen (Bloco 2) — mesma permissão + launch do picker, sem
// duplicar a lógica em dois lugares.
//
// O enquadramento é o editor NATIVO (`allowsEditing` + 1:1): arrastar e
// ampliar com os dedos é o gesto que o sistema já ensina, e a foto sai quadrada
// — o círculo do disco é só a máscara, como no painel web.
export async function pickAvatarImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão necessária', 'Precisamos acessar suas fotos para definir sua foto de perfil.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:    'images',
    allowsEditing: true,
    aspect:        [1, 1],
    quality:        0.7,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

type Props = {
  uri:      string | null;
  onChange: (uri: string) => void;
  /** Diâmetro da FOTO (o selo). O disco em volta cresce junto. */
  size?:    number;
  /** Enviando: o selo gira no toca-discos. */
  busy?:    boolean;
  /**
   * Mostra a foto escolhida no disco e nos lugares em que ela aparece ANTES de
   * gravar, com "Salvar foto" / "Cancelar". É o caso da edição de perfil, onde
   * escolher subia na hora. No cadastro inicial fica desligado: lá o botão
   * "Continuar" da etapa já é a confirmação.
   */
  confirmBeforeChange?: boolean;
};

const useStyles = makeStyles((colors) => ({
  wrap: {
    alignSelf:  'center',
    alignItems: 'center',
    gap:         spacing.md,
  },
  photo: {
    width:  '100%',
    height: '100%',
  },
  placeholder: {
    width:           '100%',
    height:          '100%',
    backgroundColor: colors.bg.surface,
    alignItems:      'center',
    justifyContent:  'center',
  },
  badge: {
    position:        'absolute',
    right:            6,
    bottom:           6,
    width:            40,
    height:           40,
    borderRadius:     20,
    backgroundColor: colors.brand.primary,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:      3,
    borderColor:     colors.bg.primary,
  },
  question: {
    ...typography.bodySm,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap:            spacing.sm,
    alignSelf:     'stretch',
  },
  btn: {
    flex:           1,
    minHeight:      48,
    borderRadius:   radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  btnPrimary: {
    backgroundColor: colors.brand.primary,
  },
  btnGhostText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  btnPrimaryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
  pressed: {
    opacity: 0.8,
  },
}));

/**
 * A foto do artista como SELO de um disco de vinil — a mesma ideia do editor
 * de foto do painel web, pedida para o app em 18/set/2026.
 *
 * ## "Ver antes de trocar"
 *
 * Com `confirmBeforeChange`, a foto escolhida pousa no disco (o selo entra
 * como quem coloca o disco no prato) e aparece nos três lugares em que as
 * casas e o público a veem — a busca de artistas, a conversa e o disco da
 * página pública, que é a que o QR code abre. Só "Salvar foto" chama
 * `onChange`. Antes disso, escolher subia na hora, e o rosto cortado só era
 * visto depois de gravado.
 */
export function AvatarPicker({ uri, onChange, size = 128, busy = false, confirmBeforeChange = false }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [pending, setPending] = useState<string | null>(null);

  const shown = pending ?? uri;

  const handlePick = async () => {
    const picked = await pickAvatarImage();
    if (!picked) return;
    if (confirmBeforeChange) setPending(picked);
    else onChange(picked);
  };

  const confirm = () => {
    if (!pending) return;
    onChange(pending);
    setPending(null);
  };

  return (
    <View style={s.wrap}>
      <Pressable
        onPress={handlePick}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={uri ? 'Trocar foto de perfil' : 'Escolher foto de perfil'}
        accessibilityState={{ disabled: busy, busy }}
      >
        <VinylRecord labelSize={size} spinning={busy} highlighted={!!pending}>
          {shown ? (
            // `key` pela URI: foto nova remonta o selo, e o `ZoomIn` é o disco
            // pousando no prato. Sob "reduzir movimento" o Reanimated o pula.
            <Animated.View key={shown} entering={ZoomIn.duration(360)} style={s.photo}>
              <Image source={{ uri: shown }} style={s.photo} />
            </Animated.View>
          ) : (
            <View style={s.placeholder}>
              <User size={size * 0.31} color={colors.text.muted} />
            </View>
          )}
        </VinylRecord>
        <View style={s.badge}>
          <Camera size={18} color={colors.text.inverse} />
        </View>
      </Pressable>

      {pending && (
        <>
          <AvatarPlacementPreview uri={pending} />
          <Text style={s.question}>Ficou bom assim?</Text>
          <View style={s.actions}>
            <Pressable
              onPress={() => setPending(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancelar e manter a foto atual"
              style={({ pressed }) => [s.btn, s.btnGhost, pressed && s.pressed]}
            >
              <Text style={s.btnGhostText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              accessibilityRole="button"
              accessibilityLabel="Salvar a nova foto de perfil"
              style={({ pressed }) => [s.btn, s.btnPrimary, pressed && s.pressed]}
            >
              <Text style={s.btnPrimaryText}>Salvar foto</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
