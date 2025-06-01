import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, catchError, tap, finalize, filter } from 'rxjs/operators';
import { VectorStore } from '../../../core/models/vector-store.model';
import { VectorStoreService } from '../../../services/vector-store.service';

@Component({
  selector: "app-vector-store-edit",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vector-store-edit.component.html',
  styleUrls: ['./vector-store-edit.component.scss']
})
export class VectorStoreEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vectorStoreService = inject(VectorStoreService);

  vectorStoreForm: FormGroup = new FormGroup({});
  submitting: boolean = false;
  error: any = null;
  vectorStoreId: string | null = null;
  initialLoading: boolean = true; // For initial data fetch

  ngOnInit(): void {
    this.vectorStoreForm = new FormGroup({
      name: new FormControl('', Validators.required),
      // Add other editable fields here, e.g., description
    });

    this.route.paramMap.pipe(
      tap(() => this.initialLoading = true),
      switchMap(params => {
        this.vectorStoreId = params.get('id');
        if (this.vectorStoreId) {
          return this.vectorStoreService.getVectorStore(this.vectorStoreId).pipe(
            catchError(err => {
              if (err.status === 404) {
                this.error = 'Vector Store not found.';
                this.router.navigate(['/vector-stores']); // Redirect if not found
              } else {
                this.error = 'Failed to load vector store details for editing.';
              }
              this.initialLoading = false;
              return throwError(() => new Error(this.error));
            })
          );
        } else {
          this.error = 'No Vector Store ID provided for editing.';
          this.initialLoading = false;
          this.router.navigate(['/vector-stores']);
          return throwError(() => new Error(this.error));
        }
      }),
      filter((store): store is VectorStore => store !== null),
      tap(vectorStore => {
        this.vectorStoreForm.patchValue({
          name: vectorStore.name,
          // Patch other form values here
        });
        this.initialLoading = false;
      }),
      finalize(() => this.initialLoading = false)
    ).subscribe({
      error: (err) => {
        console.error("Error in ngOnInit subscription:", err);
        if (!this.error) {
            this.error = "An unexpected error occurred during initialization.";
        }
        this.initialLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.vectorStoreForm.invalid) {
      this.vectorStoreForm.markAllAsTouched();
      return;
    }

    if (!this.vectorStoreId) {
      this.error = "Vector Store ID is missing, cannot update.";
      return;
    }

    this.submitting = true;
    this.error = null;

    const updatedData: Partial<VectorStore> = {
      name: this.vectorStoreForm.value.name,
      // map other form values
    };

    this.vectorStoreService.updateVectorStore(this.vectorStoreId, updatedData)
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/vector-stores', this.vectorStoreId]);
        },
        error: (err) => {
          this.error = err.message || 'An unknown error occurred while updating.';
          console.error('Error updating vector store:', err);
        }
      });
  }
}
