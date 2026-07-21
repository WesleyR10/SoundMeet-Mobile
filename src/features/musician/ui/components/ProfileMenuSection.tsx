import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  title:    string;
  children: ReactNode;
};

// Título + card agrupador de ProfileMenuRow — mesmo estilo de seção já
// usado em ProfileInfoSection.tsx (título uppercase discreto + card com
// borda sutil), reaproveitado aqui pro hub de navegação do Perfil.
export function ProfileMenuSection({ title, children }: Props) {
  return (
    <View style={s.root}>
      <Text style={s.title}>{title}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  title: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    textTransform: 'uppercase',
    color:          colors.text.secondary,
  },
  card: {
    borderRadius:      radius.lg,
    borderWidth:        1,
    borderColor:       colors.border.default,
    backgroundColor:   'rgba(255,255,255,0.03)',
    paddingVertical:   spacing.xs,
    paddingHorizontal: spacing.sm,
    gap:                2,
  },
});
