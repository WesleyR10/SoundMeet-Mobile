// Cliente ViaCEP (https://viacep.com.br) — consulta pública de CEP, sem token.
// fetch nativo de propósito (não o httpClient/Axios do backend): é um serviço
// externo sem JWT/envelope, não deve passar pelos interceptors do SoundMeet.

export interface CepAddress {
  zipCode:      string; // 8 dígitos, sem máscara
  street:       string;
  neighborhood: string;
  city:         string;
  state:        string; // UF
}

export class CepNotFoundError extends Error {
  constructor() {
    super('CEP não encontrado');
    this.name = 'CepNotFoundError';
  }
}

export class CepLookupError extends Error {
  constructor() {
    super('Não foi possível consultar o CEP');
    this.name = 'CepLookupError';
  }
}

type ViaCepResponse = {
  cep?:        string;
  logradouro?: string;
  bairro?:     string;
  localidade?: string;
  uf?:         string;
  erro?:       boolean;
};

/** Consulta um CEP (aceita com ou sem máscara). Lança CepNotFoundError para
 *  CEP inexistente e CepLookupError para falha de rede/formato. */
export async function lookupCep(rawCep: string): Promise<CepAddress> {
  const cep = rawCep.replace(/\D/g, '');
  if (cep.length !== 8) throw new CepLookupError();

  let response: Response;
  try {
    response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  } catch {
    throw new CepLookupError();
  }
  if (!response.ok) throw new CepLookupError();

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) throw new CepNotFoundError();

  return {
    zipCode:      cep,
    street:       data.logradouro ?? '',
    neighborhood: data.bairro ?? '',
    city:         data.localidade ?? '',
    state:        data.uf ?? '',
  };
}

/** Máscara de exibição 00000-000 conforme o usuário digita. */
export function formatCepInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
