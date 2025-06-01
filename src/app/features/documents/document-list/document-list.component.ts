import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DocumentService } from '../../../services/document.service'; // Corrected path
import { Document } from '../../../core/models/document.model';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss']
})
export class DocumentListComponent implements OnInit {
  documents: Document[] = [];
  isLoading = false;
  error: string | null = null;
  // TODO: Potentially add vectorStoreId filter from route params or input
  // private vectorStoreId: string | null = null;

  constructor(
    private documentService: DocumentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.error = null;
    // Pass this.vectorStoreId if filtering is implemented
    this.documentService.getDocuments().pipe(
      catchError(err => {
        console.error('Error loading documents:', err);
        this.error = 'Failed to load documents. Please try again later.';
        return of([]); // Return empty array on error to clear previous data
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(docs => {
      this.documents = docs;
    });
  }

  deleteDocument(id: string, event: Event): void {
    event.stopPropagation(); // Prevent navigation if delete is on a clickable row/element
    if (!id) {
      console.error('Document ID is undefined, cannot delete.');
      this.error = 'Cannot delete document: Invalid ID.';
      return;
    }

    // Optional: Add a confirmation dialog here
    // if (!confirm('Are you sure you want to delete this document?')) {
    //   return;
    // }

    this.isLoading = true; // Can also use a specific deleting flag like isDeleting[id] = true
    this.documentService.deleteDocument(id).pipe(
      catchError(err => {
        console.error(`Error deleting document ${id}:`, err);
        this.error = `Failed to delete document. ${err.error?.detail || ''}`;
        return of(null); // Continue the stream to finalize
      }),
      finalize(() => {
        this.isLoading = false; // Reset global loading or specific flag
      })
    ).subscribe(response => {
      if (response !== null) { // Check if deletion was successful (not an error)
        this.documents = this.documents.filter(doc => doc.id !== id);
        // Optionally, show a success toast/message
      }
      // If error occurred, it's already handled by catchError and error property is set
    });
  }

  navigateToDetail(documentId: string): void {
    this.router.navigate(['/documents', documentId]);
  }

  navigateIngest(): void {
    this.router.navigate(['/documents/ingest']);
  }
}
