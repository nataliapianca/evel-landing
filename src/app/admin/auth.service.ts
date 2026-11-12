import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string | null;
  tokenType: string | null;
  expiresIn: number;
}

const ADMIN_TOKEN_KEY = 'adminToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'https://api-loja-9224.onrender.com/api/auth/login';

  constructor(private http: HttpClient) {}

  login(email: string, senha: string): Observable<LoginResponse> {
    const body: LoginRequest = { email: email.trim(), password: senha };

    return this.http.post<LoginResponse>(this.apiUrl, body).pipe(
      tap((result) => {
        if (result.token) {
          this.storage?.setItem(ADMIN_TOKEN_KEY, result.token);
        } else {
          this.storage?.removeItem(ADMIN_TOKEN_KEY);
        }
      }),
    );
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Devolve o token só se ainda estiver válido; token vencido é apagado na hora.
  getToken(): string | null {
    const token = this.storage?.getItem(ADMIN_TOKEN_KEY) ?? null;
    if (!token) {
      return null;
    }

    if (this.tokenExpirado(token)) {
      this.logout();
      return null;
    }

    return token;
  }

  logout(): void {
    this.storage?.removeItem(ADMIN_TOKEN_KEY);
  }

  // Lê o campo "exp" (em segundos) do JWT. Se não der para ler, deixa o servidor decidir.
  private tokenExpirado(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return false;
      }

      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join(''),
      );
      const { exp } = JSON.parse(json) as { exp?: number };

      // Margem de 10 s para não enviar um token prestes a vencer.
      return typeof exp === 'number' && exp * 1000 <= Date.now() + 10_000;
    } catch {
      return false;
    }
  }

  private get storage(): Storage | null {
    return typeof window === 'undefined' ? null : window.localStorage;
  }
}
