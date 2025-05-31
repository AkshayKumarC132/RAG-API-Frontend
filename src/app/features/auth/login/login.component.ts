import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="container">
      <div class="row justify-content-center min-vh-100 align-items-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow">
            <div class="card-body p-5">
              <h2 class="text-center mb-4">Login</h2>
              
              <div *ngIf="errorMessage" class="alert alert-danger">
                {{ errorMessage }}
              </div>
              
              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input 
                    type="text" 
                    id="username" 
                    formControlName="username" 
                    class="form-control" 
                    [ngClass]="{'is-invalid': submitted && f.username.errors}"
                    placeholder="Enter your username"
                  >
                  <div *ngIf="submitted && f.username.errors" class="invalid-feedback">
                    <div *ngIf="f.username.errors.required">Username is required</div>
                  </div>
                </div>
                
                <div class="mb-4">
                  <label for="password" class="form-label">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    formControlName="password" 
                    class="form-control" 
                    [ngClass]="{'is-invalid': submitted && f.password.errors}"
                    placeholder="Enter your password"
                  >
                  <div *ngIf="submitted && f.password.errors" class="invalid-feedback">
                    <div *ngIf="f.password.errors.required">Password is required</div>
                  </div>
                </div>
                
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary" [disabled]="loading">
                    <span *ngIf="loading">
                      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </span>
                    <span *ngIf="!loading">Login</span>
                  </button>
                </div>
              </form>
              
              <div class="mt-4 text-center">
                <p class="mb-0">Don't have an account? <a routerLink="/auth/register">Register</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  
  loading = false;
  submitted = false;
  errorMessage = '';
  
  get f() { return this.loginForm.controls; }
  
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const { username, password } = this.loginForm.value;
    
    this.authService.login(username!, password!).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigate([returnUrl]);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Invalid username or password';
        this.loading = false;
      }
    });
  }
}