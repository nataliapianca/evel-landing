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
    loginFake: vi.fn(),
  };

  beforeEach(async () => {
    authService.loginFake.mockReset();
    authService.loginFake.mockReturnValue(of({ success: true }));

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

    expect(authService.loginFake).not.toHaveBeenCalled();
    expect(component.loginForm.controls.email.touched).toBe(true);
  });

  it('should navigate to the dashboard after a successful login', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'senha' });

    component.entrar();

    expect(authService.loginFake).toHaveBeenCalledWith('admin@evel.com', 'senha');
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
    authService.loginFake.mockReturnValue(of({ success: false }));
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'incorreta' });

    component.entrar();

    expect(component.mensagemErro).toBe('E-mail ou senha inválidos.');
  });

  it('should keep the loading state and prevent duplicate submissions', () => {
    const result = new Subject<{ success: boolean }>();
    authService.loginFake.mockReturnValue(result);
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'senha' });

    component.entrar();
    component.entrar();

    expect(component.carregando).toBe(true);
    expect(authService.loginFake).toHaveBeenCalledOnce();

    result.next({ success: false });
    result.complete();
    expect(component.carregando).toBe(false);
  });

  it('should restore the form after an unexpected login error', () => {
    authService.loginFake.mockReturnValue(throwError(() => new Error('falha')));
    component.loginForm.setValue({ email: 'admin@evel.com', senha: 'senha' });

    component.entrar();

    expect(component.carregando).toBe(false);
    expect(component.mensagemErro).toContain('Tente novamente');
  });
});
