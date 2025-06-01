import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { of, throwError } from "rxjs";
import { switchMap, catchError, tap, finalize } from "rxjs/operators";
import { User, UserOperation } from "../../../core/models/user.model";
import { UserService } from "../../../services/user.service";

@Component({
  selector: "app-user-edit",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-6">
        {{ isEditMode ? "Edit User" : "Create New User" }}
      </h1>

      <div *ngIf="initialLoading" class="text-center p-6">
        <p class="text-gray-600">Loading user details...</p>
        <!-- Add a spinner/loader graphic here if desired -->
      </div>

      <div
        *ngIf="error && !submitting"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
        role="alert"
      >
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ error }}</span>
        <div class="mt-2">
          <a
            *ngIf="isEditMode && userId"
            [routerLink]="['/users', userId]"
            class="text-red-700 hover:text-red-900 font-semibold mr-2"
            >Back to Details</a
          >
          <a
            routerLink="/users"
            class="text-red-700 hover:text-red-900 font-semibold"
            >Back to List</a
          >
        </div>
      </div>

      <form
        *ngIf="!initialLoading && userForm"
        [formGroup]="userForm"
        (ngSubmit)="onSubmit()"
        class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <!-- Username -->
        <div class="mb-4">
          <label
            for="username"
            class="block text-gray-700 text-sm font-bold mb-2"
            >Username:</label
          >
          <input
            id="username"
            type="text"
            formControlName="username"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            [ngClass]="{
              'border-red-500':
                userForm.get('username')?.invalid &&
                (userForm.get('username')?.dirty ||
                  userForm.get('username')?.touched)
            }"
          />
          <div
            *ngIf="
              userForm.get('username')?.invalid &&
              (userForm.get('username')?.dirty ||
                userForm.get('username')?.touched)
            "
            class="text-red-500 text-xs italic"
          >
            <span *ngIf="userForm.get('username')?.errors?.['required']"
              >Username is required.</span
            >
          </div>
        </div>

        <!-- Email -->
        <div class="mb-4">
          <label for="email" class="block text-gray-700 text-sm font-bold mb-2"
            >Email:</label
          >
          <input
            id="email"
            type="email"
            formControlName="email"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            [ngClass]="{
              'border-red-500':
                userForm.get('email')?.invalid &&
                (userForm.get('email')?.dirty || userForm.get('email')?.touched)
            }"
          />
          <div
            *ngIf="
              userForm.get('email')?.invalid &&
              (userForm.get('email')?.dirty || userForm.get('email')?.touched)
            "
            class="text-red-500 text-xs italic"
          >
            <span *ngIf="userForm.get('email')?.errors?.['required']"
              >Email is required.</span
            >
            <span *ngIf="userForm.get('email')?.errors?.['email']"
              >Please enter a valid email address.</span
            >
          </div>
        </div>

        <!-- Role -->
        <div class="mb-4">
          <label for="role" class="block text-gray-700 text-sm font-bold mb-2"
            >Role:</label
          >
          <input
            id="role"
            type="text"
            formControlName="role"
            placeholder="e.g., admin, editor, viewer"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            [ngClass]="{
              'border-red-500':
                userForm.get('role')?.invalid &&
                (userForm.get('role')?.dirty || userForm.get('role')?.touched)
            }"
          />
          <div
            *ngIf="
              userForm.get('role')?.invalid &&
              (userForm.get('role')?.dirty || userForm.get('role')?.touched)
            "
            class="text-red-500 text-xs italic"
          >
            <span *ngIf="userForm.get('role')?.errors?.['required']"
              >Role is required.</span
            >
          </div>
        </div>

        <!-- Password -->
        <div class="mb-6">
          <label
            for="password"
            class="block text-gray-700 text-sm font-bold mb-2"
            >Password:</label
          >
          <input
            id="password"
            type="password"
            formControlName="password"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            [ngClass]="{
              'border-red-500':
                userForm.get('password')?.invalid &&
                (userForm.get('password')?.dirty ||
                  userForm.get('password')?.touched)
            }"
          />
          <p
            *ngIf="isEditMode && !passwordRequired"
            class="text-xs text-gray-600"
          >
            Leave blank to keep current password.
          </p>
          <div
            *ngIf="
              userForm.get('password')?.invalid &&
              (userForm.get('password')?.dirty ||
                userForm.get('password')?.touched) &&
              passwordRequired
            "
            class="text-red-500 text-xs italic"
          >
            <span *ngIf="userForm.get('password')?.errors?.['required']"
              >Password is required.</span
            >
          </div>
        </div>

        <div class="flex items-center justify-between">
          <button
            type="submit"
            [disabled]="userForm.invalid || submitting"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            <span *ngIf="!submitting">{{
              isEditMode ? "Update User" : "Create User"
            }}</span>
            <span *ngIf="submitting">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isEditMode ? "Updating..." : "Creating..." }}
            </span>
          </button>
          <a
            [routerLink]="isEditMode && userId ? ['/users', userId] : '/users'"
            class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            Cancel
          </a>
        </div>
        <div
          *ngIf="error && submitting"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4"
          role="alert"
        >
          <strong class="font-bold">Error:</strong>
          <span class="block sm:inline">{{ error }}</span>
        </div>
      </form>
    </div>
  `,
})
export class UserEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  userForm: FormGroup = new FormGroup({
    username: new FormControl("", Validators.required),
    email: new FormControl("", [Validators.required, Validators.email]),
    role: new FormControl("", Validators.required),
    password: new FormControl("", Validators.required),
  });
  isEditMode: boolean = false;
  userId: string | null = null;
  submitting: boolean = false;
  error: any = null;
  initialLoading: boolean = true;
  passwordRequired: boolean = true;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.initialLoading = true;
        }),
        switchMap((params) => {
          const id = params.get("id");
          if (id) {
            this.isEditMode = true;
            this.userId = id;
            this.passwordRequired = false;
            this.userForm.get("password")?.clearValidators();
            this.userForm.get("password")?.updateValueAndValidity();

            return this.userService.getUser(this.userId).pipe(
              // Assuming getUserById is named getUser
              catchError((err) => {
                if (err.status === 404) {
                  this.error = "User not found.";
                  this.router.navigate(["/users"]); // Redirect if not found
                } else {
                  this.error = "Failed to load user details for editing.";
                }
                return throwError(() => new Error(this.error));
              })
            );
          } else {
            this.isEditMode = false;
            this.passwordRequired = true; // Explicitly true for create mode
            this.initialLoading = false; // Not fetching data, so stop initial loading
            return of(null); // No user to fetch for create mode
          }
        }),
        tap((user) => {
          // This tap will only run if a user was fetched (edit mode)
          if (user && this.isEditMode) {
            this.userForm.patchValue({
              username: user.username,
              email: user.email,
              role: user.role,
              // Do not patch password
            });
          }
        }),
        finalize(() => {
          // Finalize initial loading only if it wasn't already set to false (create mode)
          if (this.isEditMode || !this.userId) {
            this.initialLoading = false;
          }
        })
      )
      .subscribe({
        error: (err) => {
          // Errors are handled in catchError, but this is a safety net
          console.error(
            "Error in ngOnInit subscription for UserEditComponent:",
            err
          );
          this.initialLoading = false; // Ensure loading is off
          if (!this.error) {
            this.error = "An unexpected error occurred during initialization.";
          }
        },
      });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const formData = this.userForm.value;
    let userData: UserOperation = {
      username: formData.username,
      email: formData.email,
      role: formData.role,
    };

    if (this.isEditMode) {
      if (formData.password) {
        // Only include password if provided in edit mode
        userData.password = formData.password;
      }
    } else {
      // Create mode
      userData.password = formData.password;
    }

    const operation =
      this.isEditMode && this.userId
        ? this.userService.updateUser(this.userId, userData)
        : this.userService.createUser(userData as User); // Type assertion for createUser

    operation
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: (responseUser) => {
          const navigateToId = responseUser?.id || this.userId;
          if (navigateToId) {
            this.router.navigate(["/users", navigateToId]);
          } else {
            this.router.navigate(["/users"]);
          }
        },
        error: (err) => {
          this.error =
            err.message ||
            (this.isEditMode
              ? "Failed to update user."
              : "Failed to create user.");
          console.error("Error submitting user form:", err);
        },
      });
  }
}
