// src/app/components/produtos/produtos.ts
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { retry, throwError, timeout, timer } from 'rxjs';
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
  // Vira true se a API demorar (ex.: acordando no Render) para mostrarmos um aviso amigável.
  demorando = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private avisoTimer?: ReturnType<typeof setTimeout>;

  // Tabela de medidas da Evel (letra -> numeração)
  readonly medidasPorTamanho: Readonly<Record<string, string>> = {
    P: '36 a 40',
    M: '42 a 44',
    G: '46 a 48',
    GG: '50 a 52',
  };
  readonly tamanhosPadrao = ['P', 'M', 'G'];
  readonly coresPadrao = ['Preto', 'Branco', 'Rosa', 'Bordô', 'Blush'];

  constructor(
    private produtoService: ProdutoService,
    private whatsappService: WhatsappService
  ) {}

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => clearTimeout(this.avisoTimer));
    this.carregarProdutos();
  }

  // Busca os produtos cadastrados na API (MongoDB + Cloudinary).
  // Se a API estiver "dormindo" (plano gratuito do Render), a primeira chamada pode falhar ou
  // demorar cerca de 1 minuto: tentamos de novo automaticamente e avisamos o visitante.
  carregarProdutos(): void {
    clearTimeout(this.avisoTimer);
    this.carregando.set(true);
    this.erroAoCarregar.set(false);
    this.demorando.set(false);
    this.avisoTimer = setTimeout(() => this.demorando.set(true), 5000);

    this.produtoService
      .listar()
      .pipe(
        timeout(30000),
        retry({
          count: 3,
          delay: (erro: unknown) =>
            this.valeTentarDeNovo(erro) ? timer(4000) : throwError(() => erro),
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (dados) => {
          clearTimeout(this.avisoTimer);
          this.listaProdutos.set(dados);
          this.demorando.set(false);
          this.carregando.set(false);
        },
        error: (err) => {
          clearTimeout(this.avisoTimer);
          this.demorando.set(false);
          this.carregando.set(false);
          this.erroAoCarregar.set(true);
          console.error('Erro ao carregar os produtos:', err);
        },
      });
  }

  // Erros de rede/servidor indisponível (API acordando) merecem nova tentativa.
  // O 503 do Render não traz cabeçalhos CORS, então o navegador o enxerga como status 0.
  private valeTentarDeNovo(erro: unknown): boolean {
    if (erro instanceof HttpErrorResponse) {
      return [0, 502, 503, 504].includes(erro.status);
    }
    return true; // timeout
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
