import { Injectable } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';

export interface LoginResult {
  success: boolean;
}

const ADMIN_TOKEN_KEY = 'adminToken';
const FAKE_ADMIN_TOKEN = 'token-falso-para-teste';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // TODO: substituir pelas credenciais validadas e pelo token emitido pela API.
  private readonly fakeEmail = 'atelier.evel@gmail.com';
  private readonly fakePassword = 'admin@2022';

  loginFake(email: string, senha: string): Observable<LoginResult> {
    const success =
      email.trim().toLowerCase() === this.fakeEmail && senha === this.fakePassword;

    return of({ success }).pipe(
      delay(1000),
      tap((result) => {
        if (result.success) {
          this.storage?.setItem(ADMIN_TOKEN_KEY, FAKE_ADMIN_TOKEN);
        } else {
          this.storage?.removeItem(ADMIN_TOKEN_KEY);
        }
      }),
    );
  }

  isLoggedIn(): boolean {
    return !!this.storage?.getItem(ADMIN_TOKEN_KEY);
  }

  logout(): void {
    this.storage?.removeItem(ADMIN_TOKEN_KEY);
  }

  private get storage(): Storage | null {
    return typeof window === 'undefined' ? null : window.localStorage;
  }
}
