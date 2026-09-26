import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Nenhuma UI lê a paleta ESCURA fixa por engano.
 *
 * ## Por que existe
 *
 * `import { colors } from '@/shared/design-system/tokens'` compila, passa no
 * lint e funciona no tema escuro — e no claro pinta `text.primary` #F8FAFC
 * (quase branco) sobre o fundo #F0FEFA. Foi o relato que motivou isto (25/set/2026):
 * "a letra branca com tema claro não dava para enxergar". Havia 30 arquivos
 * assim; o sintoma só aparece com o aparelho no tema claro, e ninguém testa
 * todas as telas nos dois temas.
 *
 * A mesma armadilha tem duas formas, e as duas entram aqui:
 *  - o import direto do `colors` estático;
 *  - texto branco escrito à mão (`color: 'rgba(255,255,255,…)'` / `'#FFF'`).
 *
 * ## As exceções são intencionais — e têm de dizer por quê
 *
 * Superfície que é escura nos DOIS temas (cartão que vira imagem para o
 * Instagram, texto sobre a câmera, texto sobre gradiente coral) pode e deve
 * usar a paleta fixa. Nesses casos o arquivo importa com ALIAS
 * (`colors as cameraColors`) ou entra na allowlist abaixo com o motivo.
 */

const STATIC_PALETTE_ALLOWED: Record<string, string> = {
  'src/features/musician/ui/components/ShowRecapCard.tsx':
    'vira imagem compartilhável; desenha o próprio fundo escuro',
  'src/features/musician/ui/components/QRShareCard.tsx':
    'vira imagem compartilhável; desenha o próprio fundo escuro',
  'src/features/audience/ui/components/TipReceiptCard.tsx':
    'vira imagem compartilhável; desenha o próprio fundo escuro',
};

/** Texto branco fixo só onde o fundo é gradiente/coral nos dois temas. */
const WHITE_TEXT_ALLOWED: Record<string, string> = {
  'src/features/musician/ui/components/RequestCard.tsx':           'selo sobre gradients.energy',
  'src/features/audience/ui/components/RequestBoostSection.tsx':   'selo sobre gradients.energy',
  'src/features/audience/ui/components/RequestBoostPaymentSheet.tsx': 'selo sobre gradients.energy',
  'src/features/audience/ui/components/PendingBoostHost.tsx':      'banner sobre gradients.energy',
  'src/navigation/components/TabBarItem.tsx':                      'contador sobre accent.coral',
  'src/navigation/components/TabBarFabItem.tsx':                   'contador sobre accent.coral',
};

function sourceFiles(): string[] {
  const list = (cmd: string) => {
    const out = execSync(cmd, { cwd: process.cwd(), encoding: 'utf-8' }).trim();
    return out ? out.split('\n') : [];
  };
  return [
    ...list('git ls-files "src/**/*.tsx"'),
    ...list('git ls-files --others --exclude-standard "src/**/*.tsx"'),
  ].filter((file) => existsSync(file) && !file.includes('__tests__'));
}

function importsStaticColors(source: string): boolean {
  const imports = source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'[^']*design-system(?:\/tokens)?'/g);
  for (const match of imports) {
    const names = match[1]!.split(',').map((n) => n.trim());
    if (names.includes('colors')) return true;
  }
  return false;
}

describe('cobertura do tema nas telas', () => {
  const files = sourceFiles();

  it('encontra os arquivos de UI (guarda do próprio teste)', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('nenhuma UI importa a paleta escura fixa sem motivo registrado', () => {
    const offenders = files.filter(
      (file) => !STATIC_PALETTE_ALLOWED[file] && importsStaticColors(readFileSync(file, 'utf-8')),
    );
    expect(offenders).toEqual([]);
  });

  it('nenhum texto branco escrito à mão fora de fundo coral/gradiente', () => {
    const offenders: string[] = [];
    const whiteText = /\bcolor:\s*'(?:#fff|#ffffff|white|rgba\(255, ?255, ?255, ?(?:0?\.[3-9]\d*|1)\))'|\bcolor="#(?:fff|ffffff)"/gi;

    for (const file of files) {
      if (WHITE_TEXT_ALLOWED[file]) continue;
      const source = readFileSync(file, 'utf-8');
      for (const match of source.matchAll(whiteText)) {
        const line = source.slice(0, match.index).split('\n').length;
        offenders.push(`${file}:${line} — ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
