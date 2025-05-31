import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-register',
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
        <div class="col-md-8 col-lg-6">
          <div class="card shadow">
            <div class="card-body p-5">
              <h2 class="text-center mb-4">Create an Account</h2>
              
              <div *ngIf="errorMessage" class="alert alert-danger">
                {{ errorMessage }}
              </div>
              
              <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input 
                    type="text" 
                    id="username" 
                    formControlName="username" 
                    class="form-control" 
                    [ngClass]="{'is-invalid': submitted && f.username.errors}"
                    placeholder="Choose a username"
                  >
                  <div *ngIf="submitted && f.username.errors" class="invalid-feedback">
                    <div *ngIf="f.username.errors['required']">Username is required</div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    formControlName="email" 
                    class="form-control" 
                    [ngClass]="{'is-invalid': submitted && f.email.errors}"
                    placeholder="Enter your email"
                  >
                  <div *ngIf="submitted && f.email.errors" class="invalid-feedback">
                    <div *ngIf="f.email.errors['required']">Email is required</div>
                    <div *ngIf="f.email.errors['email']">Email must be a valid email address</div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    formControlName="password" 
                    class="form-control" 
                    [ngClass]="{'is-invalid': submitted && f.password.errors}"
                    placeholder="Create a password"
                  >
                  <div *ngIf="submitted && f.password.errors" class="invalid-feedback">
                    <div *ngIf="f.password.errors['required']">Password is required</div>
                    <div *ngIf="f.password.errors['minlength']">Password must be at least 6 characters</div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirm Password</label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    formControlName="confirmPassword" 
                    class="form-control" 
                    [ngClass]="{'is-invalid': submitted && (f.confirmPassword.errors || passwordMismatch)}"
                    placeholder="Confirm your password"
                  >
                  <div *ngIf="submitted && (f.confirmPassword.errors || passwordMismatch)" class="invalid-feedback">
                    <div *ngIf="f.confirmPassword.errors?.['required']">Confirm Password is required</div>
                    <div *ngIf="passwordMismatch">Passwords do not match</div>
                  </div>
                </div>
                
                <div class="mb-4">
                  <label for="tenantName" class="form-label">Tenant Name</label>
                  <input 
                    type="text" 
                    id="tenantName" 
                    formControlName="tenantName" 
                    class="form-control" 
                    [ngClass]="{'is-invalid': submitted && f.tenantName.errors}"
                    placeholder="Enter your organization/tenant name"
                  >
                  <div *ngIf="submitted && f.tenantName.errors" class="invalid-feedback">
                    <div *ngIf="f.tenantName.errors['required']">Tenant name is required</div>
                  </div>
                  <small class="form-text text-muted">
                    This will create a new tenant for your account.
                  </small>
                </div>
                
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary" [disabled]="loading">
                    <span *ngIf="loading">
                      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registering...
                    </span>
                    <span *ngIf="!loading">Register</span>
                  </button>
                </div>
              </form>
              
              <div class="mt-4 text-center">
                <p class="mb-0">Already have an account? <a routerLink="/auth/login">Login</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  registerForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    tenantName: ['', Validators.required]
  });
  
  loading = false;
  submitted = false;
  errorMessage = '';
  
  get f() { return this.registerForm.controls; }
  
  get passwordMismatch(): boolean {
    return this.registerForm.value.password !== this.registerForm.value.confirmPassword;
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    
    if (this.registerForm.invalid || this.passwordMismatch) {
      return;
    }
    
    this.loading = true;
    
    const { username, email, password, tenantName } = this.registerForm.value;
    
    this.authService.register(username!, email!, password!, tenantName!).subscribe({
      next: () => {
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (error) => {
        this.errorMessage = error.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}