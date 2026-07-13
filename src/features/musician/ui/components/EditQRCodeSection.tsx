import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Lock, ImagePlus, X, AlertTriangle } from 'lucide-react-native';
import { FormField } from '@/shared/components/FormField';
import { QRFrame } from '@/shared/components/QRFrame';
import { pickAvatarImage } from '@/shared/components/AvatarPicker';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  qrCodeValue:         string;
  foregroundColor:     string;
  onChangeForeground:  (v: string) => void;
  backgroundColor:     string;
  onChangeBackground:  (v: string) => void;
  label:               string;
  onChangeLabel:       (v: string) => void;
  logoUri:             string | null;
  onChangeLogo:        (uri: string) => void;
  onRemoveLogo:        () => void;
  isUploadingLogo:     boolean;
  hasLowContrast:      boolean;
  isLocked:            boolean;
};

// Seção "QR Code" do accordion (Bloco 2 — customização PRO). Preview ao vivo
// via QRFrame alimentado pelo estado local (não o já salvo), pra dar feedback
// imediato antes de tocar em "Salvar". Estado bloqueado (não-PRO) não
// renderiza nenhum input, só o texto informativo — decisão confirmada com o
// usuário (sem CTA de upgrade, não existe checkout no app ainda).
export function EditQRCodeSection({
  qrCodeValue, foregroundColor, onChangeForeground, backgroundColor, onChangeBackground,
  label, onChangeLabel, logoUri, onChangeLogo, onRemoveLogo, isUploadingLogo, hasLowContrast, isLocked,
}: Props) {
  if (isLocked) {
    return (
      <View style={s.lockedRoot}>
        <Lock size={22} color={colors.text.secondary} />
        <Text style={s.lockedText}>
          Personalização de QR Code (cores e logo) é exclusiva do plano PRO.
        </Text>
      </View>
    );
  }

  const handlePickLogo = async () => {
    const picked = await pickAvatarImage();
    if (picked) onChangeLogo(picked);
  };

  return (
    <View style={s.root}>
      <View style={s.previewWrap}>
        <QRFrame
          value={qrCodeValue}
          size={120}
          active={false}
          foregroundColor={foregroundColor || undefined}
          backgroundColor={backgroundColor || undefined}
          logoUrl={logoUri || undefined}
        />
      </View>

      <View style={s.logoRow}>
        <Pressable
          onPress={handlePickLogo}
          style={s.logoBtn}
          disabled={isUploadingLogo}
          accessibilityRole="button"
          accessibilityLabel="Escolher logo do QR Code"
        >
          {isUploadingLogo ? (
            <ActivityIndicator color={colors.accent.violet} />
          ) : (
            <>
              <ImagePlus size={18} color={colors.accent.violet} />
              <Text style={s.logoBtnText}>{logoUri ? 'Trocar logo' : 'Escolher logo'}</Text>
            </>
          )}
        </Pressable>

        {!!logoUri && !isUploadingLogo && (
          <Pressable
            onPress={onRemoveLogo}
            style={s.removeLogoBtn}
            accessibilityRole="button"
            accessibilityLabel="Remover logo do QR Code"
            hitSlop={8}
          >
            <X size={18} color={colors.text.secondary} />
          </Pressable>
        )}
      </View>

      <FormField
        label="Cor principal"
        value={foregroundColor}
        onChangeText={onChangeForeground}
        placeholder="#1a1a2e"
        autoCapitalize="none"
      />
      <FormField
        label="Cor de fundo"
        value={backgroundColor}
        onChangeText={onChangeBackground}
        placeholder="#ffffff"
        autoCapitalize="none"
      />

      {hasLowContrast && (
        <View style={s.warningRow}>
          <AlertTriangle size={16} color={colors.status.warning} />
          <Text style={s.warningText}>
            Essas cores têm pouco contraste — o QR Code pode ficar difícil de escanear.
          </Text>
        </View>
      )}

      <FormField
        label="Legenda (opcional)"
        value={label}
        onChangeText={onChangeLabel}
        placeholder="Peça uma música!"
        autoCapitalize="sentences"
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  previewWrap: {
    alignItems:    'center',
    paddingVertical: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  logoBtn: {
    flex:               1,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:                spacing.sm,
    height:             48,
    borderRadius:       radius.md,
    borderWidth:        1,
    borderColor:       `${colors.accent.violet}40`,
    backgroundColor:  `${colors.accent.violet}14`,
  },
  logoBtnText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.violet,
  },
  removeLogoBtn: {
    width:           48,
    height:          48,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    radius.md,
    borderWidth:      1,
    borderColor:     colors.border.default,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  warningText: {
    ...typography.caption,
    color: colors.status.warning,
    flex:   1,
  },
  lockedRoot: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               spacing.md,
    padding:           spacing.md,
    borderRadius:      radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  lockedText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex:   1,
  },
});
