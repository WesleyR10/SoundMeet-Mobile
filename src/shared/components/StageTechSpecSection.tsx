import { View, Text, StyleSheet } from 'react-native';
import { Speaker, Drum, Ruler, Clock } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { GlowCard } from '@/shared/components/GlowCard';

/**
 * Forma da ficha técnica esperada por este componente.
 *
 * Declarada AQUI, e não importada de uma feature, porque o componente é
 * consumido por duas: `audience` (fã olhando o perfil da casa) e `scheduling`
 * (músico decidindo se aceita a proposta). FSD proíbe `features/X` importar de
 * `features/Y`, e a tipagem estrutural do TypeScript faz o `StageTechSpec` de
 * cada feature satisfazer esta forma sem nenhuma conversão.
 *
 * Espelha `StageTechSpecJSON` de
 * `../soundmeet-backend/src/core/shared/domain/value-objects/stage-tech-spec.vo.ts`.
 */
export interface StageTechSpecView {
  hasPa:            boolean | null;
  mixerChannels:    number | null;
  monitors:         number | null;
  hasMicrophones:   number | null;
  backline:         string[];
  dimensions:       { widthM: number | null; depthM: number | null; heightM: number | null } | null;
  power:            { outlets: number | null; voltage: string | null } | null;
  hasParking:       boolean | null;
  hasSoundEngineer: boolean | null;
  soundcheckWindow: string | null;
  notes:            string | null;
}

interface Props {
  spec: StageTechSpecView | null;
  /** Título da seção. `null` esconde — dentro de um sheet ele já tem cabeçalho. */
  title?: string | null;
  /** Repassado ao `GlowCard`: desliga a entrada animada. */
  animated?: boolean;
  /** Atraso base do stagger, em ms. Útil para encadear com o conteúdo acima. */
  riseDelay?: number;
}

/**
 * Ficha técnica do palco (A3) — o que a casa oferece de estrutura.
 *
 * Vive em `shared/` porque responde à mesma pergunta para duas personas: o fã
 * que navega o perfil da casa e, principalmente, o músico decidindo se aceita
 * uma proposta. É nesse segundo caso que ela paga — a falha clássica é chegar
 * no local e não haver retorno.
 *
 * ⚠️ **Só mostra o que foi respondido.** Campo `null` some em vez de virar
 * "não informado" — uma ficha meio preenchida vira uma lista curta e confiável,
 * não uma lista longa cheia de lacunas.
 *
 * ⚠️ **`false` e `0` APARECEM.** As comparações são contra `null`
 * explicitamente, nunca falsy: `hasPa: false` ("não tem PA") e `monitors: 0`
 * ("nenhum retorno") são as informações mais úteis da tela para quem vai tocar,
 * e um `spec.hasPa &&` as apagaria justamente quando têm o que dizer.
 */
export function StageTechSpecSection({
  spec,
  title = 'Estrutura do palco',
  animated = true,
  riseDelay = 0,
}: Props) {
  if (!spec) return null;

  const groups = [
    {
      key:   'som',
      Icon:  Speaker,
      title: 'Som',
      items: [
        boolItem(spec.hasPa, 'PA (som da casa)'),
        countItem(spec.mixerChannels, 'canais na mesa'),
        countItem(spec.monitors, 'retornos de palco'),
        countItem(spec.hasMicrophones, 'microfones'),
        boolItem(spec.hasSoundEngineer, 'técnico de som'),
      ].filter(isPresent),
    },
    { key: 'backline', Icon: Drum, title: 'Backline', items: spec.backline },
    {
      key:   'estrutura',
      Icon:  Ruler,
      title: 'Palco e estrutura',
      items: [
        dimensionsItem(spec.dimensions),
        powerItem(spec.power),
        boolItem(spec.hasParking, 'estacionamento'),
      ].filter(isPresent),
    },
  ].filter((group) => group.items.length > 0);

  const hasSoundcheck = spec.soundcheckWindow !== null;

  // Ficha inteiramente vazia é indistinguível de não ter ficha — não anuncia
  // uma seção sem conteúdo.
  if (groups.length === 0 && !hasSoundcheck && spec.notes === null) {
    return null;
  }

  return (
    <View style={s.section}>
      {title !== null && <Text style={s.sectionTitle}>{title}</Text>}

      {/*
       * `GlowCard` com `riseDelay` crescente é o stagger canônico do app —
       * mesma primitiva e mesmo passo de 60ms usados em `RepertoireListScreen`,
       * `MyBandsScreen` e `ConversationListScreen`. Sem o atraso os blocos
       * aparecem de uma vez e o movimento lê como "piscar", não como revelação.
       */}
      {groups.map(({ key, Icon, title: groupTitle, items }, index) => (
        <GlowCard key={key} animated={animated} riseDelay={riseDelay + index * 60} style={s.group}>
          <View style={s.groupHeader}>
            <Icon size={16} color={colors.brand.primary} />
            <Text style={s.groupTitle}>{groupTitle}</Text>
          </View>
          <View style={s.chips}>
            {items.map((item) => (
              <View key={item} style={s.chip}>
                <Text style={s.chipText}>{item}</Text>
              </View>
            ))}
          </View>
        </GlowCard>
      ))}

      {hasSoundcheck && (
        <GlowCard
          animated={animated}
          riseDelay={riseDelay + groups.length * 60}
          style={s.group}
        >
          <View style={s.groupHeader}>
            <Clock size={16} color={colors.brand.primary} />
            <Text style={s.groupTitle}>Passagem de som</Text>
          </View>
          <Text style={s.body}>{spec.soundcheckWindow!.replace('-', ' às ')}</Text>
        </GlowCard>
      )}

      {spec.notes !== null && <Text style={s.notes}>{spec.notes}</Text>}
    </View>
  );
}

/** `true` → "PA (som da casa)"; `false` → "Sem PA (som da casa)"; `null` → some. */
function boolItem(value: boolean | null, label: string): string | null {
  if (value === null) return null;
  return value ? label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1) : `Sem ${label}`;
}

function countItem(value: number | null, label: string): string | null {
  // Zero é resposta: "0 retornos" é mais honesto que omitir a linha.
  return value === null ? null : `${value} ${label}`;
}

function dimensionsItem(dimensions: StageTechSpecView['dimensions']): string | null {
  if (!dimensions) return null;
  const { widthM, depthM, heightM } = dimensions;

  // Largura × profundidade é o par que responde "a banda cabe?"; a altura
  // sozinha não diz nada útil, então só entra como complemento.
  const base =
    widthM !== null && depthM !== null ? `Palco ${fmt(widthM)} × ${fmt(depthM)} m`
    : widthM !== null                  ? `Palco com ${fmt(widthM)} m de largura`
    : depthM !== null                  ? `Palco com ${fmt(depthM)} m de profundidade`
    : null;

  if (base === null) return heightM !== null ? `Palco com ${fmt(heightM)} m de altura` : null;
  return heightM !== null ? `${base} (${fmt(heightM)} m de altura)` : base;
}

function powerItem(power: StageTechSpecView['power']): string | null {
  if (!power) return null;
  const parts: string[] = [];
  if (power.outlets !== null) parts.push(`${power.outlets} tomadas`);
  if (power.voltage !== null) parts.push(power.voltage);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** `0.4` → "0,4" — vírgula decimal, que é o que o Brasil lê. */
function fmt(value: number): string {
  return String(value).replace('.', ',');
}

function isPresent(value: string | null): value is string {
  return value !== null;
}

const s = StyleSheet.create({
  section: { gap: spacing.md },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  group: { gap: spacing.sm },
  groupHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  groupTitle: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
  chip: {
    borderRadius:    radius.full,
    borderWidth:      1,
    borderColor:     colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical:   6,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
  },
  notes: {
    ...typography.bodySm,
    color:            colors.text.muted,
    borderLeftWidth:   2,
    borderLeftColor:  colors.border.default,
    paddingLeft:       spacing.md,
  },
});
