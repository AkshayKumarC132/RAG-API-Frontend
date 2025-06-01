import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../services/user.service';

@Component({
  selector: "app-user-detail",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  user$: Observable<User | null> = of(null);
  error: any = null;
  initialLoading: boolean = true;

  ngOnInit(): void {
    this.user$ = this.route.paramMap.pipe(
      tap(() => {
        this.initialLoading = true;
        this.error = null;
      }),
      switchMap(params => {
        const id = params.get('id');
        if (id) {
          return this.userService.getUser(id).pipe(
            catchError(err => {
              if (err.status === 404) {
                this.error = null;
              } else {
                this.error = err.message || 'Failed to load user details.';
                console.error('Error fetching user:', err);
              }
              return of(null);
            })
          );
        } else {
          this.error = 'No User ID provided in the route.';
          return of(null);
        }
      }),
      tap(() => {
        this.initialLoading = false;
      })
    );
  }
}
