import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Run } from '../core/models/run.model';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RunService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;
  
  createRun(threadId: string, assistantId: string): Observable<Run> {
    const token = this.authService.getToken();
    return this.http.post<Run>(`${this.apiUrl}/run/${token}/`, {
      thread_id: threadId,
      assistant_id: assistantId
    });
  }
  
  getRun(id: string): Observable<Run> {
    const token = this.authService.getToken();
    return this.http.get<Run>(`${this.apiUrl}/run/${token}/${id}/`);
  }
}