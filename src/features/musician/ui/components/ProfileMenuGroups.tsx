import { View, StyleSheet } from 'react-native';
import {
  QrCode, Music, Gauge, ChartColumn, Wallet, Crown, Users,
  CalendarDays, MessagesSquare, Pencil, ArrowLeftRight, LogOut,
} from 'lucide-react-native';
import { colors, spacing } from '@/shared/design-system/tokens';
import { ProfileMenuSection } from './ProfileMenuSection';
import { ProfileMenuRow } from './ProfileMenuRow';

type Props = {
  onPressQrCode:         () => void;
  onPressRepertoire:     () => void;
  onPressTuner:          () => void;
  onPressAnalytics:      () => void;
  onPressWallet:         () => void;
  onPressPlans:          () => void;
  onPressBands:          () => void;
  bandsBadgeCount?:      number;
  onPressAgenda:         () => void;
  onPressConversations:  () => void;
  onPressEditProfile:    () => void;
  onPressSwitchAccount:  () => void;
  onPressLogout:         () => void;
};

// Hub de navegação do Perfil (redesign jul/2026) — extraído da
// ViewProfileScreen (limite de ~200 linhas/screen) por ter 4 seções × 2-4
// linhas cada. Cada linha navega pra uma tela que já existe no app (nenhuma
// rota nova); a Home continua com seus próprios atalhos (QuickAccessGrid,
// HomeAvatarMenu) sem mudança — a duplicação é intencional, mesmo padrão
// observado em apps grandes (Spotify/Shopee/Amazon/Magalu/Telegram/WhatsApp).
export function ProfileMenuGroups({
  onPressQrCode, onPressRepertoire, onPressTuner, onPressAnalytics,
  onPressWallet, onPressPlans,
  onPressBands, bandsBadgeCount, onPressAgenda, onPressConversations,
  onPressEditProfile, onPressSwitchAccount, onPressLogout,
}: Props) {
  return (
    <View style={s.root}>
      <ProfileMenuSection title="Ferramentas">
        <ProfileMenuRow icon={QrCode} label="QR Code" accentColor={colors.accent.violet} onPress={onPressQrCode} />
        <ProfileMenuRow icon={Music} label="Repertório" onPress={onPressRepertoire} />
        <ProfileMenuRow icon={Gauge} label="Afinador" onPress={onPressTuner} />
        <ProfileMenuRow icon={ChartColumn} label="Analytics" accentColor={colors.accent.amber} onPress={onPressAnalytics} />
      </ProfileMenuSection>

      <ProfileMenuSection title="Financeiro">
        <ProfileMenuRow icon={Wallet} label="Carteira & Gorjetas" accentColor={colors.accent.violet} onPress={onPressWallet} />
        <ProfileMenuRow icon={Crown} label="Plano & Assinatura" accentColor={colors.accent.violet} onPress={onPressPlans} />
      </ProfileMenuSection>

      <ProfileMenuSection title="Comunidade">
        <ProfileMenuRow icon={Users} label="Minhas Bandas" accentColor={colors.accent.violet} onPress={onPressBands} badgeCount={bandsBadgeCount} />
        <ProfileMenuRow icon={CalendarDays} label="Agenda" onPress={onPressAgenda} />
        <ProfileMenuRow icon={MessagesSquare} label="Conversas" accentColor={colors.accent.violet} onPress={onPressConversations} />
      </ProfileMenuSection>

      <ProfileMenuSection title="Conta">
        <ProfileMenuRow icon={Pencil} label="Editar perfil" onPress={onPressEditProfile} />
        <ProfileMenuRow icon={ArrowLeftRight} label="Trocar de conta" accentColor={colors.accent.coral} onPress={onPressSwitchAccount} />
        <ProfileMenuRow icon={LogOut} label="Sair da conta" destructive onPress={onPressLogout} />
      </ProfileMenuSection>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.xxl,
  },
});
