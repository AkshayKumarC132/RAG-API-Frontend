import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Assistant } from '../core/models/assistant.model';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;
  
  getAssistants(): Observable<Assistant[]> {
    const token = this.authService.getToken();
    return this.http.get<Assistant[]>(`${this.apiUrl}/assistant/${token}/list/`);
  }
  
  getAssistant(id: string): Observable<Assistant> {
    const token = this.authService.getToken();
    return this.http.get<Assistant>(`${this.apiUrl}/assistant/${token}/${id}/`);
  }
  
  createAssistant(name: string, vectorStoreId?: string, instructions?: string): Observable<Assistant> {
    const token = this.authService.getToken();
    const payload: any = { name };
    
    if (vectorStoreId) {
      payload.vector_store_id = vectorStoreId;
    }
    
    if (instructions) {
      payload.instructions = instructions;
    }
    
    return this.http.post<Assistant>(`${this.apiUrl}/assistant/${token}/`, payload);
  }
  
  updateAssistant(id: string, name: string, vectorStoreId?: string, instructions?: string): Observable<Assistant> {
    const token = this.authService.getToken();
    const payload: any = { name };
    
    if (vectorStoreId) {
      payload.vector_store_id = vectorStoreId;
    }
    
    if (instructions) {
      payload.instructions = instructions;
    }
    
    return this.http.put<Assistant>(`${this.apiUrl}/assistant/${token}/${id}/`, payload);
  }
  
  deleteAssistant(id: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.apiUrl}/assistant/${token}/${id}/`);
  }
}