import { View, Text, Pressable } from 'react-native';
import { QrCode, Trophy, ListMusic, type LucideIcon } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Action = {
  key:         string;
  label:       string;
  icon:        LucideIcon;
  accentColor: string;
  onPress?:    () => void;
};

type Props = {
  onScanQr:     () => void;
  onMyPoints:   () => void;
  onMyRequests: () => void;
};

// Atalhos da Home do fã (Bloco 11.3).
//
// "Meus Pedidos" ficou desabilitado desde jul/2026 com um comentário afirmando
// que `GET /audiences/:id/requests` não existia. A rota certa é
// `GET /requests/audiences/:audience_id` (backend 7.12) e o app já a consumia —
// `PendingBoostHost` a usa no cold start do destaque pago. A tile foi ligada
// junto com `MyRequestsScreen`; o mecanismo de tile desabilitada continua aqui
// porque é a honestidade visual certa para o próximo destino que faltar.
const useStyles = makeStyles((colors) => ({
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
}));

export function QuickActionsRow({ onScanQr, onMyPoints, onMyRequests }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const actions: Action[] = [
    { key: 'scan',   label: 'Escanear QR',  icon: QrCode,   accentColor: colors.brand.primary, onPress: onScanQr },
    { key: 'points', label: 'Meus Pontos',  icon: Trophy,   accentColor: colors.accent.amber,  onPress: onMyPoints },
    { key: 'orders', label: 'Meus Pedidos', icon: ListMusic, accentColor: colors.accent.violet, onPress: onMyRequests },
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
