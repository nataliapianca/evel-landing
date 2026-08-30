import { Routes } from '@angular/router';
import { adminGuard } from './admin/auth.guard';
import { Dashboard } from './admin/dashboard/dashboard';
import { Login } from './admin/login/login';
import { ProductList } from './admin/product-list/product-list';
import { AdminProduto } from './components/admin-produto/admin-produto';
import { Produtos } from './components/produtos/produtos';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'produtos', component: Produtos },
  { path: 'admin/login', component: Login, title: 'Login administrativo | Evel' },
  {
    path: 'admin/dashboard',
    component: Dashboard,
    canActivate: [adminGuard],
    title: 'Painel administrativo | Evel',
  },
  {
    path: 'admin/produtos/novo',
    component: AdminProduto,
    canActivate: [adminGuard],
    title: 'Cadastrar produto | Evel',
  },
  {
    path: 'admin/produtos/editar/:id',
    component: AdminProduto,
    canActivate: [adminGuard],
    title: 'Editar produto | Evel',
  },
  {
    path: 'admin/produtos/lista',
    component: ProductList,
    canActivate: [adminGuard],
    title: 'Gerenciar produtos | Evel',
  },
  { path: 'admin', redirectTo: 'admin/dashboard', pathMatch: 'full' },
];
