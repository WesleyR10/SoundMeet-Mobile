import { useCallback, useEffect, useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

/*
 * Liga um `BottomSheetModal` a um prop `visible` SEM nunca chamar `dismiss()`
 * num sheet que não está aberto.
 *
 * 🔴 Na @gorhom/bottom-sheet 5.2.x, `dismiss()` num modal fechado (status
 * INITIAL) marca o status como DISMISSING e não tem o que animar — o status
 * fica preso ali. O `present()` seguinte monta o Portal, mas
 * `handlePortalRender` recusa renderizar em DISMISSING: o sheet NUNCA aparece,
 * sem erro nenhum. O padrão antigo (`if (visible) present(); else dismiss();`)
 * caía nisso de duas formas:
 *   - no MOUNT, com `visible=false` — todo sheet que já nasce montado ficava
 *     inabrível (diagrama de acorde, seletor de acorde, anotação…);
 *   - depois de o usuário fechar por gesto/backdrop — a lib já desmontou, o
 *     `onDismiss` zera o `visible` do pai e o `dismiss()` do efeito envenenava
 *     o sheet para a próxima abertura.
 *
 * Por isso o estado "aberto" é rastreado aqui, e o `onDismiss` do modal PRECISA
 * passar por `trackDismiss` — é ele que avisa que a lib já fechou sozinha.
 */
export function useSheetModalVisibility(visible: boolean) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const presentedRef = useRef(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    if (visible && !presentedRef.current) {
      presentedRef.current = true;
      sheet.present();
    } else if (!visible && presentedRef.current) {
      presentedRef.current = false;
      sheet.dismiss();
    }
  }, [visible]);

  const trackDismiss = useCallback(
    (onDismiss?: () => void) => () => {
      presentedRef.current = false;
      onDismiss?.();
    },
    [],
  );

  return { sheetRef, trackDismiss };
}
