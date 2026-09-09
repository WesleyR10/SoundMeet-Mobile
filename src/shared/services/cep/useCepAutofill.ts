import { useRef, useState } from 'react';
import { CepNotFoundError, formatCepInput, lookupCep } from './viacep.api';

type AutofillTargets = {
  setStreet:       (v: string) => void;
  setNeighborhood: (v: string) => void;
  setCity:         (v: string) => void;
  setState:        (v: string) => void;
};

/**
 * Campo de CEP com autofill do ViaCEP.
 *
 * Extraído de `useEditLocationSection` quando o modo turnê (7.13d) passou a
 * precisar do mesmo comportamento: são dois endereços do mesmo músico — a base
 * permanente e a temporária — e duas cópias divergiriam na primeira correção.
 * A API externa do hook de localização não mudou.
 *
 * Os campos continuam editáveis depois do preenchimento: o ViaCEP não traz
 * número nem complemento, e erra em endereço novo.
 */
export function useCepAutofill(initialZip: string | null | undefined, targets: AutofillTargets) {
  const [cep, setCep] = useState(initialZip ? formatCepInput(initialZip) : '');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | undefined>(undefined);

  // Evita consulta duplicada pro mesmo CEP (ex.: blur + re-render).
  const lastLookupRef = useRef<string | null>(null);

  const onChangeCep = (raw: string) => {
    const masked = formatCepInput(raw);
    setCep(masked);
    setCepError(undefined);

    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 8 || lastLookupRef.current === digits) return;

    lastLookupRef.current = digits;
    setCepLoading(true);
    lookupCep(digits)
      .then((address) => {
        if (address.street) targets.setStreet(address.street);
        if (address.neighborhood) targets.setNeighborhood(address.neighborhood);
        if (address.city) targets.setCity(address.city);
        if (address.state) targets.setState(address.state);
      })
      .catch((err) => {
        setCepError(err instanceof CepNotFoundError ? 'CEP não encontrado' : 'Falha ao consultar o CEP');
        lastLookupRef.current = null;
      })
      .finally(() => setCepLoading(false));
  };

  /** Dígitos sem máscara — é o que o backend espera em `zip_code`. */
  const cepDigits = cep.replace(/\D/g, '');

  /** CEP começado e não terminado; string vazia é válida (campo opcional). */
  const isCepIncomplete = cepDigits.length > 0 && cepDigits.length !== 8;

  return { cep, setCep, onChangeCep, cepLoading, cepError, setCepError, cepDigits, isCepIncomplete };
}
