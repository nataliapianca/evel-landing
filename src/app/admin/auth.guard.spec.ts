import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { adminGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  const authService = {
    isLoggedIn: vi.fn(),
  };

  beforeEach(() => {
    authService.isLoggedIn.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });
  });

  it('should allow an authenticated administrator', () => {
    authService.isLoggedIn.mockReturnValue(true);

    const result = executarGuard('/admin/dashboard');

    expect(result).toBe(true);
  });

  it('should redirect an unauthenticated visitor to login', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const router = TestBed.inject(Router);

    const result = executarGuard('/admin/produtos/lista') as UrlTree;

    expect(router.serializeUrl(result)).toBe(
      '/admin/login?redirectTo=%2Fadmin%2Fprodutos%2Flista',
    );
  });

  function executarGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }
});
