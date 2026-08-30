import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { ProdutoService } from '../../core/services/produto.service';
import { Product } from '../../shared/models/product.model';
import { AdminProduto } from './admin-produto';

describe('AdminProduto', () => {
  let component: AdminProduto;
  let fixture: ComponentFixture<AdminProduto>;
  let routeParamMap: BehaviorSubject<ParamMap>;
  const produtoSalvo: Product = {
    id: 'produto-1',
    nome: 'Conjunto Energy',
    descricao: 'Top e legging',
    preco: 249.9,
    imagemUrl: '/produto.jpg',
  };
  const produtoService = {
    buscarPorId: vi.fn(),
    criarProduto: vi.fn(),
    updateProduct: vi.fn(),
  };

  beforeEach(async () => {
    produtoService.buscarPorId.mockReset();
    produtoService.criarProduto.mockReset();
    produtoService.updateProduct.mockReset();
    produtoService.buscarPorId.mockReturnValue(of(undefined));
    produtoService.criarProduto.mockReturnValue(of(produtoSalvo));
    produtoService.updateProduct.mockReturnValue(of({ message: 'Produto atualizado' }));
    routeParamMap = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [AdminProduto],
      providers: [
        provideRouter([]),
        { provide: ProdutoService, useValue: produtoService },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: routeParamMap.asObservable() },
        },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdminProduto);
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

  it('should create a product with the selected image', () => {
    const foto = new File(['foto'], 'produto.jpg', { type: 'image/jpeg' });
    component.produtoForm.setValue({
      nome: 'Conjunto Energy',
      descricao: 'Top e legging',
      preco: 249.9,
    });
    component.arquivoSelecionado = foto;

    component.salvarProduto();

    expect(produtoService.criarProduto).toHaveBeenCalledOnce();
    const formData = produtoService.criarProduto.mock.calls[0][0] as FormData;
    expect(formData.get('nome')).toBe('Conjunto Energy');
    expect(formData.get('foto')).toBe(foto);
    expect(component.mensagemSucesso).toBe('Produto cadastrado com sucesso!');
  });

  it('should update a product without requiring a new image', () => {
    component.produtoId = 'produto-1';
    component.produtoForm.setValue({
      nome: 'Conjunto Energy atualizado',
      descricao: 'Nova descrição',
      preco: 259.9,
    });

    component.salvarProduto();

    expect(produtoService.updateProduct).toHaveBeenCalledOnce();
    expect(produtoService.updateProduct.mock.calls[0][0]).toBe('produto-1');
    const formData = produtoService.updateProduct.mock.calls[0][1] as FormData;
    expect(formData.get('foto')).toBeNull();
    expect(component.mensagemSucesso).toContain('demonstração');
  });

  it('should load an existing product from the edit route', () => {
    produtoService.buscarPorId.mockReturnValue(of(produtoSalvo));

    routeParamMap.next(convertToParamMap({ id: 'produto-1' }));

    expect(produtoService.buscarPorId).toHaveBeenCalledWith('produto-1');
    expect(component.produtoId).toBe('produto-1');
    expect(component.produtoForm.getRawValue()).toEqual({
      nome: 'Conjunto Energy',
      descricao: 'Top e legging',
      preco: 249.9,
    });
    expect(component.imagemAtual).toBe('/produto.jpg');
    expect(component.produtoForm.enabled).toBe(true);
  });

  it('should block editing when the route product does not exist', () => {
    produtoService.buscarPorId.mockReturnValue(of(undefined));

    routeParamMap.next(convertToParamMap({ id: 'inexistente' }));
    component.salvarProduto();

    expect(component.edicaoBloqueada).toBe(true);
    expect(component.produtoForm.disabled).toBe(true);
    expect(component.mensagemErro).toBe('Produto não encontrado.');
    expect(produtoService.updateProduct).not.toHaveBeenCalled();
  });

  it('should not create a product without an image', () => {
    component.produtoForm.setValue({
      nome: 'Conjunto Energy',
      descricao: 'Top e legging',
      preco: 249.9,
    });

    component.salvarProduto();

    expect(produtoService.criarProduto).not.toHaveBeenCalled();
    expect(component.mensagemErro).toContain('selecione uma foto');
  });
});
