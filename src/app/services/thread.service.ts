import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { Thread } from "../core/models/thread.model";
import { Message } from "../core/models/message.model";
import { AuthService } from "../core/services/auth.service";

@Injectable({
  providedIn: "root",
})
export class ThreadService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  getThreads(): Observable<Thread[]> {
    const token = this.authService.getToken();
    return this.http.get<Thread[]>(`${this.apiUrl}/thread/${token}/list/`);
  }

  getThread(id: string): Observable<Thread> {
    const token = this.authService.getToken();
    return this.http.get<Thread>(`${this.apiUrl}/thread/${token}/${id}/`);
  }

  createThread(vectorStoreId: string): Observable<Thread> {
    const token = this.authService.getToken();
    return this.http.post<Thread>(`${this.apiUrl}/thread/${token}/`, {
      vector_store_id: vectorStoreId,
    });
  }

  updateThread(id: string, vectorStoreId: string): Observable<Thread> {
    const token = this.authService.getToken();
    return this.http.put<Thread>(`${this.apiUrl}/thread/${token}/${id}/`, {
      vector_store_id: vectorStoreId,
    });
  }

  deleteThread(id: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.delete(`${this.apiUrl}/thread/${token}/${id}/`);
  }

  getMessages(threadId: string): Observable<Message[]> {
    const token = this.authService.getToken();
    return this.http.get<Message[]>(
      `${this.apiUrl}/thread/${token}/${threadId}/messages/`
    );
  }

  createRun(threadId: string, assistantId: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.post<any>(`${this.apiUrl}/run/${token}/`, {
      thread_id: threadId,
      assistant_id: assistantId,
    });
  }

  getRunStatus(threadId: string): Observable<any> {
    const token = this.authService.getToken();
    return this.http.get<any>(`${this.apiUrl}/run/${token}/list/`);
  }
}
