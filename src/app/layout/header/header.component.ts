import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { NgbDropdownModule } from "@ng-bootstrap/ng-bootstrap";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div class="container-fluid">
        <span class="navbar-brand d-lg-none">RAG API</span>

        <div class="d-flex align-items-center ms-auto">
          <div ngbDropdown class="d-inline-block">
            <button
              class="btn btn-outline-secondary"
              id="userDropdown"
              type="button"
              ngbDropdownToggle
            >
              <i class="bi bi-person-circle me-2"></i>
              {{ authService.currentUser()?.username || "User" }}
            </button>
            <div
              ngbDropdownMenu
              class="dropdown-menu dropdown-menu-end"
              aria-labelledby="userDropdown"
            >
              <a ngbDropdownItem routerLink="/profile">
                <i class="bi bi-person me-2"></i>Profile
              </a>
              <div class="dropdown-divider"></div>
              <a
                ngbDropdownItem
                class="text-danger"
                href="javascript:void(0)"
                (click)="onLogout()"
              >
                <i class="bi bi-box-arrow-right me-2"></i>Logout
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
})
export class HeaderComponent {
  authService = inject(AuthService);

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}
