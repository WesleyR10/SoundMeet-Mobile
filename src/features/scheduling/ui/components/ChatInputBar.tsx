import { useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Send } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { sendMessageSchema } from '../../domain/conversation.validation';

type Props = {
  onSend:     (content: string) => void;
  isSending?: boolean;
};

// TextInput controlado simples, não react-hook-form: um campo único sem
// necessidade de isolamento de re-render por Controller (o ganho real do
// RHF nesta codebase é multi-campo/schema composto — LoginScreen,
// RegisterScreen — não se aplica aqui). Validação via
// sendMessageSchema.safeParse() só no submit.
export function ChatInputBar({ onSend, isSending = false }: Props) {
  const [value, setValue] = useState('');

  function handleSend() {
    const result = sendMessageSchema.safeParse({ content: value });
    if (!result.success) return;
    onSend(result.data.content);
    setValue('');
  }

  const canSend = value.trim().length > 0 && !isSending;

  return (
    <View style={s.row}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Escreva uma mensagem..."
        placeholderTextColor={colors.text.muted}
        style={s.input}
        multiline
        maxLength={2000}
        accessibilityLabel="Campo de mensagem"
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel="Enviar mensagem"
        hitSlop={8}
      >
        {isSending ? (
          <ActivityIndicator color={colors.text.inverse} size="small" />
        ) : (
          <Send size={18} color={colors.text.inverse} />
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    gap:                spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.md,
    borderTopWidth:     1,
    borderTopColor:     colors.border.default,
    backgroundColor:   colors.bg.primary,
  },
  input: {
    ...typography.body,
    flex:              1,
    maxHeight:          120,
    borderRadius:      radius.xl,
    borderWidth:        1,
    borderColor:        colors.border.default,
    backgroundColor:   colors.bg.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical:   spacing.sm,
    color:              colors.text.primary,
  },
  sendBtn: {
    width:            48,
    height:           48,
    borderRadius:     radius.full,
    backgroundColor: colors.brand.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
