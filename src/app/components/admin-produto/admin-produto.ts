// src/app/components/admin-produto/admin-produto.ts
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
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

@Component({
  selector: 'app-admin-produto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-produto.html',
  styleUrls: ['./admin-produto.scss'],
})
export class AdminProduto implements OnInit {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  private readonly destroyRef = inject(DestroyRef);

  produtoForm: FormGroup;
  arquivoSelecionado: File | null = null;
  produtoId: string | null = null;
  imagemAtual = '';
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
    });
  }

  get modoEdicao(): boolean {
    return this.produtoId !== null;
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.arquivoSelecionado = input.files?.[0] ?? null;
    this.fotoInvalida = false;
  }

  salvarProduto(): void {
    if (this.salvando || this.carregandoProduto || this.edicaoBloqueada) {
      return;
    }

    const faltaFotoNaCriacao = !this.modoEdicao && !this.arquivoSelecionado;

    if (this.produtoForm.invalid || faltaFotoNaCriacao) {
      this.produtoForm.markAllAsTouched();
      this.fotoInvalida = faltaFotoNaCriacao;
      this.mensagemErro = faltaFotoNaCriacao
        ? 'Preencha os campos obrigatórios e selecione uma foto.'
        : 'Revise os campos obrigatórios.';
      return;
    }

    this.salvando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const formData = new FormData();
    const { nome, descricao, preco } = this.produtoForm.getRawValue();
    formData.append('nome', String(nome).trim());
    formData.append('descricao', String(descricao).trim());
    formData.append('preco', String(preco));

    if (this.arquivoSelecionado) {
      formData.append('foto', this.arquivoSelecionado);
    }

    let requisicao$: Observable<unknown>;
    let mensagem: string;

    if (this.modoEdicao && this.produtoId) {
      requisicao$ = this.produtoService.updateProduct(this.produtoId, formData);
      mensagem = 'Produto atualizado na demonstração!';
    } else {
      requisicao$ = this.produtoService.criarProduto(formData);
      mensagem = 'Produto cadastrado com sucesso!';
    }

    requisicao$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.salvando = false;
        this.mensagemSucesso = mensagem;

        if (!this.modoEdicao) {
          this.produtoForm.reset();
          this.arquivoSelecionado = null;
          this.fotoInvalida = false;
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }
        }
      },
      error: () => {
        this.salvando = false;
        this.mensagemErro = this.modoEdicao
          ? 'Não foi possível simular a atualização do produto.'
          : 'Não foi possível cadastrar o produto.';
      },
    });
  }

  campoInvalido(campo: 'nome' | 'descricao' | 'preco'): boolean {
    const control = this.produtoForm.controls[campo];
    return control.invalid && control.touched;
  }

  private prepararRota(id: string | null): void {
    this.produtoId = id;
    this.imagemAtual = '';
    this.arquivoSelecionado = null;
    this.edicaoBloqueada = false;
    this.carregandoProduto = !!id;
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.produtoForm.reset();

    if (id) {
      this.produtoForm.disable();
    } else {
      this.produtoForm.enable();
    }
  }

  private aplicarProdutoCarregado(resultado: ResultadoCarregamento): void {
    this.carregandoProduto = false;

    if (resultado.erro) {
      this.edicaoBloqueada = true;
      this.mensagemErro = 'Não foi possível carregar o produto.';
      return;
    }

    if (!resultado.produto) {
      this.edicaoBloqueada = true;
      this.mensagemErro = 'Produto não encontrado.';
      return;
    }

    this.produtoForm.enable();
    this.produtoForm.patchValue({
      nome: resultado.produto.nome,
      descricao: resultado.produto.descricao,
      preco: resultado.produto.preco,
    });
    this.imagemAtual = resultado.produto.imagemUrl;
  }
}
