import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VectorStore } from '../../../core/models/vector-store.model';
import { VectorStoreService } from '../../../services/vector-store.service';

@Component({
  selector: 'app-vector-store-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vector-store-list.component.html',
  styleUrls: ['./vector-store-list.component.scss']
})
export class VectorStoreListComponent implements OnInit {
  private vectorStoreService = inject(VectorStoreService);

  public vectorStores$: Observable<VectorStore[]>;
  public error: any = null;

  ngOnInit(): void {
    this.vectorStores$ = this.vectorStoreService.getVectorStores().pipe(
      catchError(err => {
        this.error = err;
        return [];
      })
    );
  }
}
