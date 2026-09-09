import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Todo `<Pressable>` do app declara alguma prop de acessibilidade.
 *
 * ## Por que existe
 *
 * O `CLAUDE.md` exige `accessibilityLabel` em todo elemento interativo sem
 * texto visível desde sempre, e a cobertura real era ótima — **235 de 240**.
 * O problema é que os 5 que faltavam não produziam erro nenhum: não quebram
 * o `tsc`, não quebram o lint, não quebram a tela. Só somem para quem navega
 * por leitor de tela, e ninguém descobre até alguém testar com o TalkBack
 * ligado.
 *
 * 🔴 Os 5 estavam todos na MESMA feature (cifra pessoal / comunidade), que é o
 * padrão que este teste existe para pegar: a lacuna não chega espalhada, chega
 * em bloco, quando uma fatia inteira é escrita sem o hábito. Varrer o
 * repositório inteiro é o que transforma "esqueci num arquivo" em erro de
 * suíte — mesmo precedente do `route-auth-coverage.spec.ts` do backend, que
 * varre o grafo de módulos em vez de confiar em revisão.
 *
 * ## O que ele NÃO garante
 *
 * ⚠️ Ele checa *presença*, não *qualidade*. `accessibilityLabel="botão"` passa
 * aqui e continua inútil no aparelho. A regra que ele mecaniza é a barata (não
 * esquecer); a cara — o rótulo dizer o que a ação faz — continua sendo revisão
 * humana.
 *
 * ⚠️ Cobre `<Pressable>` porque é o primitivo padrão do projeto.
 * `TouchableOpacity` é legado e não aparece em `src/`; se voltar, entra aqui.
 */

/** Lê a tag de abertura inteira, respeitando `{}` aninhado nas props. */
function openingTags(source: string, tagName: string): { tag: string; line: number }[] {
  const found: { tag: string; line: number }[] = [];
  const needle = `<${tagName}`;
  let index = source.indexOf(needle);

  while (index !== -1) {
    // `<PressableFoo` não é `<Pressable` — o caractere seguinte tem de fechar
    // o nome da tag, senão um componente com prefixo igual entraria na conta.
    const next = source[index + needle.length];
    if (next && !/[\s/>]/.test(next)) {
      index = source.indexOf(needle, index + needle.length);
      continue;
    }

    // Um `>` dentro de `{...}` (arrow function, generic, comparação) não
    // fecha a tag. Sem contar chaves, a varredura corta a prop no meio e
    // `accessibilityLabel` escrito depois dela passaria por ausente.
    let depth = 0;
    let end = -1;
    for (let i = index + needle.length; i < source.length; i++) {
      const char = source[i];
      if (char === '{') depth++;
      else if (char === '}') depth--;
      else if (char === '>' && depth === 0) {
        end = i;
        break;
      }
    }
    if (end === -1) break;

    found.push({
      tag:  source.slice(index, end + 1),
      line: source.slice(0, index).split('\n').length,
    });
    index = source.indexOf(needle, end);
  }

  return found;
}

function sourceFiles(): string[] {
  // `git ls-files` em vez de walk manual: respeita o `.gitignore` de graça e
  // nunca entra em `node_modules`.
  const output = execSync('git ls-files "src/**/*.tsx"', {
    cwd:      process.cwd(),
    encoding: 'utf-8',
  }).trim();
  const tracked = output ? output.split('\n') : [];

  // Arquivo novo ainda não adicionado ao git é justamente onde a lacuna
  // costuma nascer — incluí-lo é o ponto do teste.
  const untracked = execSync(
    'git ls-files --others --exclude-standard "src/**/*.tsx"',
    { cwd: process.cwd(), encoding: 'utf-8' },
  ).trim();

  // ⚠️ `git ls-files` lista o que o índice conhece, e isso inclui arquivo
  // APAGADO na cópia de trabalho e ainda não commitado — foi o que aconteceu
  // com o `EmptyState.tsx` promovido para `shared/`. Sem o filtro, a varredura
  // morre em ENOENT por um arquivo que deixou de existir de propósito.
  return [...tracked, ...(untracked ? untracked.split('\n') : [])].filter(
    (file) => existsSync(file),
  );
}

describe('cobertura de acessibilidade dos <Pressable>', () => {
  const files = sourceFiles();

  it('encontra os arquivos de UI (guarda do próprio teste)', () => {
    // 🔴 Sem isto, um erro no `git ls-files` devolveria lista vazia e o teste
    // abaixo passaria em verde tendo verificado NADA — o modo de falha mais
    // perigoso de uma varredura.
    expect(files.length).toBeGreaterThan(100);
  });

  it('todo <Pressable> declara ao menos uma prop accessibility*', () => {
    const offenders: string[] = [];
    let total = 0;

    for (const file of files) {
      const source = readFileSync(file, 'utf-8');
      if (!source.includes('<Pressable')) continue;

      for (const { tag, line } of openingTags(source, 'Pressable')) {
        total++;
        if (!/accessibility/.test(tag)) {
          offenders.push(`${file}:${line} — ${tag.replace(/\s+/g, ' ').slice(0, 100)}`);
        }
      }
    }

    // A contagem entra na asserção para que o teste também morra se a
    // varredura parar de achar Pressable por mudança de sintaxe.
    expect(total).toBeGreaterThan(200);
    expect(offenders).toEqual([]);
  });
});
