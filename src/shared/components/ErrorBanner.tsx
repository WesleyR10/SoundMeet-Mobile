import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  message: string;
  style?:  StyleProp<ViewStyle>;
};

export function ErrorBanner({ message, style }: Props) {
  return (
    <View style={[s.banner, style]}>
      <AlertCircle size={18} color={colors.status.error} strokeWidth={2} />
      <Text style={s.bannerText}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:              spacing.sm,
    borderRadius:     radius.md,
    borderWidth:      1,
    borderColor:      `${colors.status.error}59`,
    backgroundColor: `${colors.status.error}14`,
    padding:          spacing.md,
  },
  bannerText: {
    ...typography.bodySm,
    color: colors.text.primary,
    flex:  1,
  },
});
