import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { By } from '@angular/platform-browser';

import { DocumentDetailComponent } from './document-detail.component';
import { DocumentService } from '../../../services/document.service';
import { Document, DocumentStatus } from '../../../core/models/document.model';

describe('DocumentDetailComponent', () => {
  let component: DocumentDetailComponent;
  let fixture: ComponentFixture<DocumentDetailComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const documentId = 'doc123';
  const initialDocument: Document = {
    id: documentId,
    title: 'Test Document',
    vector_store_id: 'vs1',
    upload_date: new Date().toISOString(),
    status: 'processing'
  };

  const completedDocument: Document = { ...initialDocument, status: 'completed' };
  const failedDocument: Document = { ...initialDocument, status: 'failed' };

  beforeEach(async () => {
    mockDocumentService = jasmine.createSpyObj('DocumentService', ['getDocument', 'checkDocumentStatus', 'deleteDocument']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({ id: documentId })),
      snapshot: {} // Add snapshot if your component uses it, e.g. for initial values
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule,
        HttpClientTestingModule,
        DocumentDetailComponent // Standalone
      ],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        DatePipe // DocumentDetailComponent uses DatePipe in its template implicitly via CommonModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentDetailComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Ensure tasks from fakeAsync are cleaned up
    try {
      discardPeriodicTasks();
    } catch (e) {
      // May throw if no periodic tasks were queued
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call getDocument on init and display document details', fakeAsync(() => {
      mockDocumentService.getDocument.and.returnValue(of({ ...initialDocument }));
      mockDocumentService.checkDocumentStatus.and.returnValue(of({ status: 'processing' } as DocumentStatus)); // for initial poll

      fixture.detectChanges(); // ngOnInit
      tick(); // Resolve getDocument
      fixture.detectChanges(); // Update view

      expect(mockDocumentService.getDocument).toHaveBeenCalledWith(documentId);
      expect(component.document).toEqual(initialDocument);
      expect(fixture.debugElement.query(By.css('.card-header h3')).nativeElement.textContent).toContain(initialDocument.title);

      tick(5000); // Allow polling to run once
      discardPeriodicTasks();
    }));

    it('should handle loading state for getDocument', fakeAsync(() => {
      mockDocumentService.getDocument.and.returnValue(of({ ...initialDocument }).pipe());
      mockDocumentService.checkDocumentStatus.and.returnValue(of({ status: 'processing' } as DocumentStatus));


      fixture.detectChanges(); // ngOnInit
      expect(component.isLoading).toBeTrue();
      tick();
      fixture.detectChanges();
      expect(component.isLoading).toBeFalse();
      discardPeriodicTasks();
    }));

    it('should display error if getDocument fails', fakeAsync(() => {
      mockDocumentService.getDocument.and.returnValue(throwError(() => new Error('Fetch failed')));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();

      expect(component.error).toContain('Failed to load document details');
      expect(fixture.debugElement.query(By.css('.alert-danger'))).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should display error if no document ID is in route', fakeAsync(() => {
      mockActivatedRoute.paramMap = of(convertToParamMap({})); // No ID
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();
      expect(component.error).toBe('Document ID not found in route.');
      discardPeriodicTasks();
    }));
  });

  describe('Document Status Checking and Polling', () => {
    beforeEach(fakeAsync(() => {
      mockDocumentService.getDocument.and.returnValue(of({ ...initialDocument })); // status: 'processing'
      mockDocumentService.checkDocumentStatus.and.returnValue(of({ status: 'processing' } as DocumentStatus));
      fixture.detectChanges(); // ngOnInit
      tick(); // Resolve getDocument
      fixture.detectChanges();
    }));

    it('should call checkDocumentStatus on manual refresh click', fakeAsync(() => {
      const refreshButton = fixture.debugElement.query(By.css('button[title="Refresh Status"]'));

      mockDocumentService.checkDocumentStatus.calls.reset(); // Reset call count from initial poll
      mockDocumentService.checkDocumentStatus.and.returnValue(of({ status: 'completed' } as DocumentStatus));

      refreshButton.triggerEventHandler('click', null);
      tick();
      fixture.detectChanges();

      expect(mockDocumentService.checkDocumentStatus).toHaveBeenCalledWith(documentId);
      expect(component.document?.status).toBe('completed');
      discardPeriodicTasks();
    }));

    it('should poll for status when document is "processing"', fakeAsync(() => {
      // Initial status is 'processing' from beforeEach
      expect(component.document?.status).toBe('processing');
      expect(component.pollingSubscription).not.toBeNull();

      // Simulate time passing for polling
      mockDocumentService.checkDocumentStatus.and.returnValue(of({ status: 'processing' } as DocumentStatus));
      tick(5000); // Advance time by polling interval
      fixture.detectChanges();
      expect(mockDocumentService.checkDocumentStatus).toHaveBeenCalledTimes(2); // Initial + 1 poll

      mockDocumentService.checkDocumentStatus.and.returnValue(of({ status: 'completed' } as DocumentStatus));
      tick(5000);
      fixture.detectChanges();
      expect(mockDocumentService.checkDocumentStatus).toHaveBeenCalledTimes(3); // Initial + 2 polls
      expect(component.document?.status).toBe('completed');
      expect(component.pollingSubscription).toBeNull(); // Polling should stop

      discardPeriodicTasks();
    }));

    it('should stop polling when status becomes "failed"', fakeAsync(() => {
      mockDocumentService.checkDocumentStatus.and.returnValue(of({ status: 'failed' } as DocumentStatus));
      tick(5000); // polling interval
      fixture.detectChanges();
      expect(component.document?.status).toBe('failed');
      expect(component.pollingSubscription).toBeNull();
      discardPeriodicTasks();
    }));

    it('should stop polling on component destroy', fakeAsync(() => {
      expect(component.pollingSubscription).not.toBeNull();
      component.ngOnDestroy();
      expect(component.pollingSubscription).toBeNull();
      // Try to advance time, no more calls should be made
      mockDocumentService.checkDocumentStatus.calls.reset();
      tick(10000);
      expect(mockDocumentService.checkDocumentStatus).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should handle error during manual status check', fakeAsync(() => {
      mockDocumentService.checkDocumentStatus.and.returnValue(throwError(() => ({ error: { detail: 'Status check error' } })));
      component.checkDocumentStatus(true); // manual trigger
      tick();
      fixture.detectChanges();
      expect(component.error).toContain('Failed to check document status. Status check error');
      discardPeriodicTasks();
    }));
  });

  describe('Delete Document', () => {
    beforeEach(fakeAsync(() => {
      mockDocumentService.getDocument.and.returnValue(of({ ...initialDocument }));
      mockDocumentService.checkDocumentStatus.and.returnValue(of({ status: 'processing' } as DocumentStatus));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      discardPeriodicTasks(); // Clean up any polling from setup
    }));

    it('should call deleteDocument and navigate to list on success', fakeAsync(() => {
      mockDocumentService.deleteDocument.and.returnValue(of(null));
      const deleteButton = fixture.debugElement.query(By.css('.btn-danger'));
      deleteButton.triggerEventHandler('click', null);
      tick();

      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(documentId);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
      discardPeriodicTasks();
    }));

    it('should display error if deleteDocument fails', fakeAsync(() => {
      mockDocumentService.deleteDocument.and.returnValue(throwError(() => ({ error: { detail: 'Deletion failed' } })));
      const deleteButton = fixture.debugElement.query(By.css('.btn-danger'));
      deleteButton.triggerEventHandler('click', null);
      tick();
      fixture.detectChanges();

      expect(component.error).toContain('Failed to delete document. Deletion failed');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));
  });

  describe('Navigation', () => {
    it('should navigate back to document list', () => {
      component.navigateBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
    });

    it('should navigate back when "Back to List" button is clicked', fakeAsync(() => {
      mockDocumentService.getDocument.and.returnValue(of({ ...initialDocument }));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(By.css('.btn-outline-secondary'));
      backButton.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
      discardPeriodicTasks();
    }));
  });
});
