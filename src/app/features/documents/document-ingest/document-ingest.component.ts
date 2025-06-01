import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, FormsModule } from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { DocumentService } from "../../../services/document.service"; // Corrected path
// TODO: Import VectorStoreService if implementing Vector Store dropdown
// import { VectorStoreService } from '../../../services/vector-store.service';
// import { VectorStore } from '../../../core/models/vector-store.model';
import { Observable, of } from "rxjs";
import { catchError, finalize } from "rxjs/operators";

@Component({
  selector: "app-document-ingest",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./document-ingest.component.html",
  styleUrls: ['./document-ingest.component.scss']
})
export class DocumentIngestComponent implements OnInit {
  vectorStoreId = "";
  ingestMode: "file" | "s3" = "file"; // Default to file upload
  selectedFile: File | null = null;
  s3Url = "";

  // TODO: For Vector Store dropdown
  // vectorStores$: Observable<VectorStore[]> | undefined;

  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  fileInput = new FormControl<File | null>(null);

  constructor(
    private documentService: DocumentService,
    private router: Router,
    private route: ActivatedRoute
  ) // TODO: private vectorStoreService: VectorStoreService
  {}

  ngOnInit(): void {
    // TODO: Load vector stores if implementing dropdown
    // this.vectorStores$ = this.vectorStoreService.getVectorStores();

    // Check if vectorStoreId is passed in route params (e.g., from a Vector Store's detail page)
    this.route.queryParamMap.subscribe((params) => {
      const vsId = params.get("vectorStoreId");
      if (vsId) {
        this.vectorStoreId = vsId;
      }
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      this.s3Url = ""; // Clear S3 URL if a file is selected
      this.error = null; // Clear previous errors
    } else {
      this.selectedFile = null;
    }
  }

  onS3UrlChange(): void {
    if (this.s3Url) {
      this.selectedFile = null; // Clear selected file if S3 URL is entered
      this.error = null; // Clear previous errors
    }
  }

  onSubmit(): void {
    this.error = null;
    this.successMessage = null;

    if (!this.vectorStoreId.trim()) {
      this.error = "Vector Store ID is required.";
      return;
    }

    if (this.ingestMode === "file" && !this.selectedFile) {
      this.error = "Please select a file to upload.";
      return;
    } else if (this.ingestMode === "s3" && !this.s3Url.trim()) {
      this.error = "Please provide an S3 URL.";
      return;
    } else if (this.ingestMode === "s3") {
      try {
        const url = new URL(this.s3Url.trim());
        if (url.protocol !== "s3:") {
          this.error = "Invalid S3 URL. It must start with s3://";
          return;
        }
      } catch (_) {
        this.error = "Invalid S3 URL format.";
        return;
      }
    }

    this.isLoading = true;
    let ingestObs: Observable<any>;

    if (this.ingestMode === "file" && this.selectedFile) {
      ingestObs = this.documentService.ingestDocument(
        this.vectorStoreId.trim(),
        this.selectedFile
      );
    } else if (this.ingestMode === "s3" && this.s3Url.trim()) {
      ingestObs = this.documentService.ingestDocument(
        this.vectorStoreId.trim(),
        undefined,
        this.s3Url.trim()
      );
    } else {
      // Should not happen due to prior checks, but as a safeguard:
      this.error = "No file selected or S3 URL provided.";
      this.isLoading = false;
      return;
    }

    ingestObs
      .pipe(
        catchError((err) => {
          console.error("Error ingesting document:", err);
          this.error = `Failed to ingest document. ${
            err.error?.detail || err.message || "Please try again."
          }`;
          return of(null); // Continue to finalize
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response) => {
        if (response) {
          // If response is not null (i.e., no error caught)
          this.successMessage = "Document ingestion started successfully!";
          // The backend might return the new document ID or details
          // For now, navigate to the general document list.
          // If response contains document ID: this.router.navigate(['/documents', response.id]);
          // Else:
          setTimeout(() => {
            if (this.vectorStoreId) {
              // If coming from a specific vector store, maybe go back there or its doc list
              // For now, let's assume a general document list is fine, or a specific route for VS documents
              this.router.navigate(["/documents"], {
                queryParams: { vectorStoreId: this.vectorStoreId },
              });
            } else {
              this.router.navigate(["/documents"]);
            }
          }, 2000); // Give user time to read success message
        }
      });
  }

  navigateBack(): void {
    if (
      this.vectorStoreId &&
      this.route.snapshot.queryParamMap.has("vectorStoreId")
    ) {
      // If vectorStoreId was passed as a query param, consider navigating back to a more specific context
      // e.g., this.router.navigate(['/vector-stores', this.vectorStoreId]);
      // For now, a general documents list or list filtered by this VS ID
      this.router.navigate(["/documents"], {
        queryParams: { vectorStoreId: this.vectorStoreId },
      });
    } else {
      this.router.navigate(["/documents"]);
    }
  }
}
