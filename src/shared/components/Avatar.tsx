import { View, Image } from 'react-native';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';

type Props = {
  uri?:          string | null;
  size:          number;
  fallbackIcon:  LucideIcon;
  iconSize?:     number;
  // Anel gradiente opcional (mesma técnica de MusicianRecommendationCard —
  // LinearGradient com padding:2 por trás de um círculo sólido). Sem isso,
  // renderiza um círculo simples (uso do ChatHeader, menor e mais discreto).
  ringColors?: readonly [string, string, ...string[]];
};

// Círculo com Image quando há URL, ícone Lucide como fallback quando não —
// mesmo idioma já usado em MusicianRecommendationCard.tsx, extraído aqui
// porque o Bloco 9 (chat) reintroduziu o mesmo par Image-ou-ícone em dois
// lugares (ConversationListItem/ChatHeader) sem reaproveitar nada (achado
// em revisão). Não retrofita MusicianRecommendationCard (fora do escopo
// desta tarefa, diff mínimo) — mas é o candidato natural pra usar isso
// também da próxima vez que precisar mexer nele.
const useStyles = makeStyles((colors) => ({
  plain: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  ring: {
    padding:        2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  ringInner: {
    width:            '100%',
    height:           '100%',
    backgroundColor: colors.bg.surface,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  img: {
    width:  '100%',
    height: '100%',
  },
}));

export function Avatar({ uri, size, fallbackIcon: Icon, iconSize, ringColors }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const iconEl = <Icon size={iconSize ?? Math.round(size * 0.46)} color={colors.text.muted} />;
  const imgEl = uri ? <Image source={{ uri }} style={s.img} /> : iconEl;

  if (!ringColors) {
    return (
      <View style={[s.plain, { width: size, height: size, borderRadius: size }]}>
        {imgEl}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={ringColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.ring, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View style={[s.ringInner, { borderRadius: (size - 4) / 2 }]}>
        {imgEl}
      </View>
    </LinearGradient>
  );
}

