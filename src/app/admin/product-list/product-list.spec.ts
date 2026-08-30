import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';

import { ProdutoService } from '../../core/services/produto.service';
import { Product } from '../../shared/models/product.model';
import { ProductList } from './product-list';

describe('ProductList', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;
  const produto: Product = {
    id: 'produto-1',
    nome: 'Conjunto Energy',
    descricao: 'Top e legging',
    preco: 249.9,
    imagemUrl: '/produto.jpg',
  };
  const produtoService = {
    listar: vi.fn(),
    deleteProduct: vi.fn(),
  };

  beforeEach(async () => {
    produtoService.listar.mockReset();
    produtoService.deleteProduct.mockReset();
    produtoService.listar.mockReturnValue(of([produto]));
    produtoService.deleteProduct.mockReturnValue(of({ message: 'Produto deletado' }));

    await TestBed.configureTestingModule({
      imports: [ProductList],
      providers: [provideRouter([]), { provide: ProdutoService, useValue: produtoService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load and render real products', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(produtoService.listar).toHaveBeenCalled();
    expect(text).toContain('Conjunto Energy');
    expect(text).toContain('Editar');
    expect(text).toContain('Excluir');
  });

  it('should keep the product when deletion is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.excluirProduto(produto, 'produto-1');

    expect(produtoService.deleteProduct).not.toHaveBeenCalled();
    expect(component.produtos).toContain(produto);
  });

  it('should call the fake deletion and remove the product from the visible list', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.excluirProduto(produto, 'produto-1');

    expect(produtoService.deleteProduct).toHaveBeenCalledWith('produto-1');
    expect(component.produtos).toEqual([]);
    expect(component.mensagemSucesso).toContain('visualização');
  });

  it('should prevent concurrent deletions and preserve products after an error', () => {
    const deleteResult = new Subject<{ message: string }>();
    const outroProduto: Product = { ...produto, id: 'produto-2', nome: 'Top Duo' };
    component.produtos = [produto, outroProduto];
    produtoService.deleteProduct.mockReturnValue(deleteResult);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.excluirProduto(produto, 'produto-1');
    component.excluirProduto(outroProduto, 'produto-2');

    expect(produtoService.deleteProduct).toHaveBeenCalledOnce();
    expect(component.excluindoId).toBe('produto-1');

    deleteResult.error(new Error('falha'));

    expect(component.excluindoId).toBeNull();
    expect(component.produtos).toEqual([produto, outroProduto]);
    expect(component.mensagemErro).toContain('simular a exclusão');
  });
});
