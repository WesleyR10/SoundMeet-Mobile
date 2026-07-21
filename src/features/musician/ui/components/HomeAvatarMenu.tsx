import { useEffect, type ReactNode } from 'react';
import { Alert, InteractionManager, Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { User, Users, Crown, LogOut } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { logout } from '@/shared/services/auth/keycloak.service';

type Props = {
  visible:           boolean;
  onClose:           () => void;
  planTier:          string | null;      // 'free' | 'essential' | 'pro'
  onNavigateProfile: () => void;
  onNavigatePlans:   () => void;
  // Abre o RoleSwitchSheet (10.5.1) — troca de conta e CTAs de novo papel.
  onOpenAccounts:    () => void;
};

const PLAN_LABEL: Record<string, string> = {
  free:      'Plano Free',
  essential: 'Plano Essencial',
  pro:       'Plano Pro',
};

// Dropdown/popover do avatar da Home — overlay JS puro (Modal transparente).
// O item "Trocar de conta" abre o RoleSwitchSheet (@gorhom/bottom-sheet,
// 10.5.1) — o dropdown segue leve pra ações rápidas (perfil/planos/sair).
export function HomeAvatarMenu({ visible, onClose, planTier, onNavigateProfile, onNavigatePlans, onOpenAccounts }: Props) {
  const insets   = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 180 });
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity:   progress.value,
    transform: [{ translateY: (1 - progress.value) * -8 }, { scale: 0.96 + progress.value * 0.04 }],
  }));

  const handleLogout = () => {
    onClose();
    Alert.alert(
      'Sair da conta',
      'Você precisará entrar novamente para acessar o app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => { void logout(); } },
      ],
    );
  };

  const planLabel = PLAN_LABEL[planTier ?? ''] ?? 'Plano Free';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Fechar menu">
        <Animated.View
          style={[s.card, shadows.lg, cardStyle, { marginTop: insets.top + spacing.xxxl + spacing.md }]}
          // impede o tap dentro do card de fechar o menu via backdrop
          onStartShouldSetResponder={() => true}
        >
          <MenuItem
            icon={<User size={18} color={colors.brand.primary} />}
            label="Ver perfil"
            onPress={() => { onClose(); onNavigateProfile(); }}
          />

          <MenuItem
            icon={<Users size={18} color={colors.accent.coral} />}
            label="Trocar de conta"
            // O RoleSwitchSheet (@gorhom/bottom-sheet) some se apresentado no
            // mesmo tick em que este <Modal> nativo fecha — a janela nativa
            // do Modal atropela o portal do sheet. runAfterInteractions
            // adia a apresentação pro próximo frame, depois do Modal fechar.
            onPress={() => { onClose(); InteractionManager.runAfterInteractions(onOpenAccounts); }}
          />

          <Pressable
            onPress={() => { onClose(); onNavigatePlans(); }}
            style={({ pressed }) => [s.planRow, pressed && s.itemPressed]}
            accessibilityRole="menuitem"
            accessibilityLabel={`${planLabel} — ver planos e vantagens`}
          >
            <Crown size={18} color={colors.accent.violet} />
            <View style={s.planTextCol}>
              <Text style={s.planLabel}>{planLabel}</Text>
              <Text style={s.planHint}>Ver planos e vantagens</Text>
            </View>
          </Pressable>

          <View style={s.divider} />

          <MenuItem
            icon={<LogOut size={18} color={colors.status.error} />}
            label="Sair da conta"
            labelColor={colors.status.error}
            onPress={handleLogout}
          />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function MenuItem({ icon, label, labelColor, onPress }: {
  icon:        ReactNode;
  label:       string;
  labelColor?: string;
  onPress:     () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.item, pressed && s.itemPressed]}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={[s.itemLabel, labelColor ? { color: labelColor } : null]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: colors.bg.overlay,
  },
  card: {
    alignSelf:        'flex-start',
    marginHorizontal:  spacing.xl,
    minWidth:          232,
    borderRadius:      radius.lg,
    borderWidth:        1,
    borderColor:       colors.border.strong,
    backgroundColor:   colors.bg.elevated,
    paddingVertical:   spacing.sm,
  },
  item: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    minHeight:          48,
    paddingHorizontal:  spacing.lg,
  },
  itemPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  itemLabel: {
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  planRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    minHeight:          48,
    paddingHorizontal:  spacing.lg,
  },
  planTextCol: {
    flexShrink: 1,
  },
  planLabel: {
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  planHint: {
    ...typography.caption,
    color: colors.text.muted,
  },
  divider: {
    height:           1,
    backgroundColor: colors.border.default,
    marginVertical:   spacing.xs,
    marginHorizontal: spacing.lg,
  },
});
