import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

import { DocumentIngestComponent } from './document-ingest.component';
import { DocumentService } from '../../../services/document.service';
// Assuming no VectorStoreService mock needed for these tests as per current component implementation

describe('DocumentIngestComponent', () => {
  let component: DocumentIngestComponent;
  let fixture: ComponentFixture<DocumentIngestComponent>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockDocumentService = jasmine.createSpyObj('DocumentService', ['ingestDocument']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      queryParamMap: of(convertToParamMap({})), // Default no query params
      snapshot: { queryParamMap: convertToParamMap({}) } // for navigateBack
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        DocumentIngestComponent // Standalone
      ],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentIngestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Initial data binding
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should pre-fill vectorStoreId from query param if provided', fakeAsync(() => {
      const vsId = 'vsFromQuery';
      mockActivatedRoute.queryParamMap = of(convertToParamMap({ vectorStoreId: vsId }));
      component.ngOnInit(); // Re-run ngOnInit with new route mock
      tick();
      fixture.detectChanges();
      expect(component.vectorStoreId).toBe(vsId);
    }));
  });

  describe('Form Submission - File Upload', () => {
    const mockFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

    beforeEach(() => {
      component.ingestMode = 'file';
      component.vectorStoreId = 'vs123';
      // Simulate file selection
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);
      const fileInput = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement as HTMLInputElement;
      fileInput.files = dataTransfer.files;
      // Dispatch 'change' event manually after setting files property
      fileInput.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    });

    it('should call ingestDocument with file data and navigate on success', fakeAsync(() => {
      mockDocumentService.ingestDocument.and.returnValue(of({ message: 'Ingestion started' }));

      component.onSubmit();
      tick(); // Resolve observable
      fixture.detectChanges();

      expect(mockDocumentService.ingestDocument).toHaveBeenCalledWith('vs123', mockFile);
      expect(component.isLoading).toBeFalse();
      expect(component.successMessage).toBe('Document ingestion started successfully!');

      tick(2000); // For the setTimeout before navigation
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents'], { queryParams: { vectorStoreId: 'vs123' } });
    }));

    it('should show error if file not selected', () => {
        component.selectedFile = null; // Ensure no file is selected
        fixture.detectChanges();
        component.onSubmit();
        expect(component.error).toBe('Please select a file to upload.');
        expect(mockDocumentService.ingestDocument).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission - S3 URL', () => {
    const s3Url = 's3://my-bucket/file.txt';

    beforeEach(() => {
      component.ingestMode = 's3';
      component.vectorStoreId = 'vs456';
      component.s3Url = s3Url;
      fixture.detectChanges();
    });

    it('should call ingestDocument with S3 URL and navigate on success', fakeAsync(() => {
      mockDocumentService.ingestDocument.and.returnValue(of({ message: 'Ingestion started' }));

      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(mockDocumentService.ingestDocument).toHaveBeenCalledWith('vs456', undefined, s3Url);
      expect(component.isLoading).toBeFalse();
      expect(component.successMessage).toBe('Document ingestion started successfully!');

      tick(2000); // setTimeout
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents'], { queryParams: { vectorStoreId: 'vs456' } });
    }));

    it('should show error if S3 URL is not provided', () => {
        component.s3Url = '';
        fixture.detectChanges();
        component.onSubmit();
        expect(component.error).toBe('Please provide an S3 URL.');
        expect(mockDocumentService.ingestDocument).not.toHaveBeenCalled();
    });

    it('should show error for invalid S3 URL format (not starting with s3://)', () => {
        component.s3Url = 'http://my-bucket/file.txt';
        fixture.detectChanges();
        component.onSubmit();
        expect(component.error).toBe('Invalid S3 URL. It must start with s3://');
        expect(mockDocumentService.ingestDocument).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation and Error Handling', () => {
     it('should require vectorStoreId', () => {
        component.vectorStoreId = '';
        component.ingestMode = 'file';
        component.selectedFile = new File([''], 'test.txt');
        fixture.detectChanges();
        component.onSubmit();
        expect(component.error).toBe('Vector Store ID is required.');
        expect(mockDocumentService.ingestDocument).not.toHaveBeenCalled();
    });

    it('should handle ingestDocument API error', fakeAsync(() => {
        mockDocumentService.ingestDocument.and.returnValue(throwError(() => ({ error: { detail: 'Ingestion failed badly' } })));
        component.vectorStoreId = 'vs1';
        component.ingestMode = 'file';
        component.selectedFile = new File([''], 'test.txt');
        fixture.detectChanges();

        component.onSubmit();
        tick();
        fixture.detectChanges();

        expect(component.isLoading).toBeFalse();
        expect(component.error).toContain('Failed to ingest document. Ingestion failed badly');
        expect(component.successMessage).toBeNull();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
    }));

    it('should clear S3 URL when a file is selected', () => {
        component.s3Url = "s3://some/path";
        fixture.detectChanges();

        const mockFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(mockFile);
        const fileInput = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement as HTMLInputElement;
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        expect(component.selectedFile).toBe(mockFile);
        expect(component.s3Url).toBe('');
    });

    it('should clear selected file when S3 URL is entered', () => {
        component.selectedFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
        fixture.detectChanges();

        const s3Input = fixture.debugElement.query(By.css('input[name="s3Url"]')).nativeElement;
        s3Input.value = "s3://new/path";
        s3Input.dispatchEvent(new Event('input')); // Or 'change' depending on (input) vs (change)
        fixture.detectChanges();

        expect(component.s3Url).toBe("s3://new/path");
        expect(component.selectedFile).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to documents list (no query param)', () => {
      component.navigateBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents']);
    });

    it('should navigate back to documents list with vectorStoreId if it was in query params', fakeAsync(() => {
      const vsId = 'vsFromQuery';
      mockActivatedRoute.queryParamMap = of(convertToParamMap({ vectorStoreId: vsId }));
      // Create a new snapshot object for the navigateBack method
      mockActivatedRoute.snapshot = { queryParamMap: convertToParamMap({ vectorStoreId: vsId }) };

      component.ngOnInit(); // To set this.vectorStoreId from the new mock
      tick();
      fixture.detectChanges();

      component.navigateBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/documents'], { queryParams: { vectorStoreId: vsId } });
    }));
  });
});
