import {
  describeEndpointProblem,
  isHostAllowed,
  parseEndpoint,
  resolveAppEnv,
  PRODUCTION_HOST_ALLOWLIST,
} from '../env';

// Funções puras — o nível de teste que este projeto pratica (ver CLAUDE.md).
// O `ENV` em si não é testável por injeção: `process.env.EXPO_PUBLIC_*` é
// INLINADO no bundle pelo babel, então reatribuir `process.env` num teste não
// mudaria o valor no aparelho. Por isso a regra de segurança mora em funções
// puras e o módulo só as costura.

describe('resolveAppEnv', () => {
  it('respeita preview e production declarados', () => {
    expect(resolveAppEnv('preview', true)).toBe('preview');
    expect(resolveAppEnv('production', true)).toBe('production');
  });

  it('bundle de release SEM variável assume production, não development', () => {
    // O ponto do SM-017: esquecer de configurar não pode afrouxar a regra de
    // canal seguro. Era exatamente o que acontecia com o antigo `APP_ENV`, que
    // nunca chegava ao runtime.
    expect(resolveAppEnv(undefined, true)).toBe('production');
    expect(resolveAppEnv('', true)).toBe('production');
  });

  it('bundle de release declarando development é incoerente e vira production', () => {
    expect(resolveAppEnv('development', true)).toBe('production');
  });

  it('valor desconhecido não passa como ambiente válido', () => {
    expect(resolveAppEnv('prod', true)).toBe('production');
    expect(resolveAppEnv('staging', false)).toBe('development');
  });

  it('bundle de desenvolvimento continua development', () => {
    expect(resolveAppEnv('development', false)).toBe('development');
    expect(resolveAppEnv(undefined, false)).toBe('development');
  });
});

describe('parseEndpoint', () => {
  it('extrai esquema e host', () => {
    expect(parseEndpoint('https://api.soundmeet.com.br/api/v1')).toEqual({
      scheme: 'https',
      host: 'api.soundmeet.com.br',
    });
  });

  it('normaliza caixa e descarta porta', () => {
    expect(parseEndpoint('HTTP://Localhost:3000/api/v1')).toEqual({
      scheme: 'http',
      host: 'localhost',
    });
  });

  it('descarta credenciais embutidas — o host é o que vem DEPOIS do @', () => {
    // `https://soundmeet.com.br@evil.com` passaria pela allowlist se o parser
    // olhasse a authority inteira.
    expect(parseEndpoint('https://soundmeet.com.br@evil.com/api/v1')).toEqual({
      scheme: 'https',
      host: 'evil.com',
    });
  });

  it('preserva literal IPv6 entre colchetes', () => {
    expect(parseEndpoint('http://[::1]:3000/api/v1')).toEqual({
      scheme: 'http',
      host: '[::1]',
    });
  });

  it('rejeita URL relativa e host vazio', () => {
    expect(parseEndpoint('/api/v1')).toBeNull();
    expect(parseEndpoint('api.soundmeet.com.br')).toBeNull();
    expect(parseEndpoint('https://')).toBeNull();
  });
});

describe('isHostAllowed', () => {
  it('aceita o domínio exato e seus subdomínios', () => {
    expect(isHostAllowed('soundmeet.com.br', PRODUCTION_HOST_ALLOWLIST)).toBe(true);
    expect(isHostAllowed('api.soundmeet.com.br', PRODUCTION_HOST_ALLOWLIST)).toBe(true);
    expect(isHostAllowed('auth.soundmeet.com.br', PRODUCTION_HOST_ALLOWLIST)).toBe(true);
  });

  it('não cai em sufixo colado — evilsoundmeet.com.br NÃO é nosso', () => {
    expect(isHostAllowed('evilsoundmeet.com.br', PRODUCTION_HOST_ALLOWLIST)).toBe(false);
    expect(isHostAllowed('soundmeet.com.br.evil.com', PRODUCTION_HOST_ALLOWLIST)).toBe(false);
  });
});

describe('describeEndpointProblem', () => {
  const base = { label: 'API', kind: 'http' as const, allowlist: null };

  it('development aceita http e localhost', () => {
    expect(
      describeEndpointProblem({
        ...base,
        value: 'http://192.168.18.3:3000/api/v1',
        requireSecure: false,
      }),
    ).toBeNull();
  });

  it('fora de development, http é recusado', () => {
    const problem = describeEndpointProblem({
      ...base,
      value: 'http://api.soundmeet.com.br/api/v1',
      requireSecure: true,
    });
    expect(problem).toContain('não é aceito fora de development');
  });

  it('https passa', () => {
    expect(
      describeEndpointProblem({
        ...base,
        value: 'https://api.soundmeet.com.br/api/v1',
        requireSecure: true,
      }),
    ).toBeNull();
  });

  it('websocket aceita https e wss, recusa ws puro', () => {
    const ws = { label: 'WS', kind: 'ws' as const, allowlist: null, requireSecure: true };
    expect(describeEndpointProblem({ ...ws, value: 'https://api.soundmeet.com.br' })).toBeNull();
    expect(describeEndpointProblem({ ...ws, value: 'wss://api.soundmeet.com.br' })).toBeNull();
    expect(describeEndpointProblem({ ...ws, value: 'ws://api.soundmeet.com.br' })).toContain(
      'não é aceito fora de development',
    );
  });

  it('allowlist barra host estranho mesmo em https', () => {
    const problem = describeEndpointProblem({
      ...base,
      value: 'https://api.exemplo.com/api/v1',
      requireSecure: true,
      allowlist: PRODUCTION_HOST_ALLOWLIST,
    });
    expect(problem).toContain('fora da allowlist de produção');
  });

  it('allowlist nula (preview) deixa passar host de staging em https', () => {
    expect(
      describeEndpointProblem({
        ...base,
        value: 'https://staging.exemplo.com/api/v1',
        requireSecure: true,
        allowlist: null,
      }),
    ).toBeNull();
  });

  it('valor ausente ou relativo é problema', () => {
    expect(describeEndpointProblem({ ...base, value: '', requireSecure: true })).toContain(
      'ausente',
    );
    expect(describeEndpointProblem({ ...base, value: '/api/v1', requireSecure: true })).toContain(
      'não é uma URL absoluta',
    );
  });
});
