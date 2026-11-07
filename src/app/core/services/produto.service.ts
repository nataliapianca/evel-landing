// src/app/core/services/produto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '../../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {

  // Endereço da API Spring Boot publicada no Render
  private apiUrl = 'https://api-loja-9224.onrender.com/api/produtos';

  constructor(private http: HttpClient) { }

  // Busca todos os produtos cadastrados para exibir na landing page
  listar(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  buscarPorId(id: string): Observable<Product | undefined> {
    return this.listar().pipe(map((produtos) => produtos.find((produto) => produto.id === id)));
  }

  // Envia as fotos e os dados preenchidos pelo ADM para o backend
  criarProduto(formData: FormData): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, formData);
  }

  // Exclusão real (exige login de administrador; o authInterceptor envia o token)
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Atualização real (multipart: dados, fotos novas e fotos a remover)
  updateProduct(id: string, formData: FormData): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, formData);
  }
}
