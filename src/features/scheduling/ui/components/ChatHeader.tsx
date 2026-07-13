import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2 } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { Avatar } from '@/shared/components/Avatar';
import { getEstablishmentSummary } from '../../infrastructure/conversation.api';

type Props = {
  onBack:          () => void;
  name?:           string;
  avatar?:         string | null;
  // Presente só quando conversation já carregou (useChat) — usado pro
  // fallback de nome/avatar quando a tela abre via push (sem os params de
  // navegação que a ConversationListScreen normalmente já carrega).
  establishmentId?: string | null;
};

// Fallback client-side (decisão confirmada): quando aberto via push só
// conversation_id chega, sem nome/avatar. Só busca GET /establishments/:id
// nesse caminho raro — na esmagadora maioria das aberturas (vindo da lista)
// name/avatar já vêm pelos params, sem round-trip nenhum.
export function ChatHeader({ onBack, name, avatar, establishmentId }: Props) {
  const needsFallback = !name && !!establishmentId;
  const fallback = useQuery({
    queryKey: ['scheduling', 'establishment-summary', establishmentId],
    queryFn:  () => getEstablishmentSummary(establishmentId!),
    enabled:  needsFallback,
    staleTime: 60 * 1_000,
  });

  const displayName = name ?? fallback.data?.name ?? 'Estabelecimento';
  const displayAvatar = avatar ?? fallback.data?.avatar ?? null;

  return (
    <View style={s.row}>
      <Pressable onPress={onBack} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
        <ArrowLeft size={22} color={colors.text.primary} />
      </Pressable>

      <Avatar uri={displayAvatar} size={36} fallbackIcon={Building2} iconSize={18} />

      <Text style={s.name} numberOfLines={1}>{displayName}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
    borderBottomWidth:  1,
    borderBottomColor:  colors.border.default,
  },
  iconBtn: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.title,
    color: colors.text.primary,
    flex:   1,
  },
});
