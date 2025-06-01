import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AssistantService } from '../../../services/assistant.service'; // Corrected path
// import { VectorStoreService } from '../../../services/vector-store.service'; // TODO
// import { VectorStore } from '../../../core/models/vector-store.model'; // TODO
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

interface AssistantFormData {
  name: string;
  vector_store_id?: string;
  instructions?: string;
}

@Component({
  selector: 'app-assistant-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './assistant-create.component.html',
  // styleUrls: ['./assistant-create.component.css']
})
export class AssistantCreateComponent implements OnInit {
  assistantForm: AssistantFormData = {
    name: '',
    vector_store_id: '',
    instructions: ''
  };

  // TODO: For Vector Store dropdown
  // vectorStores$: Observable<VectorStore[]> | undefined;

  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private assistantService: AssistantService,
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

    if (!this.assistantForm.name.trim()) {
      this.error = 'Assistant name is required.';
      return;
    }
    // vector_store_id and instructions are optional, so no specific validation here unless desired (e.g. format for ID)

    this.isLoading = true;

    const vsId = this.assistantForm.vector_store_id?.trim() || undefined;
    const instructions = this.assistantForm.instructions?.trim() || undefined;

    this.assistantService.createAssistant(
      this.assistantForm.name.trim(),
      vsId,
      instructions
    ).pipe(
      catchError(err => {
        console.error('Error creating assistant:', err);
        this.error = `Failed to create assistant. ${err.error?.detail || err.message || 'Please try again.'}`;
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      if (response) {
        this.successMessage = 'Assistant created successfully!';
        setTimeout(() => {
          this.router.navigate(['/assistants', response.id]); // Navigate to detail page of new assistant
        }, 1500);
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/assistants']);
  }
}
