import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastNotificationService, Toast } from './toast-notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3">
      <div *ngFor="let toast of toasts" 
           class="toast show fade-in" 
           role="alert" 
           aria-live="assertive" 
           aria-atomic="true">
        <div class="toast-header bg-{{ toast.type }}">
          <strong class="me-auto text-white">{{ getTitle(toast.type) }}</strong>
          <button type="button" class="btn-close btn-close-white" (click)="remove(toast.id)"></button>
        </div>
        <div class="toast-body">
          {{ toast.message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      min-width: 250px;
    }
    .bg-success, .bg-danger, .bg-warning, .bg-info {
      color: white;
    }
  `]
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastNotificationService) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  getTitle(type: string): string {
    switch (type) {
      case 'success': return 'Success';
      case 'danger': return 'Error';
      case 'warning': return 'Warning';
      case 'info': return 'Information';
      default: return 'Notification';
    }
  }

  remove(id: number): void {
    this.toastService.remove(id);
  }
}