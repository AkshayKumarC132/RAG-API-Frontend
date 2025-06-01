import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { VectorStore } from '../../../core/models/vector-store.model';
import { VectorStoreService } from '../../../services/vector-store.service';

@Component({
  selector: "app-vector-store-detail",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vector-store-detail.component.html',
  styleUrls: ['./vector-store-detail.component.scss']
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
              if (err.status === 404) {
                this.error = null;
              } else {
                this.error = err.message || 'Failed to load vector store details.';
              }
              console.error('Error fetching vector store:', err);
              return of(null);
            })
          );
        } else {
          this.error = 'No Vector Store ID provided in the route.';
          return of(null);
        }
      })
    );
  }
}
