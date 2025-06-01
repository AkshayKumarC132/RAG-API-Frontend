import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThreadService } from '../../../services/thread.service'; // Corrected path
import { Thread } from '../../../core/models/thread.model';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-thread-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './thread-list.component.html',
  // styleUrls: ['./thread-list.component.css']
})
export class ThreadListComponent implements OnInit {
  threads: Thread[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private threadService: ThreadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadThreads();
  }

  loadThreads(): void {
    this.isLoading = true;
    this.error = null;
    this.threadService.getThreads().pipe(
      catchError(err => {
        console.error('Error loading threads:', err);
        this.error = 'Failed to load threads. Please try again later.';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(data => {
      this.threads = data;
    });
  }

  deleteThread(id: string, event: Event): void {
    event.stopPropagation();
    if (!id) {
      this.error = 'Cannot delete thread: Invalid ID.';
      return;
    }

    if (!confirm('Are you sure you want to delete this thread? This will delete all associated messages.')) {
      return;
    }

    const originalThreads = [...this.threads];
    this.threads = this.threads.filter(t => t.id !== id); // Optimistic update

    this.threadService.deleteThread(id).pipe(
      catchError(err => {
        console.error(`Error deleting thread ${id}:`, err);
        this.error = `Failed to delete thread. ${err.error?.detail || ''}`;
        this.threads = originalThreads; // Rollback on error
        return of(null);
      }),
      finalize(() => {
        // Could use a specific isDeleting[id] flag and reset it here
      })
    ).subscribe(response => {
      if (response !== null) {
        // Deletion successful, list already updated
        // Optionally show success message
      }
    });
  }

  navigateToChat(threadId: string): void {
    this.router.navigate(['/threads', threadId, 'chat']);
  }

  navigateToCreate(): void {
    this.router.navigate(['/threads/create']);
  }
}
