import { View, Image, Pressable, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import { colors } from '@/shared/design-system/tokens';

// Extraído de StepThreePhoto.tsx (Bloco 1.13) para ser reaproveitado também
// pelo EditProfileScreen (Bloco 2) — mesma permissão + launch do picker, sem
// duplicar a lógica em dois lugares.
export async function pickAvatarImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão necessária', 'Precisamos acessar suas fotos para definir sua foto de perfil.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:    'images',
    allowsEditing: true,
    aspect:        [1, 1],
    quality:        0.7,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

type Props = {
  uri:      string | null;
  onChange: (uri: string) => void;
  size?:    number;
};

export function AvatarPicker({ uri, onChange, size = 128 }: Props) {
  const handlePick = async () => {
    const picked = await pickAvatarImage();
    if (picked) onChange(picked);
  };

  const dimension = { width: size, height: size, borderRadius: size / 2 };

  return (
    <Pressable
      onPress={handlePick}
      style={s.wrap}
      accessibilityRole="button"
      accessibilityLabel="Escolher foto de perfil"
    >
      {uri ? (
        <Image source={{ uri }} style={[s.avatar, dimension]} />
      ) : (
        <View style={[s.avatar, s.placeholder, dimension]}>
          <User size={size * 0.31} color={colors.text.muted} />
        </View>
      )}
      <View style={s.badge}>
        <Camera size={16} color={colors.text.inverse} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
  avatar: {},
  placeholder: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:      1,
    borderColor:     colors.border.default,
  },
  badge: {
    position:        'absolute',
    right:            0,
    bottom:           0,
    width:            36,
    height:           36,
    borderRadius:     18,
    backgroundColor: colors.brand.primary,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:      3,
    borderColor:     colors.bg.primary,
  },
});
