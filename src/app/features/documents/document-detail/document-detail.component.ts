import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DocumentService } from '../../../services/document.service'; // Corrected path
import { Document, DocumentStatus } from '../../../core/models/document.model';
import { Observable, of, Subscription, timer } from 'rxjs';
import { catchError, finalize, switchMap, takeWhile, tap } from 'rxjs/operators';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss']
})
export class DocumentDetailComponent implements OnInit, OnDestroy {
  document: Document | null = null;
  documentId: string | null = null;
  isLoading = false;
  isDeleting = false;
  isCheckingStatus = false;
  error: string | null = null;

  public pollingSubscription: Subscription | null = null;
  private componentActive = true;

  constructor(
    private documentService: DocumentService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.componentActive = true;
    this.route.paramMap.subscribe(params => {
      this.documentId = params.get('id');
      if (this.documentId) {
        this.loadDocumentDetails();
      } else {
        this.error = 'Document ID not found in route.';
        this.isLoading = false;
      }
    });
  }

  loadDocumentDetails(): void {
    if (!this.documentId) return;

    this.isLoading = true;
    this.error = null;
    this.documentService.getDocument(this.documentId).pipe(
      tap(doc => {
        this.document = doc;
        if (this.isTerminalStatus(doc.status)) {
          this.stopPolling();
        } else {
          this.startPollingStatus();
        }
      }),
      catchError(err => {
        console.error('Error loading document details:', err);
        this.error = `Failed to load document details. ${err.error?.detail || ''}`;
        this.document = null;
        this.stopPolling();
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe();
  }

  checkDocumentStatus(manualTrigger = false): void {
    if (!this.documentId || this.isCheckingStatus && !manualTrigger) return;

    this.isCheckingStatus = true;
    if(manualTrigger) this.error = null; // Clear previous error on manual trigger

    this.documentService.checkDocumentStatus(this.documentId).pipe(
      catchError(err => {
        console.error(`Error checking document status for ${this.documentId}:`, err);
        if (manualTrigger) {
          this.error = `Failed to check document status. ${err.error?.detail || ''}`;
        }
        // Don't stop polling on transient errors unless it's a 404 or similar
        return of(null);
      }),
      finalize(() => {
        this.isCheckingStatus = false;
      })
    ).subscribe(statusResponse => {
      if (statusResponse && this.document) {
        this.document.status = statusResponse.status;
        // Potentially update other fields if status check returns full document
        if (this.isTerminalStatus(statusResponse.status)) {
          this.stopPolling();
          // Optionally, reload full document details if status implies other changes
          // this.loadDocumentDetails();
        }
      }
    });
  }

  startPollingStatus(): void {
    this.stopPolling(); // Ensure no multiple polls
    if (!this.documentId || !this.componentActive) return;

    this.pollingSubscription = timer(0, 5000) // Poll every 5 seconds, start immediately
      .pipe(
        takeWhile(() => this.componentActive && !this.isTerminalStatus(this.document?.status)),
        switchMap(() => {
          if (this.isCheckingStatus) return of(null); // Skip if a check is already in progress
          this.isCheckingStatus = true;
          return this.documentService.checkDocumentStatus(this.documentId!).pipe(
            catchError(err => {
              console.warn(`Polling error for document ${this.documentId}:`, err);
              // Don't show error in UI for background polling unless it's critical
              if (err.status === 404) { // e.g. document deleted
                this.error = 'Document not found. It might have been deleted.';
                this.stopPolling();
              }
              return of(null); // Continue polling for non-critical errors
            }),
            finalize(() => {
              this.isCheckingStatus = false;
            })
          );
        })
      )
      .subscribe(statusResponse => {
        if (statusResponse && this.document) {
          this.document.status = statusResponse.status;
          if (this.isTerminalStatus(statusResponse.status)) {
            this.stopPolling();
            // Consider reloading full document to get any final state details
            // this.loadDocumentDetails();
          }
        }
      });
  }

  isTerminalStatus(status: string | undefined): boolean {
    return status === 'completed' || status === 'failed';
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  deleteDocument(): void {
    if (!this.documentId) return;

    // Optional: Add a confirmation dialog here
    // if (!confirm('Are you sure you want to delete this document?')) {
    //   return;
    // }

    this.isDeleting = true;
    this.error = null;
    this.documentService.deleteDocument(this.documentId).pipe(
      catchError(err => {
        console.error(`Error deleting document ${this.documentId}:`, err);
        this.error = `Failed to delete document. ${err.error?.detail || ''}`;
        return of(null);
      }),
      finalize(() => {
        this.isDeleting = false;
      })
    ).subscribe(response => {
      if (response !== null) {
        this.stopPolling();
        this.router.navigate(['/documents']);
        // Optionally, show a success toast/message
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/documents']);
  }

  ngOnDestroy(): void {
    this.componentActive = false;
    this.stopPolling();
  }
}
