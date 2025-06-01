import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ThreadService } from '../../../services/thread.service'; // Corrected path
// import { VectorStoreService } from '../../../services/vector-store.service'; // TODO
// import { VectorStore } from '../../../core/models/vector-store.model'; // TODO
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-thread-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './thread-create.component.html',
  styleUrls: ['./thread-create.component.scss']
})
export class ThreadCreateComponent implements OnInit {
  vectorStoreId = '';

  // TODO: For Vector Store dropdown
  // vectorStores$: Observable<VectorStore[]> | undefined;

  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private threadService: ThreadService,
    private router: Router
    // TODO: private vectorStoreService: VectorStoreService
  ) {}

  ngOnInit(): void {
    // TODO: Load vector stores if implementing dropdown
    // this.vectorStores$ = this.vectorStoreService.getVectorStores();
  }

  onSubmit(): void {
    this.error = null;
    this.successMessage = null;

    if (!this.vectorStoreId.trim()) {
      this.error = 'Vector Store ID is required to create a thread.';
      return;
    }

    this.isLoading = true;

    this.threadService.createThread(this.vectorStoreId.trim()).pipe(
      catchError(err => {
        console.error('Error creating thread:', err);
        this.error = `Failed to create thread. ${err.error?.detail || err.message || 'Please try again.'}`;
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      if (response) {
        this.successMessage = 'Thread created successfully!';
        setTimeout(() => {
          // Navigate to the chat page of the new thread
          this.router.navigate(['/threads', response.id, 'chat']);
        }, 1500);
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/threads']);
  }
}
