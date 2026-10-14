import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { AuthService } from '../auth.service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let router: Router;
  const authService = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    authService.login.mockReset();
    authService.login.mockReturnValue(
      of({ message: 'Login realizado com sucesso', token: 'fake-token', tokenType: 'Bearer', expiresIn: 3600 }),
    );

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not submit an invalid form', () => {
    component.entrar();

    expect(authService.login).not.toHaveBeenCalled();
    expect(component.loginForm.controls.email.touched).toBe(true);
  });

  it('should navigate to the dashboard after a successful login', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'senha' });

    component.entrar();

    expect(authService.login).toHaveBeenCalledWith('admin@evel.com', 'senha');
    expect(navigateSpy).toHaveBeenCalledWith('/admin/dashboard');
    expect(component.carregando).toBe(false);
  });

  it('should return to a protected admin URL after login', async () => {
    await router.navigateByUrl('/?redirectTo=%2Fadmin%2Fprodutos%2Flista');
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'senha' });

    component.entrar();

    expect(navigateSpy).toHaveBeenCalledWith('/admin/produtos/lista');
  });

  it('should not redirect back to the login page', async () => {
    await router.navigateByUrl('/?redirectTo=%2Fadmin%2Flogin%3Ffoo%3Dbar');
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'senha' });

    component.entrar();

    expect(navigateSpy).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('should show an error when the credentials are rejected', () => {
    authService.login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'incorreta' });

    component.entrar();

    expect(component.mensagemErro).toBe('E-mail ou senha inválidos.');
  });

  it('should keep the loading state and prevent duplicate submissions', () => {
    const result = new Subject<{ message: string; token: string | null; tokenType: string | null; expiresIn: number }>();
    authService.login.mockReturnValue(result);
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'senha' });

    component.entrar();
    component.entrar();

    expect(component.carregando).toBe(true);
    expect(authService.login).toHaveBeenCalledOnce();

    result.next({ message: 'ok', token: null, tokenType: null, expiresIn: 0 });
    result.complete();
    expect(component.carregando).toBe(false);
  });

  it('should restore the form after an unexpected login error', () => {
    authService.login.mockReturnValue(throwError(() => ({ status: 0 })));
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'senha' });

    component.entrar();

    expect(component.carregando).toBe(false);
    expect(component.mensagemErro).toContain('Tente novamente');
  });
});