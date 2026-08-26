import { Routes } from '@angular/router';
import { AdminProduto } from './components/admin-produto/admin-produto';
import { Produtos } from './components/produtos/produtos';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'produtos', component: Produtos },
  { path: 'admin', component: AdminProduto },
];


