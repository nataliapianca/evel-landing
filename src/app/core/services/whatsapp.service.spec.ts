import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappService', () => {
  let service: WhatsappService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WhatsappService);
  });

  it('should use a Brazilian number containing only digits', () => {
    expect(environment.whatsappNumber).toMatch(/^55\d{10,11}$/);
  });

  it('should create a wa.me link with the configured number and encoded message', () => {
    const mensagem =
      'Olá! Gostaria de encomendar o produto Conjunto & Top, no tamanho M e na cor Bordô.';

    const link = service.buildLink(mensagem);
    const url = new URL(link);

    expect(url.origin).toBe('https://wa.me');
    expect(url.pathname).toBe(`/${environment.whatsappNumber}`);
    expect(url.searchParams.get('text')).toBe(mensagem);
    expect(link).toContain(encodeURIComponent(mensagem));
  });
});
