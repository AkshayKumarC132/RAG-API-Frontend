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
  templateUrl: './alert-list.component.html',
  styleUrls: ['./alert-list.component.scss']
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