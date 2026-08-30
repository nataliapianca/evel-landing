// src/app/components/produtos/produtos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProdutoService } from '../../core/services/produto.service';
import { Product } from '../../shared/models/product.model';
import { WhatsappService } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produtos.html',
  styleUrls: ['./produtos.scss']
})
export class Produtos implements OnInit {
  listaProdutos: Product[] = [];
  carregando = true;
  erroAoCarregar = false;
  readonly tamanhosPadrao = ['PP', 'P', 'M', 'G', 'GG'];
  readonly coresPadrao = ['Preto', 'Branco', 'Rosa', 'Bordô', 'Blush'];

  constructor(
    private produtoService: ProdutoService,
    private whatsappService: WhatsappService
  ) {}

  ngOnInit(): void {
    // Busca os produtos cadastrados na API (MongoDB + Cloudinary)
    this.produtoService.listar().subscribe({
      next: (dados) => {
        this.listaProdutos = dados;
        this.carregando = false;
      },
      error: (err) => {
        this.carregando = false;
        this.erroAoCarregar = true;
        console.error('Erro ao carregar os produtos:', err);
      }
    });
  }

  opcoesDeTamanho(produto: Product): readonly string[] {
    return produto.tamanhos ?? this.tamanhosPadrao;
  }

  opcoesDeCor(produto: Product): readonly string[] {
    return produto.cores ?? this.coresPadrao;
  }

  produtoTemOpcoes(produto: Product): boolean {
    return this.opcoesDeTamanho(produto).length > 0 && this.opcoesDeCor(produto).length > 0;
  }

  montarMensagem(nomeProduto: string, tamanho: string, cor: string): string {
    return `Olá! Gostaria de encomendar o produto ${nomeProduto}, no tamanho ${tamanho} e na cor ${cor}.`;
  }

  comprarViaWhatsapp(
    nomeProduto: string,
    tamanho: string | null | undefined,
    cor: string | null | undefined,
  ): void {
    const tamanhoSelecionado = tamanho?.trim() ?? '';
    const corSelecionada = cor?.trim() ?? '';

    if (!tamanhoSelecionado || !corSelecionada) {
      return;
    }

    const mensagem = this.montarMensagem(nomeProduto, tamanhoSelecionado, corSelecionada);
    const link = this.whatsappService.buildLink(mensagem);
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}
