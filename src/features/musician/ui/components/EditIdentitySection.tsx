import { View, Text } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { FormField } from '@/shared/components/FormField';
import { formatCnpj } from '@/shared/utils/cnpj';
import { AvatarPicker } from '@/shared/components/AvatarPicker';
import { STAGE_NAME_SOFT_MAX, BIO_SOFT_MAX, type EditProfileFormValues } from '../../domain/musician.validation';

type Props = {
  control:            Control<EditProfileFormValues>;
  avatarUri:          string | null;
  onChangeAvatarUri:  (uri: string) => void;
};

const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  counter: {
    ...typography.caption,
    color:     colors.text.muted,
    textAlign: 'right',
  },
  hint: {
    ...typography.caption,
    color: colors.text.muted,
  },
}));

export function EditIdentitySection({ control, avatarUri, onChangeAvatarUri }: Props) {
  const s = useStyles();
  return (
    <View style={s.root}>
      <AvatarPicker uri={avatarUri} onChange={onChangeAvatarUri} />

      <Controller
        control={control}
        name="stageName"
        render={({ field, fieldState }) => (
          <View style={s.field}>
            <FormField
              label="Nome artístico"
              value={field.value}
              onChangeText={(v) => field.onChange(v.slice(0, STAGE_NAME_SOFT_MAX))}
              onBlur={field.onBlur}
              placeholder="Ex.: Lua Cordeiro"
              autoCapitalize="words"
              error={fieldState.error?.message}
            />
            <Text style={s.counter}>{field.value.length}/{STAGE_NAME_SOFT_MAX}</Text>
          </View>
        )}
      />

      <Controller
        control={control}
        name="bio"
        render={({ field, fieldState }) => (
          <View style={s.field}>
            <FormField
              label="Bio / descrição"
              value={field.value ?? ''}
              onChangeText={(v) => field.onChange(v.slice(0, BIO_SOFT_MAX))}
              onBlur={field.onBlur}
              placeholder="Conte sua história, seu estilo, o que você toca ao vivo..."
              autoCapitalize="sentences"
              multiline
              error={fieldState.error?.message}
            />
            <Text style={s.counter}>{(field.value ?? '').length}/{BIO_SOFT_MAX}</Text>
          </View>
        )}
      />

      {/*
        Opcional por desenho: a maioria dos músicos não tem MEI, e o cadastro
        continua sendo de pessoa física. Quem preenche passa a ser qualificado
        como pessoa jurídica no contrato — o que muda a cláusula de tributos
        (MEI emite nota e recolhe pelo DAS; não sofre retenção previdenciária).
        Daí o texto de ajuda dizer o efeito, e não só o formato.
      */}
      <Controller
        control={control}
        name="cnpj"
        render={({ field, fieldState }) => (
          <View style={s.field}>
            <FormField
              label="CNPJ do MEI (opcional)"
              value={field.value ?? ''}
              onChangeText={(v) => field.onChange(formatCnpj(v))}
              onBlur={field.onBlur}
              placeholder="00.000.000/0001-00"
              keyboardType="number-pad"
              error={fieldState.error?.message}
            />
            <Text style={s.hint}>
              Tem MEI? Preencha e seus contratos passam a sair no CNPJ, batendo com a nota que você emite.
              Sem MEI, é só deixar em branco — o contrato sai no seu CPF.
            </Text>
          </View>
        )}
      />
    </View>
  );
}
