import { useState } from 'react';
import { Text } from 'react-native';
import { Radar, MapPin, CalendarClock } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { AccordionSaveFooter } from './AccordionSaveFooter';
import { AvailabilityToggleRow } from '@/shared/components/AvailabilityToggleRow';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EditLocationSection } from './EditLocationSection';
import { FormField } from '@/shared/components/FormField';
import { useUpdateBandOpenToGigs, getUpdateBandOpenToGigsErrorMessage } from '../../application/useUpdateBandOpenToGigs';
import { useUpdateBandFormedIn, getUpdateBandFormedInErrorMessage } from '../../application/useUpdateBandFormedIn';
import { useEditBandAddressSection } from '../screens/useEditBandAddressSection';
import { parseFormationYear } from '../../domain/band.validation';
import type { Band } from '../../domain/band.types';

type Props = {
  band:       Band;
  musicianId: string | null;
};

type LeaderSectionId = 'availability' | 'address' | 'tenure';

// Só renderizado pra quem é líder (BandDetailScreen já filtra antes de
// montar). Disponibilidade (open_to_gigs), Endereço e Tempo de estrada — mesmo
// idioma visual do accordion de EditProfileScreen.
//
// "Tempo de estrada" (17/set/2026) existe porque o perfil do músico solo
// mostrava anos de experiência e o da banda não mostrava nada — e não era
// esquecimento de UI: `model Band` não tinha o campo. Hoje tem (`formed_in`),
// e é aqui que o líder o declara.
const useStyles = makeStyles((colors) => ({
  sectionTitle: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    textTransform: 'uppercase',
    color:          colors.text.secondary,
  },
  hint: {
    ...typography.caption,
    color:      colors.text.muted,
    marginTop:  spacing.xs,
  },
}));

export function BandLeaderSettingsSection({ band, musicianId }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [openId, setOpenId] = useState<LeaderSectionId | null>(null);
  const toggle = (id: LeaderSectionId) => setOpenId((prev) => (prev === id ? null : id));

  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const updateBandOpenToGigs = useUpdateBandOpenToGigs(band.id, musicianId);
  const address = useEditBandAddressSection(band.id, musicianId, band.address);

  // `?? ''` e não `String(band.formed_in)`: `null` viraria a string "null" no
  // campo, que é o tipo de defeito que só aparece em captura de tela.
  const [formedInText, setFormedInText] = useState(
    band.formed_in != null ? String(band.formed_in) : '',
  );
  const [formedInError, setFormedInError] = useState<string | null>(null);
  const updateBandFormedIn = useUpdateBandFormedIn(band.id, musicianId);

  /**
   * `Promise<boolean>` é o contrato do `AccordionSaveFooter`: `true` dispara o
   * checkmark de confirmação. Devolver `true` num caminho que falhou mostraria
   * "salvo" sobre um erro.
   */
  const onSaveFormedIn = async (): Promise<boolean> => {
    const parsed = parseFormationYear(formedInText);

    // Valida ANTES de chamar a API: o backend também recusa
    // (`@IsFormationYear`), mas deixar o 422 ser a mensagem entregaria
    // "formed_in must be an integer year between..." para quem digitou 2027.
    if (!parsed.ok) {
      setFormedInError(parsed.message);
      return false;
    }

    setFormedInError(null);
    try {
      await updateBandFormedIn.mutateAsync(parsed.value);
      return true;
    } catch (err) {
      setFormedInError(getUpdateBandFormedInErrorMessage(err));
      return false;
    }
  };

  const onChangeAvailability = async (next: boolean) => {
    setAvailabilityError(null);
    try {
      await updateBandOpenToGigs.mutateAsync(next);
    } catch (err) {
      setAvailabilityError(getUpdateBandOpenToGigsErrorMessage(err));
    }
  };

  return (
    <>
      <Text style={s.sectionTitle}>Gerenciar banda</Text>

      <AccordionSection
        title="Disponibilidade"
        subtitle={band.open_to_gigs ? 'Radar ligado' : (band.open_to_gigs === null ? 'Ainda não decidido' : 'Radar desligado')}
        icon={Radar}
        accentColor={colors.brand.primary}
        isComplete={band.open_to_gigs !== null}
        isOpen={openId === 'availability'}
        onToggle={() => toggle('availability')}
      >
        <AvailabilityToggleRow
          value={!!band.open_to_gigs}
          onChange={onChangeAvailability}
          disabled={updateBandOpenToGigs.isPending}
          title={band.open_to_gigs ? 'Radar ligado' : 'Radar desligado'}
          subtitle={band.open_to_gigs ? 'Visível para estabelecimentos' : 'A banda não aparece em buscas'}
        />
        {!!availabilityError && <ErrorBanner message={availabilityError} />}
      </AccordionSection>

      <AccordionSection
        title="Endereço"
        subtitle={[band.address?.city, band.address?.state].filter(Boolean).join(' - ') || 'Não definido'}
        icon={MapPin}
        accentColor={colors.text.secondary}
        isComplete={!!band.address?.city}
        isOpen={openId === 'address'}
        onToggle={() => toggle('address')}
      >
        <EditLocationSection
          cep={address.cep}
          onChangeCep={address.onChangeCep}
          cepLoading={address.cepLoading}
          cepError={address.cepError}
          street={address.street}
          onChangeStreet={address.setStreet}
          number={address.number}
          onChangeNumber={address.setNumber}
          complement={address.complement}
          onChangeComplement={address.setComplement}
          neighborhood={address.neighborhood}
          onChangeNeighborhood={address.setNeighborhood}
          city={address.city}
          onChangeCity={address.setCity}
          state={address.state}
          onChangeState={address.setState}
          stateError={address.fieldError}
        />
        <AccordionSaveFooter onSave={address.onSave} isSaving={address.isSaving} error={address.error} />
      </AccordionSection>

      <AccordionSection
        title="Tempo de estrada"
        // `!= null` cobre `undefined` (backend anterior à migration) e `null`
        // (não declarado) com a mesma leitura: não informado.
        subtitle={band.formed_in != null ? `Desde ${band.formed_in}` : 'Não informado'}
        icon={CalendarClock}
        accentColor={colors.text.secondary}
        isComplete={band.formed_in != null}
        isOpen={openId === 'tenure'}
        onToggle={() => toggle('tenure')}
      >
        <FormField
          label="Ano de formação"
          value={formedInText}
          onChangeText={(value) => {
            setFormedInText(value);
            // Limpa o erro ao digitar: manter a mensagem enquanto a pessoa
            // corrige faz a tela parecer travada.
            if (formedInError) setFormedInError(null);
          }}
          placeholder="2019"
          keyboardType="number-pad"
          error={formedInError ?? undefined}
        />
        {/* Campo de TEXTO e não seletor de data, de propósito: o dado é um ANO.
            Um date picker pediria dia e mês que ninguém sabe — precisão falsa
            num campo que o estabelecimento lê como credencial. E o vazio é
            operação válida (apagar), não erro. */}
        <Text style={s.hint}>
          Deixe em branco para não informar. O estabelecimento vê isso como
          &ldquo;anos de estrada&rdquo; no perfil da banda.
        </Text>
        <AccordionSaveFooter
          onSave={onSaveFormedIn}
          isSaving={updateBandFormedIn.isPending}
          error={null}
        />
      </AccordionSection>
    </>
  );
}
