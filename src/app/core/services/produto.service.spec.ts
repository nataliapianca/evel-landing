import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { Product } from '../../shared/models/product.model';
import { ProdutoService } from './produto.service';

describe('ProdutoService', () => {
  let service: ProdutoService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProdutoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProdutoService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.useRealTimers();
  });

  it('should find a product by id using the existing list endpoint', async () => {
    const produto: Product = {
      id: 'produto-1',
      nome: 'Conjunto Energy',
      descricao: 'Top e legging',
      preco: 249.9,
      imagemUrl: '/produto.jpg',
    };
    const resultPromise = firstValueFrom(service.buscarPorId('produto-1'));
    const request = httpTesting.expectOne('https://api-loja-9224.onrender.com/api/produtos');
    request.flush([produto]);

    await expect(resultPromise).resolves.toEqual(produto);
  });

  it('should simulate product deletion', async () => {
    vi.useFakeTimers();
    const resultPromise = firstValueFrom(service.deleteProduct('produto-1'));

    await vi.advanceTimersByTimeAsync(500);

    await expect(resultPromise).resolves.toEqual({ message: 'Produto produto-1 deletado' });
  });

  it('should simulate product update', async () => {
    vi.useFakeTimers();
    const resultPromise = firstValueFrom(service.updateProduct('produto-1', new FormData()));

    await vi.advanceTimersByTimeAsync(500);

    await expect(resultPromise).resolves.toEqual({ message: 'Produto produto-1 atualizado' });
  });
});
