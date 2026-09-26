import { inquiryDecisionMode } from '../inquiry.rules';
import type { Inquiry } from '../inquiry.types';

const NOW = new Date('2026-09-25T12:00:00Z');

function inquiry(overrides: Partial<Inquiry>): Inquiry {
  return {
    id: 'i1', establishment_id: 'e1', musician_id: 'm1', band_id: null, event_id: null,
    subject: null, initial_message: null, status: 'open', expires_at: null,
    accepted_at: null, rejected_at: null, rejection_reason: null, converted_at: null,
    booking_id: null, created_at: NOW.toISOString(), updated_at: NOW.toISOString(),
    ...overrides,
  };
}

describe('inquiryDecisionMode', () => {
  it('convertida em show: a resposta é sobre o show, com data e cachê', () => {
    // O caso relatado: a tela dizia "não está mais aberta" com um show esperando resposta.
    expect(inquiryDecisionMode(inquiry({ status: 'converted', booking_id: 'b1' }), NOW)).toBe('offer');
  });

  it('aberta sem termos: aceitar é só "tenho interesse"', () => {
    expect(inquiryDecisionMode(inquiry({}), NOW)).toBe('interest');
  });

  it('sem termos e já respondida ou vencida: nada a decidir', () => {
    expect(inquiryDecisionMode(inquiry({ status: 'rejected' }), NOW)).toBe('closed');
    expect(inquiryDecisionMode(inquiry({ expires_at: '2026-09-24T00:00:00Z' }), NOW)).toBe('closed');
  });
});
