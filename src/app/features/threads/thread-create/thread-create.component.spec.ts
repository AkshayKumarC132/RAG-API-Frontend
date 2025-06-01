import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { ThreadCreateComponent } from './thread-create.component';
import { ThreadService } from '../../../services/thread.service';
import { Thread } from '../../../core/models/thread.model';
import { CommonModule } from '@angular/common';

describe('ThreadCreateComponent', () => {
  let component: ThreadCreateComponent;
  let fixture: ComponentFixture<ThreadCreateComponent>;
  let mockThreadService: jasmine.SpyObj<ThreadService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockCreatedThread: Thread = {
    id: 'threadNew123',
    vector_store_id_read: 'vs1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(async () => {
    mockThreadService = jasmine.createSpyObj('ThreadService', ['createThread']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        ThreadCreateComponent // Standalone
      ],
      providers: [
        { provide: ThreadService, useValue: mockThreadService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThreadCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Submission and Creation', () => {
    it('should call createThread with vector_store_id and navigate on success', fakeAsync(() => {
      mockThreadService.createThread.and.returnValue(of(mockCreatedThread));

      component.vectorStoreId = 'vs1';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick(); // Resolve createThread observable

      expect(mockThreadService.createThread).toHaveBeenCalledWith('vs1');
      expect(component.isLoading).toBeFalse();
      expect(component.successMessage).toBe('Thread created successfully!');

      tick(1500); // For the setTimeout before navigation
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/threads', mockCreatedThread.id, 'chat']);
    }));

    it('should handle loading state during createThread', fakeAsync(() => {
      mockThreadService.createThread.and.returnValue(of(mockCreatedThread).pipe(delay(100)));
      component.vectorStoreId = 'vs1';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      fixture.detectChanges();

      expect(component.isLoading).toBeTrue();
      const loadingDiv = fixture.debugElement.query(By.css('.alert-info'));
      expect(loadingDiv.nativeElement.textContent).toContain('Creating thread...');

      tick(100);
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
      tick(1500); // navigation timeout
    }));

    it('should not call createThread if vectorStoreId is empty and display error', () => {
      component.vectorStoreId = '  '; // Whitespace
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      expect(mockThreadService.createThread).not.toHaveBeenCalled();
      expect(component.error).toBe('Vector Store ID is required to create a thread.');
      fixture.detectChanges();
      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv.nativeElement.textContent).toContain('Vector Store ID is required');
    });

    it('should disable submit button when form is invalid or loading', fakeAsync(() => {
        component.vectorStoreId = ''; // Invalid state (required)
        fixture.detectChanges();
        let submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(submitButton.disabled).toBeTrue();

        component.vectorStoreId = 'valid-vs-id';
        fixture.detectChanges();
        submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(submitButton.disabled).toBeFalse();

        mockThreadService.createThread.and.returnValue(of(mockCreatedThread));
        component.onSubmit();
        fixture.detectChanges();
        submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(submitButton.disabled).toBeTrue(); // isLoading is true

        tick(); // complete observable
        tick(1500); // navigation timeout
    }));
  });

  describe('Error Handling for createThread', () => {
    it('should display error message if createThread fails with detail', fakeAsync(() => {
      const errorResponse = { error: { detail: 'VS not found.' } };
      mockThreadService.createThread.and.returnValue(throwError(() => errorResponse));

      component.vectorStoreId = 'invalid-vs';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick();
      fixture.detectChanges();

      expect(mockThreadService.createThread).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
      expect(component.error).toContain('VS not found.');
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv.nativeElement.textContent).toContain('VS not found.');
    }));

    it('should display generic error if createThread fails without detail or message', fakeAsync(() => {
      mockThreadService.createThread.and.returnValue(throwError(() => ({}))); // Empty error
      component.vectorStoreId = 'vs-error';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('Failed to create thread. Please try again.');
    }));
  });

  describe('Navigation', () => {
    it('should navigate back to threads list', () => {
      component.navigateBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/threads']);
    });

    it('should navigate back on button click', () => {
      const backButton = fixture.debugElement.query(By.css('.btn-outline-secondary'));
      backButton.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/threads']);
    });
  });
});

// Helper for delay in observable pipe if needed
import { Observable } from 'rxjs';
import { delay as rxDelay } from 'rxjs/operators';

function delay<T>(ms: number): (source: Observable<T>) => Observable<T> {
  return rxDelay(ms);
}
