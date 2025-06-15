import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { OpenAIKeyService } from "../../../services/openai-key.service";
import { OpenAIKey } from "../../../core/models/openai-key.model";

@Component({
  selector: "app-api-key-edit",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./api-key-edit.component.html",
  styleUrls: ["./api-key-edit.component.scss"],
})
export class ApiKeyEditComponent implements OnInit {
  apiKeyId: string = "";
  apiKey: OpenAIKey | null = null;
  isLoading = false;
  error: string | null = null;
  showKey = false;

  constructor(
    private route: ActivatedRoute,
    private openAIKeyService: OpenAIKeyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiKeyId = this.route.snapshot.paramMap.get("id") || "";
    if (this.apiKeyId) {
      this.isLoading = true;
      this.openAIKeyService.getAPIKey(this.apiKeyId).subscribe({
        next: (key: OpenAIKey) => {
          this.apiKey = key;
          this.isLoading = false;
        },
        error: (err: any) => {
          this.error = "Failed to load API key.";
          this.isLoading = false;
        },
      });
    }
  }

  updateApiKey(): void {
    if (!this.apiKey) return;
    this.isLoading = true;
    this.openAIKeyService.updateAPIKey(this.apiKeyId, this.apiKey).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(["/api-keys"]);
      },
      error: (err: any) => {
        this.error = "Failed to update API key.";
        this.isLoading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(["/api-keys"]);
  }

  toggleKeyVisibility(): void {
    this.showKey = !this.showKey;
  }
}
