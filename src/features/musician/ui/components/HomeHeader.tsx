import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Eye, EyeOff, MessageCircle, User } from 'lucide-react-native';
import { colors, spacing, radius, typography, gradients } from '@/shared/design-system/tokens';
import { HomeAvatarMenu } from './HomeAvatarMenu';
import type { MusicianProfile } from '../../domain/musician.types';

type Props = {
  musician: MusicianProfile | null | undefined;
  balance:  number | null;
  onNavigateProfile: () => void;
  onNavigatePlans:   () => void;
  onOpenAccounts:    () => void;
  onPressMessages:   () => void;
};

const AVATAR_SIZE = 56;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia,';
  if (hour < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Header da Home (Bloco 10.3) — avatar com ring gradiente (mesma técnica de
// ProfileHeader.tsx) + saudação + ações à direita (mensagens e saldo com
// toggle de visibilidade). Identidade à ESQUERDA e ações/valores à DIREITA
// de propósito (padrão consolidado de UX — leitura em F começa na identidade;
// zona direita concentra ações). Avatar é tappable → HomeAvatarMenu.
export function HomeHeader({ musician, balance, onNavigateProfile, onNavigatePlans, onOpenAccounts, onPressMessages }: Props) {
  const [hidden, setHidden]           = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const name = musician?.stage_name || musician?.name || '';

  return (
    <View style={s.root}>
      <Pressable
        style={s.identity}
        onPress={() => setMenuVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu do perfil"
        hitSlop={4}
      >
        <LinearGradient colors={gradients.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarRing}>
          <View style={s.avatarInner}>
            {musician?.avatar ? (
              <Image source={{ uri: musician.avatar }} style={s.avatarImg} />
            ) : (
              <User size={22} color={colors.text.muted} />
            )}
          </View>
        </LinearGradient>
        <View style={s.textCol}>
          <Text style={s.greeting}>{greeting()}</Text>
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1}>{name}</Text>
            <ChevronDown size={14} color={colors.text.secondary} />
          </View>
        </View>
      </Pressable>

      <View style={s.actions}>
        <Pressable
          onPress={onPressMessages}
          style={s.messagesBtn}
          accessibilityRole="button"
          accessibilityLabel="Mensagens com estabelecimentos"
          hitSlop={8}
        >
          <MessageCircle size={20} color={colors.text.secondary} />
        </Pressable>

        <Pressable
          onPress={() => setHidden((v) => !v)}
          style={s.balanceWrap}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Mostrar saldo' : 'Ocultar saldo'}
          hitSlop={8}
        >
          <Text style={s.balance}>
            {balance === null ? '—' : hidden ? 'R$ •••' : formatBRL(balance)}
          </Text>
          {hidden ? <EyeOff size={16} color={colors.text.secondary} /> : <Eye size={16} color={colors.text.secondary} />}
        </Pressable>
      </View>

      <HomeAvatarMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        planTier={musician?.plan_tier ?? null}
        onNavigateProfile={onNavigateProfile}
        onNavigatePlans={onNavigatePlans}
        onOpenAccounts={onOpenAccounts}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:      spacing.md,
    paddingBottom:   spacing.lg,
  },
  identity: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
    flexShrink:     1,
  },
  avatarRing: {
    width:          AVATAR_SIZE,
    height:         AVATAR_SIZE,
    borderRadius:   AVATAR_SIZE / 2,
    padding:         2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width:            '100%',
    height:           '100%',
    borderRadius:     AVATAR_SIZE / 2,
    backgroundColor: colors.bg.surface,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:         'hidden',
  },
  avatarImg: {
    width:  '100%',
    height: '100%',
  },
  textCol:  { flexShrink: 1 },
  greeting: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.xs,
  },
  name: {
    ...typography.title,
    color:    colors.text.primary,
    maxWidth: 140,
  },
  actions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  messagesBtn: {
    width:            40,
    height:           40,
    borderRadius:     radius.full,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  balanceWrap: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               spacing.xs,
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius:      radius.md,
    backgroundColor:  'rgba(255,255,255,0.03)',
  },
  balance: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.text.primary,
  },
});
