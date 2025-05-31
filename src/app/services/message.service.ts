import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message } from '../core/models/message.model';
import { AuthService } from '../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;
  
  createMessage(threadId: string, content: string): Observable<Message> {
    const token = this.authService.getToken();
    return this.http.post<Message>(`${this.apiUrl}/message/${token}/`, {
      thread_id: threadId,
      content: content
    });
  }
}