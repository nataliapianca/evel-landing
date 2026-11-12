import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../admin/auth.service';

const ROTA_LOGIN_ADMIN = '/admin/login';

function caminhoDe(req: HttpRequest<unknown>): string {
  try {
    return new URL(req.url, 'http://localhost').pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

// A listagem de produtos (GET /api/produtos) é pública na API.
// Não enviamos o token nela: se o token do admin estiver vencido,
// o backend responderia 401 e a vitrine não carregaria.
function ehListagemPublica(req: HttpRequest<unknown>): boolean {
  return req.method === 'GET' && caminhoDe(req) === '/api/produtos';
}

// O login também não deve levar token antigo.
function ehLogin(req: HttpRequest<unknown>): boolean {
  return caminhoDe(req) === '/api/auth/login';
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const enviarToken = !!token && !ehListagemPublica(req) && !ehLogin(req);

  if (enviarToken) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((erro: unknown) => {
      // Token rejeitado pela API: apaga o token e leva o admin para o login.
      // Só acontece em chamadas que levaram token, então a vitrine pública nunca é afetada.
      if (enviarToken && erro instanceof HttpErrorResponse && erro.status === 401) {
        authService.logout();
        if (!router.url.startsWith(ROTA_LOGIN_ADMIN)) {
          void router.navigate([ROTA_LOGIN_ADMIN]);
        }
      }
      return throwError(() => erro);
    }),
  );
};
