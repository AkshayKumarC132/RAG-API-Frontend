import { Routes } from '@angular/router';

export const VECTOR_STORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./vector-store-list/vector-store-list.component').then(m => m.VectorStoreListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./vector-store-create/vector-store-create.component').then(m => m.VectorStoreCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./vector-store-detail/vector-store-detail.component').then(m => m.VectorStoreDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./vector-store-edit/vector-store-edit.component').then(m => m.VectorStoreEditComponent)
  },
  {
    path: ':id/documents',
    loadComponent: () => import('./vector-store-document-access/vector-store-document-access.component').then(m => m.VectorStoreDocumentAccessComponent)
  }
];