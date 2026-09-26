import { resolveSessionChannel } from '../session-channel';

describe('resolveSessionChannel', () => {
  it('token do client público (Google/PKCE) renova direto no Keycloak', () => {
    expect(resolveSessionChannel('soundmeet-mobile', 'soundmeet-mobile')).toBe('keycloak');
  });

  it('token do client confidencial (senha, cadastro) renova pela API', () => {
    expect(resolveSessionChannel('soundmeet-registration', 'soundmeet-mobile')).toBe('api');
  });

  it('sem azp, vai pela API — nunca manda ao Keycloak um token que ele recusaria', () => {
    expect(resolveSessionChannel(undefined, 'soundmeet-mobile')).toBe('api');
  });
});
