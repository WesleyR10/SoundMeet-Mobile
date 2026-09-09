import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * "Reduzir movimento" está ligado no sistema?
 *
 * ## Por que isto nasceu com a celebração
 *
 * Até aqui o app não tinha nenhum tratamento de reduce-motion (`grep
 * AccessibilityInfo` não retornava nada) — as animações existentes são curtas
 * e locais, e a ausência passava. Uma comemoração em tela cheia, com bloom
 * radial e 56 partículas em queda, é exatamente o efeito que provoca enjoo em
 * quem liga essa preferência: aqui deixa de ser detalhe.
 *
 * O padrão é `false` até o sistema responder — a leitura é assíncrona e um
 * default `true` faria todo mundo perder a animação no primeiro frame.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduced(enabled);
    });

    // A preferência pode mudar com o app aberto (o usuário sai, ajusta,
    // volta) — sem o listener a tela ficaria com o valor do boot.
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
