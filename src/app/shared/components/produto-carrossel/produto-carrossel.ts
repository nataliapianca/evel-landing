// src/app/shared/components/produto-carrossel/produto-carrossel.ts
import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-produto-carrossel',
  standalone: true,
  template: `
    @if (total() > 0) {
      <div class="viewport" (touchstart)="aoIniciarToque($event)" (touchend)="aoFinalizarToque($event)">
        <img
          class="slide"
          [src]="imagens()[indiceAtual()]"
          [alt]="total() > 1 ? alt() + ' (foto ' + (indiceAtual() + 1) + ' de ' + total() + ')' : alt()"
        />

        @if (total() > 1) {
          <button type="button" class="seta anterior" aria-label="Foto anterior" (click)="anterior()">
            ‹
          </button>
          <button type="button" class="seta proxima" aria-label="Próxima foto" (click)="proxima()">
            ›
          </button>

          <div class="pontos">
            @for (foto of imagens(); track $index) {
              <button
                type="button"
                class="ponto"
                [class.ativo]="$index === indiceAtual()"
                [attr.aria-label]="'Ver foto ' + ($index + 1)"
                [attr.aria-current]="$index === indiceAtual() ? 'true' : null"
                (click)="irPara($index)"
              ></button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .viewport {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .slide {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .seta {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.85);
        color: #222;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        display: grid;
        place-items: center;
        padding: 0 0 3px;
      }
      .seta:hover {
        background: #fff;
      }
      .seta:focus-visible,
      .ponto:focus-visible {
        outline: 2px solid #222;
        outline-offset: 2px;
      }
      .anterior {
        left: 8px;
      }
      .proxima {
        right: 8px;
      }
      .pontos {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 10px;
        display: flex;
        justify-content: center;
        gap: 6px;
      }
      .ponto {
        width: 8px;
        height: 8px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        cursor: pointer;
      }
      .ponto.ativo {
        background: #fff;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
      }
    `,
  ],
})
export class ProdutoCarrossel {
  imagens = input.required<readonly string[]>();
  alt = input('');

  private readonly indice = signal(0);
  private toqueInicialX: number | null = null;

  total = computed(() => this.imagens().length);
  // Garante que o índice nunca passe do tamanho da lista, mesmo se as fotos mudarem.
  indiceAtual = computed(() => Math.min(this.indice(), Math.max(this.total() - 1, 0)));

  anterior(): void {
    const total = this.total();
    this.indice.set((this.indiceAtual() - 1 + total) % total);
  }

  proxima(): void {
    this.indice.set((this.indiceAtual() + 1) % this.total());
  }

  irPara(posicao: number): void {
    this.indice.set(posicao);
  }

  // Deslizar o dedo para o lado no celular
  aoIniciarToque(evento: TouchEvent): void {
    this.toqueInicialX = evento.changedTouches[0]?.clientX ?? null;
  }

  aoFinalizarToque(evento: TouchEvent): void {
    if (this.toqueInicialX === null || this.total() < 2) {
      return;
    }

    const diferenca = (evento.changedTouches[0]?.clientX ?? this.toqueInicialX) - this.toqueInicialX;
    this.toqueInicialX = null;

    if (Math.abs(diferenca) < 40) {
      return;
    }

    if (diferenca < 0) {
      this.proxima();
    } else {
      this.anterior();
    }
  }
}
