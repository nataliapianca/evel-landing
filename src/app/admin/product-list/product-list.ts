import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProdutoService } from '../../core/services/produto.service';
import { Product } from '../../shared/models/product.model';

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private readonly produtoService = inject(ProdutoService);

  // Signals: o projeto é zoneless, então só signals atualizam a tela sozinhos.
  produtos = signal<Product[]>([]);
  carregando = signal(true);
  mensagemErro = signal('');
  mensagemSucesso = signal('');
  excluindoId = signal<string | null>(null);

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando.set(true);
    this.mensagemErro.set('');

    this.produtoService.listar().subscribe({
      next: (produtos) => {
        this.produtos.set(produtos);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.mensagemErro.set('Não foi possível carregar os produtos.');
      },
    });
  }

  excluirProduto(produto: Product, id: string): void {
    if (this.excluindoId()) {
      return;
    }

    const confirmou = window.confirm(
      `Excluir “${produto.nome}” definitivamente? Essa ação não pode ser desfeita.`,
    );
    if (!confirmou) {
      return;
    }

    this.excluindoId.set(id);
    this.mensagemErro.set('');
    this.mensagemSucesso.set('');

    this.produtoService.deleteProduct(id).subscribe({
      next: () => {
        this.produtos.update((lista) => lista.filter((item) => item.id !== id));
        this.excluindoId.set(null);
        this.mensagemSucesso.set('Produto excluído com sucesso.');
      },
      error: (erro: unknown) => {
        this.excluindoId.set(null);
        this.mensagemErro.set(this.mensagemDeErro(erro, 'Não foi possível excluir o produto.'));
      },
    });
  }

  trackByProduto(index: number, produto: Product): string {
    return produto.id ?? `produto-${index}`;
  }

  private mensagemDeErro(erro: unknown, padrao: string): string {
    if (erro instanceof HttpErrorResponse && (erro.status === 401 || erro.status === 403)) {
      return 'Sua sessão expirou ou você não tem permissão. Entre novamente no painel.';
    }
    return padrao;
  }
}
