import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, User } from 'lucide-react-native';
import { colors, spacing, radius, typography, gradients } from '@/shared/design-system/tokens';
import type { MusicianProfile } from '../../domain/musician.types';

type Props = {
  musician: MusicianProfile | null | undefined;
  balance:  number | null;
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
// ProfileHeader.tsx, RN não tem conic-gradient nativo, aproximado com
// LinearGradient diagonal teal→violeta) + saudação + saldo com toggle de
// visibilidade (olho), como no mockup `Home do Músico.dc.html`.
export function HomeHeader({ musician, balance }: Props) {
  const [hidden, setHidden] = useState(false);
  const name = musician?.stage_name || musician?.name || '';

  return (
    <View style={s.root}>
      <View style={s.identity}>
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
          <Text style={s.name} numberOfLines={1}>{name}</Text>
        </View>
      </View>

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
  name: {
    ...typography.title,
    color:    colors.text.primary,
    maxWidth: 160,
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
