// src/app/core/services/whatsapp.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  private readonly numero = environment.whatsappNumber;

  buildLink(mensagem: string): string {
    return `https://wa.me/${this.numero}?text=${encodeURIComponent(mensagem)}`;
  }
}
