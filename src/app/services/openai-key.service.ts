import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OpenAIKey } from '../core/models/openai-key.model';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OpenAIKeyService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;
  
  getAPIKeys(): Observable<OpenAIKey[]> {
    const token = this.authService.getToken();
    return this.http.get<OpenAIKey[]>(`${this.apiUrl}/openai-key/${token}/list/`);
  }
  
  getAPIKey(id: string): Observable<OpenAIKey> {
    const token = this.authService.getToken();
    return this.http.get<OpenAIKey>(`${this.apiUrl}/openai-key/${token}/${id}/`);
  }
  
  createAPIKey(key: string): Observable<OpenAIKey> {
    const token = this.authService.getToken();
    return this.http.post<OpenAIKey>(`${this.apiUrl}/openai-key/${token}/`, { key });
  }
  
  deleteAPIKey(id: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.apiUrl}/openai-key/${token}/${id}/`);
  }
}