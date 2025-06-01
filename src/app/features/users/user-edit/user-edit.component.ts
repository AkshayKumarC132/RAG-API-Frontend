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
  templateUrl: "./user-edit.component.html",
  styleUrls: ["./user-edit.component.scss"],
})
export class UserEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  userForm: FormGroup = new FormGroup({});
  isEditMode: boolean = false;
  userId: string | null = null;
  submitting: boolean = false;
  error: any = null;
  initialLoading: boolean = true;
  passwordRequired: boolean = true;

  ngOnInit(): void {
    this.userForm = new FormGroup({
      username: new FormControl("", Validators.required),
      email: new FormControl("", [Validators.required, Validators.email]),
      role: new FormControl("", Validators.required),
      password: new FormControl("", Validators.required),
    });

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
              catchError((err) => {
                if (err.status === 404) {
                  this.error = "User not found.";
                  this.router.navigate(["/users"]);
                } else {
                  this.error = "Failed to load user details for editing.";
                }
                return throwError(() => new Error(this.error));
              })
            );
          } else {
            this.isEditMode = false;
            this.passwordRequired = true;
            this.initialLoading = false;
            return of(null);
          }
        }),
        tap((user) => {
          if (user && this.isEditMode) {
            this.userForm.patchValue({
              username: user.username,
              email: user.email,
              role: user.role,
            });
          }
        }),
        finalize(() => {
          if (this.isEditMode || !this.userId) {
            this.initialLoading = false;
          }
        })
      )
      .subscribe({
        error: (err) => {
          console.error(
            "Error in ngOnInit subscription for UserEditComponent:",
            err
          );
          this.initialLoading = false;
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
        userData.password = formData.password;
      }
    } else {
      userData.password = formData.password;
    }

    const operation =
      this.isEditMode && this.userId
        ? this.userService.updateUser(this.userId, userData)
        : this.userService.createUser(userData as User);

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
