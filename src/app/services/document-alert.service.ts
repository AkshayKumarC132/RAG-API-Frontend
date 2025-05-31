import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { AuthService } from "../core/services/auth.service";
import { DocumentAlert } from "../core/models/document-alert.model";

@Injectable({
  providedIn: "root",
})
export class DocumentAlertService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  getDocumentAlerts(documentId?: string): Observable<DocumentAlert[]> {
    const token = this.authService.getToken();
    let url = `${this.apiUrl}/document-alert/${token}/list/`;

    if (documentId) {
      url += `?document_id=${documentId}`;
    }

    return this.http.get<DocumentAlert[]>(url);
  }

  getDocumentAlert(id: string): Observable<DocumentAlert> {
    const token = this.authService.getToken();
    return this.http.get<DocumentAlert>(
      `${this.apiUrl}/document-alert/${token}/${id}/`
    );
  }

  deleteDocumentAlert(id: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.apiUrl}/document-alert/${token}/${id}/`);
  }
}
