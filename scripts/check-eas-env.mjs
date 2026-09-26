#!/usr/bin/env node
/**
 * Guarda de configuração de build (SM-017).
 *
 *   node scripts/check-eas-env.mjs
 *
 * `src/shared/services/config/env.ts` já recusa http:// fora de development —
 * mas recusa no APARELHO, o que significa que a descoberta acontece depois de o
 * binário existir, e no pior caso depois de ele ser publicado. Este script move
 * a mesma pergunta para antes do build.
 *
 * ⚠️ Limite honesto: só enxerga `eas.json`. Variável definida como EAS Secret
 * (`eas secret:create`) ou como variável de ambiente do projeto no site não
 * aparece aqui, e nesses casos quem protege continua sendo o gate de boot. Por
 * isso este script NÃO exige que as URLs estejam em eas.json — exige que, se
 * estiverem, sejam seguras, e que o ambiente esteja declarado em todo perfil.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const EAS_PATH = join(HERE, '..', 'eas.json');

const URL_VARS = [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_WS_BASE_URL',
  'EXPO_PUBLIC_KEYCLOAK_URL',
];

const INSECURE = /^(http|ws):\/\//i;

function main() {
  const eas = JSON.parse(readFileSync(EAS_PATH, 'utf8'));
  const profiles = eas.build ?? {};
  const failures = [];

  for (const [name, profile] of Object.entries(profiles)) {
    const env = profile.env ?? {};
    const declared = env.EXPO_PUBLIC_APP_ENV;

    // Sem o prefixo EXPO_PUBLIC_ o babel não inlina e o app cai no ambiente
    // mais restrito por padrão. Como o default é fail-closed, o sintoma seria
    // um build de development recusando o backend local — confuso o bastante
    // para merecer erro aqui.
    if (!declared) {
      failures.push(
        `perfil "${name}": falta EXPO_PUBLIC_APP_ENV em build.${name}.env. ` +
          `Sem o prefixo EXPO_PUBLIC_ a variável não chega ao bundle.`,
      );
      continue;
    }

    if (!['development', 'preview', 'production'].includes(declared)) {
      failures.push(`perfil "${name}": EXPO_PUBLIC_APP_ENV="${declared}" não é um ambiente válido.`);
    }

    if (declared === 'development') continue;

    for (const variable of URL_VARS) {
      const value = env[variable];
      if (value && INSECURE.test(value)) {
        failures.push(
          `perfil "${name}" (${declared}): ${variable}="${value}" usa canal inseguro. ` +
            `Senha (POST /auth/login) e JWT (handshake do Socket.io) sairiam em texto puro.`,
        );
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\nConfiguração de build REPROVADA (${failures.length}):\n`);
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error('');
    process.exit(1);
  }

  const names = Object.keys(profiles).join(', ');
  console.log(`Configuração de build OK — perfis verificados: ${names || '(nenhum)'}.`);
}

main();
