#!/usr/bin/env python3
"""
Migra um arquivo de `StyleSheet.create` (paleta fixa) para `makeStyles` (tema).

## Por que este script RECUSA mais do que aceita

A primeira versão migrava tudo que casasse com o padrão feliz e estragou três
arquivos de formas diferentes — mapa de cor em constante de módulo
(`PrimaryButton`), arquivo com vários componentes (`Skeleton`), helper usando
cor fora do componente principal (`QRFrame`). Nenhuma quebra apareceu como erro
de estilo: apareceram como `tsc` vermelho, e num caso teria passado batido se o
arquivo não tivesse tipo.

Migração de cor em lote é como se introduz regressão visual em massa. Então
aqui a regra é: **na dúvida, recusa e diz o motivo.** O que ele recusa é
trabalho manual, não erro.

Uso:
    python3 scripts/migrate-theme.py <arquivo...>
    python3 scripts/migrate-theme.py --dry <arquivo...>   # só classifica
"""
import re
import sys

TOKENS_IMPORT = r"^import \{([^}]*)\} from '@/shared/design-system/tokens';$"


def classify(src: str, prepared: bool = False) -> tuple[str, str]:
    """`prepared=True`: o autor JÁ injetou `useStyles()`/`useTheme()` nos
    componentes auxiliares à mão. Só então a checagem de helper é dispensada —
    ela existe justamente porque o hook do exportado não alcança ali."""
    """Devolve (situação, motivo). Situação 'ok' = seguro automatizar."""
    if 'makeStyles' in src:
        return 'pulado', 'já migrado'

    sheets = re.findall(r'const \w+ = StyleSheet\.create\(', src)
    if not sheets:
        return 'pulado', 'sem StyleSheet.create'
    if len(sheets) > 1:
        return 'manual', f'{len(sheets)} folhas de estilo no arquivo'

    m = re.search(r'\nconst s = StyleSheet\.create\((\{.*\})\);\s*$', src, re.S)
    if not m:
        return 'manual', 'folha não é `const s = …` no fim do arquivo'

    block = m.group(1)
    if 'colors.' not in block:
        # ⚠️ Folha sem cor NÃO significa arquivo sem cor: `ChordDiagram`,
        # `CelebrationBurst` e `AmbientGlowBackground` passam `colors.*` como
        # PROP (`stroke`, `color`, `glows`), fora de qualquer StyleSheet. A
        # primeira versão deste script os classificava como "estático" e eles
        # ficariam presos no dark para sempre — invisível, porque nada quebra.
        if 'colors.' in src:
            return 'manual', 'usa `colors` em prop, fora da folha (precisa de useTheme)'
        return 'pulado', 'não usa cor — deve continuar estático'

    head = src[:m.start()]

    # 🔴 Constante de módulo que lê `colors` congela a paleta no carregamento.
    # `PrimaryButton` tinha três; o codemod antigo as deixava intactas e o
    # botão continuaria teal-neon sobre fundo claro.
    # Objeto OU array: `HOME_GLOWS = [...]` escapava da versão que só olhava
    # `{...}`, e o arquivo era migrado com a paleta dark congelada dentro.
    for const in re.finditer(r'^const \w+(?::[^=]+)? = [\[{].*?^\];?|^const \w+(?::[^=]+)? = \{[^}]*\}',
                             head, re.M | re.S):
        if 'colors.' in const.group(0):
            return 'manual', 'constante de módulo usa `colors` (congela a paleta)'

    # 🔴 `accentColor = colors.brand.primary` na ASSINATURA é avaliado fora do
    # corpo do componente — o `colors` do hook não existe naquele escopo. O
    # padrão correto é `accentColor?: string` e `accentColor ?? colors.…`
    # dentro. Pega `AccordionSection`, `GlowCard`, `MultiSelectChip`.
    if re.search(r'=\s*colors\.[\w.]+\s*[,)}\n]', head):
        return 'manual', 'valor padrão de parâmetro usa `colors` (fora do escopo do hook)'

    exported = re.findall(r'^export function (\w+)', head, re.M)
    if len(exported) != 1:
        return 'manual', f'{len(exported)} componentes exportados'

    # Componente auxiliar (não exportado) que usa a folha ou cor: o hook
    # injetado no exportado não alcança ali. `FanExploreScreen` tinha um —
    # `ResultList<T extends …>`, cuja assinatura genérica escapava de um regex
    # que casava só `nome(args)`. Por isso a varredura é por BLOCO, do
    # `^function` até a próxima `}` na coluna zero.
    for fn in (() if prepared else re.finditer(r'^function (\w+)', head, re.M)):
        rest = head[fn.start():]
        # `^\}$`, não `^\}`: a assinatura de `ResultList<T extends …>({…}: {`
        # fecha com `}) {` na coluna zero, e um `^\}` solto truncava o bloco
        # ANTES do corpo — o helper passava como limpo.
        close = re.search(r'^\}$', rest[1:], re.M)
        block = rest[: close.end() + 1] if close else rest
        if re.search(r'\bs\.\w+', block) or 'colors.' in block:
            return 'manual', f'`{fn.group(1)}` usa folha/cor fora do componente exportado'

    # Helper que usa cor fora do componente exportado não alcança o hook.
    for fn in (() if prepared else re.finditer(r'^function (\w+)\([^)]*\)[^{]*\{(.*?)^\}', head, re.M | re.S)):
        if 'colors.' in fn.group(2):
            return 'manual', f'helper `{fn.group(1)}` usa `colors` fora do componente'

    return 'ok', 'forma simples'


def migrate(path: str, dry: bool, prepared: bool = False) -> str:
    src = open(path, encoding='utf-8').read()
    status, reason = classify(src, prepared)
    if dry or status != 'ok':
        return f'{status:8s} {reason}'

    m = re.search(r'\nconst s = StyleSheet\.create\((\{.*\})\);\s*$', src, re.S)
    block = m.group(1)
    head = src[:m.start()]
    needs_hook = bool(re.search(r'\bcolors\.', head))

    src = src[:m.start()] + src[m.end():]
    sheet = f'const useStyles = makeStyles((colors) => ({block}));'

    fn = re.search(r'^export function \w+', src, re.M)
    src = src[:fn.start()] + sheet + '\n\n' + src[fn.start():]

    body = re.search(r'^export function \w+\([^)]*\)[^{]*\{\n', src, re.M)
    inject = '  const s = useStyles();\n'
    if needs_hook:
        inject += '  const { colors } = useTheme();\n'
    src = src[:body.end()] + inject + src[body.end():]

    # `colors` sai do import de tokens; spacing/radius/typography ficam.
    def strip_colors(match: re.Match) -> str:
        names = [n.strip() for n in match.group(1).split(',') if n.strip() and n.strip() != 'colors']
        return f"import {{ {', '.join(names)} }} from '@/shared/design-system/tokens';" if names else ''

    src = re.sub(TOKENS_IMPORT, strip_colors, src, count=1, flags=re.M)
    src = re.sub(r'\n\n\n+', '\n\n', src)

    extra = "import { makeStyles } from '@/shared/design-system/makeStyles';"
    if needs_hook:
        extra += "\nimport { useTheme } from '@/shared/hooks/useTheme';"

    anchor = re.search(TOKENS_IMPORT, src, re.M) or re.search(r"^import .*from 'react-native';$", src, re.M)
    src = src[:anchor.end()] + '\n' + extra + src[anchor.end():]

    if not re.search(r'StyleSheet\.', src):
        src = re.sub(r'StyleSheet,\s*', '', src)
        src = re.sub(r',\s*StyleSheet\b', '', src)

    open(path, 'w', encoding='utf-8').write(src)
    return f'migrado  {"(+useTheme)" if needs_hook else ""}'


if __name__ == '__main__':
    args = sys.argv[1:]
    dry = '--dry' in args
    prepared = '--prepared' in args
    for target in (a for a in args if not a.startswith('--')):
        print(f'{target.split("/")[-1]:38s} {migrate(target, dry, prepared)}')
