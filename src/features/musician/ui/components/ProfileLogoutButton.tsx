import { Alert, Pressable, Text, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { logout } from '@/shared/services/auth/keycloak.service';

// Extraído de ViewProfileScreen.tsx (limite de ~200 linhas/screen). logout()
// já limpa tokens + auth.store — RootNavigator reage a isAuthenticated=false
// e troca pra AuthStack sozinho, sem navigation.reset() manual aqui.
export function ProfileLogoutButton() {
  function handlePress() {
    Alert.alert(
      'Sair da conta',
      'Você precisará entrar novamente para acessar o app.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => { void logout(); } },
      ],
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={s.root}
      accessibilityRole="button"
      accessibilityLabel="Sair da conta"
      hitSlop={8}
    >
      <LogOut size={18} color={colors.status.error} />
      <Text style={s.label}>Sair da conta</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:                spacing.sm,
    paddingVertical:   spacing.md,
    borderRadius:      radius.xl,
    borderWidth:       1,
    borderColor:       'rgba(239,68,68,0.30)',
  },
  label: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.status.error,
  },
});
