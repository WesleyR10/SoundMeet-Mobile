import { View, Text, StyleSheet } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { UserPoints } from '@/shared/services/gamification/gamification.types';

type Props = {
  entry:    UserPoints;
  position: number;
  isSelf:   boolean;
};

// Sem cores de medalha "reais" (ouro/prata/bronze) hardcoded — só tokens do
// design system (CLAUDE.md: "toda cor vem de tokens.ts"), diferenciando o
// top-3 com os accents já existentes em vez de introduzir hex novo.
const MEDAL_COLOR: Record<number, string> = {
  1: colors.accent.amber,
  2: colors.text.secondary,
  3: colors.accent.coral,
};

// GET /gamification/leaderboard não retorna nome/avatar (só user_id) — e um
// fã não pode consultar o perfil de OUTRO fã (GET /audiences/:id é dono/
// admin-only) pra resolver isso. Mostra posição + nível + pontos, sem nome
// fabricado (ver soundmeet-backend/Docs/roadmap.md Bloco 7.16).
export function LeaderboardRow({ entry, position, isSelf }: Props) {
  const medalColor = MEDAL_COLOR[position];

  return (
    <View style={[s.row, isSelf && s.rowSelf]}>
      <View style={[s.position, medalColor && { backgroundColor: `${medalColor}24` }]}>
        {medalColor ? (
          <Trophy size={16} color={medalColor} fill={medalColor} />
        ) : (
          <Text style={s.positionText}>{position}</Text>
        )}
      </View>

      <View style={s.info}>
        <Text style={s.name}>{isSelf ? 'Você' : `Fã #${entry.user_id.slice(0, 6)}`}</Text>
        <Text style={s.level}>Nível {entry.current_level} · {entry.level_info.name}</Text>
      </View>

      <Text style={s.points}>{entry.total_points} pts</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.md,
    borderRadius:   radius.lg,
    borderWidth:     1,
    borderColor:    colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding:          spacing.md,
  },
  rowSelf: {
    borderColor:     colors.border.brand,
    backgroundColor: colors.brand.muted,
  },
  position: {
    width:            32,
    height:           32,
    borderRadius:     radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  positionText: {
    ...typography.bodySm,
    fontFamily: 'Inter-Bold',
    color:      colors.text.secondary,
  },
  info: { flex: 1, gap: 2 },
  name: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  level: {
    ...typography.caption,
    color: colors.text.muted,
  },
  points: {
    ...typography.body,
    fontFamily: 'SpaceGrotesk-SemiBold',
    color:      colors.accent.amber,
  },
});
