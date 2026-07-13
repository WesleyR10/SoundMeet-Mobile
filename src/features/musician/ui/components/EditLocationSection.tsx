import { View, StyleSheet } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import { spacing } from '@/shared/design-system/tokens';

type Props = {
  city:           string;
  onChangeCity:   (v: string) => void;
  state:          string;
  onChangeState:  (v: string) => void;
  stateError?:    string;
};

export function EditLocationSection({ city, onChangeCity, state, onChangeState, stateError }: Props) {
  return (
    <View style={s.root}>
      <FormField
        label="Cidade"
        value={city}
        onChangeText={onChangeCity}
        placeholder="Ex.: Belo Horizonte"
        autoCapitalize="words"
      />
      <FormField
        label="Estado (UF)"
        value={state}
        onChangeText={(v) => onChangeState(v.slice(0, 2).toUpperCase())}
        placeholder="Ex.: MG"
        autoCapitalize="characters"
        error={stateError}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
});
