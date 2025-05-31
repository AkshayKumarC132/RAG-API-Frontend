import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ title }}</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="modal.dismiss('cancel')"></button>
    </div>
    <div class="modal-body">
      <p>{{ message }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="modal.dismiss('cancel')">{{ cancelText }}</button>
      <button type="button" class="btn btn-{{ confirmButtonType }}" (click)="modal.close('confirm')">{{ confirmText }}</button>
    </div>
  `,
  imports: []
})
export class ConfirmDialogComponent {
  @Input() title: string = 'Confirm Action';
  @Input() message: string = 'Are you sure you want to proceed?';
  @Input() confirmText: string = 'Confirm';
  @Input() cancelText: string = 'Cancel';
  @Input() confirmButtonType: string = 'danger';

  constructor(public modal: NgbActiveModal) {}
}