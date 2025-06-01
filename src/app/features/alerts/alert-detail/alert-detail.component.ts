import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DocumentAlertService } from '../../../services/document-alert.service';
import { DocumentAlert } from '../../../core/models/document-alert.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-alert-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './alert-detail.component.html',
  styleUrls: ['./alert-detail.component.scss']
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
      next: (alert: DocumentAlert) => {
        this.alert = alert;
        this.loading = false;
      },
      error: (error: any) => {
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
      error: (error: any) => {
        console.error('Failed to delete alert:', error);
      }
    });
  }
}