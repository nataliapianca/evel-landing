import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProdutoService } from '../../core/services/produto.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { Product } from '../../shared/models/product.model';
import { Produtos } from './produtos';

describe('Produtos', () => {
  let component: Produtos;
  let fixture: ComponentFixture<Produtos>;
  const produtoService = {
    listar: () => of([] as Product[]),
  };
  const whatsappService = {
    buildLink: (_mensagem: string) => '',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Produtos],
      providers: [
        { provide: ProdutoService, useValue: produtoService },
        { provide: WhatsappService, useValue: whatsappService },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(Produtos);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build the standardized order message', () => {
    expect(component.montarMensagem('Conjunto Essential', 'M', 'Bordô')).toBe(
      'Olá! Gostaria de encomendar o produto Conjunto Essential, no tamanho M e na cor Bordô.',
    );
  });

  it('should require size and color before opening WhatsApp', () => {
    const buildLinkSpy = vi.spyOn(whatsappService, 'buildLink');
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    component.comprarViaWhatsapp('Conjunto Essential', null, 'Bordô');

    expect(buildLinkSpy).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('should treat an explicitly empty option list as unavailable', () => {
    const produto: Product = {
      nome: 'Conjunto Essential',
      descricao: 'Top e short',
      preco: 199.9,
      imagemUrl: '/produto.jpg',
      tamanhos: [],
      cores: ['Bordô'],
    };

    expect(component.opcoesDeTamanho(produto)).toEqual([]);
    expect(component.produtoTemOpcoes(produto)).toBe(false);
  });

  it('should select the product details and open WhatsApp in a new tab', async () => {
    component.listaProdutos = [
      {
        nome: 'Conjunto Essential',
        descricao: 'Top e short',
        preco: 199.9,
        imagemUrl: '/produto.jpg',
        tamanhos: ['M'],
        cores: ['Bordô'],
      },
    ];
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    const [tamanho, cor] = Array.from(
      fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>,
    );
    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const link = 'https://wa.me/5511999999999?text=pedido';
    const buildLinkSpy = vi.spyOn(whatsappService, 'buildLink').mockReturnValue(link);
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    expect(botao.disabled).toBe(true);

    tamanho.value = 'M';
    tamanho.dispatchEvent(new Event('change', { bubbles: true }));
    cor.value = 'Bordô';
    cor.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    botao.click();

    expect(botao.disabled).toBe(false);
    expect(buildLinkSpy).toHaveBeenCalledWith(
      'Olá! Gostaria de encomendar o produto Conjunto Essential, no tamanho M e na cor Bordô.',
    );
    expect(openSpy).toHaveBeenCalledWith(link, '_blank', 'noopener,noreferrer');
  });
});
