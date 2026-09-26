import {
  formatDurationLabel,
  PRESENTATION_AUDIO_LIMITS,
  rejectPresentationAudio,
  type PresentationAudioCandidate,
} from '../presentation-audio.rules';

function candidate(
  overrides: Partial<PresentationAudioCandidate> = {},
): PresentationAudioCandidate {
  return { name: 'apresentacao.mp3', size: 900_000, duration: 32, ...overrides };
}

describe('rejectPresentationAudio', () => {
  it('aceita um arquivo dentro dos limites', () => {
    expect(rejectPresentationAudio(candidate())).toBeNull();
  });

  it.each(['mp3', 'm4a', 'aac', 'wav', 'MP3', 'M4A'])('aceita .%s', (ext) => {
    expect(rejectPresentationAudio(candidate({ name: `demo.${ext}` }))).toBeNull();
  });

  /*
   * Ogg e FLAC são recusados pelo mesmo motivo do backend: Safari não toca Ogg
   * Vorbis e não há transcode, então aceitar seria prometer um preview que
   * parte dos estabelecimentos simplesmente não ouve.
   */
  it.each(['ogg', 'flac', 'mp4', 'pdf', 'exe'])('recusa .%s', (ext) => {
    expect(rejectPresentationAudio(candidate({ name: `demo.${ext}` }))?.reason).toBe(
      'extension',
    );
  });

  it('recusa arquivo sem extensão', () => {
    expect(rejectPresentationAudio(candidate({ name: 'gravacao' }))?.reason).toBe(
      'extension',
    );
  });

  it('recusa arquivo acima do teto, dizendo o tamanho', () => {
    const rejection = rejectPresentationAudio(candidate({ size: 12 * 1024 * 1024 }));

    expect(rejection?.reason).toBe('size');
    expect(rejection?.message).toContain('12,0 MB');
  });

  it('recusa áudio longo demais, dizendo a duração', () => {
    const rejection = rejectPresentationAudio(candidate({ duration: 72 }));

    expect(rejection?.reason).toBe('too_long');
    expect(rejection?.message).toContain('1min12');
  });

  it('recusa áudio curto demais', () => {
    expect(rejectPresentationAudio(candidate({ duration: 2 }))?.reason).toBe('too_short');
  });

  // Mesma tolerância do servidor: um trecho cortado em "40 segundos" costuma
  // vir com 40,04 no cabeçalho, e reprovar isso seria incompreensível.
  it('aceita 40,04s — arredonda antes de comparar', () => {
    expect(rejectPresentationAudio(candidate({ duration: 40.04 }))).toBeNull();
  });

  /*
   * 🔴 Nem todo arquivo permite medir a duração no aparelho. Recusar por isso
   * transformaria limitação do dispositivo em impedimento de produto — o
   * servidor mede de novo e decide.
   */
  it.each([null, undefined, Number.NaN])('não reprova com duração %p', (duration) => {
    expect(rejectPresentationAudio(candidate({ duration }))).toBeNull();
  });

  it('não reprova quando o seletor não informa o tamanho', () => {
    expect(rejectPresentationAudio(candidate({ size: null }))).toBeNull();
  });

  // Espelho de upload-musician-presentation-audio.use-case.ts. Divergir aqui
  // produz arquivo aceito na tela e recusado no envio (ou o contrário).
  it('mantém os limites espelhados do backend', () => {
    expect(PRESENTATION_AUDIO_LIMITS.MIN_SECONDS).toBe(5);
    expect(PRESENTATION_AUDIO_LIMITS.MAX_SECONDS).toBe(40);
    expect(PRESENTATION_AUDIO_LIMITS.MAX_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe('formatDurationLabel', () => {
  it.each([
    [0, '0:00'],
    [8, '0:08'],
    [38, '0:38'],
    [40, '0:40'],
    [37.6, '0:38'],
    [61, '1:01'],
  ])('formata %p como %s', (input, expected) => {
    expect(formatDurationLabel(input)).toBe(expected);
  });

  it('não produz tempo negativo', () => {
    expect(formatDurationLabel(-5)).toBe('0:00');
  });
});
