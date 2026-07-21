import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  icon:         LucideIcon;
  label:        string;
  subtitle?:    string;
  accentColor?: string;
  onPress:      () => void;
  // Linha de ação irreversível (ex.: "Sair da conta") — ícone/label em
  // vermelho, sem chevron (não navega, executa).
  destructive?: boolean;
  // Contagem discreta (ex.: convites de banda pendentes) — pill violeta
  // antes do chevron. Ausente/0 não renderiza nada.
  badgeCount?: number;
};

// Linha de menu genérica pro hub do Perfil (redesign jul/2026) — mesmo
// idioma visual de InfoRow (ProfileInfoSection.tsx)/BandTipSplitCard (ícone
// em box colorido + texto), mas navegável (Pressable + chevron), fundo
// plano em vez de card com borda — pensada pra ficar densa dentro de um
// ProfileMenuSection sem competir visualmente com os cards de banda/stats.
export function ProfileMenuRow({ icon: Icon, label, subtitle, accentColor = colors.brand.primary, onPress, destructive, badgeCount }: Props) {
  const color = destructive ? colors.status.error : accentColor;
  const accessibilityLabel = badgeCount ? `${label}, ${badgeCount} pendente${badgeCount === 1 ? '' : 's'}` : label;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && s.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[s.iconBox, { backgroundColor: `${color}14` }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={s.textCol}>
        <Text style={[s.label, destructive && { color }]}>{label}</Text>
        {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>
      {!!badgeCount && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{badgeCount}</Text>
        </View>
      )}
      {!destructive && <ChevronRight size={18} color={colors.text.muted} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    minHeight:          52,
    borderRadius:       radius.md,
    paddingHorizontal:  spacing.sm,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  iconBox: {
    width:           32,
    height:          32,
    borderRadius:    radius.sm,
    alignItems:      'center',
    justifyContent:  'center',
  },
  textCol: {
    flex: 1,
    gap:   2,
  },
  label: {
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.muted,
  },
  badge: {
    minWidth:          20,
    height:            20,
    borderRadius:      radius.full,
    paddingHorizontal:  5,
    alignItems:        'center',
    justifyContent:    'center',
    backgroundColor:   colors.accent.violet,
  },
  badgeText: {
    ...typography.caption,
    fontFamily: 'Inter-Bold',
    color:      colors.text.inverse,
  },
});
