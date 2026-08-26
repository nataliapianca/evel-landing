// src/app/core/services/whatsapp.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  // Número de WhatsApp configurado para a loja
  private readonly numero = '5527988335127';
  

  buildLink(mensagem: string): string {
    return `https://wa.me/${this.numero}?text=${encodeURIComponent(mensagem)}`;
  }

  linkParaProduto(nomeProduto: string): string {
    const msg = `Olá! Tenho interesse na ${nomeProduto}.`;
    return this.buildLink(msg);
  }
}