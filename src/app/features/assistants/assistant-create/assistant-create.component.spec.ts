import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { AssistantCreateComponent } from './assistant-create.component';
import { AssistantService } from '../../../services/assistant.service';
import { Assistant } from '../../../core/models/assistant.model';
import { CommonModule } from '@angular/common';

describe('AssistantCreateComponent', () => {
  let component: AssistantCreateComponent;
  let fixture: ComponentFixture<AssistantCreateComponent>;
  let mockAssistantService: jasmine.SpyObj<AssistantService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockCreatedAssistant: Assistant = {
    id: 'asstNew',
    name: 'New Assistant',
    vector_store_id: 'vs1',
    instructions: 'Instructions here',
    created_at: new Date().toISOString()
  };

  beforeEach(async () => {
    mockAssistantService = jasmine.createSpyObj('AssistantService', ['createAssistant']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        AssistantCreateComponent // Standalone
      ],
      providers: [
        { provide: AssistantService, useValue: mockAssistantService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Initial data binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Submission and Creation', () => {
    it('should call createAssistant with correct data and navigate on success', fakeAsync(() => {
      mockAssistantService.createAssistant.and.returnValue(of(mockCreatedAssistant));

      component.assistantForm = {
        name: 'New Assistant',
        vector_store_id: 'vs1',
        instructions: 'Instructions here'
      };
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick(); // Resolve createAssistant observable

      expect(mockAssistantService.createAssistant).toHaveBeenCalledWith('New Assistant', 'vs1', 'Instructions here');
      expect(component.isLoading).toBeFalse();
      expect(component.successMessage).toBe('Assistant created successfully!');

      tick(1500); // For the setTimeout before navigation
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', mockCreatedAssistant.id]);
    }));

    it('should call createAssistant with undefined for optional fields if empty', fakeAsync(() => {
      const minimalAssistant: Assistant = { ...mockCreatedAssistant, vector_store_id: undefined, instructions: undefined };
      mockAssistantService.createAssistant.and.returnValue(of(minimalAssistant));

      component.assistantForm = { name: 'New Assistant', vector_store_id: '  ', instructions: '      ' }; // whitespace
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick();

      expect(mockAssistantService.createAssistant).toHaveBeenCalledWith('New Assistant', undefined, undefined);
      tick(1500);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', minimalAssistant.id]);
    }));

    it('should handle loading state during createAssistant', fakeAsync(() => {
      mockAssistantService.createAssistant.and.returnValue(of(mockCreatedAssistant).pipe(delay(100))); // Add delay
      component.assistantForm = { name: 'Test' };
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      fixture.detectChanges();

      expect(component.isLoading).toBeTrue();
      const loadingDiv = fixture.debugElement.query(By.css('.alert-info'));
      expect(loadingDiv.nativeElement.textContent).toContain('Creating assistant...');

      tick(100);
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
      tick(1500); // navigation timeout
    }));

    it('should not call createAssistant if name is empty and display error', () => {
      component.assistantForm.name = '';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);

      expect(mockAssistantService.createAssistant).not.toHaveBeenCalled();
      expect(component.error).toBe('Assistant name is required.');
      fixture.detectChanges();
      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv.nativeElement.textContent).toContain('Assistant name is required.');
    });

    it('should disable submit button when form is invalid (e.g. name empty) or loading', fakeAsync(() => {
        component.assistantForm.name = ''; // Invalid state
        fixture.detectChanges();
        let submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(submitButton.disabled).toBeTrue(); // Due to required name

        component.assistantForm.name = 'Valid Name';
        fixture.detectChanges();
        submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(submitButton.disabled).toBeFalse();

        mockAssistantService.createAssistant.and.returnValue(of(mockCreatedAssistant));
        component.onSubmit();
        fixture.detectChanges();
        submitButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(submitButton.disabled).toBeTrue(); // isLoading is true

        tick(); // complete observable
        tick(1500); // navigation timeout
    }));
  });

  describe('Error Handling for createAssistant', () => {
    it('should display error message if createAssistant fails with detail', fakeAsync(() => {
      const errorResponse = { error: { detail: 'Backend creation failed.' } };
      mockAssistantService.createAssistant.and.returnValue(throwError(() => errorResponse));

      component.assistantForm = { name: 'Error Key' };
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick();
      fixture.detectChanges();

      expect(mockAssistantService.createAssistant).toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
      expect(component.error).toContain('Backend creation failed.');
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv.nativeElement.textContent).toContain('Backend creation failed.');
    }));

    it('should display generic error if createAssistant fails without detail or message', fakeAsync(() => {
      mockAssistantService.createAssistant.and.returnValue(throwError(() => ({}))); // Empty error
      component.assistantForm = { name: 'Error Key' };
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('Failed to create assistant. Please try again.');
    }));
  });

  describe('Navigation', () => {
    it('should navigate back to assistants list', () => {
      component.navigateBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants']);
    });

    it('should navigate back on button click', () => {
      const backButton = fixture.debugElement.query(By.css('.btn-outline-secondary'));
      backButton.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants']);
    });
  });
});

// Helper for delay in observable pipe if needed
import { Observable } from 'rxjs';
import { delay as rxDelay } from 'rxjs/operators';

function delay<T>(ms: number): (source: Observable<T>) => Observable<T> {
  return rxDelay(ms);
}
