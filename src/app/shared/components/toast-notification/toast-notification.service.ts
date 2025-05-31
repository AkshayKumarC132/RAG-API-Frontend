import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  autoClose?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastNotificationService {
  private nextId = 1;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info', autoClose: boolean = true): number {
    const id = this.nextId++;
    const toast: Toast = { id, message, type, autoClose };
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);
    
    if (autoClose) {
      setTimeout(() => this.remove(id), 5000);
    }
    
    return id;
  }

  remove(id: number): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  clear(): void {
    this.toastsSubject.next([]);
  }
}