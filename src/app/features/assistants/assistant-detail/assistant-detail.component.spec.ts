import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { AssistantDetailComponent } from './assistant-detail.component';
import { AssistantService } from '../../../services/assistant.service';
import { Assistant } from '../../../core/models/assistant.model';
import { CommonModule, DatePipe } from '@angular/common';

describe('AssistantDetailComponent', () => {
  let component: AssistantDetailComponent;
  let fixture: ComponentFixture<AssistantDetailComponent>;
  let mockAssistantService: jasmine.SpyObj<AssistantService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const assistantId = 'asstAbc';
  const mockAssistant: Assistant = {
    id: assistantId,
    name: 'Detailed Assistant',
    vector_store_id: 'vs789',
    vector_store_name: 'Vector Store Detailed',
    instructions: 'Very specific instructions.',
    created_at: new Date().toISOString()
  };

  beforeEach(async () => {
    mockAssistantService = jasmine.createSpyObj('AssistantService', ['getAssistant', 'deleteAssistant']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({ id: assistantId }))
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule,
        HttpClientTestingModule,
        AssistantDetailComponent // Standalone
      ],
      providers: [
        { provide: AssistantService, useValue: mockAssistantService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        DatePipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call getAssistant on init and display assistant details', fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(of({ ...mockAssistant }));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();

      expect(mockAssistantService.getAssistant).toHaveBeenCalledWith(assistantId);
      expect(component.assistant).toEqual(mockAssistant);
      expect(fixture.debugElement.query(By.css('.card-header h3')).nativeElement.textContent).toContain(mockAssistant.name);
      const instructionsPre = fixture.debugElement.query(By.css('pre')).nativeElement;
      expect(instructionsPre.textContent).toContain(mockAssistant.instructions);
    }));

    it('should handle loading state for getAssistant', fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(of({ ...mockAssistant }).pipe(delay(50)));
      fixture.detectChanges();
      expect(component.isLoading).toBeTrue();
      tick(50);
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
    }));

    it('should display error if getAssistant fails', fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(throwError(() => new Error('Fetch failed')));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.error).toContain('Failed to load assistant details');
      expect(fixture.debugElement.query(By.css('.alert-danger'))).toBeTruthy();
    }));

    it('should display error if no assistant ID is in route', fakeAsync(() => {
      mockActivatedRoute.paramMap = of(convertToParamMap({})); // No ID
      // Need to re-run ngOnInit essentially, or re-create component for this test
      fixture = TestBed.createComponent(AssistantDetailComponent);
      component = fixture.componentInstance;

      fixture.detectChanges();
      tick(); // process the empty paramMap
      fixture.detectChanges(); // update view
      expect(component.error).toBe('Assistant ID not found in route.');
    }));
  });

  describe('Delete Assistant', () => {
    beforeEach(fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(of({ ...mockAssistant }));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      spyOn(window, 'confirm').and.returnValue(true); // Auto-confirm
    }));

    it('should call deleteAssistant and navigate to list on success', fakeAsync(() => {
      mockAssistantService.deleteAssistant.and.returnValue(of(null));

      component.deleteAssistant(); // Call directly or trigger button
      tick();

      expect(mockAssistantService.deleteAssistant).toHaveBeenCalledWith(assistantId);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants']);
    }));

    it('should display error if deleteAssistant fails', fakeAsync(() => {
      mockAssistantService.deleteAssistant.and.returnValue(throwError(() => ({ error: { detail: 'Deletion error' } })));
      component.deleteAssistant();
      tick();
      fixture.detectChanges();

      expect(component.error).toContain('Failed to delete assistant. Deletion error');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    }));

    it('should not call deleteAssistant if confirm is false', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      component.deleteAssistant();
      expect(mockAssistantService.deleteAssistant).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      mockAssistantService.getAssistant.and.returnValue(of({ ...mockAssistant }));
      fixture.detectChanges(); tick(); fixture.detectChanges();
    }));

    it('should navigate to edit page', () => {
      component.navigateToEdit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', assistantId, 'edit']);
    });

    it('should navigate to edit page on edit button click', () => {
      const editButton = fixture.debugElement.query(By.css('.btn-warning'));
      editButton.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', assistantId, 'edit']);
    });

    it('should navigate back to list page', () => {
      component.navigateBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants']);
    });

    it('should navigate back on "Back to List" button click', () => {
      const backButton = fixture.debugElement.query(By.css('.btn-outline-secondary'));
      backButton.triggerEventHandler('click', null);
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
