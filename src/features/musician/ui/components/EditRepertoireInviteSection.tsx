import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Users, X, Search } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { useMusicianSearch } from '../../application/useMusicianSearch';
import type { RepertoireInvitee } from '../../domain/repertoire.types';
import type { MusicianSearchResult } from '../../domain/musician-search.types';

type Props = {
  ownMusicianId:  string | null;
  onInvite:       (musicianId: string) => void;
  inviteLoading:  boolean;
  invitees:       RepertoireInvitee[];
  onRevoke:       (inviteeId: string) => void;
};

// Substitui o "colar UUID manualmente" por busca real de nome artístico
// (GET /musicians?filter[stage_name]=, já existia pra outros fluxos — sem
// mudança de backend). Some da lista quem já foi convidado ou é o próprio
// dono, evitando uma tentativa de convite que o backend rejeitaria mesmo
// assim (regra de domínio: dono não pode se autoconvidar).
const useStyles = makeStyles((colors) => ({
  section: {
    borderRadius:    12,
    borderWidth:      1,
    borderColor:      colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:          spacing.lg,
    gap:              spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  sectionHint: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  searchWrap: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.sm,
    height:              44,
    borderRadius:        radius.md,
    borderWidth:          1,
    borderColor:         colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.04)',
    paddingHorizontal:   spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySm,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  resultsWrap: {
    gap: spacing.xs,
  },
  emptyResultsText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  resultRow: {
    borderRadius:      radius.md,
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor:  'rgba(255,255,255,0.03)',
  },
  resultName: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  resultMeta: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  inviteeRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderTopWidth:     1,
    borderTopColor:    colors.border.default,
    paddingTop:         spacing.sm,
    marginTop:          spacing.sm,
  },
  inviteeText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex:   1,
    marginRight: spacing.sm,
  },
}));

export function EditRepertoireInviteSection({ ownMusicianId, onInvite, inviteLoading, invitees, onRevoke }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const { data: results, isPending: isSearching } = useMusicianSearch(query);

  const invitedIds = new Set(invitees.map((i) => i.musician_id));
  const filteredResults = (results ?? []).filter(
    (m) => m.id !== ownMusicianId && !invitedIds.has(m.id),
  );

  function handleInvite(musician: MusicianSearchResult) {
    onInvite(musician.id);
    setQuery('');
  }

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Users size={18} color={colors.accent.violet} />
        <Text style={s.sectionTitle}>Convidar músico (PRO)</Text>
      </View>
      <Text style={s.sectionHint}>Busque pelo nome artístico do músico que você quer convidar pra colaborar neste repertório.</Text>

      <View style={s.searchWrap}>
        <Search size={16} color={colors.text.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Nome artístico"
          placeholderTextColor={colors.text.muted}
          style={s.searchInput}
          cursorColor={colors.brand.primary}
          autoCapitalize="none"
          accessibilityLabel="Buscar músico pra convidar"
        />
        {/* Gate de 2 letras junto: `isPending` de query desabilitada é sempre
            true no TanStack v5, e sem isso o spinner nunca parava. */}
        {query.trim().length >= 2 && isSearching && (
          <ActivityIndicator size="small" color={colors.brand.primary} />
        )}
        {inviteLoading && <ActivityIndicator size="small" color={colors.accent.violet} />}
      </View>

      {query.trim().length >= 2 && (
        <View style={s.resultsWrap}>
          {filteredResults.length === 0 && !isSearching ? (
            <Text style={s.emptyResultsText}>Nenhum músico encontrado.</Text>
          ) : (
            filteredResults.map((musician) => (
              <Pressable
                key={musician.id}
                onPress={() => handleInvite(musician)}
                disabled={inviteLoading}
                style={s.resultRow}
                accessibilityRole="button"
                accessibilityLabel={`Convidar ${musician.display_name}`}
              >
                <Text style={s.resultName} numberOfLines={1}>{musician.display_name}</Text>
                {musician.instruments.length > 0 && (
                  <Text style={s.resultMeta} numberOfLines={1}>{musician.instruments.join(', ')}</Text>
                )}
              </Pressable>
            ))
          )}
        </View>
      )}

      {invitees.map((invitee) => (
        <View key={invitee.id} style={s.inviteeRow}>
          <Text style={s.inviteeText} numberOfLines={1}>{invitee.musician_id}</Text>
          <Pressable onPress={() => onRevoke(invitee.id)} accessibilityRole="button" accessibilityLabel="Revogar convite" hitSlop={8}>
            <X size={18} color={colors.text.secondary} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
