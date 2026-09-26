import { ActivityIndicator, Alert, Image, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Camera, User } from 'lucide-react-native';
import { gradients, radius, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { pickAvatarImage } from '@/shared/components/AvatarPicker';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useQuickAvatarChange } from '../../application/useQuickAvatarChange';

type Props = { avatarUrl: string | null };

const SIZE = 108;
const BADGE = 34;

/*
 * A foto do Perfil é o próprio botão de trocá-la — é onde o dedo vai primeiro.
 * O selo de câmera existe porque um toque que ninguém descobre não existe.
 */
const useStyles = makeStyles((colors) => ({
  ring: {
    width:          SIZE,
    height:         SIZE,
    borderRadius:   SIZE / 2,
    padding:        3,
    alignItems:     'center',
    justifyContent: 'center',
    ...shadows.violet,
  },
  inner: {
    width:           '100%',
    height:          '100%',
    borderRadius:    SIZE / 2,
    backgroundColor: colors.bg.surface,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  img:     { width: '100%', height: '100%' },
  overlay: {
    position:        'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.bg.overlay,
  },
  badge: {
    position:        'absolute',
    right:           0,
    bottom:          0,
    width:           BADGE,
    height:          BADGE,
    borderRadius:    radius.full,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.brand.primary,
    borderWidth:     3,
    borderColor:     colors.bg.primary,
  },
  pressed: { transform: [{ scale: 0.96 }] },
}));

export function ProfileAvatarButton({ avatarUrl }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((state) => state.user?.musicianId ?? null);
  const { change, previewUri, uploading } = useQuickAvatarChange(musicianId);
  const shown = previewUri ?? avatarUrl;

  const onPress = async () => {
    const uri = await pickAvatarImage();
    if (!uri) return;
    const result = await change(uri);
    if (result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Não deu para trocar a foto', result.message);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={uploading}
      style={({ pressed }) => pressed && s.pressed}
      accessibilityRole="button"
      accessibilityLabel="Trocar foto de perfil"
      accessibilityState={{ busy: uploading, disabled: uploading }}
    >
      <LinearGradient colors={gradients.premium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ring}>
        <View style={s.inner}>
          {shown ? <Image source={{ uri: shown }} style={s.img} /> : <User size={40} color={colors.text.muted} />}
          {uploading && (
            <View style={s.overlay}>
              <ActivityIndicator color={colors.brand.primary} />
            </View>
          )}
        </View>
      </LinearGradient>
      <View style={s.badge}>
        <Camera size={16} color={colors.text.inverse} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}
