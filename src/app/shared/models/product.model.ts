// src/app/shared/models/product.model.ts
export interface Product {
  id?: string;
  nome: string;
  descricao: string;
  preco: number;
  imagemUrl: string;
  tamanhos?: string[];
  cores?: string[];
}
