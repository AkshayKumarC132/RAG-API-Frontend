import { Routes } from '@angular/router';

export const API_KEYS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./api-key-list/api-key-list.component').then(m => m.ApiKeyListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./api-key-create/api-key-create.component').then(m => m.ApiKeyCreateComponent)
  }
];