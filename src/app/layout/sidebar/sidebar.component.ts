import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sidebar-wrapper" [class.collapsed]="isCollapsed">
      <div class="d-flex flex-column h-100">
        <div class="p-3 d-flex justify-content-between align-items-center">
          <h5 *ngIf="!isCollapsed" class="text-white mb-0">RAG API</h5>
          <button class="btn btn-outline-light btn-sm" (click)="toggleSidebar()">
            <i class="bi" [ngClass]="isCollapsed ? 'bi-arrow-right' : 'bi-arrow-left'"></i>
          </button>
        </div>
        
        <ul class="nav flex-column flex-grow-1">
          <li class="nav-item" *ngFor="let item of navItems">
            <a class="nav-link text-white py-3 px-3" [routerLink]="[item.route]" routerLinkActive="active">
              <i class="bi {{ item.icon }} me-2"></i>
              <span *ngIf="!isCollapsed">{{ item.label }}</span>
            </a>
          </li>
        </ul>
        
        <div class="mt-auto p-3">
          <div *ngIf="!isCollapsed" class="text-white-50 small mb-2">
            <span>Tenant: </span>
            <span class="text-white">{{ (authService.currentUser())?.tenant_name || 'Unknown' }}</span>
          </div>
          <button class="btn btn-outline-danger w-100" (click)="onLogout()">
            <i class="bi bi-box-arrow-right me-2"></i>
            <span *ngIf="!isCollapsed">Logout</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-link {
      transition: all 0.2s;
    }
    .nav-link:hover, .nav-link.active {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .active {
      border-left: 4px solid var(--primary);
    }
  `]
})
export class SidebarComponent {
  @Output() collapse = new EventEmitter<boolean>();
  
  isCollapsed = false;
  authService = inject(AuthService);
  
  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'bi-speedometer2' },
    { label: 'Documents', route: '/documents', icon: 'bi-file-earmark-text' },
    { label: 'Vector Stores', route: '/vector-stores', icon: 'bi-database' },
    { label: 'Assistants', route: '/assistants', icon: 'bi-robot' },
    { label: 'Threads', route: '/threads', icon: 'bi-chat-dots' },
    { label: 'Alerts', route: '/alerts', icon: 'bi-exclamation-triangle' },
    { label: 'API Keys', route: '/api-keys', icon: 'bi-key' },
    { label: 'User Management', route: '/users', icon: 'bi-people' }
  ];
  
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapse.emit(this.isCollapsed);
  }
  
  onLogout(): void {
    this.authService.logout().subscribe();
  }
}