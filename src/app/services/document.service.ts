import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Document, DocumentStatus } from '../core/models/document.model';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;
  
  getDocuments(vectorStoreId?: string): Observable<Document[]> {
    const token = this.authService.getToken();
    let url = `${this.apiUrl}/document/${token}/list/`;
    
    if (vectorStoreId) {
      url += `?vector_store_id=${vectorStoreId}`;
    }
    
    return this.http.get<Document[]>(url);
  }
  
  getDocument(id: string): Observable<Document> {
    const token = this.authService.getToken();
    return this.http.get<Document>(`${this.apiUrl}/document/${token}/${id}/`);
  }
  
  deleteDocument(id: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.apiUrl}/document/${token}/${id}/`);
  }
  
  checkDocumentStatus(id: string): Observable<DocumentStatus> {
    const token = this.authService.getToken();
    return this.http.get<DocumentStatus>(`${this.apiUrl}/document/${token}/${id}/status/`);
  }
  
  ingestDocument(vectorStoreId: string, file?: File, s3Url?: string): Observable<any> {
    const token = this.authService.getToken();
    const url = `${this.apiUrl}/document/${token}/ingest/`;
    
    if (file) {
      // Handle file upload
      const formData = new FormData();
      formData.append('vector_store_id', vectorStoreId);
      formData.append('file', file);
      
      return this.http.post(url, formData);
    } else if (s3Url) {
      // Handle S3 URL
      return this.http.post(url, {
        vector_store_id: vectorStoreId,
        s3_file_url: s3Url
      });
    }
    
    throw new Error('Either file or S3 URL must be provided');
  }
}