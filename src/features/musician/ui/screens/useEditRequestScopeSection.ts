import { useState } from 'react';
import {
  useUpdateRequestScope,
  getUpdateRequestScopeErrorMessage,
} from '../../application/useUpdateRequestScope';

// Mesmo desenho de useEditAvailabilitySection: um Switch salva sozinho ao ser
// tocado. Pedir "Salvar" separado para um boolean seria fricção sem propósito.
//
// ⚠️ Não há tri-state aqui, ao contrário de `open_to_gigs`. Este campo nasce
// `true` e sempre tem resposta: ele descreve o comportamento que o produto já
// tinha antes do switch existir, então "ainda não decidiu" não é um estado
// possível — e um `null` obrigaria a tela do fã a inventar a resposta.
export function useEditRequestScopeSection(musicianId: string, initialValue: boolean) {
  const [value, setValue] = useState<boolean>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const updateRequestScope = useUpdateRequestScope(musicianId);

  const onChange = async (next: boolean) => {
    setValue(next);
    setError(null);
    try {
      await updateRequestScope.mutateAsync(next);
    } catch (err) {
      setValue(!next);
      setError(getUpdateRequestScopeErrorMessage(err));
    }
  };

  return {
    value,
    onChange,
    isSaving: updateRequestScope.isPending,
    error,
  };
}
