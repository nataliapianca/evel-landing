import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it('should log in with the fake admin credentials after the simulated delay', async () => {
    const resultPromise = firstValueFrom(
      service.loginFake(' Atelier.evel@gmail.com ', 'admin@2022'),
    );

    await vi.advanceTimersByTimeAsync(1000);

    await expect(resultPromise).resolves.toEqual({ success: true });
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should reject invalid credentials and remove a stale token', async () => {
    window.localStorage.setItem('adminToken', 'token-antigo');
    const resultPromise = firstValueFrom(service.loginFake('outro@email.com', 'senha'));

    await vi.advanceTimersByTimeAsync(1000);

    await expect(resultPromise).resolves.toEqual({ success: false });
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should log out by removing the admin token', () => {
    window.localStorage.setItem('adminToken', 'token-falso-para-teste');

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
  });
});
