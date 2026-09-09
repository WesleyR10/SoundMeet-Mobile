import type { Control } from 'react-hook-form';
import { UserRound, Music, Clock, Wallet, AtSign, MapPin, Landmark, QrCode, Radar, Plane } from 'lucide-react-native';
import { colors } from '@/shared/design-system/tokens';
import { AccordionSection } from '@/shared/components/AccordionSection';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EditIdentitySection } from './EditIdentitySection';
import { EditTagsSection } from './EditTagsSection';
import { EditExperienceSection } from './EditExperienceSection';
import { EditPriceRangeSection } from './EditPriceRangeSection';
import { EditSocialLinksSection } from './EditSocialLinksSection';
import { EditLocationSection } from './EditLocationSection';
import { EditTouringSection } from './EditTouringSection';
import { touringSubtitle } from '../../domain/touring.rules';
import { EditWalletSection } from './EditWalletSection';
import { EditQRCodeSection } from './EditQRCodeSection';
import { EditAvailabilitySection } from './EditAvailabilitySection';
import { AccordionSaveFooter } from './AccordionSaveFooter';
import type { EditProfileFormValues } from '../../domain/musician.validation';
import type { MusicianProfile } from '../../domain/musician.types';
import type { useEditProfileForm } from '../screens/useEditProfileForm';

export type SectionId = 'identity' | 'availability' | 'tags' | 'experience' | 'price' | 'social' | 'location' | 'touring' | 'wallet' | 'qrcode';

type EditProfileFormResult = ReturnType<typeof useEditProfileForm>;

type Props = {
  musician:      MusicianProfile;
  control:       Control<EditProfileFormValues>;
  avatarUri:           EditProfileFormResult['avatarUri'];
  handleChangeAvatar:  EditProfileFormResult['handleChangeAvatar'];
  instrumentIds:       EditProfileFormResult['instrumentIds'];
  toggleInstrument:    EditProfileFormResult['toggleInstrument'];
  genreIds:            EditProfileFormResult['genreIds'];
  toggleGenre:         EditProfileFormResult['toggleGenre'];
  sections:            EditProfileFormResult['sections'];
  location:            EditProfileFormResult['location'];
  touring:             EditProfileFormResult['touring'];
  wallet:              EditProfileFormResult['wallet'];
  qrCode:              EditProfileFormResult['qrCode'];
  availability:        EditProfileFormResult['availability'];
  openId:   SectionId | null;
  onToggle: (id: SectionId) => void;
};

// Extraído de EditProfileScreen.tsx (limite de ~200 linhas/arquivo) — as 7
// seções do accordion de perfil (Bloco 2), cada uma com seu próprio botão de
// salvar (AccordionSaveFooter). A tela em si só orquestra loading/erro/back.
export function EditProfileAccordionList({
  musician, control, avatarUri, handleChangeAvatar,
  instrumentIds, toggleInstrument, genreIds, toggleGenre,
  sections, location, touring, wallet, qrCode, availability, openId, onToggle,
}: Props) {
  return (
    <>
      <AccordionSection
        title="Identidade"
        subtitle={musician.stage_name || 'Foto, nome artístico e bio'}
        icon={UserRound}
        accentColor={colors.brand.primary}
        isComplete={!!musician.stage_name}
        isOpen={openId === 'identity'}
        onToggle={() => onToggle('identity')}
      >
        <EditIdentitySection control={control} avatarUri={avatarUri} onChangeAvatarUri={handleChangeAvatar} />
        <AccordionSaveFooter onSave={sections.identity.onSave} isSaving={sections.identity.isSaving} error={sections.identity.error} />
      </AccordionSection>

      <AccordionSection
        title="Disponibilidade"
        subtitle={availability.value ? 'Radar ligado' : (availability.isDecided ? 'Radar desligado' : 'Ainda não decidido')}
        icon={Radar}
        accentColor={colors.brand.primary}
        isComplete={availability.isDecided}
        isOpen={openId === 'availability'}
        onToggle={() => onToggle('availability')}
      >
        <EditAvailabilitySection value={availability.value} onChange={availability.onChange} disabled={availability.isSaving} />
        {!!availability.error && <ErrorBanner message={availability.error} />}
      </AccordionSection>

      <AccordionSection
        title="Instrumentos e gêneros"
        subtitle={`${instrumentIds.length} instrumento${instrumentIds.length === 1 ? '' : 's'}, ${genreIds.length} gênero${genreIds.length === 1 ? '' : 's'}`}
        icon={Music}
        accentColor={colors.accent.coral}
        isComplete={instrumentIds.length > 0 && genreIds.length > 0}
        isOpen={openId === 'tags'}
        onToggle={() => onToggle('tags')}
      >
        <EditTagsSection
          selectedInstrumentIds={instrumentIds}
          onToggleInstrument={toggleInstrument}
          selectedGenreIds={genreIds}
          onToggleGenre={toggleGenre}
        />
        <AccordionSaveFooter onSave={sections.tags.onSave} isSaving={sections.tags.isSaving} error={sections.tags.error} />
      </AccordionSection>

      <AccordionSection
        title="Experiência"
        subtitle={`${musician.profile?.experience ?? musician.experience_years} anos de palco`}
        icon={Clock}
        accentColor={colors.accent.violetLight}
        isComplete
        isOpen={openId === 'experience'}
        onToggle={() => onToggle('experience')}
      >
        <EditExperienceSection control={control} />
        <AccordionSaveFooter onSave={sections.experience.onSave} isSaving={sections.experience.isSaving} error={sections.experience.error} />
      </AccordionSection>

      <AccordionSection
        title="Faixa de preço"
        subtitle={musician.profile?.price_ranges?.length ? 'Definida' : 'Não definida'}
        icon={Wallet}
        accentColor={colors.accent.amber}
        isComplete={!!musician.profile?.price_ranges?.length}
        isOpen={openId === 'price'}
        onToggle={() => onToggle('price')}
      >
        <EditPriceRangeSection control={control} />
        <AccordionSaveFooter onSave={sections.price.onSave} isSaving={sections.price.isSaving} error={sections.price.error} />
      </AccordionSection>

      <AccordionSection
        title="Links sociais"
        subtitle="Instagram, YouTube, Spotify"
        icon={AtSign}
        accentColor={colors.brand.primary}
        isComplete={!!musician.profile?.social_links}
        isOpen={openId === 'social'}
        onToggle={() => onToggle('social')}
      >
        <EditSocialLinksSection control={control} />
        <AccordionSaveFooter onSave={sections.social.onSave} isSaving={sections.social.isSaving} error={sections.social.error} />
      </AccordionSection>

      <AccordionSection
        title="Localização"
        subtitle={[musician.profile?.location?.city, musician.profile?.location?.state].filter(Boolean).join(' - ') || 'Não definida'}
        icon={MapPin}
        accentColor={colors.text.secondary}
        isComplete={!!musician.profile?.location?.city}
        isOpen={openId === 'location'}
        onToggle={() => onToggle('location')}
      >
        <EditLocationSection
          cep={location.cep}
          onChangeCep={location.onChangeCep}
          cepLoading={location.cepLoading}
          cepError={location.cepError}
          street={location.street}
          onChangeStreet={location.setStreet}
          number={location.number}
          onChangeNumber={location.setNumber}
          complement={location.complement}
          onChangeComplement={location.setComplement}
          neighborhood={location.neighborhood}
          onChangeNeighborhood={location.setNeighborhood}
          city={location.city}
          onChangeCity={location.setCity}
          state={location.state}
          onChangeState={location.setState}
          stateError={location.fieldError}
        />
        <AccordionSaveFooter onSave={location.onSave} isSaving={location.isSaving} error={location.error} />
      </AccordionSection>

      {/*
        Modo turnê logo depois de Localização, de propósito: é o mesmo assunto —
        onde o público te encontra — e a proximidade das duas seções é o que
        deixa claro que a turnê SOMA à base, em vez de trocá-la.
      */}
      <AccordionSection
        title="Modo turnê"
        subtitle={touringSubtitle(musician.profile)}
        icon={Plane}
        accentColor={colors.text.secondary}
        isComplete={touring.isActive}
        isOpen={openId === 'touring'}
        onToggle={() => onToggle('touring')}
      >
        <EditTouringSection
          isActive={touring.isActive}
          expiresAtLabel={touring.expiresAtLabel}
          cep={touring.cep}
          onChangeCep={touring.onChangeCep}
          cepLoading={touring.cepLoading}
          cepError={touring.cepError}
          street={touring.street}
          onChangeStreet={touring.setStreet}
          number={touring.number}
          onChangeNumber={touring.setNumber}
          complement={touring.complement}
          onChangeComplement={touring.setComplement}
          neighborhood={touring.neighborhood}
          onChangeNeighborhood={touring.setNeighborhood}
          city={touring.city}
          onChangeCity={touring.setCity}
          state={touring.state}
          onChangeState={touring.setState}
          stateError={touring.fieldError}
          durationDays={touring.durationDays}
          onChangeDuration={touring.onChangeDuration}
          onDeactivate={touring.onDeactivate}
          isDeactivating={touring.isDeactivating}
        />
        <AccordionSaveFooter
          onSave={touring.onSave}
          isSaving={touring.isSaving}
          error={touring.error}
          label={touring.isActive ? 'Atualizar turnê' : 'Ativar modo turnê'}
        />
      </AccordionSection>

      <AccordionSection
        title="Carteira / Chave PIX"
        subtitle="Para onde vão suas gorjetas e pagamentos"
        icon={Landmark}
        accentColor={colors.text.secondary}
        isComplete={!wallet.isLoadingWallet && !!wallet.pixKey}
        isOpen={openId === 'wallet'}
        onToggle={() => onToggle('wallet')}
      >
        <EditWalletSection
          pixKeyType={wallet.pixKeyType}
          pixKey={wallet.pixKey}
          onChangeType={wallet.onChangeType}
          onChangeKey={wallet.onChangeKey}
          error={wallet.fieldError}
        />
        <AccordionSaveFooter onSave={wallet.onSave} isSaving={wallet.isSaving} error={wallet.error} />
      </AccordionSection>

      <AccordionSection
        title="QR Code"
        subtitle={qrCode.isLocked ? 'Exclusivo do plano PRO' : (musician.qr_customization ? 'Personalizado' : 'Padrão')}
        icon={QrCode}
        accentColor={colors.accent.violet}
        isComplete={!qrCode.isLocked && !!musician.qr_customization}
        locked={qrCode.isLocked}
        isOpen={openId === 'qrcode'}
        onToggle={() => onToggle('qrcode')}
      >
        <EditQRCodeSection
          qrCodeValue={musician.qr_code ?? ''}
          foregroundColor={qrCode.foregroundColor}
          onChangeForeground={qrCode.setForegroundColor}
          backgroundColor={qrCode.backgroundColor}
          onChangeBackground={qrCode.setBackgroundColor}
          label={qrCode.label}
          onChangeLabel={qrCode.setLabel}
          logoUri={qrCode.logoUri}
          onChangeLogo={qrCode.onChangeLogo}
          onRemoveLogo={qrCode.onRemoveLogo}
          isUploadingLogo={qrCode.isUploadingLogo}
          hasLowContrast={qrCode.hasLowContrast}
          isLocked={qrCode.isLocked}
        />
        {!qrCode.isLocked && (
          <AccordionSaveFooter onSave={qrCode.onSave} isSaving={qrCode.isSaving} error={qrCode.error} />
        )}
      </AccordionSection>
    </>
  );
}
