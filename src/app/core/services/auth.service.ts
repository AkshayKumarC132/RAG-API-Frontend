import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, tap, catchError, throwError } from "rxjs";
import { environment } from "../../../environments/environment";
import { User } from "../models/user.model";

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  private readonly TOKEN_KEY = "auth_token";
  private _isAuthenticated = signal(this.hasToken());
  isAuthenticated = this._isAuthenticated.asReadonly();

  currentUser = signal<User | null>(null);

  constructor() {
    window.addEventListener("storage", () => {
      this._isAuthenticated.set(this.hasToken());
    });

    this._isAuthenticated.set(this.hasToken());
  }

  register(
    username: string,
    email: string,
    password: string,
    tenantName: string
  ): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/register/`, {
        username,
        email,
        password,
        tenant_name: tenantName,
      })
      .pipe(
        catchError((error) =>
          throwError(
            () => new Error(error.error?.message || "Registration failed")
          )
        )
      );
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login/`, { username, password })
      .pipe(
        tap((response) => {
          if (response?.token) {
            this.setToken(response.token);
            this._isAuthenticated.set(true);
            this.currentUser.set(response.user);
          }
        }),
        catchError((error) =>
          throwError(() => new Error(error.error?.message || "Login failed"))
        )
      );
  }

  logout(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      this.clearSession();
      this.router.navigate(["/auth/login"]);
      return throwError(() => new Error("No token found"));
    }

    return this.http.post(`${this.apiUrl}/logout/${token}/`, {}).pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(["/auth/login"]);
      }),
      catchError((error) => {
        this.clearSession();
        this.router.navigate(["/auth/login"]);
        return throwError(
          () => new Error(error.error?.message || "Logout failed")
        );
      })
    );
  }

  loadUserProfile(): Observable<User> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error("No token found"));
    }

    return this.http.get<User>(`${this.apiUrl}/user/${token}/profile/`).pipe(
      tap((user) => {
        this.currentUser.set(user);
      }),
      catchError((error) => {
        if (error.status === 401) {
          this.clearSession();
          this.router.navigate(["/auth/login"]);
        }
        return throwError(
          () => new Error(error.error?.message || "Failed to load user profile")
        );
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._isAuthenticated.set(false);
    this.currentUser.set(null);
  }
}
