import { View, StyleSheet } from 'react-native';
import {
  QrCode, Music, Gauge, ChartColumn, Wallet, Crown, Users,
  CalendarDays, MessagesSquare, Inbox, FileSignature, BadgeCheck, Disc3,
} from 'lucide-react-native';
import { spacing } from '@/shared/design-system/tokens';
import { useTheme } from '@/shared/hooks/useTheme';
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
  onPressInquiries:      () => void;
  onPressContracts:      () => void;
  onPressResume:         () => void;
  onPressShowHistory:    () => void;
};

// Hub de navegação do Perfil (redesign jul/2026) — extraído da
// ViewProfileScreen (limite de ~200 linhas/screen). Cada linha navega pra uma
// tela que já existe no app (nenhuma rota nova); a Home continua com seus
// próprios atalhos (QuickAccessGrid, HomeAvatarMenu) sem mudança — a
// duplicação é intencional, mesmo padrão observado em apps grandes
// (Spotify/Shopee/Amazon/Magalu/Telegram/WhatsApp).
//
// A seção "Conta" saiu daqui para ProfileAccountSection: a tela precisa
// posicioná-la por último, depois de Informações e Links Sociais.
export function ProfileMenuGroups({
  onPressQrCode, onPressRepertoire, onPressTuner, onPressAnalytics,
  onPressWallet, onPressPlans,
  onPressBands, bandsBadgeCount, onPressAgenda, onPressConversations, onPressInquiries,
  onPressContracts, onPressResume, onPressShowHistory,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={s.root}>
      <ProfileMenuSection title="Ferramentas">
        <ProfileMenuRow icon={QrCode} label="QR Code" accentColor={colors.accent.violet} onPress={onPressQrCode} />
        <ProfileMenuRow icon={Music} label="Repertório" onPress={onPressRepertoire} />
        <ProfileMenuRow icon={Gauge} label="Afinador" onPress={onPressTuner} />
        <ProfileMenuRow icon={ChartColumn} label="Analytics" accentColor={colors.accent.amber} onPress={onPressAnalytics} />
        {/* Currículo verificado (F4) — não é analytics: analytics é métrica de
            engajamento para o próprio músico; o currículo é prova para
            terceiros, e aparece também no perfil que o público vê. */}
        <ProfileMenuRow icon={BadgeCheck} label="Currículo verificado" onPress={onPressResume} />
        <ProfileMenuRow icon={Disc3} label="Meus shows" accentColor={colors.accent.amber} onPress={onPressShowHistory} />
      </ProfileMenuSection>

      <ProfileMenuSection title="Financeiro">
        <ProfileMenuRow icon={Wallet} label="Carteira & Gorjetas" accentColor={colors.accent.violet} onPress={onPressWallet} />
        <ProfileMenuRow icon={Crown} label="Plano & Assinatura" accentColor={colors.accent.violet} onPress={onPressPlans} />
      </ProfileMenuSection>

      <ProfileMenuSection title="Comunidade">
        <ProfileMenuRow icon={Users} label="Minhas Bandas" accentColor={colors.accent.violet} onPress={onPressBands} badgeCount={bandsBadgeCount} />
        <ProfileMenuRow icon={CalendarDays} label="Agenda" onPress={onPressAgenda} />
        <ProfileMenuRow icon={MessagesSquare} label="Conversas" accentColor={colors.accent.violet} onPress={onPressConversations} />
        {/* Propostas (A3/F1.2) — sem badgeCount: a contagem viria de
            features/scheduling e FSD proíbe import cross-feature. */}
        <ProfileMenuRow icon={Inbox} label="Propostas" accentColor={colors.accent.amber} onPress={onPressInquiries} />
        {/* Contratos (B4/Bloco 10) — sem badgeCount pelo mesmo motivo da linha
            acima: a contagem viria de features/contract, e FSD proíbe import
            cross-feature. */}
        <ProfileMenuRow icon={FileSignature} label="Contratos" accentColor={colors.accent.violet} onPress={onPressContracts} />
      </ProfileMenuSection>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.xxl,
  },
});
