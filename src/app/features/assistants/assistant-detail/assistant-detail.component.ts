import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AssistantService } from '../../../services/assistant.service'; // Corrected path
import { Assistant } from '../../../core/models/assistant.model';
import { Observable, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-assistant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './assistant-detail.component.html',
  styleUrls: ['./assistant-detail.component.scss']
})
export class AssistantDetailComponent implements OnInit {
  assistant: Assistant | null = null;
  assistantId: string | null = null;
  isLoading = false;
  isDeleting = false;
  error: string | null = null;

  constructor(
    private assistantService: AssistantService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.assistantId = params.get('id');
        if (this.assistantId) {
          this.isLoading = true;
          this.error = null;
          return this.assistantService.getAssistant(this.assistantId).pipe(
            catchError(err => {
              console.error('Error loading assistant details:', err);
              this.error = `Failed to load assistant details. ${err.error?.detail || ''}`;
              this.assistant = null;
              return of(null); // Propagate null to handle in subscribe
            }),
            finalize(() => {
              this.isLoading = false;
            })
          );
        } else {
          this.error = 'Assistant ID not found in route.';
          this.isLoading = false;
          return of(null); // No ID, return null
        }
      })
    ).subscribe(data => {
      if (data) {
        this.assistant = data;
      }
      // If data is null due to error or no ID, error is already set
    });
  }

  deleteAssistant(): void {
    if (!this.assistantId) {
      this.error = "Cannot delete: Assistant ID is missing.";
      return;
    }

    if (!confirm('Are you sure you want to delete this assistant? This action cannot be undone.')) {
      return;
    }

    this.isDeleting = true;
    this.error = null;
    this.assistantService.deleteAssistant(this.assistantId).pipe(
      catchError(err => {
        console.error(`Error deleting assistant ${this.assistantId}:`, err);
        this.error = `Failed to delete assistant. ${err.error?.detail || ''}`;
        return of(null);
      }),
      finalize(() => {
        this.isDeleting = false;
      })
    ).subscribe(response => {
      if (response !== null) { // Indicates success (no error caught)
        this.router.navigate(['/assistants']);
        // Optionally, show a success toast/message via a shared service
      }
    });
  }

  navigateToEdit(): void {
    if (this.assistantId) {
      this.router.navigate(['/assistants', this.assistantId, 'edit']);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/assistants']);
  }
}
