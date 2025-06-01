import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { finalize } from "rxjs/operators";
import { VectorStoreService } from "../../../services/vector-store.service";
import { VectorStore } from "../../../core/models/vector-store.model";

@Component({
  selector: "app-vector-store-create",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Create New Vector Store</h1>

      <div
        *ngIf="error"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
        role="alert"
      >
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ error.message || error }}</span>
      </div>

      <form
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

        <!-- Add other form fields here if needed -->

        <div class="flex items-center justify-between">
          <button
            type="submit"
            [disabled]="vectorStoreForm.invalid || submitting"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            <span *ngIf="!submitting">Create Vector Store</span>
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
              Submitting...
            </span>
          </button>
          <a
            routerLink="/vector-stores"
            class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  `,
})
export class VectorStoreCreateComponent implements OnInit {
  private router = inject(Router);
  private vectorStoreService = inject(VectorStoreService);

  vectorStoreForm: FormGroup = new FormGroup({
    name: new FormControl("", Validators.required),
  });
  submitting: boolean = false;
  error: any = null;

  ngOnInit(): void {
    // Potentially add other fields like 'description' or 'tags' here later
  }

  onSubmit(): void {
    if (this.vectorStoreForm.invalid) {
      this.vectorStoreForm.markAllAsTouched(); // Mark fields as touched to show errors
      return;
    }

    this.submitting = true;
    this.error = null;

    // Assuming createVectorStore expects an object with a 'name' property
    const formData = { name: this.vectorStoreForm.value.name };

    this.vectorStoreService
      .createVectorStore(formData)
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: (createdStore: VectorStore) => {
          // Navigate to the details page of the newly created store or list page
          this.router.navigate(["/vector-stores", createdStore.id]);
          // Or navigate to the list page: this.router.navigate(['/vector-stores']);
        },
        error: (err) => {
          this.error = err.message || "An unknown error occurred.";
          console.error("Error creating vector store:", err);
        },
      });
  }
}
