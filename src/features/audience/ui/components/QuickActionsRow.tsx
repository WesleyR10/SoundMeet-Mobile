import { View, Text, Pressable, StyleSheet } from 'react-native';
import { QrCode, Trophy, ListMusic, type LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Action = {
  key:         string;
  label:       string;
  icon:        LucideIcon;
  accentColor: string;
  onPress?:    () => void;
};

type Props = {
  onScanQr:   () => void;
  onMyPoints: () => void;
};

// Atalhos da Home do fã (Bloco 11.3) — "Meus Pedidos" fica desabilitado
// (sem GET /audiences/:id/requests ainda, ver
// soundmeet-backend/Docs/roadmap.md Bloco 7.12 / MyRequestsScreen bloqueado)
// mesma honestidade visual das tiles "Cifras"/"Agenda" na Home do músico —
// sem inventar destino.
export function QuickActionsRow({ onScanQr, onMyPoints }: Props) {
  const actions: Action[] = [
    { key: 'scan',   label: 'Escanear QR',  icon: QrCode,   accentColor: colors.brand.primary, onPress: onScanQr },
    { key: 'points', label: 'Meus Pontos',  icon: Trophy,   accentColor: colors.accent.amber,  onPress: onMyPoints },
    { key: 'orders', label: 'Meus Pedidos', icon: ListMusic, accentColor: colors.accent.violet },
  ];

  return (
    <View style={s.row}>
      {actions.map((action) => {
        const disabled = !action.onPress;
        const Icon = action.icon;
        return (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            disabled={disabled}
            style={({ pressed }) => [
              s.tile,
              { borderColor: `${action.accentColor}40` },
              disabled && s.tileDisabled,
              pressed && !disabled && s.tilePressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityState={{ disabled }}
          >
            <View style={[s.iconBox, { backgroundColor: `${action.accentColor}24` }]}>
              <Icon size={20} color={action.accentColor} strokeWidth={2.2} />
            </View>
            <Text style={s.label} numberOfLines={1}>{action.label}</Text>
            {disabled && <Text style={s.sub}>Em breve</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
  tile: {
    flex:              1,
    alignItems:       'center',
    gap:               spacing.xs,
    borderRadius:      radius.lg,
    borderWidth:        1,
    backgroundColor:  'rgba(255,255,255,0.03)',
    paddingVertical:    spacing.md,
    paddingHorizontal:  spacing.xs,
  },
  tileDisabled: { opacity: 0.45 },
  tilePressed:  { opacity: 0.8 },
  iconBox: {
    width:            40,
    height:           40,
    borderRadius:     radius.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
  label: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
    textAlign:  'center',
  },
  sub: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
