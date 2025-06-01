import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Users</h1>

      <div *ngIf="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ error }}</span>
      </div>

      <div class="mb-4">
        <a routerLink="/users/create" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create New User
        </a>
      </div>

      <ng-container *ngIf="users$ | async as users; else loading">
        <div *ngIf="users.length > 0; else emptyState" class="overflow-x-auto bg-white shadow-md rounded">
          <table class="min-w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th class="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr *ngFor="let user of users" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">{{ user.username }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ user.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ user.role }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ user.created_at | date:'short' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a [routerLink]="['/users', user.id]" class="text-indigo-600 hover:text-indigo-900 mr-3">Details</a>
                  <a [routerLink]="['/users', user.id, 'edit']" class="text-green-600 hover:text-green-900">Edit</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #emptyState>
          <p class="text-gray-700">No users found.</p>
        </ng-template>
      </ng-container>

      <ng-template #loading>
        <p *ngIf="!error">Loading users...</p> <!-- Show loading only if no error -->
      </ng-template>
    </div>
  `,
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
        return of([]); // Return empty array on error to let the UI render an empty state or error message
      })
    );
  }
}
