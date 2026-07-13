import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, MessagesSquare } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useConversations } from '../../application/useConversations';
import { ConversationListItem } from '../components/ConversationListItem';
import type { Conversation } from '../../domain/conversation.types';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'ConversationList'>;

// Entrada via tile "Agenda" da Home do músico (Bloco 9) — registrada no
// nível raiz (RootStackParamList), não aninhada em nenhuma tab, mesmo
// racional de SharedRepertoire/SharedSongViewer (Bloco 7.9b).
export function ConversationListScreen({ navigation }: Props) {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data, isPending, isError, isRefetching, refetch } = useConversations(musicianId);

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar suas conversas." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    const conversations = data?.conversations ?? [];

    if (conversations.length === 0) {
      return (
        <View style={s.centerRoot}>
          <MessagesSquare size={40} color={colors.text.muted} />
          <Text style={s.emptyTitle}>Nenhuma conversa ainda</Text>
          <Text style={s.emptySubtitle}>Quando um estabelecimento fizer uma proposta de show, a conversa aparece aqui.</Text>
        </View>
      );
    }

    return (
      <FlatList<Conversation>
        data={conversations}
        keyExtractor={(item) => item.conversation_id}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl tintColor={colors.brand.primary} refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        renderItem={({ item, index }) => (
          <ConversationListItem
            conversation={item}
            riseDelay={index * 60}
            onPress={() =>
              navigation.navigate('Chat', {
                conversationId:      item.conversation_id,
                establishmentName:   item.establishment?.name,
                establishmentAvatar: item.establishment?.avatar,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <View style={s.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={s.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={8}
        >
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title}>Conversas</Text>
        <View style={s.iconBtn} />
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  iconBtn: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
  },
  centerRoot: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.md,
    padding:          spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
});
