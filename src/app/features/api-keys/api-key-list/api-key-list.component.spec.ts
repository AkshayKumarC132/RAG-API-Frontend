import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ApiKeyListComponent } from './api-key-list.component';
import { OpenAIKeyService } from '../../../services/openai-key.service';
import { OpenAIKey } from '../../../core/models/openai-key.model';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

describe('ApiKeyListComponent', () => {
  let component: ApiKeyListComponent;
  let fixture: ComponentFixture<ApiKeyListComponent>;
  let mockOpenAIKeyService: jasmine.SpyObj<OpenAIKeyService>;

  const mockApiKeys: OpenAIKey[] = [
    { id: '1', name: 'Test Key 1', masked_key: 'sk-...1234', created_at: new Date().toISOString(), is_valid: true, key: 'sk-real123' },
    { id: '2', name: 'Test Key 2', masked_key: 'sk-...5678', created_at: new Date().toISOString(), is_valid: false, key: 'sk-real567' }
  ];

  beforeEach(async () => {
    mockOpenAIKeyService = jasmine.createSpyObj('OpenAIKeyService', ['getAPIKeys', 'deleteAPIKey']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule,
        HttpClientTestingModule,
        ApiKeyListComponent // Import the standalone component
      ],
      providers: [
        { provide: OpenAIKeyService, useValue: mockOpenAIKeyService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApiKeyListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call getAPIKeys on init and display keys', fakeAsync(() => {
      mockOpenAIKeyService.getAPIKeys.and.returnValue(of([...mockApiKeys]));
      fixture.detectChanges(); // ngOnInit
      tick(); // Resolve observables
      fixture.detectChanges(); // Update view with data

      expect(mockOpenAIKeyService.getAPIKeys).toHaveBeenCalled();
      expect(component.apiKeys.length).toBe(2);
      expect(component.isLoading).toBeFalse();
      expect(component.error).toBeNull();

      const tableRows = fixture.debugElement.queryAll(By.css('table tbody tr'));
      expect(tableRows.length).toBe(2);
      expect(tableRows[0].nativeElement.cells[0].textContent).toContain('Test Key 1');
      expect(tableRows[1].nativeElement.cells[1].textContent).toContain('sk-...5678');
    }));

    it('should handle loading state during getAPIKeys', () => {
      mockOpenAIKeyService.getAPIKeys.and.returnValue(of([...mockApiKeys]));
      fixture.detectChanges(); // ngOnInit
      expect(component.isLoading).toBeTrue();
      tick(); // Should not be needed here as we are checking intermediate state
      // fixture.detectChanges(); // after observable resolves
      // expect(component.isLoading).toBeFalse(); // This will be false after tick() and detectChanges()
    });


    it('should display error message if getAPIKeys fails', fakeAsync(() => {
      mockOpenAIKeyService.getAPIKeys.and.returnValue(throwError(() => new Error('Failed to fetch')));
      fixture.detectChanges(); // ngOnInit
      tick(); // Resolve error
      fixture.detectChanges(); // Update view with error

      expect(mockOpenAIKeyService.getAPIKeys).toHaveBeenCalled();
      expect(component.apiKeys.length).toBe(0);
      expect(component.isLoading).toBeFalse();
      expect(component.error).toBe('Failed to load API keys.');

      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.nativeElement.textContent).toContain('Failed to load API keys.');
    }));

     it('should show "No API keys found" message when apiKeys array is empty', fakeAsync(() => {
      mockOpenAIKeyService.getAPIKeys.and.returnValue(of([]));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();

      expect(component.apiKeys.length).toBe(0);
      const noKeysMessage = fixture.debugElement.query(By.css('.alert-secondary'));
      expect(noKeysMessage.nativeElement.textContent).toContain('No API keys found.');
    }));
  });

  describe('Delete API Key', () => {
    beforeEach(fakeAsync(() => {
      mockOpenAIKeyService.getAPIKeys.and.returnValue(of([...mockApiKeys]));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();
    }));

    it('should call deleteAPIKey and remove key from list on success', fakeAsync(() => {
      const keyToDelete = mockApiKeys[0];
      mockOpenAIKeyService.deleteAPIKey.and.returnValue(of(null)); // Simulate successful deletion

      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', null);
      tick(); // Resolve deleteAPIKey observable
      fixture.detectChanges(); // Update view

      expect(mockOpenAIKeyService.deleteAPIKey).toHaveBeenCalledWith(keyToDelete.id);
      expect(component.apiKeys.length).toBe(1);
      expect(component.apiKeys.find(k => k.id === keyToDelete.id)).toBeUndefined();
      expect(component.isLoading).toBeFalse();

      const tableRows = fixture.debugElement.queryAll(By.css('table tbody tr'));
      expect(tableRows.length).toBe(1);
      expect(tableRows[0].nativeElement.cells[0].textContent).toContain(mockApiKeys[1].name);
    }));

    it('should display error message if deleteAPIKey fails', fakeAsync(() => {
      const keyToDelete = mockApiKeys[0];
      mockOpenAIKeyService.deleteAPIKey.and.returnValue(throwError(() => new Error('Delete failed')));

      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', null);
      tick();
      fixture.detectChanges();

      expect(mockOpenAIKeyService.deleteAPIKey).toHaveBeenCalledWith(keyToDelete.id);
      expect(component.apiKeys.length).toBe(2); // Key should still be in the list
      expect(component.isLoading).toBeFalse();
      expect(component.error).toBe('Failed to delete API key.');

      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.nativeElement.textContent).toContain('Failed to delete API key.');
    }));

    it('should not call deleteAPIKey if id is undefined or null', () => {
      // This test directly calls the component method, not through template interaction
      component.deleteApiKey(null as any);
      expect(mockOpenAIKeyService.deleteAPIKey).not.toHaveBeenCalled();
      expect(component.error).toBe('Cannot delete key with invalid ID.');

      component.error = null; // Reset error for next check

      component.deleteApiKey(undefined as any);
      expect(mockOpenAIKeyService.deleteAPIKey).not.toHaveBeenCalled();
      expect(component.error).toBe('Cannot delete key with invalid ID.');
    });
  });
});
