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
    return !!this.storage?.getItem(ADMIN_TOKEN_KEY);
  }

  getToken(): string | null {
    return this.storage?.getItem(ADMIN_TOKEN_KEY) ?? null;
  }

  logout(): void {
    this.storage?.removeItem(ADMIN_TOKEN_KEY);
  }

  private get storage(): Storage | null {
    return typeof window === 'undefined' ? null : window.localStorage;
  }
}