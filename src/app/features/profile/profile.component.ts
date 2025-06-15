import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../core/services/auth.service";

interface ProtectedResponse {
  user: {
    id: number;
    username: string;
    email: string;
    tenant: number;
  };
  token: string;
}

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h2 class="mb-0">Profile</h2>
            </div>
            <div class="card-body">
              <div class="mb-4" *ngIf="userDetails; else loading">
                <div class="row mb-3">
                  <div class="col-md-4 fw-bold">Username:</div>
                  <div class="col-md-8">{{ userDetails.user.username }}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-md-4 fw-bold">Email:</div>
                  <div class="col-md-8">{{ userDetails.user.email }}</div>
                </div>
                <div class="row mb-3">
                  <div class="col-md-4 fw-bold">Tenant ID:</div>
                  <div class="col-md-8">{{ userDetails.user.tenant }}</div>
                </div>
                <!-- <div class="row mb-3">
                  <div class="col-md-4 fw-bold">User ID:</div>
                  <div class="col-md-8">{{ userDetails.user.id }}</div>
                </div> -->
              </div>
              <ng-template #loading>
                <div class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);

  userDetails: ProtectedResponse | null = null;

  ngOnInit(): void {
    this.loadUserDetails();
  }

  private loadUserDetails(): void {
    const token = this.authService.getToken();
    if (token) {
      this.authService.getUserDetails().subscribe({
        next: (response) => {
          this.userDetails = response;
        },
        error: (error) => {
          console.error("Error loading user details:", error);
        },
      });
    }
  }
}
