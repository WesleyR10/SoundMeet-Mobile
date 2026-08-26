import {
  awaitsMySignature,
  describeContractDelivery,
  canDownloadCertificate,
  canSign,
  challengeExpiryLabel,
  pendingActorLabel,
  resolveMySide,
  signatureOf,
  statusLabel,
  statusTone,
} from '../contract.rules';
import type {
  Contract,
  ContractPartyRole,
  ContractSignature,
  ContractStatus,
} from '../contract.types';

const MUSICIAN_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_MUSICIAN_ID = '33333333-3333-4333-8333-333333333333';
const BAND_ID = '44444444-4444-4444-8444-444444444444';

function signature(role: ContractPartyRole): ContractSignature {
  return {
    role,
    signer_name:     'Ana Ribeiro',
    signer_document: '529.982.247-25',
    signer_email:    'ana@exemplo.com',
    signer_user_id:  MUSICIAN_ID,
    signed_at:       '2026-08-16T10:00:00.000Z',
    method:          'internal',
    ip:              '203.0.113.10',
    ip_source:       'direct',
    forwarded_for:   null,
    user_agent:      'jest',
  };
}

function contract(overrides: Partial<Contract> = {}): Contract {
  return {
    musician_id:        MUSICIAN_ID,
    band_id:            null,
    status:             'issued' as ContractStatus,
    pending_signatures: ['contractor', 'contracted'],
    signatures:         [],
    has_certificate:    false,
    ...overrides,
  } as Contract;
}

describe('resolveMySide', () => {
  it('é `contracted` quando o contrato é do músico da sessão', () => {
    expect(resolveMySide(contract(), MUSICIAN_ID)).toBe('contracted');
  });

  it('é `contracted` em contrato de banda, sem checar liderança', () => {
    // `AuthUser` não carrega band_ids, e pertencer não é liderar. A garantia de
    // que o contrato é meu já veio do escopo de `GET /contracts`; quem não é
    // líder toma 403 ao assinar, e a UI trata a mensagem.
    const bandContract = contract({ musician_id: null, band_id: BAND_ID });
    expect(resolveMySide(bandContract, MUSICIAN_ID)).toBe('contracted');
  });

  it('é `null` sem sessão de músico', () => {
    expect(resolveMySide(contract(), null)).toBeNull();
  });

  it('é `null` quando o contrato é de outro músico e não é de banda', () => {
    const alheio = contract({ musician_id: OTHER_MUSICIAN_ID, band_id: null });
    expect(resolveMySide(alheio, MUSICIAN_ID)).toBeNull();
  });
});

describe('canSign', () => {
  it('permite quando o meu lado ainda está pendente', () => {
    expect(canSign(contract(), 'contracted')).toBe(true);
  });

  it('recusa quando o meu lado já assinou', () => {
    const parcial = contract({
      status:             'partially_signed',
      pending_signatures: ['contractor'],
      signatures:         [signature('contracted')],
    });
    expect(canSign(parcial, 'contracted')).toBe(false);
  });

  it('recusa contrato assinado e contrato anulado', () => {
    expect(canSign(contract({ status: 'signed', pending_signatures: [] }), 'contracted')).toBe(false);
    // Pendência aberta num anulado não reabre a assinatura: o teste usa
    // `pending_signatures` cheio de propósito, para provar que o status vence.
    expect(canSign(contract({ status: 'annulled' }), 'contracted')).toBe(false);
  });

  it('recusa quem não é parte', () => {
    expect(canSign(contract(), null)).toBe(false);
  });
});

describe('awaitsMySignature', () => {
  it('conta só o que exige ação minha', () => {
    expect(awaitsMySignature(contract(), MUSICIAN_ID)).toBe(true);
    expect(
      awaitsMySignature(
        contract({ status: 'partially_signed', pending_signatures: ['contractor'] }),
        MUSICIAN_ID,
      ),
    ).toBe(false);
    expect(awaitsMySignature(contract({ musician_id: OTHER_MUSICIAN_ID }), MUSICIAN_ID)).toBe(false);
  });
});

describe('pendingActorLabel', () => {
  it('distingue "aguardando você" de "aguardando o estabelecimento"', () => {
    // `partially_signed` sozinho não diz de quem é a vez — é a distinção que
    // mais importa para o músico e que o status não carrega.
    expect(pendingActorLabel(contract(), 'contracted')).toBe('Aguardando você');
    expect(
      pendingActorLabel(
        contract({ status: 'partially_signed', pending_signatures: ['contractor'] }),
        'contracted',
      ),
    ).toBe('Aguardando o estabelecimento');
  });

  it('não diz nada em contrato fechado ou anulado', () => {
    expect(pendingActorLabel(contract({ status: 'signed', pending_signatures: [] }), 'contracted')).toBeNull();
    expect(pendingActorLabel(contract({ status: 'annulled' }), 'contracted')).toBeNull();
  });
});

describe('canDownloadCertificate', () => {
  it('só depois das DUAS assinaturas e com o anexo pronto', () => {
    expect(canDownloadCertificate({ status: 'signed', has_certificate: true })).toBe(true);
    expect(canDownloadCertificate({ status: 'signed', has_certificate: false })).toBe(false);
    expect(canDownloadCertificate({ status: 'partially_signed', has_certificate: true })).toBe(false);
  });
});

describe('signatureOf', () => {
  it('acha a assinatura do lado pedido', () => {
    const assinado = contract({ signatures: [signature('contracted')] });
    expect(signatureOf(assinado, 'contracted')?.role).toBe('contracted');
    expect(signatureOf(assinado, 'contractor')).toBeNull();
  });
});

describe('status', () => {
  it('rotula e dá o tom semântico de cada status', () => {
    expect(statusLabel(contract())).toBe('Aguardando assinaturas');
    expect(statusTone(contract())).toBe('pending');
    expect(statusTone(contract({ status: 'partially_signed' }))).toBe('pending');
    expect(statusTone(contract({ status: 'signed' }))).toBe('positive');
    expect(statusTone(contract({ status: 'annulled' }))).toBe('negative');
  });
});

describe('challengeExpiryLabel', () => {
  const now = new Date('2026-08-16T10:00:00.000Z');

  it('conta os minutos que faltam', () => {
    expect(challengeExpiryLabel('2026-08-16T10:07:00.000Z', now)).toBe('Código expira em 7 min');
  });

  it('avisa quando já venceu', () => {
    expect(challengeExpiryLabel('2026-08-16T09:59:00.000Z', now)).toBe('Código expirado — peça outro');
  });

  it('não inventa rótulo para data ilegível', () => {
    expect(challengeExpiryLabel('não é data', now)).toBeNull();
  });
});

describe('describeContractDelivery', () => {
  it('confirma o envio quando o PDF saiu', () => {
    expect(
      describeContractDelivery({
        delivered:          ['contracted'],
        failed:             [],
        document_available: true,
      }),
    ).toMatch(/Enviamos o contrato/);
  });

  it('não manda tentar de novo quando o PDF nem existe', () => {
    // `document_available: false` é permanente até alguém reemitir — sugerir
    // "tente em alguns minutos" mandaria a pessoa insistir para sempre.
    const message = describeContractDelivery({
      delivered:          [],
      failed:             [],
      document_available: false,
    });
    expect(message).not.toMatch(/tente novamente/i);
    expect(message).toMatch(/ainda não está disponível/i);
  });

  it('trata falha de e-mail como transitória', () => {
    expect(
      describeContractDelivery({
        delivered:          [],
        failed:             [{ role: 'contracted', reason: 'smtp recusou' }],
        document_available: true,
      }),
    ).toMatch(/tente novamente/i);
  });

  it('trata exceção da chamada como transitória', () => {
    expect(describeContractDelivery(null)).toMatch(/tente novamente/i);
  });
});
