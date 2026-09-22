import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  @ViewChild('emailInput') private emailInput?: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') private passwordInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  carregando = false;
  mensagemErro = '';

  entrar(): void {
    if (this.carregando) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.mensagemErro = 'Revise os campos destacados para continuar.';
      const primeiroCampo = this.loginForm.controls.email.invalid
        ? this.emailInput
        : this.passwordInput;
      primeiroCampo?.nativeElement.focus();
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';
    const { email, senha } = this.loginForm.getRawValue();

    this.authService.login(email, senha).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.carregando = false;

        if (result.token) {
          void this.router.navigateByUrl(this.destinoAposLogin());
          return;
        }

        this.mensagemErro = 'E-mail ou senha inválidos.';
      },
      error: (err) => {
        this.carregando = false;
        this.mensagemErro =
          err?.status === 401
            ? 'E-mail ou senha inválidos.'
            : 'Não foi possível entrar. Tente novamente.';
      },
    });
  }

  campoInvalido(campo: 'email' | 'senha'): boolean {
    const control = this.loginForm.controls[campo];
    return control.invalid && control.touched;
  }

  private destinoAposLogin(): string {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');

    if (redirectTo?.startsWith('/admin/') && !redirectTo.startsWith('/admin/login')) {
      return redirectTo;
    }

    return '/admin/dashboard';
  }
}