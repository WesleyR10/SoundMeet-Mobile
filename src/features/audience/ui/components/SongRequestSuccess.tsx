import { View, Text } from 'react-native';
import { PartyPopper } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { SaveToSpotifyAction } from './SaveToSpotifyAction';

type Props = {
  audienceId:   string | null;
  songTitle:    string;
  artistName:   string;
  pointsEarned: number;
  /** Valor prometido quando o destaque entrou; `null` quando o pedido é simples. */
  boostAmount:  number | null;
  onDone:       () => void;
};

const useStyles = makeStyles((colors) => ({
  root: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    gap:                spacing.md,
    paddingHorizontal:  spacing.xl,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  spotify: {
    width:     '100%',
    marginTop:  spacing.md,
  },
  button: {
    marginTop: spacing.lg,
    width:     '100%',
  },
  notice: {
    width:            '100%',
    marginTop:         spacing.md,
    padding:           spacing.md,
    borderRadius:      radius.md,
    borderWidth:        1,
    borderColor:      `${colors.accent.coral}33`,
    backgroundColor:  `${colors.accent.coral}0F`,
  },
  noticeText: {
    ...typography.bodySm,
    color:      colors.text.primary,
    textAlign:  'center',
    lineHeight: 19,
  },
}));

/**
 * Confirmação do pedido enviado.
 *
 * Extraída de `SongRequestScreen` quando o catálogo navegável entrou — a tela
 * passou do limite de ~200 linhas do `CLAUDE.md`, e este bloco tem nome lógico
 * próprio.
 */
export function SongRequestSuccess({
  audienceId,
  songTitle,
  artistName,
  pointsEarned,
  boostAmount,
  onDone,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const boosted = boostAmount !== null;

  return (
    <View style={s.root}>
      <PartyPopper size={56} color={boosted ? colors.accent.coral : colors.brand.primary} />
      <Text style={s.title}>{boosted ? 'Pedido no topo da fila!' : 'Pedido enviado!'}</Text>
      <Text style={s.subtitle}>
        +{pointsEarned} pontos ganhos. O músico vai ver seu pedido em breve.
      </Text>

      {/*
        🔴 A promessa de cobrança precisa ser dita AQUI, e não só na tela
        anterior: é o último momento em que o fã lê algo antes de sair. Sem
        isto, o PIX chegando depois do aceite parece cobrança surpresa.
      */}
      {boosted && (
        <View style={s.notice}>
          <Text style={s.noticeText}>
            Assim que o artista aceitar, o PIX de R${' '}
            {boostAmount.toFixed(2).replace('.', ',')} aparece aqui pra você
            concluir. Nada foi cobrado ainda.
          </Text>
        </View>
      )}

      {/*
        O momento certo para oferecer o Spotify: o fã acabou de dizer que quer
        ouvir ESTA música. Só aparece para quem já conectou a conta — virar CTA
        de integração aqui transformaria a comemoração num funil, no meio do show.
      */}
      <View style={s.spotify}>
        <SaveToSpotifyAction audienceId={audienceId} title={songTitle} artist={artistName} />
      </View>

      <PrimaryButton label="Voltar ao perfil" onPress={onDone} style={s.button} />
    </View>
  );
}
