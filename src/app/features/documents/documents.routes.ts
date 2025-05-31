import { Routes } from '@angular/router';

export const DOCUMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./document-list/document-list.component').then(m => m.DocumentListComponent)
  },
  {
    path: 'ingest',
    loadComponent: () => import('./document-ingest/document-ingest.component').then(m => m.DocumentIngestComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./document-detail/document-detail.component').then(m => m.DocumentDetailComponent)
  }
];