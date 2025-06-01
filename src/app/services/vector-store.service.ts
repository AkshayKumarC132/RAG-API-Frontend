import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
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
  
  createVectorStore(data: Partial<VectorStore>): Observable<VectorStore> {
    const token = this.authService.getToken();
    // The actual API might expect an object like { name: 'store name', ...other_props }
    // For now, we'll pass the data directly.
    // If using a mock:
    // const newId = Math.random().toString(36).substring(2, 15);
<<<<<<< HEAD
    // const mockVectorStore: VectorStore = {
    //   id: newId,
    //   name: data.name || 'Unnamed Store',
    //   status: 'creating',
    //   created_at: new Date(),
    //   ...data
=======
    // const mockVectorStore: VectorStore = {
    //   id: newId,
    //   name: data.name || 'Unnamed Store',
    //   status: 'creating',
    //   created_at: new Date(),
    //   ...data
>>>>>>> 6bc18a0bc9f7113f69a45dd53374aed86847735b
    // };
    // return of(mockVectorStore).pipe(delay(1000));
    return this.http.post<VectorStore>(`${this.apiUrl}/vector-store/${token}/`, data);
  }
  
  updateVectorStore(id: string, data: Partial<VectorStore>): Observable<VectorStore> {
    const token = this.authService.getToken();
    // If using a mock:
<<<<<<< HEAD
    // const mockUpdatedStore: VectorStore = {
    //   id: id,
    //   name: data.name || 'Updated Store Name',
    //   status: data.status || 'active', // Assuming status might be updatable
    //   created_at: new Date(), // This might not be accurate for an update, depends on API
    //   ...data
=======
    // const mockUpdatedStore: VectorStore = {
    //   id: id,
    //   name: data.name || 'Updated Store Name',
    //   status: data.status || 'active', // Assuming status might be updatable
    //   created_at: new Date(), // This might not be accurate for an update, depends on API
    //   ...data
>>>>>>> 6bc18a0bc9f7113f69a45dd53374aed86847735b
    // };
    // return of(mockUpdatedStore).pipe(delay(1000));
    return this.http.put<VectorStore>(`${this.apiUrl}/vector-store/${token}/${id}/`, data);
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