import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  mode: 'login' | 'register' = 'login';

  loginForm: FormGroup;
  registerForm: FormGroup;

  loginError = '';
  registerError = '';
  loginLoading = false;
  registerLoading = false;

  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: AuthComponent.passwordsMatch }
    );
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.mode = data['mode'] === 'register' ? 'register' : 'login';
    });
  }

  private static passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!confirm) { return null; }
    return pass === confirm ? null : { mismatch: true };
  }

  switchTo(mode: 'login' | 'register'): void {
    if (this.mode === mode) { return; }
    this.mode = mode;
    this.router.navigate([mode === 'login' ? '/login' : '/register']);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loginLoading = true;
    this.loginError = '';
    const { email, password } = this.loginForm.value;
    this.auth.login(email, password).subscribe({
      next: () => { this.loginLoading = false; this.router.navigate(['/']); },
      error: (err) => { this.loginLoading = false; this.loginError = err.error?.message || 'Login failed. Please check your credentials.'; }
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.registerLoading = true;
    this.registerError = '';
    const { name, email, phone, password } = this.registerForm.value;
    this.auth.register(name, email, phone, password).subscribe({
      next: () => { this.registerLoading = false; this.router.navigate(['/']); },
      error: (err) => { this.registerLoading = false; this.registerError = err.error?.message || 'Registration failed. Please try again.'; }
    });
  }
}
