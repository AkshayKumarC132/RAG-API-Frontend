import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { ApiKeyCreateComponent } from './api-key-create.component';
import { OpenAIKeyService } from '../../../services/openai-key.service';
import { CreateOpenAIKeyRequest, OpenAIKey } from '../../../core/models/openai-key.model';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

describe('ApiKeyCreateComponent', () => {
  let component: ApiKeyCreateComponent;
  let fixture: ComponentFixture<ApiKeyCreateComponent>;
  let mockOpenAIKeyService: jasmine.SpyObj<OpenAIKeyService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockCreatedApiKey: OpenAIKey = {
    id: 'newKey123',
    name: 'My New Key',
    masked_key: 'sk-...new',
    created_at: new Date().toISOString(),
    is_valid: true,
    api_key: 'sk-realNewKey'
  };

  beforeEach(async () => {
    mockOpenAIKeyService = jasmine.createSpyObj('OpenAIKeyService', ['createAPIKey']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        // RouterTestingModule, // RouterTestingModule.withRoutes([]) if you have routes in this component's direct template
        HttpClientTestingModule,
        ApiKeyCreateComponent // Import the standalone component
      ],
      providers: [
        { provide: OpenAIKeyService, useValue: mockOpenAIKeyService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApiKeyCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Initial binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Submission and Creation', () => {
    it('should call createAPIKey with correct data and navigate on success', fakeAsync(() => {
      mockOpenAIKeyService.createAPIKey.and.returnValue(of(mockCreatedApiKey));

      component.apiKeyString = 'sk-test1234567890123456789012345678901234567890';
      component.apiKeyName = 'Test Key';
      fixture.detectChanges(); // Update ngModel bindings

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick(); // Resolve createAPIKey observable

      const expectedRequest: CreateOpenAIKeyRequest = {
        api_key: 'sk-test1234567890123456789012345678901234567890',
        name: 'Test Key'
      };
      expect(mockOpenAIKeyService.createAPIKey).toHaveBeenCalledWith(expectedRequest);
      expect(component.isLoading).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/api-keys']);
    }));

    it('should call createAPIKey with undefined name if apiKeyName is empty', fakeAsync(() => {
      mockOpenAIKeyService.createAPIKey.and.returnValue(of(mockCreatedApiKey));

      component.apiKeyString = 'sk-test1234567890123456789012345678901234567890';
      component.apiKeyName = ''; // Empty name
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick();

      const expectedRequest: CreateOpenAIKeyRequest = {
        api_key: 'sk-test1234567890123456789012345678901234567890',
        name: undefined
      };
      expect(mockOpenAIKeyService.createAPIKey).toHaveBeenCalledWith(expectedRequest);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/api-keys']);
    }));


    it('should handle loading state during createAPIKey', fakeAsync(() => {
      mockOpenAIKeyService.createAPIKey.and.returnValue(of(mockCreatedApiKey).pipe(delay(100))); // Add delay

      component.apiKeyString = 'sk-validkey1234567890123456789012345678901234567890';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      fixture.detectChanges(); // Reflect isLoading = true

      expect(component.isLoading).toBeTrue();
      const loadingDiv = fixture.debugElement.query(By.css('.alert-info'));
      expect(loadingDiv.nativeElement.textContent).toContain('Creating API key...');

      tick(100); // Advance time for the delay
      fixture.detectChanges(); // Reflect isLoading = false
      expect(component.isLoading).toBeFalse();
    }));


    it('should not call createAPIKey if apiKeyString is empty and display error', () => {
      component.apiKeyString = '';
      component.apiKeyName = 'Test';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      // No tick needed as it's a synchronous check

      expect(mockOpenAIKeyService.createAPIKey).not.toHaveBeenCalled();
      expect(component.error).toBe('API key string is required.');
      fixture.detectChanges(); // Update view with error
      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv.nativeElement.textContent).toContain('API key string is required.');
    });

    it('should disable submit button when form is invalid or loading', fakeAsync(() => {
        // Initial state (invalid due to empty key)
        fixture.detectChanges();
        let submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(submitButton.disabled).toBeTrue();

        // Valid form
        component.apiKeyString = 'sk-validkey1234567890123456789012345678901234567890';
        fixture.detectChanges();
        submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(submitButton.disabled).toBeFalse();

        // Loading state
        mockOpenAIKeyService.createAPIKey.and.returnValue(of(mockCreatedApiKey));
        component.createApiKey(); // This will set isLoading = true
        fixture.detectChanges();
        submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(submitButton.disabled).toBeTrue();

        tick(); // complete observable
    }));
  });

  describe('Error Handling for createAPIKey', () => {
    it('should display error message if createAPIKey fails with a detail message', fakeAsync(() => {
      const errorResponse = { error: { detail: 'Backend validation failed.' } };
      mockOpenAIKeyService.createAPIKey.and.returnValue(throwError(() => errorResponse));

      component.apiKeyString = 'sk-validkey1234567890123456789012345678901234567890';
      component.apiKeyName = 'Error Key';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick();
      fixture.detectChanges();

      expect(mockOpenAIKeyService.createAPIKey).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
      expect(component.error).toContain('Backend validation failed.');
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv.nativeElement.textContent).toContain('Backend validation failed.');
    }));

    it('should display generic error message if createAPIKey fails without detail', fakeAsync(() => {
      mockOpenAIKeyService.createAPIKey.and.returnValue(throwError(() => new Error('Network Error')));

      component.apiKeyString = 'sk-validkey1234567890123456789012345678901234567890';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('Failed to create API key. Please ensure the key is valid and not a duplicate.');
    }));
  });
});

// Helper function for Observables that need a delay
function delay(ms: number) {
  return (source: any) => new Observable(observer => {
    setTimeout(() => {
      source.subscribe({
        next: (value: any) => observer.next(value),
        error: (err: any) => observer.error(err),
        complete: () => observer.complete(),
      });
    }, ms);
  });
}
