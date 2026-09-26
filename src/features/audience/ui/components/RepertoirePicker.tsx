import { View, Text } from 'react-native';
import { ListMusic, SearchX, Info } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { Skeleton } from '@/shared/components/Skeleton';
import type { SongCatalogItem, SongCatalogScope } from '../../domain/repertoire.types';
import { RepertoireRow } from './RepertoireRow';
import { SearchBar } from './SearchBar';

type Props = {
  items:         SongCatalogItem[];
  isPending:     boolean;
  query:         string;
  onChangeQuery: (value: string) => void;
  /** Nulo até a primeira resposta chegar. */
  scope:         SongCatalogScope | null;
  /** Item já escolhido — nulo quando o fã digitou à mão. */
  selected:      SongCatalogItem | null;
  onSelect:      (item: SongCatalogItem) => void;
};

// Teto de linhas renderizadas. A tela é um `ScrollView`, então uma `FlatList`
// aqui daria o aviso de VirtualizedList aninhada — e virtualizar 8 linhas não
// paga o custo. O corte é visual, não de dados: o rodapé diz quantas sobraram.
const MAX_VISIBLE = 8;

// Identidade da linha. O catálogo é AGREGADO — não há `id`, porque uma entrada
// corresponde à linha de vários músicos ao mesmo tempo. O par (título, artista)
// é o que a própria consulta usa para agrupar.
//
// Separador improvável no texto: com um espaço, título "A B" + artista vazio
// colidiria com título "A" + artista "B".
const itemKey = (item: SongCatalogItem) => `${item.title}||${item.artist}`;

const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  headerText: {
    ...typography.caption,
    color:          colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing:  0.6,
  },
  notice: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:                spacing.sm,
    paddingVertical:    spacing.sm,
    paddingHorizontal:  spacing.md,
    borderRadius:       radius.md,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:    colors.bg.elevated,
  },
  noticeText: {
    ...typography.bodySm,
    flex:       1,
    color:      colors.text.secondary,
    lineHeight: 18,
  },
  noticeStrong: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  list: {
    borderRadius:    radius.md,
    borderWidth:      1,
    borderColor:     colors.border.default,
    backgroundColor: colors.bg.elevated,
    overflow:        'hidden',
  },
  // Vazio INLINE (ícone pequeno + uma linha), nunca o `EmptyState` compartilhado:
  // aquele é `flex: 1` e estouraria o cartão. É o segundo padrão de vazio já
  // usado em `TipHistoryList`/`TopSongsList`.
  emptyRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               spacing.sm,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    ...typography.bodySm,
    flex:  1,
    color: colors.text.muted,
  },
  skeletonWrap: {
    gap:     spacing.sm,
    padding: spacing.md,
  },
  footer: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

/**
 * Catálogo navegável dentro do pedido de música.
 *
 * ## Os dois escopos, e por que a diferença é dita em voz alta
 *
 * Por padrão o fã busca no catálogo da **plataforma** — tudo que a SoundMeet
 * já cifrou — e pode pedir o que quiser: se o artista não souber ou não quiser
 * tocar, ele recusa. Um músico pode desligar isso, e aí a busca é só no
 * repertório dele.
 *
 * 🔴 **O aviso do modo restrito vem ANTES da busca, não no estado vazio.** Se
 * aparecesse só quando nada é encontrado, o fã procuraria a música dele, veria
 * "nada com esse nome" e concluiria que a busca do SoundMeet está quebrada.
 * Dito antes, ele já procura sabendo onde está procurando.
 *
 * ⚠️ **No modo restrito não há texto livre** — a tela esconde os campos, e o
 * servidor recusaria de qualquer forma. No modo plataforma o texto livre
 * continua: `MusicLibrary` é biblioteca pessoal e nem tudo que um artista sabe
 * tocar está cadastrado; travar o pedido no que está catalogado transformaria
 * uma ajuda em barreira.
 *
 * ⚠️ O que o catálogo devolve é só metadado. Acorde, cifra e letra nunca saem
 * daquela rota (allowlist no `SongCatalogItemPresenter`), e o DONO de cada
 * linha também não.
 */
export function RepertoirePicker({
  items,
  isPending,
  query,
  onChangeQuery,
  scope,
  selected,
  onSelect,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();

  const visible = items.slice(0, MAX_VISIBLE);
  const hidden  = items.length - visible.length;
  const isSearching  = query.trim().length > 0;
  const isRestricted = scope === 'repertoire';
  const selectedKey  = selected ? itemKey(selected) : null;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <ListMusic size={14} color={colors.text.muted} />
        <Text style={s.headerText}>
          {isRestricted ? 'Repertório do artista' : 'Catálogo SoundMeet'}
        </Text>
      </View>

      {isRestricted && (
        <View style={s.notice}>
          <Info size={16} color={colors.text.secondary} />
          <Text style={s.noticeText}>
            <Text style={s.noticeStrong}>
              Este artista prefere pedidos do próprio repertório.
            </Text>
            {' '}Busque abaixo entre as músicas que ele toca.
          </Text>
        </View>
      )}

      <SearchBar
        value={query}
        onChangeText={onChangeQuery}
        placeholder={isRestricted ? 'Buscar no repertório...' : 'Buscar música ou artista...'}
      />

      <View style={s.list}>
        {isPending ? (
          // Larguras decrescentes: bloco cheio em todas as linhas lê como caixa
          // vazia, não como texto por vir (mesma regra do `SkeletonList`).
          <View style={s.skeletonWrap}>
            <Skeleton height={18} width="70%" />
            <Skeleton height={18} width="55%" />
            <Skeleton height={18} width="62%" />
          </View>
        ) : visible.length === 0 ? (
          <View style={s.emptyRow}>
            <SearchX size={18} color={colors.text.muted} />
            <Text style={s.emptyText}>
              {isRestricted
                ? (isSearching
                    ? 'Nada com esse nome no repertório deste artista.'
                    : 'Este artista ainda não publicou o repertório dele.')
                : (isSearching
                    ? 'Nada com esse nome no catálogo. Você ainda pode pedir escrevendo abaixo.'
                    : 'Catálogo indisponível agora. Você ainda pode pedir escrevendo abaixo.')}
            </Text>
          </View>
        ) : (
          visible.map((item, index) => (
            <RepertoireRow
              key={itemKey(item)}
              item={item}
              selected={itemKey(item) === selectedKey}
              isFirst={index === 0}
              showsInRepertoire={!isRestricted}
              onPress={onSelect}
            />
          ))
        )}
      </View>

      {hidden > 0 && (
        <Text style={s.footer}>
          +{hidden} {hidden === 1 ? 'música' : 'músicas'} — refine a busca para ver.
        </Text>
      )}
    </View>
  );
}
