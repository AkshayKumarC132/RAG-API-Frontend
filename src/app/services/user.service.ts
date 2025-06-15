import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { delay } from "rxjs/operators";
import { environment } from "../../environments/environment";
import { User } from "../core/models/user.model";
import { AuthService } from "../core/services/auth.service";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  getUsers(): Observable<User[]> {
    const token = this.authService.getToken();
    return this.http.get<User[]>(`${this.apiUrl}/user/${token}/list/`);
  }

  getUser(id: string): Observable<User> {
    const token = this.authService.getToken();
    return this.http.get<User>(`${this.apiUrl}/user/${token}/${id}/`);
  }

  createUser(data: Partial<User>): Observable<User> {
    const token = this.authService.getToken();
    // Mock implementation:
    // const newUser: User = {
    //   id: Math.random().toString(36).substring(2, 15),
    //   created_at: new Date(),
    //   tenant_id: 'mock_tenant_id', // Or get from authService if applicable
    //   ...data,
    // } as User;
    // return of(newUser).pipe(delay(1000));
    return this.http.post<User>(`${this.apiUrl}/user/${token}/create/`, data); // Assuming a POST endpoint
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    const token = this.authService.getToken();
    // Mock implementation:
    // const updatedUser: User = { id, ...data } as User; // Simplified mock
    // return of(updatedUser).pipe(delay(1000));
    return this.http.put<User>(`${this.apiUrl}/user/${token}/${id}/`, data);
  }

  deleteUser(id: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.apiUrl}/user/${token}/${id}/`);
  }

  updateProfile(data: Partial<User>): Observable<User> {
    const token = this.authService.getToken();
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      throw new Error("No user logged in");
    }
    return this.http.put<User>(
      `${this.apiUrl}/user/${token}/${currentUser.id}/profile/`,
      data
    );
  }
}
