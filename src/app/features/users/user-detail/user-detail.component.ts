import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Observable, of } from "rxjs";
import { switchMap, catchError, tap } from "rxjs/operators";
import { User } from "../../../core/models/user.model";
import { UserService } from "../../../services/user.service";

@Component({
  selector: "app-user-detail",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-4">
      <ng-container *ngIf="user$ | async as user; else loadingOrErrorState">
        <div *ngIf="user; else notFoundState">
          <h1 class="text-3xl font-bold mb-6">
            User Details: {{ user.username }}
          </h1>
          <div class="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
              <div>
                <dt class="text-sm font-medium text-gray-500">User ID</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user.id }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Username</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user.username }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user.email }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Role</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user.role }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Tenant ID</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user.tenant_id }}</dd>
              </div>
              <div *ngIf="user.tenant_name">
                <dt class="text-sm font-medium text-gray-500">Tenant Name</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ user.tenant_name }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Created At</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ user.created_at | date : "medium" }}
                </dd>
              </div>
            </dl>
          </div>
          <div class="mt-8 flex gap-x-4">
            <a
              [routerLink]="['/users', user.id, 'edit']"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Edit User
            </a>
            <a
              routerLink="/users"
              class="text-blue-600 hover:text-blue-800 font-semibold py-2 px-4"
            >
              Back to User List
            </a>
          </div>
        </div>
      </ng-container>

      <ng-template #loadingOrErrorState>
        <div *ngIf="initialLoading && !error" class="text-center py-10">
          <p class="text-gray-600 text-lg">Loading user details...</p>
          <!-- Optional: Add a spinner here -->
        </div>
        <div
          *ngIf="error"
          class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md"
          role="alert"
        >
          <strong class="font-bold">Error:</strong>
          <p>{{ error }}</p>
          <div class="mt-4">
            <a
              routerLink="/users"
              class="text-red-600 hover:text-red-800 font-semibold"
              >Back to User List</a
            >
          </div>
        </div>
      </ng-template>

      <ng-template #notFoundState>
        <!-- This state is specifically when user is null AND there's no general error from initialLoading block -->
        <div *ngIf="!initialLoading && !error" class="text-center py-10">
          <h2 class="text-2xl font-semibold text-gray-700 mb-4">
            User Not Found
          </h2>
          <p class="text-gray-500 mb-6">
            The user you are looking for does not exist or could not be loaded.
          </p>
          <a
            routerLink="/users"
            class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back to User List
          </a>
        </div>
      </ng-template>
    </div>
  `,
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  user$: Observable<User | null> = of(null);
  error: any = null;
  initialLoading: boolean = true;

  ngOnInit(): void {
    this.user$ = this.route.paramMap.pipe(
      tap(() => {
        this.initialLoading = true;
        this.error = null; // Reset error on new ID
      }),
      switchMap((params) => {
        const id = params.get("id");
        if (id) {
          return this.userService.getUser(id).pipe(
            // Assumes getUser from UserService handles API call
            catchError((err) => {
              if (err.status === 404) {
                // Handled by returning of(null), error display is conditional in template
                this.error = null;
              } else {
                this.error = err.message || "Failed to load user details.";
                console.error("Error fetching user:", err);
              }
              return of(null); // Emit null in case of any error to let the async pipe resolve
            })
          );
        } else {
          this.error = "No User ID provided in the route.";
          return of(null); // No ID, so return null
        }
      }),
      tap(() => {
        this.initialLoading = false;
      })
    );
  }
}
