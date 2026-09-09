import { View, Text, Pressable } from 'react-native';
import { QrCode, Music, FileText, CalendarDays, ChartColumn, Gauge, Inbox, FileSignature, type LucideIcon } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

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
  onPressCifras:     () => void;
  onPressAgenda:     () => void;
  onPressInquiries:  () => void;
  onPressContracts:  () => void;
};

// Grid do mockup `Home do Músico.dc.html` — todas as tiles têm destino real.
// "Cifras" ficou desabilitada ("Em breve") por um tempo por ser considerada
// redundante com a tab Repertório; agora aponta pro ChordSheetsHub, que reúne
// cifras pessoais, comunidade e criação — coisas que a tab de repertório
// (organizada por show) não expõe.
const useStyles = makeStyles((colors) => ({
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
}));

export function QuickAccessGrid({
  repertoireCount, onPressQrCode, onPressRepertoire, onPressAnalytics, onPressTuner, onPressCifras, onPressAgenda,
  onPressInquiries, onPressContracts,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
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
      sub:         'Minhas e da comunidade',
      icon:        FileText,
      accentColor: colors.brand.primary,
      onPress:     onPressCifras,
    },
    {
      key:         'agenda',
      label:       'Agenda',
      sub:         'Conversas',
      icon:        CalendarDays,
      accentColor: colors.accent.violet,
      onPress:     onPressAgenda,
    },
    {
      // Propostas (A3/F1.2) — quem aceita ou recusa é o músico, então esta é a
      // única superfície onde a decisão pode acontecer.
      //
      // Sem contador de propostas abertas de propósito: o número viria de
      // `features/scheduling/application/useInquiries`, e FSD proíbe
      // `features/musician` importar de outra feature. Um badge aqui custaria
      // ou uma violação da regra ou uma promoção do hook para `shared/` que
      // nenhuma outra tela pediu.
      key:         'inquiries',
      label:       'Propostas',
      sub:         'Convites de show',
      icon:        Inbox,
      accentColor: colors.accent.amber,
      onPress:     onPressInquiries,
    },
    {
      // Contratos (B4/Bloco 10). No app do músico o contrato É a tela do show:
      // não existe lista de bookings aqui, e o snapshot carrega data, local,
      // cachê e a Ficha Técnica.
      //
      // Violeta, a mesma cor de Propostas e Agenda: contrato é a continuação
      // da negociação, não uma família nova (ver a tabela de contexto do
      // design-system.md).
      //
      // Sem contador de "aguardando você", pelo MESMO motivo do tile de
      // Propostas logo acima: o número viria de
      // `features/contract/application/useContracts`, e a regra de ouro do FSD
      // proíbe `features/musician` importar de outra feature. Um badge aqui
      // custaria ou a violação da regra ou a promoção do hook para `shared/`
      // que nenhuma outra tela pediu — e o estado pendente já aparece em cada
      // linha da própria lista.
      key:         'contracts',
      label:       'Contratos',
      sub:         'Shows fechados',
      icon:        FileSignature,
      accentColor: colors.accent.violet,
      onPress:     onPressContracts,
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
