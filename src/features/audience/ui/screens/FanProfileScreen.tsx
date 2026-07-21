import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LogOut, Users } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { MultiSelectChip } from '@/shared/components/MultiSelectChip';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { logout } from '@/shared/services/auth/keycloak.service';
import type { FanProfileScreenProps } from '@/navigation/types';
import { useAudience, useCompleteAudienceProfile } from '../../application/useAudience';
import { GENRE_OPTIONS, INSTRUMENT_OPTIONS } from '../../domain/audience.constants';
import { FanProfileHero } from '../components/FanProfileHero';
import { RoleSwitchSheet } from '@/navigation/components/RoleSwitchSheet';

type Props = FanProfileScreenProps<'FanProfile'>;

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// FanProfileScreen (Bloco 11.13) — perfil completa progressivamente (sem
// wizard, decisão fechada em roadmap-mobile.md): editar preferências de
// gêneros/instrumentos aqui é o único fluxo de "completar cadastro" do fã.
export function FanProfileScreen({ navigation }: Props) {
  const audienceId = useAuthStore((s) => s.user?.audienceId ?? null);
  const { data: audience, isPending } = useAudience(audienceId);
  const completeMutation = useCompleteAudienceProfile(audienceId);

  const [genres, setGenres]           = useState<string[]>([]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [accountsVisible, setAccountsVisible] = useState(false);

  useEffect(() => {
    if (audience) {
      setGenres(audience.preferences.favorite_genres ?? []);
      setInstruments(audience.preferences.favorite_instruments ?? []);
    }
  }, [audience]);

  function handleSave() {
    completeMutation.mutate({ favorite_genres: genres, favorite_instruments: instruments });
  }

  function handleLogout() {
    Alert.alert('Sair da conta', 'Tem certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  }

  if (isPending || !audience) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <FanProfileHero audience={audience} onPressLevel={() => navigation.navigate('Gamification')} />

        <View style={s.section}>
          <Text style={s.sectionTitle}>Gêneros favoritos</Text>
          <View style={s.chipWrap}>
            {GENRE_OPTIONS.map((genre) => (
              <MultiSelectChip
                key={genre}
                label={genre}
                selected={genres.includes(genre)}
                accentColor={colors.accent.violet}
                onPress={() => setGenres((g) => toggle(g, genre))}
              />
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Instrumentos favoritos</Text>
          <View style={s.chipWrap}>
            {INSTRUMENT_OPTIONS.map((instrument) => (
              <MultiSelectChip
                key={instrument}
                label={instrument}
                selected={instruments.includes(instrument)}
                onPress={() => setInstruments((i) => toggle(i, instrument))}
              />
            ))}
          </View>
        </View>

        <PrimaryButton label="Salvar preferências" onPress={handleSave} loading={completeMutation.isPending} />

        {/* Multi-role (10.5): troca de conta + CTA "Quero ser Músico também" */}
        <Pressable
          onPress={() => setAccountsVisible(true)}
          style={s.accountsRow}
          accessibilityRole="button"
          accessibilityLabel="Trocar de conta"
        >
          <Users size={18} color={colors.brand.primary} />
          <Text style={s.accountsText}>Trocar de conta</Text>
        </Pressable>

        <Pressable onPress={handleLogout} style={s.logoutRow} accessibilityRole="button" accessibilityLabel="Sair da conta">
          <LogOut size={18} color={colors.status.error} />
          <Text style={s.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>

      <RoleSwitchSheet
        visible={accountsVisible}
        onClose={() => setAccountsVisible(false)}
        context="fan"
      />
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
    gap:                spacing.xl,
  },
  centerRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
  accountsRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.xs,
    paddingVertical: spacing.md,
  },
  accountsText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'center',
    gap:            spacing.xs,
    paddingVertical: spacing.md,
  },
  logoutText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.status.error,
  },
});
