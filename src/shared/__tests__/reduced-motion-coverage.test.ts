import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Toda animação CONTÍNUA (`withRepeat`) respeita "reduzir movimento".
 *
 * ## Por que existe
 *
 * O app tinha o hook (`useReducedMotion`) e a decisão escrita no `CLAUDE.md`
 * — *"reduce motion desliga o pulso, não o encurta"* — aplicados a **2**
 * lugares: `TipCelebrationOverlay` e `Skeleton`. Os outros **16** componentes
 * com `withRepeat` ignoravam a preferência.
 *
 * 🔴 **E eram justamente os piores.** `withRepeat(…, -1, …)` é movimento
 * perpétuo: glow de fundo em quase toda tela (`AmbientGlowBackground`),
 * partículas flutuando, barras de equalizador, anéis girando atrás do logo no
 * onboarding, borda percorrendo o campo em foco. Animação curta e local
 * incomoda pouco; movimento ambiente que nunca para é exatamente o que
 * provoca desconforto vestibular em quem liga a preferência.
 *
 * A ausência não produzia erro nenhum — nem `tsc`, nem lint, nem tela
 * quebrada. Só um app que ignora uma preferência de acessibilidade do sistema.
 *
 * ## O que ele NÃO garante
 *
 * ⚠️ Checa que o arquivo **consulta** a preferência, não que o estado de
 * repouso escolhido seja o certo. Essa parte é decisão de design e está
 * comentada caso a caso — e não é mecânica: em `RadarPulseIndicator` parar em
 * zero diria "indisponível para shows", o oposto do dado; em `BadgeGrid`
 * apagaria a conquista; no `TabBarFabItem` esconderia um pedido pendente.
 * Por isso vários param no valor ALTO, não no inicial.
 *
 * ⚠️ Cobre só `withRepeat`. Transição única e curta (entrada de tela, mola de
 * toque) fica de fora **de propósito** — desligá-la faria a interface aparecer
 * estalada, sem ganho para quem pediu menos movimento.
 */

function sourceFiles(): string[] {
  const run = (cmd: string) =>
    execSync(cmd, { cwd: process.cwd(), encoding: 'utf-8' }).trim();

  const tracked = run('git ls-files "src/**/*.tsx"');
  // Arquivo novo ainda fora do git é onde a lacuna nasce.
  const untracked = run('git ls-files --others --exclude-standard "src/**/*.tsx"');

  return [...(tracked ? tracked.split('\n') : []), ...(untracked ? untracked.split('\n') : [])]
    // `git ls-files` conhece o índice, e o índice inclui arquivo apagado na
    // cópia de trabalho e ainda não commitado.
    .filter((file) => existsSync(file));
}

describe('cobertura de reduce motion nas animações contínuas', () => {
  const files = sourceFiles();

  it('encontra os arquivos de UI (guarda do próprio teste)', () => {
    // Uma varredura que devolve lista vazia passaria em verde tendo
    // verificado nada — o pior modo de falha deste tipo de teste.
    expect(files.length).toBeGreaterThan(100);
  });

  it('todo arquivo com withRepeat consulta useReducedMotion', () => {
    const offenders: string[] = [];
    let animated = 0;

    for (const file of files) {
      const source = readFileSync(file, 'utf-8');
      if (!source.includes('withRepeat')) continue;

      animated++;
      if (!source.includes('useReducedMotion')) offenders.push(file);
    }

    expect(animated).toBeGreaterThan(10);
    expect(offenders).toEqual([]);
  });
});
