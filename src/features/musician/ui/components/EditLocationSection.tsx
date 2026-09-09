import { View, Text, ActivityIndicator } from 'react-native';
import { FormField } from '@/shared/components/FormField';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';

type Props = {
  cep:                 string;
  onChangeCep:         (v: string) => void;
  cepLoading:          boolean;
  cepError?:           string;
  street:              string;
  onChangeStreet:      (v: string) => void;
  number:              string;
  onChangeNumber:      (v: string) => void;
  complement:          string;
  onChangeComplement:  (v: string) => void;
  neighborhood:        string;
  onChangeNeighborhood:(v: string) => void;
  city:                string;
  onChangeCity:        (v: string) => void;
  state:               string;
  onChangeState:       (v: string) => void;
  stateError?:         string;
};

// Endereço com CEP (item 9, jul/2026): digitar o CEP consulta o ViaCEP e
// preenche rua/bairro/cidade/UF — validação de endereço real de graça.
// Todos os campos continuam editáveis; número/complemento são manuais.
const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.md,
  },
  cepRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
  },
  cepField: {
    flex: 1,
  },
  cepSpinner: {
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
  rowField: {
    flex: 2,
  },
  rowFieldSm: {
    flex: 1,
  },
  helper: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
}));

export function EditLocationSection({
  cep, onChangeCep, cepLoading, cepError,
  street, onChangeStreet,
  number, onChangeNumber,
  complement, onChangeComplement,
  neighborhood, onChangeNeighborhood,
  city, onChangeCity,
  state, onChangeState,
  stateError,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.root}>
      <View style={s.cepRow}>
        <View style={s.cepField}>
          <FormField
            label="CEP"
            value={cep}
            onChangeText={onChangeCep}
            placeholder="00000-000"
            keyboardType="number-pad"
            error={cepError}
          />
        </View>
        {cepLoading && <ActivityIndicator size="small" color={colors.brand.primary} style={s.cepSpinner} />}
      </View>

      <FormField
        label="Rua / Avenida"
        value={street}
        onChangeText={onChangeStreet}
        placeholder="Preenchido pelo CEP"
        autoCapitalize="words"
      />

      <View style={s.row}>
        <View style={s.rowFieldSm}>
          <FormField
            label="Número"
            value={number}
            onChangeText={onChangeNumber}
            placeholder="123"
            keyboardType="number-pad"
          />
        </View>
        <View style={s.rowField}>
          <FormField
            label="Complemento"
            value={complement}
            onChangeText={onChangeComplement}
            placeholder="Apto, bloco..."
            autoCapitalize="sentences"
          />
        </View>
      </View>

      <FormField
        label="Bairro"
        value={neighborhood}
        onChangeText={onChangeNeighborhood}
        placeholder="Preenchido pelo CEP"
        autoCapitalize="words"
      />

      <View style={s.row}>
        <View style={s.rowField}>
          <FormField
            label="Cidade"
            value={city}
            onChangeText={onChangeCity}
            placeholder="Ex.: Belo Horizonte"
            autoCapitalize="words"
          />
        </View>
        <View style={s.rowFieldSm}>
          <FormField
            label="UF"
            value={state}
            onChangeText={(v) => onChangeState(v.slice(0, 2).toUpperCase())}
            placeholder="MG"
            autoCapitalize="characters"
            error={stateError}
          />
        </View>
      </View>

      <Text style={s.helper}>
        Esse é o seu endereço base — você continua livre pra fazer shows em
        qualquer cidade.
      </Text>
    </View>
  );
}
