import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { EditProfileFormValues } from '../../domain/musician.validation';

type Props = {
  control: Control<EditProfileFormValues>;
};

export function EditExperienceSection({ control }: Props) {
  return (
    <Controller
      control={control}
      name="experienceYears"
      render={({ field }) => {
        const years = Number(field.value) || 0;
        const dec = () => field.onChange(Math.max(0, years - 1));
        const inc = () => field.onChange(Math.min(100, years + 1));

        return (
          <View style={s.root}>
            <Text style={s.label}>Anos de experiência</Text>
            <View style={s.row}>
              <Pressable onPress={dec} style={s.stepBtn} accessibilityRole="button" accessibilityLabel="Diminuir anos de experiência">
                <Text style={s.stepBtnText}>−</Text>
              </Pressable>
              <View style={s.center}>
                <Text style={s.years}>{years}</Text>
                <Text style={s.yearsLabel}>{years === 1 ? 'ano de palco' : 'anos de palco'}</Text>
              </View>
              <Pressable onPress={inc} style={s.stepBtn} accessibilityRole="button" accessibilityLabel="Aumentar anos de experiência">
                <Text style={s.stepBtnText}>＋</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    color:          'rgba(255,255,255,0.55)',
    textTransform:  'uppercase',
  },
  row: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:  'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth:      1,
    borderColor:     colors.border.brand,
    borderRadius:     radius.lg,
    padding:          spacing.sm,
  },
  stepBtn: {
    width:            42,
    height:           42,
    borderRadius:     radius.md,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'rgba(124,58,237,0.14)',
  },
  stepBtnText: {
    fontSize:   22,
    fontFamily: 'Inter-SemiBold',
    color:      colors.accent.violetLight,
  },
  center: {
    alignItems: 'center',
  },
  years: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  yearsLabel: {
    ...typography.caption,
    color:     colors.text.secondary,
    marginTop: 1,
  },
});
