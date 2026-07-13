import { View, Text, Pressable, StyleSheet } from 'react-native';
import { QrCode, Music, FileText, CalendarDays, ChartColumn, Gauge, type LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Tile = {
  key:          string;
  label:        string;
  sub:          string;
  icon:         LucideIcon;
  accentColor:  string;
  onPress?:     () => void;
};

type Props = {
  repertoireCount:   number | null;
  onPressQrCode:     () => void;
  onPressRepertoire: () => void;
  onPressAnalytics:  () => void;
  onPressTuner:      () => void;
  onPressAgenda:     () => void;
};

// Grid do mockup `Home do Músico.dc.html` — QR Code, Repertório, Analytics,
// Afinador (Bloco 8) e Agenda (Bloco 9, conversas com estabelecimentos) têm
// destino/dado real hoje; só "Cifras" fica visual e desabilitada (já
// resolvida pela tab própria do Bloco 7 — a tile antiga virou redundante).
export function QuickAccessGrid({
  repertoireCount, onPressQrCode, onPressRepertoire, onPressAnalytics, onPressTuner, onPressAgenda,
}: Props) {
  const tiles: Tile[] = [
    {
      key:         'repertoire',
      label:       'Repertório',
      sub:         repertoireCount === null ? '—' : `${repertoireCount} música${repertoireCount === 1 ? '' : 's'}`,
      icon:        Music,
      accentColor: colors.brand.primary,
      onPress:     onPressRepertoire,
    },
    {
      key:         'qrcode',
      label:       'QR Code',
      sub:         'Compartilhar',
      icon:        QrCode,
      accentColor: colors.accent.violet,
      onPress:     onPressQrCode,
    },
    {
      key:         'analytics',
      label:       'Analytics',
      sub:         'Ver estatísticas',
      icon:        ChartColumn,
      accentColor: colors.accent.amber,
      onPress:     onPressAnalytics,
    },
    {
      key:         'tuner',
      label:       'Afinador',
      sub:         'Ritual pré-show',
      icon:        Gauge,
      accentColor: colors.brand.primary,
      onPress:     onPressTuner,
    },
    {
      key:         'cifras',
      label:       'Cifras',
      sub:         'Em breve',
      icon:        FileText,
      accentColor: colors.brand.primary,
    },
    {
      key:         'agenda',
      label:       'Agenda',
      sub:         'Conversas',
      icon:        CalendarDays,
      accentColor: colors.accent.violet,
      onPress:     onPressAgenda,
    },
  ];

  return (
    <View style={s.grid}>
      {tiles.map((tile) => {
        const disabled = !tile.onPress;
        const Icon = tile.icon;
        return (
          <Pressable
            key={tile.key}
            onPress={tile.onPress}
            disabled={disabled}
            style={({ pressed }) => [
              s.tile,
              { borderColor: `${tile.accentColor}40` },
              disabled && s.tileDisabled,
              pressed && !disabled && s.tilePressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={tile.label}
            accessibilityState={{ disabled }}
          >
            <View style={[s.iconBox, { backgroundColor: `${tile.accentColor}24` }]}>
              <Icon size={18} color={tile.accentColor} strokeWidth={2.2} />
            </View>
            <Text style={s.label}>{tile.label}</Text>
            <Text style={s.sub}>{tile.sub}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap:       'wrap',
    gap:             spacing.md,
  },
  tile: {
    flexBasis:        '47%',
    flexGrow:          1,
    borderRadius:      radius.lg,
    borderWidth:        1,
    backgroundColor:  'rgba(255,255,255,0.03)',
    padding:            spacing.md,
    gap:                spacing.xs,
    minHeight:          92,
  },
  tileDisabled: {
    opacity: 0.45,
  },
  tilePressed: {
    opacity: 0.8,
  },
  iconBox: {
    width:            34,
    height:           34,
    borderRadius:     radius.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
  label: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  sub: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
