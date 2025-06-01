import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';

import { ThreadListComponent } from './thread-list.component';
import { ThreadService } from '../../../services/thread.service';
import { Thread } from '../../../core/models/thread.model';
import { CommonModule } from '@angular/common';

describe('ThreadListComponent', () => {
  let component: ThreadListComponent;
  let fixture: ComponentFixture<ThreadListComponent>;
  let mockThreadService: jasmine.SpyObj<ThreadService>;
  let mockRouter: Router;

  const mockThreads: Thread[] = [
    { id: 'thread1', vector_store_id: 'vs1', vector_store_name: 'VS Alpha', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'thread2', vector_store_id: 'vs2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  beforeEach(async () => {
    mockThreadService = jasmine.createSpyObj('ThreadService', ['getThreads', 'deleteThread']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule,
        ThreadListComponent // Standalone
      ],
      providers: [
        { provide: ThreadService, useValue: mockThreadService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThreadListComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate').and.stub();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call getThreads on init and display threads', fakeAsync(() => {
      mockThreadService.getThreads.and.returnValue(of([...mockThreads]));
      fixture.detectChanges(); // ngOnInit
      tick();
      fixture.detectChanges();

      expect(mockThreadService.getThreads).toHaveBeenCalled();
      expect(component.threads.length).toBe(2);
      const threadItems = fixture.debugElement.queryAll(By.css('.list-group-item'));
      expect(threadItems.length).toBe(2);
      expect(threadItems[0].nativeElement.textContent).toContain('Thread ID: thread1');
      expect(threadItems[0].nativeElement.textContent).toContain('VS Alpha');
      expect(threadItems[1].nativeElement.textContent).toContain('Vector Store: vs2');
    }));

    it('should handle loading state correctly', fakeAsync(() => {
      mockThreadService.getThreads.and.returnValue(of([...mockThreads]));
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

    it('should display error message if getThreads fails', fakeAsync(() => {
      mockThreadService.getThreads.and.returnValue(throwError(() => new Error('Fetch failed')));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('Failed to load threads. Please try again later.');
      const errorDiv = fixture.debugElement.query(By.css('.alert-danger'));
      expect(errorDiv.nativeElement.textContent).toContain('Failed to load threads.');
    }));

    it('should show "No threads found" message when array is empty', fakeAsync(() => {
      mockThreadService.getThreads.and.returnValue(of([]));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const noMessage = fixture.debugElement.query(By.css('.alert-secondary'));
      expect(noMessage.nativeElement.textContent).toContain('No threads found.');
    }));
  });

  describe('Delete Thread', () => {
    beforeEach(fakeAsync(() => {
      mockThreadService.getThreads.and.returnValue(of([...mockThreads]));
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      spyOn(window, 'confirm').and.returnValue(true);
    }));

    it('should call deleteThread and remove from list on success', fakeAsync(() => {
      const threadToDelete = mockThreads[0];
      mockThreadService.deleteThread.and.returnValue(of(null));

      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', { stopPropagation: () => {} });
      tick();
      fixture.detectChanges();

      expect(mockThreadService.deleteThread).toHaveBeenCalledWith(threadToDelete.id);
      expect(component.threads.length).toBe(1);
      expect(component.threads.find(a => a.id === threadToDelete.id)).toBeUndefined();
    }));

    it('should display error and roll back list if deleteThread fails', fakeAsync(() => {
      const threadToDelete = mockThreads[0];
      mockThreadService.deleteThread.and.returnValue(throwError(() => ({ error: { detail: 'Delete failed' } })));

      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', { stopPropagation: () => {} });
      tick();
      fixture.detectChanges();

      expect(component.error).toBe('Failed to delete thread. Delete failed');
      expect(component.threads.length).toBe(2);
    }));

    it('should not call deleteThread if confirm is false', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      const deleteButton = fixture.debugElement.queryAll(By.css('.btn-danger'))[0];
      deleteButton.triggerEventHandler('click', { stopPropagation: () => {} });

      expect(mockThreadService.deleteThread).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to create page', () => {
      component.navigateToCreate();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/threads/create']);
    });

    it('should navigate to create page on button click', () => {
      const createButton = fixture.debugElement.query(By.css('.btn-primary'));
      createButton.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/threads/create']);
    });

    it('should navigate to chat page on item div click', fakeAsync(() => {
      mockThreadService.getThreads.and.returnValue(of([...mockThreads]));
      fixture.detectChanges(); tick(); fixture.detectChanges();

      const firstItemDiv = fixture.debugElement.query(By.css('.list-group-item > div:first-child'));
      firstItemDiv.triggerEventHandler('click', null);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/threads', mockThreads[0].id, 'chat']);
    }));

    it('should navigate to chat page via navigateToChat method', () => {
      component.navigateToChat(mockThreads[0].id);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/threads', mockThreads[0].id, 'chat']);
    });

    it('should navigate to chat page on chat button click', fakeAsync(() => {
      mockThreadService.getThreads.and.returnValue(of([...mockThreads]));
      fixture.detectChanges(); tick(); fixture.detectChanges();

      const chatButton = fixture.debugElement.queryAll(By.css('.btn-success'))[0];
      chatButton.triggerEventHandler('click', { stopPropagation: () => {} }); // stopPropagation if on same element as another click
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/threads', mockThreads[0].id, 'chat']);
    }));
  });
});
