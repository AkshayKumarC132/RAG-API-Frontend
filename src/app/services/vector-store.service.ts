import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VectorStore } from '../core/models/vector-store.model';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class VectorStoreService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;
  
  getVectorStores(): Observable<VectorStore[]> {
    const token = this.authService.getToken();
    return this.http.get<VectorStore[]>(`${this.apiUrl}/vector-store/${token}/list/`);
  }
  
  getVectorStore(id: string): Observable<VectorStore> {
    const token = this.authService.getToken();
    return this.http.get<VectorStore>(`${this.apiUrl}/vector-store/${token}/${id}/`);
  }
  
  createVectorStore(name: string): Observable<VectorStore> {
    const token = this.authService.getToken();
    return this.http.post<VectorStore>(`${this.apiUrl}/vector-store/${token}/`, { name });
  }
  
  updateVectorStore(id: string, name: string): Observable<VectorStore> {
    const token = this.authService.getToken();
    return this.http.put<VectorStore>(`${this.apiUrl}/vector-store/${token}/${id}/`, { name });
  }
  
  deleteVectorStore(id: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.apiUrl}/vector-store/${token}/${id}/`);
  }
  
  // Document access management
  addDocumentsToVectorStore(vectorStoreId: string, documentIds: string[]): Observable<any> {
    const token = this.authService.getToken();
    return this.http.post(`${this.apiUrl}/document-access/${token}/`, {
      vector_store_id: vectorStoreId,
      document_ids: documentIds
    });
  }
  
  removeDocumentsFromVectorStore(vectorStoreId: string, documentIds: string[]): Observable<any> {
    const token = this.authService.getToken();
    return this.http.put(`${this.apiUrl}/document-access/remove/${token}/`, {
      vector_store_id: vectorStoreId,
      document_ids: documentIds
    });
  }
  
  getDocumentAccess(vectorStoreId: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.get(`${this.apiUrl}/document-access/${token}/list/?vector_store_id=${vectorStoreId}`);
  }
}