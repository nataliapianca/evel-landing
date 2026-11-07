// src/app/components/produtos/produtos.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProdutoService } from '../../core/services/produto.service';
import { Product } from '../../shared/models/product.model';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { ProdutoCarrossel } from '../../shared/components/produto-carrossel/produto-carrossel';

interface OpcaoTamanho {
  valor: string;
  rotulo: string;
}

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, FormsModule, ProdutoCarrossel],
  templateUrl: './produtos.html',
  styleUrls: ['./produtos.scss']
})
export class Produtos implements OnInit {
  // Signals: necessários porque o projeto é zoneless (sem zone.js).
  listaProdutos = signal<Product[]>([]);
  carregando = signal(true);
  erroAoCarregar = signal(false);

  // Tabela de medidas da Evel (letra -> numeração)
  readonly medidasPorTamanho: Readonly<Record<string, string>> = {
    P: '36 a 40',
    M: '42 a 44',
    G: '46 a 48',
  };
  readonly tamanhosPadrao = ['P', 'M', 'G'];
  readonly coresPadrao = ['Preto', 'Branco', 'Rosa', 'Bordô', 'Blush'];

  constructor(
    private produtoService: ProdutoService,
    private whatsappService: WhatsappService
  ) {}

  ngOnInit(): void {
    // Busca os produtos cadastrados na API (MongoDB + Cloudinary)
    this.produtoService.listar().subscribe({
      next: (dados) => {
        this.listaProdutos.set(dados);
        this.carregando.set(false);
      },
      error: (err) => {
        this.carregando.set(false);
        this.erroAoCarregar.set(true);
        console.error('Erro ao carregar os produtos:', err);
      }
    });
  }

  // Várias fotos viram carrossel; produtos antigos (só imagemUrl) continuam funcionando.
  imagensDoProduto(produto: Product): readonly string[] {
    return produto.imagens?.length ? produto.imagens : [produto.imagemUrl];
  }

  opcoesDeTamanho(produto: Product): readonly OpcaoTamanho[] {
    return (produto.tamanhos ?? this.tamanhosPadrao).map((tamanho) => {
      const medida = this.medidasPorTamanho[tamanho];
      return { valor: tamanho, rotulo: medida ? `${tamanho} – ${medida}` : tamanho };
    });
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
