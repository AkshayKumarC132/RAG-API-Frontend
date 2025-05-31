import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'documents',
        loadChildren: () => import('./features/documents/documents.routes').then(m => m.DOCUMENTS_ROUTES)
      },
      {
        path: 'vector-stores',
        loadChildren: () => import('./features/vector-stores/vector-stores.routes').then(m => m.VECTOR_STORES_ROUTES)
      },
      {
        path: 'assistants',
        loadChildren: () => import('./features/assistants/assistants.routes').then(m => m.ASSISTANTS_ROUTES)
      },
      {
        path: 'threads',
        loadChildren: () => import('./features/threads/threads.routes').then(m => m.THREADS_ROUTES)
      },
      {
        path: 'alerts',
        loadChildren: () => import('./features/alerts/alerts.routes').then(m => m.ALERTS_ROUTES)
      },
      {
        path: 'api-keys',
        loadChildren: () => import('./features/api-keys/api-keys.routes').then(m => m.API_KEYS_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];