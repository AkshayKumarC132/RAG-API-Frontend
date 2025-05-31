import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DocumentService } from '../../services/document.service';
import { VectorStoreService } from '../../services/vector-store.service';
import { AssistantService } from '../../services/assistant.service';
import { ThreadService } from '../../services/thread.service';
import { DocumentAlertService } from '../../services/document-alert.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="container-fluid p-4">
      <h1 class="mb-4">Dashboard</h1>
      
      <div *ngIf="loading" class="text-center my-5">
        <app-loading-spinner text="Loading dashboard data..."></app-loading-spinner>
      </div>
      
      <div *ngIf="!loading">
        <div class="row">
          <!-- Summary Cards -->
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-muted mb-1">Documents</h6>
                    <h2 class="mb-0">{{ stats.documents }}</h2>
                  </div>
                  <div class="bg-primary bg-opacity-10 p-3 rounded">
                    <i class="bi bi-file-earmark-text text-primary fs-3"></i>
                  </div>
                </div>
                <div class="mt-3">
                  <a routerLink="/documents" class="btn btn-sm btn-outline-primary">View All</a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-muted mb-1">Vector Stores</h6>
                    <h2 class="mb-0">{{ stats.vectorStores }}</h2>
                  </div>
                  <div class="bg-success bg-opacity-10 p-3 rounded">
                    <i class="bi bi-database text-success fs-3"></i>
                  </div>
                </div>
                <div class="mt-3">
                  <a routerLink="/vector-stores" class="btn btn-sm btn-outline-success">View All</a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-muted mb-1">Assistants</h6>
                    <h2 class="mb-0">{{ stats.assistants }}</h2>
                  </div>
                  <div class="bg-info bg-opacity-10 p-3 rounded">
                    <i class="bi bi-robot text-info fs-3"></i>
                  </div>
                </div>
                <div class="mt-3">
                  <a routerLink="/assistants" class="btn btn-sm btn-outline-info">View All</a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-muted mb-1">Threads</h6>
                    <h2 class="mb-0">{{ stats.threads }}</h2>
                  </div>
                  <div class="bg-warning bg-opacity-10 p-3 rounded">
                    <i class="bi bi-chat-dots text-warning fs-3"></i>
                  </div>
                </div>
                <div class="mt-3">
                  <a routerLink="/threads" class="btn btn-sm btn-outline-warning">View All</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <!-- Recent Alerts -->
          <div class="col-lg-6 mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white">
                <h5 class="mb-0">Recent Alerts</h5>
              </div>
              <div class="card-body">
                <div *ngIf="alerts.length === 0" class="text-center p-4 text-muted">
                  <i class="bi bi-check-circle fs-3"></i>
                  <p class="mt-2">No recent alerts found.</p>
                </div>
                
                <div *ngFor="let alert of alerts" class="alert alert-warning mb-3">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>
                      <h6 class="mb-1">Keyword detected: <strong>{{ alert.keyword }}</strong></h6>
                      <p class="mb-1 small">{{ alert.text_snippet }}</p>
                      <small class="text-muted">Document: {{ alert.document_title || alert.document_id }}</small>
                    </div>
                  </div>
                </div>
                
                <div *ngIf="alerts.length > 0" class="text-center mt-3">
                  <a routerLink="/alerts" class="btn btn-sm btn-outline-secondary">View All Alerts</a>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="col-lg-6 mb-4">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white">
                <h5 class="mb-0">Quick Actions</h5>
              </div>
              <div class="card-body">
                <div class="d-grid gap-3">
                  <a routerLink="/documents/ingest" class="btn btn-outline-primary">
                    <i class="bi bi-upload me-2"></i> Ingest Document
                  </a>
                  <a routerLink="/vector-stores/create" class="btn btn-outline-success">
                    <i class="bi bi-database-add me-2"></i> Create Vector Store
                  </a>
                  <a routerLink="/assistants/create" class="btn btn-outline-info">
                    <i class="bi bi-robot me-2"></i> Create Assistant
                  </a>
                  <a routerLink="/threads/create" class="btn btn-outline-warning">
                    <i class="bi bi-chat-square-dots me-2"></i> Start New Thread
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private documentService = inject(DocumentService);
  private vectorStoreService = inject(VectorStoreService);
  private assistantService = inject(AssistantService);
  private threadService = inject(ThreadService);
  private alertService = inject(DocumentAlertService);
  
  loading = true;
  
  stats = {
    documents: 0,
    vectorStores: 0,
    assistants: 0,
    threads: 0
  };
  
  alerts: any[] = [];
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  loadDashboardData(): void {
    forkJoin({
      documents: this.documentService.getDocuments().pipe(catchError(() => of([]))),
      vectorStores: this.vectorStoreService.getVectorStores().pipe(catchError(() => of([]))),
      assistants: this.assistantService.getAssistants().pipe(catchError(() => of([]))),
      threads: this.threadService.getThreads().pipe(catchError(() => of([]))),
      alerts: this.alertService.getDocumentAlerts().pipe(catchError(() => of([])))
    }).subscribe({
      next: (data) => {
        this.stats.documents = data.documents.length;
        this.stats.vectorStores = data.vectorStores.length;
        this.stats.assistants = data.assistants.length;
        this.stats.threads = data.threads.length;
        this.alerts = data.alerts.slice(0, 3); // Show only the 3 most recent alerts
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}