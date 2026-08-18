// src/app/components/admin-produto/admin-produto.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProdutoService } from '../../core/services/produto.service';

@Component({
  selector: 'app-admin-produto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-produto.html',
  styleUrls: ['./admin-produto.scss']
})
export class AdminProduto {
  produtoForm: FormGroup;
  arquivoSelecionado: File | null = null;
  mensagemSucesso = '';

  constructor(private fb: FormBuilder, private produtoService: ProdutoService) {
    this.produtoForm = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required],
      preco: ['', [Validators.required, Validators.min(0)]]
    });
  }

  // Captura o arquivo de imagem quando o usuário seleciona no input type="file"
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.arquivoSelecionado = file;
    }
  }

  // Disparado quando o admin clica em salvar
  salvarProduto() {
    if (this.produtoForm.invalid || !this.arquivoSelecionado) {
      alert('Preencha todos os campos e selecione uma foto!');
      return;
    }

    const formData = new FormData();
    formData.append('nome', this.produtoForm.get('nome')?.value);
    formData.append('descricao', this.produtoForm.get('descricao')?.value);
    formData.append('preco', this.produtoForm.get('preco')?.value);
    formData.append('foto', this.arquivoSelecionado);

    this.produtoService.criarProduto(formData).subscribe({
      next: (resposta) => {
        this.mensagemSucesso = 'Produto cadastrado com sucesso!';
        this.produtoForm.reset();
        this.arquivoSelecionado = null;
      },
      error: (erro) => {
        console.error('Erro ao salvar produto', erro);
        alert('Erro ao cadastrar produto.');
      }
    });
  }
}