import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VectorStore } from '../../../core/models/vector-store.model';
import { VectorStoreService } from '../../../services/vector-store.service';
import { LoadingSpinnerComponent } from 'src/app/shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-vector-store-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vector-store-list.component.html',
  styleUrls: ['./vector-store-list.component.scss']
})
export class VectorStoreListComponent implements OnInit {
  private vectorStoreService = inject(VectorStoreService);

  public vectorStores$: Observable<VectorStore[]> = of([]);
  public error: any = null;

  ngOnInit(): void {
    this.vectorStores$ = this.vectorStoreService.getVectorStores().pipe(
      catchError(err => {
        this.error = err;
        return of([]); // Ensure catchError also returns an Observable
      })
    );
  }
  deleteVectorStore(vectorStoreId: string): void {
    this.vectorStoreService.deleteVectorStore(vectorStoreId).subscribe({
      next: () => {
        // Optionally, show a loading spinner here if you have a service for it
        // For now, just refresh the list or handle the UI update here
        this.vectorStores$ = this.vectorStoreService.getVectorStores();
      },
      error: (err) => {
        this.error = err; // Handle error appropriately
      }
    });
  }
}
