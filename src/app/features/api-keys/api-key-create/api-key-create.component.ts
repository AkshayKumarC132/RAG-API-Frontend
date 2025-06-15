import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { OpenAIKeyService } from "../../../services/openai-key.service";
import { CreateOpenAIKeyRequest } from "../../../core/models/openai-key.model";

@Component({
  selector: "app-api-key-create",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./api-key-create.component.html",
  styleUrls: ["./api-key-create.component.scss"],
})
export class ApiKeyCreateComponent {
  apiKeyName = "";
  apiKeyString = "";
  selectedProvider = "OpenAI"; // Default provider
  isLoading = false;
  error: string | null = null;
  is_active = false; // New property for active status

  providers = ["OpenAI", "Ollama"]; // List of providers

  constructor(
    private openAIKeyService: OpenAIKeyService,
    private router: Router
  ) {}

  createApiKey(): void {
    if (this.selectedProvider === "OpenAI" && !this.apiKeyString.trim()) {
      this.error = "API key string is required for OpenAI.";
      return;
    }

    this.isLoading = true;
    this.error = null;

    const request: CreateOpenAIKeyRequest = {
      api_key: this.apiKeyString.trim() || "", // Send empty string if not required
      name: this.apiKeyName.trim() || undefined, // Send undefined if name is empty
      provider: this.selectedProvider, // Include the selected provider
      is_active: this.is_active, // Include the active status
    };

    this.openAIKeyService.createAPIKey(request).subscribe(
      () => {
        this.isLoading = false;
        this.router.navigate(["/api-keys"]); // Navigate to the list view
      },
      (err) => {
        this.error = `Failed to create API key. ${
          err.error?.api_key ||
          "Please ensure the key is valid and not a duplicate."
        }`;
        this.isLoading = false;
        console.error("Error creating API key:", err);
      }
    );
  }

  isApiKeyRequired(): boolean {
    return this.selectedProvider === "OpenAI";
  }
}
