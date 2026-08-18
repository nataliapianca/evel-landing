// src/app/components/produtos/produtos.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProdutoService } from '../../core/services/produto.service';
import { Product } from '../../shared/models/product.model';
import { WhatsappService } from '../../core/services/whatsapp.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './produtos.html',
  styleUrls: ['./produtos.scss']
})
export class Produtos implements OnInit {
  listaProdutos: Product[] = [];

  constructor(
    private produtoService: ProdutoService,
    private whatsappService: WhatsappService
  ) {}

  ngOnInit(): void {
    // Busca os produtos cadastrados na API (MongoDB + Cloudinary)
    this.produtoService.listar().subscribe({
      next: (dados) => {
        this.listaProdutos = dados;
      },
      error: (err) => {
        console.error('Erro ao carregar os produtos:', err);
      }
    });
  }

  // Método para abrir o WhatsApp quando o cliente clicar em "Tenho Interesse"
  comprarViaWhatsapp(nomeProduto: string) {
    const link = this.whatsappService.linkParaProduto(nomeProduto);
    window.open(link, '_blank');
  }
}