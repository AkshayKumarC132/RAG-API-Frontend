import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { VectorStoreService } from '../../../services/vector-store.service';
import { VectorStore } from '../../../core/models/vector-store.model';

@Component({
  selector: "app-vector-store-create",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vector-store-create.component.html',
  styleUrls: ['./vector-store-create.component.scss']
})
export class VectorStoreCreateComponent implements OnInit {
  private router = inject(Router);
  private vectorStoreService = inject(VectorStoreService);

  vectorStoreForm: FormGroup;
  submitting: boolean = false;
  error: any = null;

  ngOnInit(): void {
    this.vectorStoreForm = new FormGroup({
      name: new FormControl('', Validators.required),
      // Potentially add other fields like 'description' or 'tags' here later
    });
  }

  onSubmit(): void {
    if (this.vectorStoreForm.invalid) {
      this.vectorStoreForm.markAllAsTouched(); // Mark fields as touched to show errors
      return;
    }

    this.submitting = true;
    this.error = null;

    const formData = { name: this.vectorStoreForm.value.name };

    this.vectorStoreService.createVectorStore(formData)
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: (createdStore: VectorStore) => {
          this.router.navigate(['/vector-stores', createdStore.id]);
        },
        error: (err) => {
          this.error = err.message || 'An unknown error occurred.';
          console.error('Error creating vector store:', err);
        }
      });
  }
}
