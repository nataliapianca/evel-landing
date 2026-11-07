// src/app/components/admin-produto/admin-produto.ts
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, Observable, catchError, map, of, switchMap, tap } from 'rxjs';

import { ProdutoService } from '../../core/services/produto.service';
import { Product } from '../../shared/models/product.model';

interface ResultadoCarregamento {
  produto?: Product;
  erro: boolean;
}

interface FotoNova {
  arquivo: File;
  previewUrl: string;
}

type CampoOpcoes = 'tamanhos' | 'cores';

// Tabela de medidas da Evel (letra -> numeração). Para incluir PP ou GG, acrescente aqui
// e em produtos.ts (medidasPorTamanho).
const TAMANHOS_DISPONIVEIS = [
  { valor: 'P', medida: '36 a 40' },
  { valor: 'M', medida: '42 a 44' },
  { valor: 'G', medida: '46 a 48' },
  { valor: 'GG', medida: '50 a 52' },
];

const CORES_INICIAIS = ['Preto', 'Branco', 'Rosa', 'Bordô', 'Blush', 'Vermelho'];

// Produtos antigos (sem tamanhos/cores salvos) aparecem na vitrine com estas opções.
const TAMANHOS_PADRAO = ['P', 'M', 'G'];
const CORES_PADRAO = ['Preto', 'Branco', 'Rosa', 'Bordô', 'Blush'];

@Component({
  selector: 'app-admin-produto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-produto.html',
  styleUrls: ['./admin-produto.scss'],
})
export class AdminProduto implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  // Projeto zoneless: mudanças feitas dentro de subscribe() precisam avisar o Angular.
  private readonly cdr = inject(ChangeDetectorRef);

  readonly tamanhosDisponiveis = TAMANHOS_DISPONIVEIS;
  readonly maxFotos = 8;
  coresDisponiveis = [...CORES_INICIAIS];

  produtoForm: FormGroup;
  produtoId: string | null = null;

  // Fotos que já estão salvas no produto (edição) e as que o admin marcou para remover.
  fotosExistentes: string[] = [];
  fotosRemovidas: string[] = [];
  // Fotos escolhidas agora, ainda não enviadas.
  novasFotos: FotoNova[] = [];

  carregandoProduto = false;
  edicaoBloqueada = false;
  salvando = false;
  fotoInvalida = false;
  mensagemSucesso = '';
  mensagemErro = '';

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private route: ActivatedRoute,
  ) {
    this.produtoForm = this.fb.group({
      nome: ['', [Validators.required, Validators.pattern(/\S/)]],
      descricao: ['', [Validators.required, Validators.pattern(/\S/)]],
      preco: [null, [Validators.required, Validators.min(0)]],
      tamanhos: [[] as string[], [Validators.required]],
      cores: [[] as string[], [Validators.required]],
    });

    this.destroyRef.onDestroy(() => this.limparNovasFotos());
  }

  get modoEdicao(): boolean {
    return this.produtoId !== null;
  }

  get totalFotos(): number {
    return this.fotosExistentes.length + this.novasFotos.length;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        tap((id) => this.prepararRota(id)),
        switchMap((id) => {
          if (!id) {
            return EMPTY;
          }

          return this.produtoService.buscarPorId(id).pipe(
            map((produto): ResultadoCarregamento => ({ produto, erro: false })),
            catchError(() => of<ResultadoCarregamento>({ erro: true })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resultado) => this.aplicarProdutoCarregado(resultado));
  }

  // ---------- Tamanhos e cores ----------

  opcaoSelecionada(campo: CampoOpcoes, valor: string): boolean {
    const atuais: string[] = this.produtoForm.controls[campo].value ?? [];
    return atuais.includes(valor);
  }

  alternarOpcao(campo: CampoOpcoes, valor: string, evento: Event): void {
    const marcado = (evento.target as HTMLInputElement).checked;
    const controle = this.produtoForm.controls[campo];
    const atuais: string[] = controle.value ?? [];
    const semValor = atuais.filter((item) => item !== valor);
    const proximos = marcado ? [...semValor, valor] : semValor;

    const ordem =
      campo === 'tamanhos' ? this.tamanhosDisponiveis.map((t) => t.valor) : this.coresDisponiveis;
    proximos.sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));

    controle.setValue(proximos);
    controle.markAsTouched();
    controle.markAsDirty();
  }

  adicionarCor(campoTexto: HTMLInputElement, evento?: Event): void {
    evento?.preventDefault();

    const texto = campoTexto.value.replace(/,/g, ' ').trim();
    if (!texto) {
      return;
    }

    const nome = texto.charAt(0).toUpperCase() + texto.slice(1);
    const existente = this.coresDisponiveis.find((cor) => cor.toLowerCase() === nome.toLowerCase());
    const cor = existente ?? nome;

    if (!existente) {
      this.coresDisponiveis = [...this.coresDisponiveis, cor];
    }

    const controle = this.produtoForm.controls['cores'];
    const atuais: string[] = controle.value ?? [];
    if (!atuais.includes(cor)) {
      controle.setValue([...atuais, cor]);
    }
    controle.markAsTouched();
    controle.markAsDirty();
    campoTexto.value = '';
  }

  // ---------- Fotos ----------

  onFilesSelected(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivos = Array.from(input.files ?? []);
    // Limpa o campo para permitir escolher o mesmo arquivo de novo e ir somando fotos.
    input.value = '';

    this.fotoInvalida = false;
    this.mensagemErro = '';

    for (const arquivo of arquivos) {
      if (!arquivo.type.startsWith('image/')) {
        continue;
      }

      if (this.totalFotos >= this.maxFotos) {
        this.mensagemErro = `O limite é de ${this.maxFotos} fotos por produto.`;
        break;
      }

      this.novasFotos.push({ arquivo, previewUrl: URL.createObjectURL(arquivo) });
    }
  }

  removerFotoExistente(url: string): void {
    this.fotosExistentes = this.fotosExistentes.filter((foto) => foto !== url);
    this.fotosRemovidas = [...this.fotosRemovidas, url];
    this.mensagemErro = '';
  }

  removerFotoNova(indice: number): void {
    const [removida] = this.novasFotos.splice(indice, 1);
    if (removida) {
      URL.revokeObjectURL(removida.previewUrl);
    }
    this.mensagemErro = '';
  }

  // ---------- Salvar ----------

  salvarProduto(): void {
    if (this.salvando || this.carregandoProduto || this.edicaoBloqueada) {
      return;
    }

    const semFoto = this.totalFotos === 0;

    if (this.produtoForm.invalid || semFoto) {
      this.produtoForm.markAllAsTouched();
      this.fotoInvalida = semFoto;
      this.mensagemErro =
        'Revise os campos obrigatórios: escolha ao menos um tamanho, uma cor e uma foto.';
      return;
    }

    this.salvando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const formData = new FormData();
    const { nome, descricao, preco, tamanhos, cores } = this.produtoForm.getRawValue();
    formData.append('nome', String(nome).trim());
    formData.append('descricao', String(descricao).trim());
    formData.append('preco', String(preco));
    (tamanhos as string[]).forEach((tamanho) => formData.append('tamanhos', tamanho));
    (cores as string[]).forEach((cor) => formData.append('cores', cor));
    this.novasFotos.forEach((foto) => formData.append('fotos', foto.arquivo));

    let requisicao$: Observable<Product>;
    let mensagem: string;

    if (this.modoEdicao && this.produtoId) {
      this.fotosRemovidas.forEach((url) => formData.append('removerImagens', url));
      requisicao$ = this.produtoService.updateProduct(this.produtoId, formData);
      mensagem = 'Produto atualizado com sucesso!';
    } else {
      requisicao$ = this.produtoService.criarProduto(formData);
      mensagem = 'Produto cadastrado com sucesso!';
    }

    requisicao$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (produto) => {
        this.salvando = false;
        this.mensagemSucesso = mensagem;

        if (this.modoEdicao) {
          this.sincronizarFotos(produto);
        } else {
          this.produtoForm.reset(this.valoresIniciais());
          this.limparNovasFotos();
          this.fotosExistentes = [];
          this.fotosRemovidas = [];
          this.fotoInvalida = false;
        }

        this.cdr.markForCheck();
      },
      error: (erro: unknown) => {
        this.salvando = false;
        this.mensagemErro = this.mensagemDeErro(erro);
        this.cdr.markForCheck();
      },
    });
  }

  campoInvalido(campo: 'nome' | 'descricao' | 'preco' | 'tamanhos' | 'cores'): boolean {
    const control = this.produtoForm.controls[campo];
    return control.invalid && control.touched;
  }

  // ---------- Internos ----------

  private valoresIniciais() {
    return { nome: '', descricao: '', preco: null, tamanhos: [] as string[], cores: [] as string[] };
  }

  private mensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 401 || erro.status === 403) {
        return 'Sua sessão expirou ou você não tem permissão. Entre novamente no painel.';
      }
      if (erro.status === 413) {
        return 'As fotos são muito grandes. Reduza o tamanho e tente novamente.';
      }
    }

    return this.modoEdicao
      ? 'Não foi possível atualizar o produto.'
      : 'Não foi possível cadastrar o produto.';
  }

  private limparNovasFotos(): void {
    this.novasFotos.forEach((foto) => URL.revokeObjectURL(foto.previewUrl));
    this.novasFotos = [];
  }

  private sincronizarFotos(produto: Product): void {
    this.fotosExistentes = this.fotosDoProduto(produto);
    this.fotosRemovidas = [];
    this.limparNovasFotos();
  }

  private fotosDoProduto(produto: Product): string[] {
    if (produto.imagens?.length) {
      return [...produto.imagens];
    }
    return produto.imagemUrl ? [produto.imagemUrl] : [];
  }

  private prepararRota(id: string | null): void {
    this.produtoId = id;
    this.fotosExistentes = [];
    this.fotosRemovidas = [];
    this.limparNovasFotos();
    this.edicaoBloqueada = false;
    this.carregandoProduto = !!id;
    this.fotoInvalida = false;
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.produtoForm.reset(this.valoresIniciais());

    if (id) {
      this.produtoForm.disable();
    } else {
      this.produtoForm.enable();
    }

    this.cdr.markForCheck();
  }

  private aplicarProdutoCarregado(resultado: ResultadoCarregamento): void {
    this.carregandoProduto = false;

    if (resultado.erro) {
      this.edicaoBloqueada = true;
      this.mensagemErro = 'Não foi possível carregar o produto.';
      this.cdr.markForCheck();
      return;
    }

    if (!resultado.produto) {
      this.edicaoBloqueada = true;
      this.mensagemErro = 'Produto não encontrado.';
      this.cdr.markForCheck();
      return;
    }

    const produto = resultado.produto;
    const tamanhos = produto.tamanhos?.length ? [...produto.tamanhos] : [...TAMANHOS_PADRAO];
    const cores = produto.cores?.length ? [...produto.cores] : [...CORES_PADRAO];

    // Cores personalizadas salvas antes aparecem como opção marcada.
    const novasCores = cores.filter((cor) => !this.coresDisponiveis.includes(cor));
    if (novasCores.length > 0) {
      this.coresDisponiveis = [...this.coresDisponiveis, ...novasCores];
    }

    this.produtoForm.enable();
    this.produtoForm.patchValue({
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      tamanhos,
      cores,
    });
    this.fotosExistentes = this.fotosDoProduto(produto);
    this.cdr.markForCheck();
  }
}
