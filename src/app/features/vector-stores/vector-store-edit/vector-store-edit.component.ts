import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Observable, of, throwError } from "rxjs";
import { switchMap, catchError, tap, finalize, filter } from "rxjs/operators";
import { VectorStore } from "../../../core/models/vector-store.model";
import { VectorStoreService } from "../../../services/vector-store.service";

@Component({
  selector: "app-vector-store-edit",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Edit Vector Store</h1>

      <div *ngIf="initialLoading" class="text-center p-4">
        <p>Loading vector store details...</p>
        <!-- You can add a spinner here -->
      </div>

      <div
        *ngIf="error && !submitting"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
        role="alert"
      >
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ error }}</span>
        <div class="mt-2">
          <a
            *ngIf="vectorStoreId"
            [routerLink]="['/vector-stores', vectorStoreId]"
            class="text-red-700 hover:text-red-900 font-semibold mr-2"
            >Back to Details</a
          >
          <a
            routerLink="/vector-stores"
            class="text-red-700 hover:text-red-900 font-semibold"
            >Back to List</a
          >
        </div>
      </div>

      <form
        *ngIf="!initialLoading && vectorStoreForm"
        [formGroup]="vectorStoreForm"
        (ngSubmit)="onSubmit()"
        class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div class="mb-4">
          <label for="name" class="block text-gray-700 text-sm font-bold mb-2"
            >Name:</label
          >
          <input
            id="name"
            type="text"
            formControlName="name"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            [ngClass]="{
              'border-red-500':
                vectorStoreForm.get('name')?.invalid &&
                (vectorStoreForm.get('name')?.dirty ||
                  vectorStoreForm.get('name')?.touched)
            }"
          />
          <div
            *ngIf="
              vectorStoreForm.get('name')?.invalid &&
              (vectorStoreForm.get('name')?.dirty ||
                vectorStoreForm.get('name')?.touched)
            "
            class="text-red-500 text-xs italic"
          >
            <span *ngIf="vectorStoreForm.get('name')?.errors?.['required']"
              >Name is required.</span
            >
          </div>
        </div>

        <!-- Add other form fields for editing here -->

        <div class="flex items-center justify-between mt-6">
          <button
            type="submit"
            [disabled]="vectorStoreForm.invalid || submitting || initialLoading"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            <span *ngIf="!submitting">Update Vector Store</span>
            <span *ngIf="submitting">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </span>
          </button>
          <a
            *ngIf="vectorStoreId"
            [routerLink]="['/vector-stores', vectorStoreId]"
            class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            Cancel
          </a>
          <a
            *ngIf="!vectorStoreId"
            routerLink="/vector-stores"
            class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            Back to List
          </a>
        </div>
        <div
          *ngIf="error && submitting"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4"
          role="alert"
        >
          <strong class="font-bold">Update Error:</strong>
          <span class="block sm:inline">{{ error }}</span>
        </div>
      </form>
    </div>
  `,
})
export class VectorStoreEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vectorStoreService = inject(VectorStoreService);

  vectorStoreForm: FormGroup = new FormGroup({
    name: new FormControl("", Validators.required),
  });
  submitting: boolean = false;
  error: any = null;
  vectorStoreId: string | null = null;
  initialLoading: boolean = true; // For initial data fetch

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => (this.initialLoading = true)),
        switchMap((params) => {
          this.vectorStoreId = params.get("id");
          if (this.vectorStoreId) {
            return this.vectorStoreService
              .getVectorStore(this.vectorStoreId)
              .pipe(
                catchError((err) => {
                  if (err.status === 404) {
                    this.error = "Vector Store not found.";
                    this.router.navigate(["/vector-stores"]); // Redirect if not found
                  } else {
                    this.error =
                      "Failed to load vector store details for editing.";
                  }
                  this.initialLoading = false;
                  return throwError(() => new Error(this.error)); // Propagate error to stop further processing in this pipe
                })
              );
          } else {
            this.error = "No Vector Store ID provided for editing.";
            this.initialLoading = false;
            this.router.navigate(["/vector-stores"]); // Redirect if no ID
            return throwError(() => new Error(this.error));
          }
        }),
        filter((store): store is VectorStore => store !== null), // Ensure store is not null
        tap((vectorStore) => {
          this.vectorStoreForm.patchValue({
            name: vectorStore.name,
            // Patch other form values here
          });
          this.initialLoading = false;
        }),
        finalize(() => (this.initialLoading = false)) // Ensure loading is false on completion/error
      )
      .subscribe({
        // The main logic is in tap/catchError, subscribe is needed to trigger the pipe
        error: (err) => {
          // Error already handled in catchError, but good to have for safety or additional logging
          console.error("Error in ngOnInit subscription:", err);
          if (!this.error) {
            // If error wasn't set by specific handlers
            this.error = "An unexpected error occurred during initialization.";
          }
          this.initialLoading = false; // Ensure loading is off
        },
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

    this.vectorStoreService
      .updateVectorStore(this.vectorStoreId, updatedData)
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(["/vector-stores", this.vectorStoreId]); // Navigate to detail page on success
        },
        error: (err) => {
          this.error =
            err.message || "An unknown error occurred while updating.";
          console.error("Error updating vector store:", err);
        },
      });
  }
}
