import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { DocumentListComponent } from './document-list.component';
import { DocumentService } from '../../../services/document.service';
import { Document } from '../../../core/models/document.model';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockRouter: Router;

  const mockDocuments: Document[] = [
    { id: 'doc1', title: 'Document 1', vector_store_id: 'vs1', vector_store_name: 'Vector Store 1', upload_date: new Date().toISOString(), status: 'completed' },
    { id: 'doc2', title: 'Document 2', vector_store_id: 'vs2', vector_store_name: 'Vector Store 2', upload_date: new Date().toISOString(), status: 'processing' },
  ];

  beforeEach(async () => {
    mockDocumentService = jasmine.createSpyObj('DocumentService', ['getDocuments', 'deleteDocument']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([]), // Add dummy routes if your component uses routerLinkActive or similar
        HttpClientTestingModule,
        DocumentListComponent // Standalone component
      ],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router); // Get the router instance
    spyOn(mockRouter, 'navigate').and.stub(); // Spy on router.navigate
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call getDocuments on init and display documents', fakeAsync(() => {
      mockDocumentService.getDocuments.and.returnValue(of([...mockDocuments]));
      fixture.detectChanges(); // ngOnInit
      tick(); // Resolve observables
      fixture.detectChanges(); // Update view

      expect(mockDocumentService.getDocuments).toHaveBeenCalled();
      expect(component.documents.length).toBe(2);
      expect(component.isLoading).toBeFalse();
      const tableRows = fixture.debugElement.queryAll(By.css('table tbody tr'));
      expect(tableRows.length).toBe(2);
      expect(tableRows[0].nativeElement.cells[0].textContent).toContain('Document 1');
    }));

    it('should handle loading state correctly', fakeAsync(() => {
      mockDocumentService.getDocuments.and.returnValue(of([...mockDocuments]));
      fixture.detectChanges(); // ngOnInit - isLoading becomes true
      expect(component.isLoading).toBeTrue();
      const loadingDiv = fixture.debugElement.query(By.css('.alert-info'));
      expect(loadingDiv).toBeTruthy();

      tick(); // Resolve observable
      fixture.detectChanges(); // Update view - isLoading becomes false
      expect(component.isLoading).toBeFalse();
      const loadingDivAfter = fixture.debugElement.query(By.css('.alert-info'));
      expect(loadingDivAfter).toBeNull();
    }));

    it('should display error message if getDocuments fails', fakeAsync(() => {
      mockDocumentService.getDocuments.and.returnValue(throwError(() => new Error('Failed to fetch')));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('Failed to load documents. Please try again later.');
      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv.nativeElement.textContent).toContain('Failed to load documents.');
    }));

    it('should show "No documents found" message when documents array is empty', fakeAsync(() => {
      mockDocumentService.getDocuments.and.returnValue(of([]));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();

      const noDocsMessage = fixture.debugElement.query(By.css('.alert-secondary'));
      expect(noDocsMessage.nativeElement.textContent).toContain('No documents found.');
    }));
  });

  describe('Delete Document', () => {
    beforeEach(fakeAsync(() => {
      mockDocumentService.getDocuments.and.returnValue(of([...mockDocuments]));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();
    }));

    it('should call deleteDocument and remove document from list on success', fakeAsync(() => {
      const docToDelete = mockDocuments[0];
      mockDocumentService.deleteDocument.and.returnValue(of(null)); // Simulate successful deletion

      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', { stopPropagation: () => {} }); // Mock event object
      tick();
      fixture.detectChanges();

      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(docToDelete.id);
      expect(component.documents.length).toBe(1);
      expect(component.documents.find(d => d.id === docToDelete.id)).toBeUndefined();
    }));

    it('should display error message if deleteDocument fails', fakeAsync(() => {
      const docToDelete = mockDocuments[0];
      mockDocumentService.deleteDocument.and.returnValue(throwError(() => ({ error: { detail: 'Delete failed' } })));

      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', { stopPropagation: () => {} });
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('Failed to delete document. Delete failed');
      expect(component.documents.length).toBe(2); // Document should still be there
    }));
  });

  describe('Navigation', () => {
    it('should navigate to document detail page', () => {
      component.navigateToDetail('doc1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents', 'doc1']);
    });

    it('should navigate to ingest page when navigateIngest is called', () => {
      component.navigateIngest();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents/ingest']);
    });

    it('should navigate to ingest page when "Ingest New Document" button is clicked', () => {
      const ingestButton = fixture.debugElement.query(By.css('.btn-primary'));
      ingestButton.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents/ingest']);
    });

    it('should navigate to detail page when a document row is clicked', fakeAsync(() => {
      mockDocumentService.getDocuments.and.returnValue(of([...mockDocuments]));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const firstRow = fixture.debugElement.query(By.css('table tbody tr'));
      firstRow.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents', mockDocuments[0].id]);
    }));
  });
});
