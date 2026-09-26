// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      /*
       * 🔴 DESLIGADA DE PROPÓSITO — não é dívida, é incompatibilidade de modelo.
       *
       * `react-hooks/immutability` vem das regras do React Compiler, que tratam
       * como erro mutar um valor depois de ele ter sido usado num efeito ou
       * como dependência. O Reanimated funciona exatamente assim: `useSharedValue`
       * devolve um objeto cuja mutação (`.value = ...`) É a API — é o que roda na
       * thread de UI, fora do ciclo de render do React, e é por isso que a
       * animação não passa por re-render nenhum. A regra não modela isso.
       *
       * Verificado em 05/set/2026, um a um: os **21** achados desta regra em
       * `src/` eram 21/21 `sharedValue.value = ...`, zero mutação de estado
       * React. Entre os arquivos apontados estão `Pressable3DCard`,
       * `RequestCard` (swipe de aceitar/rejeitar pedido) e
       * `usePlayModeAutoScroll` — código de gesto e animação que funciona e que
       * "corrigir" significaria reescrever.
       *
       * As alternativas foram descartadas: 21 `eslint-disable-next-line` viram
       * ruído que ninguém lê e escondem o dia em que a regra pegar algo real; e
       * deixar a regra ligada com 21 erros permanentes é o cenário que faz um
       * time desligar o gate inteiro (a nota do `.github/workflows/ci.yml`
       * descreve exatamente esse risco).
       *
       * ⚠️ Reavaliar se o `eslint-plugin-react-hooks` passar a reconhecer
       * shared values do Reanimated — aí a regra volta a ter o que dizer aqui.
       */
      "react-hooks/immutability": "off",
    },
  },
]);
