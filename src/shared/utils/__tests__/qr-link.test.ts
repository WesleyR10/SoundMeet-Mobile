import { parseQrTarget } from '../qr-link';

const ID = '9366b7dc-2d71-4799-b91c-c64adb205104';

describe('parseQrTarget', () => {
  it('lê o link https canônico do músico', () => {
    expect(parseQrTarget(`https://soundmeet.com.br/musico/${ID}`)).toEqual({
      kind: 'musician',
      id: ID,
    });
  });

  it('lê o link https da casa', () => {
    expect(parseQrTarget(`https://soundmeet.com.br/local/${ID}`)).toEqual({
      kind: 'establishment',
      id: ID,
    });
  });

  // QR já impresso não se atualiza.
  it('continua lendo o esquema legado', () => {
    expect(parseQrTarget(`soundmeet://musician/${ID}`)).toEqual({
      kind: 'musician',
      id: ID,
    });
  });

  /*
   * 🔴 O ataque: um adesivo colado por cima do original, mesmo caminho, outro
   * domínio. Todos estes precisam ser recusados.
   */
  it.each([
    [`https://evil.example/musico/${ID}`, 'host de terceiro'],
    [`https://notsoundmeet.com.br/musico/${ID}`, 'host que TERMINA com o nosso'],
    [`https://soundmeet.com.br.evil.com/musico/${ID}`, 'host que COMEÇA com o nosso'],
    [`https://evil.example@soundmeet.com.br/musico/${ID}`, 'userinfo antes do host'],
    [`http://soundmeet.com.br/musico/${ID}`, 'downgrade para http'],
  ])('recusa %s (%s)', (input) => {
    expect(parseQrTarget(input)).toBeNull();
  });

  it('recusa caminho desconhecido', () => {
    expect(parseQrTarget(`https://soundmeet.com.br/perfil/${ID}`)).toBeNull();
  });

  it('recusa segmento extra depois do id', () => {
    expect(parseQrTarget(`https://soundmeet.com.br/musico/${ID}/extra`)).toBeNull();
  });

  it('recusa texto que não é QR do SoundMeet', () => {
    expect(parseQrTarget('qualquer coisa')).toBeNull();
    expect(parseQrTarget('')).toBeNull();
  });
});
