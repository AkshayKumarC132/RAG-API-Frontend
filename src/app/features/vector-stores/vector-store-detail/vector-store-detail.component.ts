import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { VectorStore } from '../../../core/models/vector-store.model';
import { VectorStoreService } from '../../../services/vector-store.service';

@Component({
  selector: 'app-vector-store-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-4">
      <ng-container *ngIf="vectorStore$ | async as vs; else loadingOrError">
        <div *ngIf="vs; else notFound">
          <h1 class="text-2xl font-bold mb-4">Vector Store Details: {{ vs.name }}</h1>
          <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
              <div>
                <dt class="text-sm font-medium text-gray-500">ID</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ vs.id }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Name</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ vs.name }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Status</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ vs.status }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Created At</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ vs.created_at | date:'medium' }}</dd>
              </div>
            </dl>
          </div>
          <div class="mt-6">
            <a [routerLink]="['/vector-stores', vs.id, 'edit']" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
              Edit
            </a>
            <a routerLink="/vector-stores" class="text-blue-500 hover:text-blue-800">
              Back to List
            </a>
          </div>
        </div>
      </ng-container>

      <ng-template #loadingOrError>
        <div *ngIf="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong class="font-bold">Error:</strong>
          <span class="block sm:inline">{{ error }}</span>
          <div class="mt-2">
             <a routerLink="/vector-stores" class="text-red-700 hover:text-red-900 font-semibold">Back to List</a>
          </div>
        </div>
        <div *ngIf="!error && !(vectorStore$ | async)" class="text-gray-700"> <!-- Check async pipe directly for loading -->
          <p>Loading vector store details...</p>
        </div>
      </ng-template>

      <ng-template #notFound>
         <div *ngIf="!(vectorStore$ | async) && !error"> <!-- Ensure this only shows if not loading and no error -->
            <h1 class="text-xl font-semibold mb-4">Vector Store Not Found</h1>
            <p class="text-gray-600 mb-4">The requested vector store could not be found.</p>
            <a routerLink="/vector-stores" class="text-blue-500 hover:text-blue-800">
              Back to List
            </a>
        </div>
      </ng-template>
    </div>
  `,
})
export class VectorStoreDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private vectorStoreService = inject(VectorStoreService);

  vectorStore$: Observable<VectorStore | null>;
  error: any = null;

  ngOnInit(): void {
    this.vectorStore$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          this.error = null; // Reset error before new fetch
          return this.vectorStoreService.getVectorStore(id).pipe(
            catchError(err => {
              // Consider checking err.status here if you want to specifically handle 404
              if (err.status === 404) {
                this.error = null; // No error message for not found, template will handle it
              } else {
                this.error = err.message || 'Failed to load vector store details.';
              }
              console.error('Error fetching vector store:', err);
              return of(null); // Emit null in case of error
            })
          );
        } else {
          this.error = 'No Vector Store ID provided in the route.';
          return of(null); // No ID, so return null
        }
      })
    );
  }
}
