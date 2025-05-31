import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div class="container-fluid">
        <span class="navbar-brand d-lg-none">RAG API</span>
        
        <div class="d-flex align-items-center ms-auto">
          <div class="dropdown">
            <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle me-2"></i>
              {{ (authService.currentUser())?.username || 'User' }}
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
              <li><a class="dropdown-item" href="javascript:void(0)">Profile</a></li>
              <li><a class="dropdown-item" href="javascript:void(0)">Settings</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="javascript:void(0)" (click)="onLogout()">Logout</a></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class HeaderComponent {
  authService = inject(AuthService);
  
  onLogout(): void {
    this.authService.logout().subscribe();
  }
}