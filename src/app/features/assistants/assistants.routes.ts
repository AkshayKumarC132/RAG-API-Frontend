import { Routes } from '@angular/router';

export const ASSISTANTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./assistant-list/assistant-list.component').then(m => m.AssistantListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./assistant-create/assistant-create.component').then(m => m.AssistantCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./assistant-detail/assistant-detail.component').then(m => m.AssistantDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./assistant-edit/assistant-edit.component').then(m => m.AssistantEditComponent)
  }
];