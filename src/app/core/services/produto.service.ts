// src/app/core/services/produto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {

  // Endereço da nossa API Spring Boot rodando (localmente na porta 8080)
  private apiUrl = 'https://api-loja-9224.onrender.com/api/produtos';

  constructor(private http: HttpClient) { }

  // Busca todos os produtos cadastrados para exibir na landing page
  listar(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  // Envia a foto e os dados preenchidos pelo ADM para o backend
  criarProduto(formData: FormData): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, formData);
  }
}