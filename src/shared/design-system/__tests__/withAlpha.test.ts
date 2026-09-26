import { withAlpha } from '../withAlpha';
import { colors, lightColors } from '../tokens';

describe('withAlpha', () => {
  it('converte #RRGGBB em rgba com a opacidade pedida', () => {
    expect(withAlpha('#0C0C14', 0.94)).toBe('rgba(12,12,20,0.94)');
    expect(withAlpha('#ffffff', 0.03)).toBe('rgba(255,255,255,0.03)');
  });

  it('no escuro, o véu da cor do texto é branco; no claro, é tinta', () => {
    expect(withAlpha(colors.text.primary, 0.05)).toBe('rgba(248,250,252,0.05)');
    expect(withAlpha(lightColors.text.primary, 0.05)).toBe('rgba(8,26,23,0.05)');
  });

  it('recusa formato que não é #RRGGBB em vez de devolver cor quebrada', () => {
    expect(() => withAlpha('rgba(0,0,0,1)', 0.5)).toThrow();
    expect(() => withAlpha('#fff', 0.5)).toThrow();
  });
});
