import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

declare global {
  interface Window {
    instgrm?: { Embeds: { process(): void } };
  }
}

@Component({
  selector: 'app-galeria', standalone: true, imports: [],
  templateUrl: './galeria.html', styleUrl: './galeria.scss',
})
export class Galeria implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // Para trocar ou acrescentar posts, edite esta lista (cole o link de cada publicação).
  readonly posts = [
    'https://www.instagram.com/p/De95idSJrvt/',
    'https://www.instagram.com/p/Dee0x43FkQt/',
    'https://www.instagram.com/p/DbTRSopjt5A/',
    'https://www.instagram.com/p/De6zi7qkbwZ/',
    'https://www.instagram.com/reel/De4R1cmt-wl/',
    'https://www.instagram.com/p/DZDCJFdDknX/',
  ];

  // Os posts só aparecem (e o script do Instagram só é baixado) quando a seção
  // está perto de entrar na tela. Assim o início do site continua rápido.
  readonly mostrar = signal(false);

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.ativar();
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          observador.disconnect();
          this.ativar();
        }
      },
      { rootMargin: '400px 0px' },
    );

    observador.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observador.disconnect());
  }

  private ativar(): void {
    this.mostrar.set(true);
    // Espera o Angular desenhar os <blockquote> antes de pedir ao Instagram para transformá-los.
    afterNextRender(() => this.processarEmbeds(), { injector: this.injector });
  }

  private processarEmbeds(): void {
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>('script[data-instagram-embed]');

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.dataset['instagramEmbed'] = 'true';
      document.body.appendChild(script);
    }

    script.addEventListener('load', () => window.instgrm?.Embeds.process(), { once: true });
  }
}
