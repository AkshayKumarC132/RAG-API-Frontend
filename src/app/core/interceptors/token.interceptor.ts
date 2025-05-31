import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export const tokenInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const apiUrl = environment.apiUrl;
  
  // Skip token injection for authentication endpoints
  if (request.url.includes(`${apiUrl}/login`) || request.url.includes(`${apiUrl}/register`)) {
    return next(request);
  }
  
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  
  // If token exists and URL doesn't already contain the token as a path parameter
  if (token && !request.url.includes(`/${token}/`)) {
    // Check if the URL ends with a trailing slash
    const url = request.url.endsWith('/') ? request.url : `${request.url}/`;
    
    // Insert the token before the trailing slash or API endpoint
    const tokenizedUrl = url.replace(apiUrl, `${apiUrl}/${token}`);
    
    // Clone the request with the modified URL
    const tokenizedRequest = request.clone({
      url: tokenizedUrl
    });
    
    return next(tokenizedRequest).pipe(
      catchError(error => {
        if (error.status === 401) {
          localStorage.removeItem('auth_token');
          router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  }
  
  return next(request).pipe(
    catchError(error => {
      if (error.status === 401) {
        localStorage.removeItem('auth_token');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};