import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AssistantService } from '../../../services/assistant.service'; // Corrected path
import { Assistant } from '../../../core/models/assistant.model';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-assistant-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assistant-list.component.html',
  // styleUrls: ['./assistant-list.component.css']
})
export class AssistantListComponent implements OnInit {
  assistants: Assistant[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private assistantService: AssistantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAssistants();
  }

  loadAssistants(): void {
    this.isLoading = true;
    this.error = null;
    this.assistantService.getAssistants().pipe(
      catchError(err => {
        console.error('Error loading assistants:', err);
        this.error = 'Failed to load assistants. Please try again later.';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(data => {
      this.assistants = data;
    });
  }

  deleteAssistant(id: string, event: Event): void {
    event.stopPropagation();
    if (!id) {
      this.error = 'Cannot delete assistant: Invalid ID.';
      return;
    }

    if (!confirm('Are you sure you want to delete this assistant?')) {
      return;
    }

    // Could use a more specific loading flag like isDeleting[id] = true
    const originalAssistants = [...this.assistants];
    this.assistants = this.assistants.filter(a => a.id !== id); // Optimistic update

    this.assistantService.deleteAssistant(id).pipe(
      catchError(err => {
        console.error(`Error deleting assistant ${id}:`, err);
        this.error = `Failed to delete assistant. ${err.error?.detail || ''}`;
        this.assistants = originalAssistants; // Rollback on error
        return of(null);
      }),
      finalize(() => {
        // Reset specific loading flag if used
      })
    ).subscribe(response => {
      if (response !== null) {
        // Deletion was successful, list is already updated optimistically
        // Optionally show success message
      }
    });
  }

  navigateToDetail(assistantId: string): void {
    this.router.navigate(['/assistants', assistantId]);
  }

  navigateToEdit(assistantId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/assistants', assistantId, 'edit']);
  }

  navigateToCreate(): void {
    this.router.navigate(['/assistants/create']);
  }
}
