import { useState } from 'react';
import { useUpdateOpenToGigs, getUpdateOpenToGigsErrorMessage } from '../../application/useUpdateOpenToGigs';

// Diferente das outras seções do accordion (sem AccordionSaveFooter): um
// Switch salva sozinho ao ser tocado, como qualquer toggle de configuração —
// pedir "Salvar" separado pra um boolean seria fricção sem propósito.
export function useEditAvailabilitySection(musicianId: string, initialValue: boolean | null) {
  const [value, setValue] = useState<boolean>(initialValue ?? false);
  const [error, setError] = useState<string | null>(null);

  const updateOpenToGigs = useUpdateOpenToGigs(musicianId);

  const onChange = async (next: boolean) => {
    setValue(next);
    setError(null);
    try {
      await updateOpenToGigs.mutateAsync(next);
    } catch (err) {
      setValue(!next);
      setError(getUpdateOpenToGigsErrorMessage(err));
    }
  };

  return {
    value,
    onChange,
    isSaving: updateOpenToGigs.isPending,
    error,
    isDecided: initialValue !== null,
  };
}
