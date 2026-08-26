import { Routes } from '@angular/router';
import { AdminProduto } from './components/admin-produto/admin-produto';
import { Produtos } from './components/produtos/produtos';
export const routes: Routes = [
    { path: 'admin', component: AdminProduto },
    { path: 'produtos', component: Produtos },
    { path: '', redirectTo: '/produtos', pathMatch: 'full' }
];


