import { Routes } from '@angular/router';

export const THREADS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./thread-list/thread-list.component').then(m => m.ThreadListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./thread-create/thread-create.component').then(m => m.ThreadCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./thread-chat/thread-chat.component').then(m => m.ThreadChatComponent)
  }
];