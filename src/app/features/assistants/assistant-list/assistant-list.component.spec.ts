import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { AssistantListComponent } from './assistant-list.component';
import { AssistantService } from '../../../services/assistant.service';
import { Assistant } from '../../../core/models/assistant.model';
import { CommonModule } from '@angular/common';

describe('AssistantListComponent', () => {
  let component: AssistantListComponent;
  let fixture: ComponentFixture<AssistantListComponent>;
  let mockAssistantService: jasmine.SpyObj<AssistantService>;
  let mockRouter: Router;

  const mockAssistants: Assistant[] = [
    { id: 'asst1', name: 'Assistant Alpha', vector_store_id: 'vs1', instructions: 'Alpha instructions', created_at: new Date().toISOString() },
    { id: 'asst2', name: 'Assistant Beta', vector_store_name: 'Beta Store', instructions: 'Beta instructions', created_at: new Date().toISOString() },
  ];

  beforeEach(async () => {
    mockAssistantService = jasmine.createSpyObj('AssistantService', ['getAssistants', 'deleteAssistant']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule,
        AssistantListComponent // Standalone
      ],
      providers: [
        { provide: AssistantService, useValue: mockAssistantService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantListComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate').and.stub();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call getAssistants on init and display assistants', fakeAsync(() => {
      mockAssistantService.getAssistants.and.returnValue(of([...mockAssistants]));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();

      expect(mockAssistantService.getAssistants).toHaveBeenCalled();
      expect(component.assistants.length).toBe(2);
      const tableRows = fixture.debugElement.queryAll(By.css('table tbody tr'));
      expect(tableRows.length).toBe(2);
      expect(tableRows[0].nativeElement.cells[0].textContent).toContain('Assistant Alpha');
    }));

    it('should handle loading state correctly', fakeAsync(() => {
      mockAssistantService.getAssistants.and.returnValue(of([...mockAssistants]));
      fixture.detectChanges();
      expect(component.isLoading).toBeTrue();
      const loadingDiv = fixture.debugElement.query(By.css('.alert-info'));
      expect(loadingDiv).toBeTruthy();

      tick();
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
      const loadingDivAfter = fixture.debugElement.query(By.css('.alert-info'));
      expect(loadingDivAfter).toBeNull();
    }));

    it('should display error message if getAssistants fails', fakeAsync(() => {
      mockAssistantService.getAssistants.and.returnValue(throwError(() => new Error('Fetch failed')));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('Failed to load assistants. Please try again later.');
      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv.nativeElement.textContent).toContain('Failed to load assistants.');
    }));

    it('should show "No assistants found" message when array is empty', fakeAsync(() => {
      mockAssistantService.getAssistants.and.returnValue(of([]));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const noMessage = fixture.debugElement.query(By.css('.alert-secondary'));
      expect(noMessage.nativeElement.textContent).toContain('No assistants found.');
    }));
  });

  describe('Delete Assistant', () => {
    beforeEach(fakeAsync(() => {
      mockAssistantService.getAssistants.and.returnValue(of([...mockAssistants]));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      spyOn(window, 'confirm').and.returnValue(true); // Auto-confirm dialogs
    }));

    it('should call deleteAssistant and remove from list on success', fakeAsync(() => {
      const asstToDelete = mockAssistants[0];
      mockAssistantService.deleteAssistant.and.returnValue(of(null));

      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', { stopPropagation: () => {} });
      tick();
      fixture.detectChanges();

      expect(mockAssistantService.deleteAssistant).toHaveBeenCalledWith(asstToDelete.id);
      expect(component.assistants.length).toBe(1);
      expect(component.assistants.find(a => a.id === asstToDelete.id)).toBeUndefined();
    }));

    it('should display error and roll back list if deleteAssistant fails', fakeAsync(() => {
      const asstToDelete = mockAssistants[0];
      mockAssistantService.deleteAssistant.and.returnValue(throwError(() => ({ error: { detail: 'Delete failed' } })));

      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', { stopPropagation: () => {} });
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('Failed to delete assistant. Delete failed');
      expect(component.assistants.length).toBe(2); // List rolled back
    }));

    it('should not call deleteAssistant if confirm is false', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', { stopPropagation: () => {} });

      expect(mockAssistantService.deleteAssistant).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to create page', () => {
      component.navigateToCreate();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants/create']);
    });

    it('should navigate to create page on button click', () => {
      const createButton = fixture.debugElement.query(By.css('.btn-primary'));
      createButton.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants/create']);
    });

    it('should navigate to detail page on row click', fakeAsync(() => {
      mockAssistantService.getAssistants.and.returnValue(of([...mockAssistants]));
      fixture.detectChanges(); tick(); fixture.detectChanges();

      const firstRow = fixture.debugElement.query(By.css('table tbody tr'));
      firstRow.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', mockAssistants[0].id]);
    }));

    it('should navigate to detail page via navigateToDetail method', () => {
      component.navigateToDetail(mockAssistants[0].id);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', mockAssistants[0].id]);
    });

    it('should navigate to edit page via navigateToEdit method', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation').and.callThrough();
      component.navigateToEdit(mockAssistants[0].id, event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', mockAssistants[0].id, 'edit']);
    });

    it('should navigate to edit page on edit button click', fakeAsync(() => {
      mockAssistantService.getAssistants.and.returnValue(of([...mockAssistants]));
      fixture.detectChanges(); tick(); fixture.detectChanges();

      const editButton = fixture.debugElement.queryAll(By.css('.btn-warning'))[0];
      editButton.triggerEventHandler('click', { stopPropagation: () => {} });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/assistants', mockAssistants[0].id, 'edit']);
    }));
  });
});
