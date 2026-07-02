/**
 * Stub de framer-motion para React Native / Moti.
 *
 * moti v0.30.x depende de framer-motion para dois recursos:
 *   - PresenceContext  → contexto React de presença de tela
 *   - usePresence()   → hook de estado de presença (para animações de saída)
 *   - AnimatePresence → componente que coordena animações de saída
 *
 * framer-motion é uma lib de DOM e não funciona no React Native.
 * Este stub fornece implementações mínimas e compatíveis:
 *   - PresenceContext: contexto com valor padrão null (sem AnimatePresence pai)
 *   - usePresence(): sempre retorna [true, null] (componente sempre presente)
 *   - AnimatePresence: passthrough que apenas renderiza seus filhos
 *
 * Efeito: animações de saída (prop `exit` do Moti) ficam desabilitadas,
 * mas todas as animações de entrada/estado (`from`, `animate`, `transition`)
 * funcionam normalmente via Reanimated.
 */
const React = require('react');

const PresenceContext = React.createContext(null);

function usePresence() {
  return [true, null];
}

function AnimatePresence({ children }) {
  return children;
}

module.exports = {
  PresenceContext,
  usePresence,
  AnimatePresence,
};
