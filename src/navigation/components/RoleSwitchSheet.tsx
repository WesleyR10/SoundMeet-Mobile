import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Music2, Users, CheckCircle2, PlusCircle } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useAddRole, getAddRoleErrorMessage } from '@/features/auth/application/useAddRole';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { navigationRef } from '../navigationRef';
import { BecomeMusicianForm } from './BecomeMusicianForm';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Persona da tela que abriu o sheet — marca a conta "ativa agora". */
  context: 'musician' | 'fan';
};

// Bottom sheet de contas/roles (Bloco 10.5.1) — lista as contas do usuário
// com switch instantâneo (10.5.1) e CTAs de criar o papel que falta
// (10.5.2/10.5.3). Após add-role, useAddRole já força o token refresh
// (10.5.4): virar fã registra FanTabs; virar músico dispara o gate
// needs-wizard e o RootNavigator troca pro wizard sozinho.
export function RoleSwitchSheet({ visible, onClose, context }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const roles      = useAuthStore((s) => s.user?.roles ?? []);
  const isMusician = roles.includes('musician');
  const isFan      = roles.includes('audience');

  const [showMusicianForm, setShowMusicianForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addRole = useAddRole();

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  );

  const switchToFan = () => {
    onClose();
    navigationRef.navigate('FanTabs', { screen: 'Home', params: { screen: 'FanHome' } });
  };

  const switchToMusician = () => {
    onClose();
    navigationRef.navigate('MusicianTabs', { screen: 'Home' });
  };

  const becomeFan = async () => {
    setError(null);
    try {
      await addRole.mutateAsync({ role: 'audience' });
      switchToFan();
    } catch (err) {
      setError(getAddRoleErrorMessage(err));
    }
  };

  const becomeMusician = async (values: { cpf: string; phone: string }) => {
    setError(null);
    try {
      await addRole.mutateAsync({ role: 'musician', ...values });
      // Sem navigate: o refresh muda roles → useMusicianWizardGate resolve
      // needs-wizard e o RootNavigator troca a árvore pro wizard (1.13).
      onClose();
    } catch (err) {
      setError(getAddRoleErrorMessage(err));
    }
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.sheetBg}
      handleIndicatorStyle={s.handle}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={s.content}>
        <Text style={s.title}>Suas contas</Text>

        {error ? <ErrorBanner message={error} /> : null}

        <AccountRow
          icon={<Music2 size={20} color={colors.brand.primary} />}
          label="Conta Músico"
          active={isMusician}
          current={context === 'musician'}
          onPress={isMusician && context === 'fan' ? switchToMusician : undefined}
        />
        <AccountRow
          icon={<Users size={20} color={colors.accent.coral} />}
          label="Conta Fã"
          active={isFan}
          current={context === 'fan'}
          onPress={isFan && context === 'musician' ? switchToFan : undefined}
        />

        {!isFan && (
          <Pressable
            onPress={becomeFan}
            disabled={addRole.isPending}
            style={({ pressed }) => [s.ctaRow, pressed && s.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Quero ser Fã também"
          >
            {addRole.isPending ? (
              <ActivityIndicator size="small" color={colors.accent.coral} />
            ) : (
              <PlusCircle size={20} color={colors.accent.coral} />
            )}
            <Text style={s.ctaLabel}>Quero ser Fã também</Text>
          </Pressable>
        )}

        {!isMusician && !showMusicianForm && (
          <Pressable
            onPress={() => setShowMusicianForm(true)}
            style={({ pressed }) => [s.ctaRow, pressed && s.rowPressed]}
            accessibilityRole="button"
            accessibilityLabel="Quero ser Músico também"
          >
            <PlusCircle size={20} color={colors.brand.primary} />
            <Text style={s.ctaLabel}>Quero ser Músico também</Text>
          </Pressable>
        )}

        {!isMusician && showMusicianForm && (
          <BecomeMusicianForm submitting={addRole.isPending} onSubmit={becomeMusician} />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

function AccountRow({ icon, label, active, current, onPress }: {
  icon:     ReactNode;
  label:    string;
  active:   boolean;
  current:  boolean;
  onPress?: () => void;
}) {
  if (!active) return null;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.accountRow, pressed && onPress && s.rowPressed]}
      accessibilityRole="button"
      accessibilityState={{ selected: current }}
      accessibilityLabel={current ? `${label}, ativa agora` : `Trocar para ${label}`}
    >
      {icon}
      <View style={s.accountTextCol}>
        <Text style={s.accountLabel}>{label}</Text>
        <Text style={s.accountHint}>{current ? 'Ativa agora' : 'Toque para trocar'}</Text>
      </View>
      {current && <CheckCircle2 size={20} color={colors.brand.primary} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  sheetBg: {
    backgroundColor: colors.bg.elevated,
    borderRadius:     radius.xl,
  },
  handle: {
    backgroundColor: colors.border.strong,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxl,
    gap:                spacing.md,
  },
  title: {
    ...typography.title,
    color:         colors.text.primary,
    marginBottom:  spacing.xs,
  },
  accountRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               spacing.md,
    minHeight:         56,
    paddingHorizontal: spacing.lg,
    borderRadius:      radius.lg,
    borderWidth:        1,
    borderColor:       colors.border.default,
    backgroundColor:   colors.bg.surface,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  accountTextCol: {
    flex: 1,
  },
  accountLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  accountHint: {
    ...typography.caption,
    color: colors.text.muted,
  },
  ctaRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               spacing.md,
    minHeight:         56,
    paddingHorizontal: spacing.lg,
    borderRadius:      radius.lg,
    borderWidth:        1,
    borderStyle:      'dashed',
    borderColor:       colors.border.strong,
  },
  ctaLabel: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
});
