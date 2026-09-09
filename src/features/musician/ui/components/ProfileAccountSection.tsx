import { View, StyleSheet } from 'react-native';
import { Pencil, ArrowLeftRight, LogOut } from 'lucide-react-native';
import { spacing } from '@/shared/design-system/tokens';
import { useTheme } from '@/shared/hooks/useTheme';
import { ProfileMenuSection } from './ProfileMenuSection';
import { ProfileMenuRow } from './ProfileMenuRow';
import { ThemeMenuRow } from '@/shared/components/ThemeMenuRow';

type Props = {
  onPressEditProfile:   () => void;
  onPressSwitchAccount: () => void;
  onPressLogout:        () => void;
};

// Separado de ProfileMenuGroups para que a TELA decida a posição: "Conta"
// fecha o perfil, depois de Informações e Links Sociais. Enquanto vivia dentro
// do grupo de menu, "Sair da conta" caía no meio da página com conteúdo de
// perfil embaixo — ação terminal no meio do caminho.
//
// Reaproveita ProfileMenuSection/ProfileMenuRow, então o visual é o mesmo dos
// outros grupos; só o ponto de montagem mudou.
export function ProfileAccountSection({
  onPressEditProfile, onPressSwitchAccount, onPressLogout,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={s.root}>
      {/*
        Aparência fica ACIMA de "Conta": é preferência, não ação de conta — e
        "Sair da conta" tem de continuar sendo a última linha da tela.
      */}
      <ThemeMenuRow />

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
