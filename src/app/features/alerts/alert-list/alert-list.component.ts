import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentAlertService } from '../../../services/document-alert.service';
import { DocumentAlert } from '../../../core/models/document-alert.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="container-fluid p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Document Alerts</h1>
      </div>

      <div *ngIf="loading" class="text-center my-5">
        <app-loading-spinner text="Loading alerts..."></app-loading-spinner>
      </div>

      <div *ngIf="!loading" class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>Document</th>
                <th>Keyword</th>
                <th>Text Snippet</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="alerts.length === 0">
                <td colspan="5" class="text-center py-4">
                  <p class="text-muted mb-0">No alerts found</p>
                </td>
              </tr>
              <tr *ngFor="let alert of alerts">
                <td>{{ alert.document_title || alert.document_id }}</td>
                <td>{{ alert.keyword }}</td>
                <td>{{ alert.text_snippet }}</td>
                <td>{{ alert.created_at | date:'medium' }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary me-2" [routerLink]="['/alerts', alert.id]">
                    View Details
                  </button>
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteAlert(alert.id)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AlertListComponent implements OnInit {
  private alertService = inject(DocumentAlertService);
  
  alerts: DocumentAlert[] = [];
  loading = true;
  
  ngOnInit(): void {
    this.loadAlerts();
  }
  
  loadAlerts(): void {
    this.alertService.getDocumentAlerts().subscribe({
      next: (alerts: DocumentAlert[]) => {
        this.alerts = alerts;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
      }
    });
  }
  
  deleteAlert(id: string): void {
    if (confirm('Are you sure you want to delete this alert?')) {
      this.alertService.deleteDocumentAlert(id).subscribe({
        next: () => {
          this.alerts = this.alerts.filter(alert => alert.id !== id);
        },
        error: (error: any) => {
          console.error('Failed to delete alert:', error);
        }
      });
    }
  }
}