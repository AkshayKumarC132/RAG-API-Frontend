import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../services/user.service';

@Component({
  selector: "app-user-list",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);

  users$: Observable<User[]>;
  error: any = null;

  ngOnInit(): void {
    this.users$ = this.userService.getUsers().pipe(
      catchError(err => {
        this.error = err.message || 'Could not load users.';
        console.error('Error fetching users:', err);
        return of([]);
      })
    );
  }
}
