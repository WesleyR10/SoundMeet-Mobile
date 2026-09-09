import { View, Text } from 'react-native';
import { ListMusic, SearchX } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { Skeleton } from '@/shared/components/Skeleton';
import type { PublicRepertoireItem } from '../../domain/repertoire.types';
import { RepertoireRow } from './RepertoireRow';
import { SearchBar } from './SearchBar';

type Props = {
  items:         PublicRepertoireItem[];
  isPending:     boolean;
  query:         string;
  onChangeQuery: (value: string) => void;
  /** `id` do item já escolhido — nulo quando o fã digitou à mão. */
  selectedId:    string | null;
  onSelect:      (item: PublicRepertoireItem) => void;
};

// Teto de linhas renderizadas. A tela é um `ScrollView`, então uma `FlatList`
// aqui daria o aviso de VirtualizedList aninhada — e virtualizar 8 linhas não
// paga o custo. O corte é visual, não de dados: o rodapé diz quantas sobraram.
const MAX_VISIBLE = 8;

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
 * Catálogo navegável do músico dentro do pedido de música.
 *
 * Fecha a ressalva do item 11.8 do `Docs/roadmap-mobile.md`, que estava marcado
 * como entregue **com** a nota "sem catálogo navegável": a rota que o destravava
 * (`GET /musicians/:id/repertoire`, backend 9.6c) existe desde 07/ago/2026 e não
 * tinha cliente nenhum — nem aqui, nem no `soundmeet-web`.
 *
 * 🔴 **Escolher do catálogo NÃO substitui o texto livre.** `MusicLibrary` é
 * biblioteca pessoal e hoje a maioria dos itens tem só título/artista; pedir uma
 * música que o artista sabe tocar mas ainda não cadastrou é caso legítimo, e
 * travar o pedido no que está catalogado transformaria uma ajuda em barreira.
 * Por isso os campos de texto continuam abaixo — o que este componente faz é
 * **preenchê-los**.
 *
 * ⚠️ O que o catálogo devolve é só metadado. Acorde, cifra e letra nunca saem
 * daquela rota (allowlist no `PublicMusicLibraryItemPresenter`), então não há o
 * que exibir aqui além de título, artista, gênero e duração.
 */
export function RepertoirePicker({
  items,
  isPending,
  query,
  onChangeQuery,
  selectedId,
  onSelect,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();

  const visible = items.slice(0, MAX_VISIBLE);
  const hidden  = items.length - visible.length;
  const isSearching = query.trim().length > 0;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <ListMusic size={14} color={colors.text.muted} />
        <Text style={s.headerText}>Repertório do artista</Text>
      </View>

      <SearchBar
        value={query}
        onChangeText={onChangeQuery}
        placeholder="Buscar música ou artista..."
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
              {isSearching
                ? 'Nada com esse nome no repertório. Você ainda pode pedir escrevendo abaixo.'
                : 'Este artista ainda não publicou o repertório. Escreva a música abaixo.'}
            </Text>
          </View>
        ) : (
          visible.map((item, index) => (
            <RepertoireRow
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              isFirst={index === 0}
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
