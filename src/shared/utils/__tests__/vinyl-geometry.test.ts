import { grooveRadii, sheenSlices, wedgePath } from '../vinyl-geometry';

describe('grooveRadii', () => {
  it('desenha sulcos só entre a borda e o selo', () => {
    const radii = grooveRadii(90, 64);
    expect(radii[0]).toBe(88.5);
    expect(Math.min(...radii)).toBeGreaterThan(65);
    // Espaçamento constante de 3px, de fora para dentro.
    expect(radii[0] - radii[1]).toBeCloseTo(3);
  });
});

describe('wedgePath', () => {
  it('começa no centro e parte do TOPO no ângulo 0 (convenção do conic-gradient)', () => {
    const d = wedgePath(100, 100, 50, 0, 90);
    expect(d.startsWith('M 100 100 L 100.00 50.00')).toBe(true);
    // 90° no sentido do relógio a partir do topo é a direita.
    expect(d).toContain('150.00 100.00');
  });

  it('usa o arco grande acima de 180°', () => {
    expect(wedgePath(0, 0, 10, 0, 200)).toContain(' 0 1 1 ');
    expect(wedgePath(0, 0, 10, 0, 90)).toContain(' 0 0 1 ');
  });
});

describe('sheenSlices', () => {
  it('a opacidade sobe até o pico e desce — o brilho não tem borda dura', () => {
    const slices = sheenSlices(0, 0, 10, 54, 74, 96, 0.12);
    const opacities = slices.map((s) => s.opacity);
    const peakIndex = opacities.indexOf(Math.max(...opacities));
    expect(Math.max(...opacities)).toBeLessThanOrEqual(0.12);
    expect(opacities[0]).toBeLessThan(opacities[peakIndex]);
    expect(opacities[opacities.length - 1]).toBeLessThan(opacities[peakIndex]);
  });
});
