import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastContainerComponent } from '../../shared/components/toast-notification/toast-container.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    SidebarComponent, 
    HeaderComponent,
    ToastContainerComponent
  ],
  template: `
    <app-sidebar (collapse)="onSidebarCollapse($event)"></app-sidebar>
    
    <div class="content-wrapper" [class.expanded]="sidebarCollapsed">
      <app-header></app-header>
      
      <div class="page-content">
        <router-outlet></router-outlet>
      </div>
    </div>
    
    <app-toast-container></app-toast-container>
  `
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  authService = inject(AuthService);
  
  ngOnInit(): void {
    if (this.authService.isAuthenticated() && !this.authService.currentUser()) {
      this.authService.loadUserProfile().subscribe();
    }
  }
  
  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}