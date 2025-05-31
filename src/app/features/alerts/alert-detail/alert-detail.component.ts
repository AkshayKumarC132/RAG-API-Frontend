import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DocumentAlertService } from '../../../core/services/document-alert.service';
import { DocumentAlert } from '../../../core/models/document-alert.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-alert-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  template: `
    <div class="container-fluid p-4">
      <div *ngIf="loading" class="text-center my-5">
        <app-loading-spinner text="Loading alert details..."></app-loading-spinner>
      </div>

      <div *ngIf="!loading && alert" class="card">
        <div class="card-header bg-white">
          <div class="d-flex justify-content-between align-items-center">
            <h2 class="h4 mb-0">Alert Details</h2>
            <div>
              <button class="btn btn-outline-danger me-2" (click)="deleteAlert()">
                Delete Alert
              </button>
              <button class="btn btn-outline-secondary" routerLink="/alerts">
                Back to List
              </button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <dl class="row">
            <dt class="col-sm-3">Document</dt>
            <dd class="col-sm-9">{{ alert.document_title || alert.document_id }}</dd>

            <dt class="col-sm-3">Keyword</dt>
            <dd class="col-sm-9">{{ alert.keyword }}</dd>

            <dt class="col-sm-3">Text Snippet</dt>
            <dd class="col-sm-9">
              <div class="alert alert-light">
                {{ alert.text_snippet }}
              </div>
            </dd>

            <dt class="col-sm-3">Created At</dt>
            <dd class="col-sm-9">{{ alert.created_at | date:'medium' }}</dd>
          </dl>
        </div>
      </div>

      <div *ngIf="!loading && !alert" class="alert alert-warning">
        Alert not found or has been deleted.
      </div>
    </div>
  `
})
export class AlertDetailComponent implements OnInit {
  private alertService = inject(DocumentAlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  alert: DocumentAlert | null = null;
  loading = true;
  
  ngOnInit(): void {
    const alertId = this.route.snapshot.paramMap.get('id');
    if (alertId) {
      this.loadAlert(alertId);
    } else {
      this.loading = false;
    }
  }
  
  loadAlert(id: string): void {
    this.alertService.getDocumentAlert(id).subscribe({
      next: (alert) => {
        this.alert = alert;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  
  
  deleteAlert(): void {
    if (!this.alert || !confirm('Are you sure you want to delete this alert?')) {
      return;
    }
    
    this.alertService.deleteDocumentAlert(this.alert.id).subscribe({
      next: () => {
        this.router.navigate(['/alerts']);
      },
      error: (error) => {
        console.error('Failed to delete alert:', error);
      }
    });
  }
}