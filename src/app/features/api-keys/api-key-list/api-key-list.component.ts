import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { OpenAIKeyService } from "../../../services/openai-key.service"; // Corrected path
import { OpenAIKey } from "../../../core/models/openai-key.model";

@Component({
  selector: "app-api-key-list",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./api-key-list.component.html",
  styleUrls: ["./api-key-list.component.scss"],
})
export class ApiKeyListComponent implements OnInit {
  apiKeys: (OpenAIKey & { showKey?: boolean })[] = [];
  isLoading = false;
  error: string | null = null;
  Math = Math; // Make Math available in template

  constructor(
    private openAIKeyService: OpenAIKeyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApiKeys();
  }

  loadApiKeys(): void {
    this.isLoading = true;
    this.error = null;
    this.openAIKeyService.getAPIKeys().subscribe(
      (keys) => {
        this.apiKeys = keys.map((key) => ({ ...key, showKey: false }));
        this.isLoading = false;
      },
      (error) => {
        this.error = "Failed to load API keys.";
        this.isLoading = false;
        console.error(error);
      }
    );
  }

  toggleApiKeyVisibility(apiKey: OpenAIKey & { showKey?: boolean }): void {
    apiKey.showKey = !apiKey.showKey;
  }

  deleteApiKey(id: string): void {
    if (!id) {
      console.error("Attempted to delete API key with undefined or null id.");
      this.error = "Cannot delete key with invalid ID.";
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.openAIKeyService.deleteAPIKey(id).subscribe(
      () => {
        this.apiKeys = this.apiKeys.filter((key) => key.id !== id);
        this.isLoading = false;
      },
      (error) => {
        this.error = "Failed to delete API key.";
        this.isLoading = false;
        console.error(error);
      }
    );
  }

  editApiKey(id: string): void {
    this.router.navigate(["/api-keys/edit", id]);
  }
}
