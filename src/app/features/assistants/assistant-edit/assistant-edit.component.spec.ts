import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { AssistantEditComponent } from './assistant-edit.component';
import { AssistantService } from '../../../services/assistant.service';
import { Assistant } from '../../../core/models/assistant.model';
import { CommonModule } from '@angular/common';

describe('AssistantEditComponent', () => {
  let component: AssistantEditComponent;
  let fixture: ComponentFixture<AssistantEditComponent>;
  let mockAssistantService: jasmine.SpyObj<AssistantService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const assistantId = 'asstEdit123';
  const initialAssistantData: Assistant = {
    id: assistantId,
    name: 'Initial Name',
    vector_store_id: 'vsInitial',
    instructions: 'Initial instructions',
    created_at: new Date().toISOString()
  };
  const updatedAssistantData: Assistant = {
    ...initialAssistantData,
    name: 'Updated Name',
    instructions: 'Updated instructions'
  };

  beforeEach(async () => {
    mockAssistantService = jasmine.createSpyObj('AssistantService', ['getAssistant', 'updateAssistant']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({ id: assistantId }))
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        AssistantEditComponent // Standalone
      ],
      providers: [
        { provide: AssistantService, useValue: mockAssistantService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantEditComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization and Form Pre-filling', () => {
    it('should call getAssistant and pre-fill the form', fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(of({ ...initialAssistantData }));
      fixture.detectChanges(); // ngOnInit
      tick(); // Resolve getAssistant
      fixture.detectChanges(); // Update form with data

      expect(mockAssistantService.getAssistant).toHaveBeenCalledWith(assistantId);
      expect(component.originalAssistant).toEqual(initialAssistantData);
      expect(component.assistantForm.name).toBe(initialAssistantData.name);
      expect(component.assistantForm.vector_store_id).toBe(initialAssistantData.vector_store_id);
      expect(component.assistantForm.instructions).toBe(initialAssistantData.instructions);
    }));

    it('should handle loading state during initial data fetch', fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(of({ ...initialAssistantData }).pipe(delay(50)));
      fixture.detectChanges(); // ngOnInit
      expect(component.isLoading).toBeTrue(); // Initial loading for page
      tick(50);
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
    }));

    it('should display error if getAssistant fails during init', fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(throwError(() => new Error('Fetch failed')));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();

      expect(component.error).toContain('Failed to load assistant data.');
      expect(fixture.debugElement.query(By.css('.alert-danger'))).toBeTruthy();
    }));

    it('should display error if no assistant ID in route', fakeAsync(() => {
      mockActivatedRoute.paramMap = of(convertToParamMap({})); // No ID
      fixture = TestBed.createComponent(AssistantEditComponent); // Recreate for this specific route setup
      component = fixture.componentInstance;
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();
      expect(component.error).toBe('Assistant ID not found in route.');
    }));
  });

  describe('Form Submission and Update', () => {
    beforeEach(fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(of({ ...initialAssistantData }));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();
    }));

    it('should call updateAssistant with correct data and navigate on success', fakeAsync(() => {
      mockAssistantService.updateAssistant.and.returnValue(of(updatedAssistantData));

      component.assistantForm.name = 'Updated Name';
      component.assistantForm.instructions = 'Updated instructions';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick(); // Resolve updateAssistant

      expect(mockAssistantService.updateAssistant).toHaveBeenCalledWith(
        assistantId,
        'Updated Name',
        initialAssistantData.vector_store_id, // Assuming vs_id not changed in this test
        'Updated instructions'
      );
      expect(component.isSaving).toBeFalse();
      expect(component.successMessage).toBe('Assistant updated successfully!');

      tick(1500); // For setTimeout before navigation
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', assistantId]);
    }));

    it('should handle saving state during updateAssistant', fakeAsync(() => {
        mockAssistantService.updateAssistant.and.returnValue(of(updatedAssistantData).pipe(delay(100)));
        component.assistantForm.name = "New Name";
        fixture.detectChanges();

        const form = fixture.debugElement.query(By.css('form'));
        form.triggerEventHandler('ngSubmit', null);
        fixture.detectChanges();

        expect(component.isSaving).toBeTrue();
        const savingAlert = fixture.debugElement.query(By.css('.alert-info'));
        expect(savingAlert.nativeElement.textContent).toContain('Saving changes...');

        tick(100);
        fixture.detectChanges();
        expect(component.isSaving).toBeFalse();
        tick(1500); // Navigation timeout
    }));

    it('should not call updateAssistant if name is empty and show error', () => {
        component.assistantForm.name = '';
        fixture.detectChanges();

        const form = fixture.debugElement.query(By.css('form'));
        form.triggerEventHandler('ngSubmit', null);

        expect(mockAssistantService.updateAssistant).not.toHaveBeenCalled();
        expect(component.error).toBe('Assistant name is required.');
    });
  });

  describe('Error Handling for updateAssistant', () => {
    beforeEach(fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(of({ ...initialAssistantData }));
      fixture.detectChanges(); tick(); fixture.detectChanges();
    }));

    it('should display error if updateAssistant fails', fakeAsync(() => {
      mockAssistantService.updateAssistant.and.returnValue(throwError(() => ({ error: { detail: 'Update error' } })));
      component.assistantForm.name = 'Attempt Update';
      fixture.detectChanges();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('ngSubmit', null);
      tick();
      fixture.detectChanges();

      expect(component.isSaving).toBeFalse();
      expect(component.error).toContain('Failed to update assistant. Update error');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    }));
  });

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(of({ ...initialAssistantData }));
      fixture.detectChanges(); tick(); fixture.detectChanges();
    }));

    it('should navigate back to assistant detail page', () => {
      component.navigateBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', assistantId]);
    });

    it('should navigate back to list if assistantId is somehow null', () => {
      component.assistantId = null; // Simulate missing ID
      component.navigateBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants']);
    });
  });
});

// Helper for delay
import { Observable } from 'rxjs';
import { delay as rxDelay } from 'rxjs/operators';

function delay<T>(ms: number): (source: Observable<T>) => Observable<T> {
  return rxDelay(ms);
}
