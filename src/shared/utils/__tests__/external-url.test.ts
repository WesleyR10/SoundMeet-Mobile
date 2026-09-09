import {
  buildSocialUrl,
  isWithinDomain,
  resolveExternalUrl,
  SOCIAL_DOMAINS,
} from '../external-url';

const TAB = String.fromCharCode(9);
const BACKSLASH = String.fromCharCode(0x5c);

describe('resolveExternalUrl — esquema', () => {
  it('permite https', () => {
    expect(resolveExternalUrl('https://exemplo.com/pagina')).toMatchObject({
      status: 'unverified',
      host:   'exemplo.com',
    });
  });

  it('nega http (downgrade de transporte)', () => {
    expect(resolveExternalUrl('http://exemplo.com')).toEqual({
      status: 'blocked',
      reason: 'not_https',
    });
  });

  // Os quatro esquemas do cenário do SM-025. `Linking.openURL` entrega ao
  // sistema operacional: no Android, `intent://` aciona qualquer handler
  // instalado que declare o filtro.
  it.each([
    'javascript:alert(1)',
    'intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;end',
    'file:///etc/passwd',
    'data:text/html,<script>alert(1)</script>',
  ])('nega esquema não-web: %s', (url) => {
    expect(resolveExternalUrl(url)).toEqual({ status: 'blocked', reason: 'not_https' });
  });

  it('nega esquema em caixa alta e com espaço em volta', () => {
    expect(resolveExternalUrl('  JavaScript:alert(1)  ')).toEqual({
      status: 'blocked',
      reason: 'not_https',
    });
  });

  it('aceita HTTPS em caixa alta e normaliza o host', () => {
    expect(resolveExternalUrl('HTTPS://Instagram.COM/joao', ['instagram.com'])).toMatchObject({
      status: 'trusted',
      host:   'instagram.com',
    });
  });
});

describe('resolveExternalUrl — userinfo', () => {
  // O caso que o teste `/^https?:\/\//` antigo deixava passar: começa com
  // `https://instagram.com`, abre `evil.example`.
  it('nega URL com userinfo', () => {
    expect(resolveExternalUrl('https://instagram.com@evil.example/', ['instagram.com'])).toEqual({
      status: 'blocked',
      reason: 'has_userinfo',
    });
  });

  it('nega userinfo com senha', () => {
    expect(resolveExternalUrl('https://user:senha@evil.example/')).toEqual({
      status: 'blocked',
      reason: 'has_userinfo',
    });
  });

  it('nega múltiplos @ — o host é o que vem depois do último', () => {
    expect(resolveExternalUrl('https://a@instagram.com@evil.example/')).toEqual({
      status: 'blocked',
      reason: 'has_userinfo',
    });
  });
});

describe('resolveExternalUrl — host', () => {
  // A barra invertida é onde o `URL` do React Native diverge do navegador: ele
  // leria `instagram.com` como host, o Chrome abriria `evil.example`.
  it(`nega barra invertida na autoridade`, () => {
    expect(
      resolveExternalUrl(`https://evil.example${BACKSLASH}@instagram.com/`, ['instagram.com']),
    ).toEqual({ status: 'blocked', reason: 'unsafe_characters' });
  });

  it('nega tab embutida (a WHATWG a remove antes de parsear)', () => {
    expect(resolveExternalUrl(`ht${TAB}tps://exemplo.com`)).toEqual({
      status: 'blocked',
      reason: 'unsafe_characters',
    });
  });

  it('nega host percent-codificado', () => {
    expect(resolveExternalUrl('https://%69nstagram.com/', ['instagram.com'])).toEqual({
      status: 'blocked',
      reason: 'invalid_host',
    });
  });

  it('nega host não-ASCII (homógrafo)', () => {
    // `а` cirílico no lugar do `a` latino.
    expect(resolveExternalUrl('https://instаgram.com/', ['instagram.com'])).toEqual({
      status: 'blocked',
      reason: 'invalid_host',
    });
  });

  it('nega host sem ponto', () => {
    expect(resolveExternalUrl('https://localhost/x')).toEqual({
      status: 'blocked',
      reason: 'invalid_host',
    });
  });

  it('nega IPv6', () => {
    expect(resolveExternalUrl('https://[::1]/x')).toEqual({
      status: 'blocked',
      reason: 'not_https',
    });
  });

  it('nega porta não numérica', () => {
    expect(resolveExternalUrl('https://exemplo.com:porta/x')).toEqual({
      status: 'blocked',
      reason: 'invalid_host',
    });
  });

  it('nega vazio e nulo', () => {
    expect(resolveExternalUrl('')).toEqual({ status: 'blocked', reason: 'empty' });
    expect(resolveExternalUrl(null)).toEqual({ status: 'blocked', reason: 'empty' });
    expect(resolveExternalUrl(undefined)).toEqual({ status: 'blocked', reason: 'empty' });
  });
});

describe('isWithinDomain', () => {
  it('aceita o domínio e subdomínios reais', () => {
    expect(isWithinDomain('instagram.com', 'instagram.com')).toBe(true);
    expect(isWithinDomain('www.instagram.com', 'instagram.com')).toBe(true);
  });

  // "Domínio parecido" do cenário: sem o ponto no `endsWith`, os dois passariam.
  it('nega domínio parecido e sufixo enganoso', () => {
    expect(isWithinDomain('notinstagram.com', 'instagram.com')).toBe(false);
    expect(isWithinDomain('instagram.com.evil.example', 'instagram.com')).toBe(false);
  });
});

describe('buildSocialUrl', () => {
  it('monta o link a partir do handle com @', () => {
    expect(buildSocialUrl('instagram', '@joao.musico')).toEqual({
      status: 'trusted',
      url:    'https://instagram.com/joao.musico',
      host:   'instagram.com',
    });
  });

  // O código antigo transformava `@canal` em `https://@canal` — host vazio com
  // userinfo, um link quebrado que nunca abriu o YouTube de ninguém.
  it('põe o @ no caminho do YouTube, e não como userinfo', () => {
    expect(buildSocialUrl('youtube', '@meucanal')).toEqual({
      status: 'trusted',
      url:    'https://youtube.com/@meucanal',
      host:   'youtube.com',
    });
  });

  it('aceita o host da própria rede sem esquema', () => {
    expect(buildSocialUrl('spotify', 'open.spotify.com/artist/abc')).toMatchObject({
      status: 'trusted',
      host:   'open.spotify.com',
    });
  });

  it('aceita youtu.be, que é domínio próprio e não subdomínio', () => {
    expect(buildSocialUrl('youtube', 'https://youtu.be/abc')).toMatchObject({
      status: 'trusted',
      host:   'youtu.be',
    });
  });

  it('trata host desconhecido sem esquema como handle — nunca visita o host', () => {
    expect(buildSocialUrl('instagram', 'evil.example/phish')).toEqual({
      status: 'trusted',
      url:    'https://instagram.com/evil.example/phish',
      host:   'instagram.com',
    });
  });

  it('marca como não verificado o https explícito para fora da rede', () => {
    expect(buildSocialUrl('instagram', 'https://evil.example/phish')).toEqual({
      status:  'unverified',
      url:     'https://evil.example/phish',
      host:    'evil.example',
    });
  });

  it('nega o userinfo mesmo no campo de uma rede conhecida', () => {
    expect(buildSocialUrl('instagram', 'https://instagram.com@evil.example/')).toEqual({
      status: 'blocked',
      reason: 'has_userinfo',
    });
  });

  it.each(['javascript:alert(1)', 'http://instagram.com/joao', 'data:text/html,x'])(
    'nega %s no campo de rede social',
    (value) => {
      expect(buildSocialUrl('instagram', value)).toEqual({
        status: 'blocked',
        reason: 'not_https',
      });
    },
  );

  it('nega valor vazio', () => {
    expect(buildSocialUrl('spotify', '   ')).toEqual({ status: 'blocked', reason: 'empty' });
  });
});

describe('SOCIAL_DOMAINS', () => {
  // Allowlist é allowlist: um domínio a mais aqui é uma decisão, não um detalhe.
  it('cobre exatamente as três redes que o app exibe', () => {
    expect(SOCIAL_DOMAINS).toEqual({
      instagram: ['instagram.com'],
      youtube:   ['youtube.com', 'youtu.be'],
      spotify:   ['spotify.com'],
    });
  });
});
