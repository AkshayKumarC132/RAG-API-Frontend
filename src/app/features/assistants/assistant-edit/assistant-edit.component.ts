import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AssistantService } from "../../../services/assistant.service"; // Corrected path
import { Assistant } from "../../../core/models/assistant.model";
// import { VectorStoreService } from '../../../services/vector-store.service'; // TODO
// import { VectorStore } from '../../../core/models/vector-store.model'; // TODO
import { Observable, of } from "rxjs";
import { catchError, finalize, switchMap, tap } from "rxjs/operators";

interface AssistantFormData {
  name: string;
  vector_store_id?: string;
  instructions?: string;
}

@Component({
  selector: "app-assistant-edit",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./assistant-edit.component.html",
  styleUrls: ["./assistant-edit.component.scss"],
})
export class AssistantEditComponent implements OnInit {
  assistantForm: AssistantFormData = {
    name: "",
    vector_store_id: "",
    instructions: "",
  };
  assistantId: string | null = null;
  originalAssistant: Assistant | null = null;

  // TODO: For Vector Store dropdown
  // vectorStores$: Observable<VectorStore[]> | undefined;

  isLoading = false; // General loading for page/initial data
  isSaving = false; // Specific loading for save operation
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private assistantService: AssistantService,
    private route: ActivatedRoute,
    private router: Router
  ) // TODO: private vectorStoreService: VectorStoreService
  {}

  ngOnInit(): void {
    this.isLoading = true;
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.assistantId = params.get("id");
          if (this.assistantId) {
            return this.assistantService.getAssistant(this.assistantId);
          } else {
            this.error = "Assistant ID not found in route.";
            return of(null);
          }
        }),
        catchError((err) => {
          console.error("Error loading assistant for editing:", err);
          this.error = `Failed to load assistant data. ${
            err.error?.detail || ""
          }`;
          return of(null);
        })
      )
      .subscribe((assistant) => {
        if (assistant) {
          this.originalAssistant = assistant;
          this.assistantForm = {
            name: assistant.name,
            vector_store_id: assistant.vector_store_id || "",
            instructions: assistant.instructions || "",
          };
        } else if (!this.error) {
          this.error = "Failed to load assistant data.";
        }
        this.isLoading = false;
      });
  }

  onSubmit(): void {
    if (!this.assistantId) {
      this.error = "Cannot save: Assistant ID is missing.";
      return;
    }
    if (!this.assistantForm.name.trim()) {
      this.error = "Assistant name is required.";
      return;
    }

    this.isSaving = true;
    this.error = null;
    this.successMessage = null;

    const vsId = this.assistantForm.vector_store_id?.trim() || undefined;
    const instructions = this.assistantForm.instructions?.trim() || undefined;

    this.assistantService
      .updateAssistant(
        this.assistantId,
        this.assistantForm.name.trim(),
        vsId,
        instructions
      )
      .pipe(
        catchError((err) => {
          console.error("Error updating assistant:", err);
          this.error = `Failed to update assistant. ${
            err.error?.detail || err.message || "Please try again."
          }`;
          return of(null);
        }),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe((response) => {
        if (response) {
          this.successMessage = "Assistant updated successfully!";
          this.originalAssistant = response; // Update original assistant data
          setTimeout(() => {
            this.router.navigate(["/assistants", this.assistantId]);
          }, 1500);
        }
      });
  }

  navigateBack(): void {
    if (this.assistantId) {
      this.router.navigate(["/assistants", this.assistantId]);
    } else {
      this.router.navigate(["/assistants"]);
    }
  }
}
