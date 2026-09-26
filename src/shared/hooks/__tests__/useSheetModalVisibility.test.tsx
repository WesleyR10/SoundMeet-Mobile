import { act, create } from 'react-test-renderer';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useSheetModalVisibility } from '../useSheetModalVisibility';

/*
 * Imita a regra da @gorhom/bottom-sheet 5.2.x que causou o defeito:
 * `dismiss()` num modal fechado deixa o status preso em DISMISSING, e aí o
 * `present()` seguinte não renderiza nada. Se o hook voltar a chamar
 * `dismiss()` sem o sheet estar aberto, `shown` fica falso e o teste falha.
 */
function fakeModal() {
  const modal = {
    status: 'initial' as 'initial' | 'presented' | 'dismissing',
    shown: false,
    onDismiss: undefined as (() => void) | undefined,
    present: jest.fn(() => {
      modal.shown = modal.status !== 'dismissing';
      if (modal.shown) modal.status = 'presented';
    }),
    dismiss: jest.fn(() => {
      if (modal.status === 'presented') modal.closeByLibrary();
      else modal.status = 'dismissing';
    }),
    // Fim da animação de fechar (ou gesto do usuário): a lib desmonta, zera o
    // status e chama o onDismiss.
    closeByLibrary: () => {
      modal.status = 'initial';
      modal.shown = false;
      modal.onDismiss?.();
    },
  };
  return modal;
}

function setup(initialVisible: boolean) {
  const modal = fakeModal();
  let visible = initialVisible;
  const onClose = jest.fn(() => {
    visible = false;
    rerender();
  });

  function Harness({ open }: { open: boolean }) {
    const { sheetRef, trackDismiss } = useSheetModalVisibility(open);
    sheetRef.current = modal as unknown as BottomSheetModal;
    modal.onDismiss = trackDismiss(onClose);
    return null;
  }

  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Harness open={visible} />);
  });
  function rerender() {
    act(() => renderer.update(<Harness open={visible} />));
  }
  const setVisible = (next: boolean) => {
    visible = next;
    rerender();
  };
  return { modal, setVisible, onClose };
}

describe('useSheetModalVisibility', () => {
  it('não chama dismiss() no mount de um sheet fechado — e o primeiro present() aparece', () => {
    const { modal, setVisible } = setup(false);
    expect(modal.dismiss).not.toHaveBeenCalled();

    setVisible(true);
    expect(modal.shown).toBe(true);
  });

  it('reabre depois de o usuário fechar por gesto/backdrop', () => {
    const { modal, setVisible, onClose } = setup(false);
    setVisible(true);

    act(() => modal.closeByLibrary());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(modal.dismiss).not.toHaveBeenCalled();

    setVisible(true);
    expect(modal.shown).toBe(true);
  });

  it('fecha pelo prop e reabre em seguida', () => {
    const { modal, setVisible } = setup(true);
    expect(modal.shown).toBe(true);

    setVisible(false);
    expect(modal.dismiss).toHaveBeenCalledTimes(1);
    expect(modal.shown).toBe(false);

    setVisible(true);
    expect(modal.shown).toBe(true);
  });
});
