import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OpenAIKeyService } from '../../../services/openai-key.service'; // Corrected path
import { CreateOpenAIKeyRequest } from '../../../core/models/openai-key.model';

@Component({
  selector: 'app-api-key-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './api-key-create.component.html',
  // styleUrls: ['./api-key-create.component.css'] // Assuming no specific styles for now
})
export class ApiKeyCreateComponent {
  apiKeyName = '';
  apiKeyString = ''; // Added field for the key itself
  isLoading = false;
  error: string | null = null;

  constructor(
    private openAIKeyService: OpenAIKeyService,
    private router: Router
  ) { }

  createApiKey(): void {
    if (!this.apiKeyString.trim()) {
      this.error = 'API key string is required.';
      return;
    }
    // Name is optional, so no need to validate if it's empty,
    // but if provided, it should meet any backend validation (e.g. min length if applicable)
    // For now, we'll just trim it if provided.

    this.isLoading = true;
    this.error = null;

    const request: CreateOpenAIKeyRequest = {
      api_key: this.apiKeyString.trim(),
      name: this.apiKeyName.trim() || undefined // Send undefined if name is empty
    };

    this.openAIKeyService.createAPIKey(request).subscribe(
      () => {
        this.isLoading = false;
        this.router.navigate(['/api-keys']); // Navigate to the list view
      },
      err => { // Changed variable name from error to err to avoid conflict
        this.error = `Failed to create API key. ${err.error?.api_key || 'Please ensure the key is valid and not a duplicate.'}`;
        this.isLoading = false;
        console.error('Error creating API key:', err);
      }
    );
  }
}
