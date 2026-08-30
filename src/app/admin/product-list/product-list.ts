import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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

  produtos: Product[] = [];
  carregando = true;
  mensagemErro = '';
  mensagemSucesso = '';
  excluindoId: string | null = null;

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.produtoService.listar().subscribe({
      next: (produtos) => {
        this.produtos = produtos;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.mensagemErro = 'Não foi possível carregar os produtos.';
      },
    });
  }

  excluirProduto(produto: Product, id: string): void {
    if (this.excluindoId) {
      return;
    }

    const confirmou = window.confirm(
      `Remover “${produto.nome}” da lista desta demonstração?`,
    );
    if (!confirmou) {
      return;
    }

    this.excluindoId = id;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.produtoService.deleteProduct(id).subscribe({
      next: () => {
        this.produtos = this.produtos.filter((item) => item.id !== id);
        this.excluindoId = null;
        this.mensagemSucesso = 'Produto removido somente desta visualização.';
      },
      error: () => {
        this.excluindoId = null;
        this.mensagemErro = 'Não foi possível simular a exclusão do produto.';
      },
    });
  }

  trackByProduto(index: number, produto: Product): string {
    return produto.id ?? `produto-${index}`;
  }
}
