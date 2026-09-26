import { View, Text, Image } from 'react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { VinylRecord } from '@/shared/components/VinylRecord';

type Props = {
  uri: string;
};

const useStyles = makeStyles((colors) => ({
  root: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'flex-end',
    gap:             spacing.lg,
  },
  item: {
    alignItems: 'center',
    gap:         spacing.xs,
    maxWidth:    88,
  },
  ring: {
    borderRadius: 999,
    borderWidth:  2,
    borderColor:  colors.brand.primary,
    padding:      2,
  },
  round: {
    borderRadius: 999,
  },
  label: {
    ...typography.caption,
    color:     colors.text.muted,
    textAlign: 'center',
  },
}));

/**
 * A foto nos três lugares em que as CASAS e o PÚBLICO a veem — no tamanho e
 * na forma de cada um, conferidos no código do painel web:
 *
 *  - a busca de artistas do estabelecimento (`ArtistCard`, retrato com anel);
 *  - a conversa com a casa (`ConversationAvatar`, círculo pequeno);
 *  - a página pública do artista (`ArtistStageHero`, o disco) — é a que o QR
 *    code abre, o primeiro contato do fã.
 *
 * É a mesma pergunta do editor do painel ("como isso vai ficar lá?"), e a
 * resposta vem antes de gravar, não depois.
 */
export function AvatarPlacementPreview({ uri }: Props) {
  const s = useStyles();
  return (
    <View style={s.root} accessibilityLabel="Prévia de onde a foto aparece">
      <View style={s.item}>
        <View style={s.ring}>
          <Image source={{ uri }} style={[s.round, { width: 40, height: 40 }]} />
        </View>
        <Text style={s.label}>Busca das casas</Text>
      </View>

      <View style={s.item}>
        <Image source={{ uri }} style={[s.round, { width: 36, height: 36 }]} />
        <Text style={s.label}>Conversa</Text>
      </View>

      <View style={s.item}>
        <VinylRecord labelSize={34}>
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
        </VinylRecord>
        <Text style={s.label}>Página do QR code</Text>
      </View>
    </View>
  );
}
