import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft, AlertTriangle, Lock, Settings2, Share2 } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ReconcileBadge } from './ReconcileBadge';

type Props = {
  title: string;
  artist: string;
  mode: 'view' | 'edit';
  conflictCount: number;
  baseChanged: boolean;
  onChangeMode: (mode: 'view' | 'edit') => void;
  onBack: () => void;
  onSettings: () => void;
  onNotes: () => void;
  onShare: () => void;
  onConflicts: () => void;
};

export function PersonalChordSheetTopBar(props: Props) {
  return (
    <View style={s.root}>
      <View style={s.mainRow}>
        <Pressable onPress={props.onBack} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Voltar">
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={s.title} numberOfLines={1}>{props.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{props.artist}</Text>
        </View>
        <Pressable onPress={props.onSettings} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Ajustes da cifra">
          <Settings2 size={20} color={colors.text.secondary} />
        </Pressable>
        <Pressable onPress={props.onNotes} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Notas privadas">
          <Lock size={19} color={colors.text.secondary} />
        </Pressable>
        <Pressable onPress={props.onShare} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Compartilhar cifra">
          <Share2 size={19} color={colors.brand.primary} />
        </Pressable>
      </View>

      <View style={s.secondaryRow}>
        <View style={s.modeToggle}>
          <ModeButton label="Visualizar" active={props.mode === 'view'} onPress={() => props.onChangeMode('view')} />
          <ModeButton label="Editar" active={props.mode === 'edit'} onPress={() => props.onChangeMode('edit')} />
        </View>
        <View style={s.badges}>
          {props.conflictCount > 0 && (
            <Pressable onPress={props.onConflicts} style={s.conflict} accessibilityRole="button" accessibilityLabel={`${props.conflictCount} conflitos`}>
              <AlertTriangle size={12} color={colors.accent.coral} />
              <Text style={s.conflictText}>{props.conflictCount}</Text>
            </Pressable>
          )}
          {props.baseChanged && <ReconcileBadge />}
        </View>
      </View>
    </View>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.modeBtn, active && s.modeBtnActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[s.modeText, active && s.modeTextActive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.sm, gap: spacing.sm },
  mainRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconBtn: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, gap: 1 },
  title: { ...typography.body, fontFamily: 'SpaceGrotesk-SemiBold', color: colors.text.primary },
  artist: { ...typography.caption, color: colors.text.secondary },
  secondaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  modeToggle: {
    flexDirection: 'row', borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border.default, overflow: 'hidden',
  },
  modeBtn: { minWidth: 92, height: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  modeBtnActive: { backgroundColor: colors.brand.muted },
  modeText: { ...typography.bodySm, color: colors.text.secondary },
  modeTextActive: { fontFamily: 'Inter-SemiBold', color: colors.brand.primary },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  conflict: {
    minHeight: 28, minWidth: 40, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing.xs, borderRadius: radius.full,
    backgroundColor: `${colors.accent.coral}1F`, paddingHorizontal: spacing.sm,
  },
  conflictText: { ...typography.caption, color: colors.accent.coral, fontFamily: 'Inter-Bold' },
});
