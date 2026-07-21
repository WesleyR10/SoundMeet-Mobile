import { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Radar, MapPin } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { AccordionSaveFooter } from './AccordionSaveFooter';
import { AvailabilityToggleRow } from '@/shared/components/AvailabilityToggleRow';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EditLocationSection } from './EditLocationSection';
import { useUpdateBandOpenToGigs, getUpdateBandOpenToGigsErrorMessage } from '../../application/useUpdateBandOpenToGigs';
import { useEditBandAddressSection } from '../screens/useEditBandAddressSection';
import type { Band } from '../../domain/band.types';

type Props = {
  band:       Band;
  musicianId: string | null;
};

type LeaderSectionId = 'availability' | 'address';

// Só renderizado pra quem é líder (BandDetailScreen já filtra antes de
// montar). Disponibilidade (open_to_gigs) e Endereço da banda — mesmo idioma
// visual do accordion de EditProfileScreen, mas os dois únicos tópicos que a
// banda tem hoje (v2, jul/2026).
export function BandLeaderSettingsSection({ band, musicianId }: Props) {
  const [openId, setOpenId] = useState<LeaderSectionId | null>(null);
  const toggle = (id: LeaderSectionId) => setOpenId((prev) => (prev === id ? null : id));

  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const updateBandOpenToGigs = useUpdateBandOpenToGigs(band.id, musicianId);
  const address = useEditBandAddressSection(band.id, musicianId, band.address);

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
    </>
  );
}

const s = StyleSheet.create({
  sectionTitle: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.8,
    textTransform: 'uppercase',
    color:          colors.text.secondary,
  },
});
