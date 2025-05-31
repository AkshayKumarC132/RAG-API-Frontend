import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="d-flex justify-content-center my-3">
      <div class="spinner-border text-{{ color }}" role="status" [ngClass]="{'spinner-border-sm': size === 'sm'}">
        <span class="visually-hidden">Loading...</span>
      </div>
      <span *ngIf="text" class="ms-2">{{ text }}</span>
    </div>
  `,
  imports: [CommonModule]
})
export class LoadingSpinnerComponent {
  @Input() color: string = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() text: string = '';
}