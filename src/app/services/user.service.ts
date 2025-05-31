import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../core/models/user.model';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
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
  
  updateUser(id: string, data: { username?: string; email?: string; password?: string }): Observable<User> {
    const token = this.authService.getToken();
    return this.http.put<User>(`${this.apiUrl}/user/${token}/${id}/`, data);
  }
  
  deleteUser(id: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.apiUrl}/user/${token}/${id}/`);
  }
}