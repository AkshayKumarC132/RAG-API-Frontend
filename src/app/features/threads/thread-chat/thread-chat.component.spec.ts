import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError, forkJoin } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ElementRef } from '@angular/core';

import { ThreadChatComponent } from './thread-chat.component';
import { ThreadService } from '../../../services/thread.service';
import { MessageService } from '../../../services/message.service';
import { Thread } from '../../../core/models/thread.model';
import { Message } from '../../../core/models/message.model';
import { CommonModule, DatePipe } from '@angular/common';

// Mock ElementRef for scrollToBottom tests
class MockElementRef implements ElementRef {
  nativeElement = { scrollTop: 0, scrollHeight: 0 };
}

describe('ThreadChatComponent', () => {
  let component: ThreadChatComponent;
  let fixture: ComponentFixture<ThreadChatComponent>;
  let mockThreadService: jasmine.SpyObj<ThreadService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockMessageContainer: MockElementRef;


  const threadId = 'thread123';
  const mockThread: Thread = {
    id: threadId,
    vector_store_id: 'vs1',
    vector_store_name: 'Test VS',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const mockMessages: Message[] = [
    { id: 'msg1', thread_id: threadId, role: 'user', content: 'Hello', created_at: new Date(Date.now() - 10000).toISOString() },
    { id: 'msg2', thread_id: threadId, role: 'assistant', content: 'Hi there!', created_at: new Date(Date.now() - 5000).toISOString() },
  ];
  const mockSentMessage: Message = {
    id: 'msg3', thread_id: threadId, role: 'user', content: 'New message', created_at: new Date().toISOString()
  };

  beforeEach(async () => {
    mockThreadService = jasmine.createSpyObj('ThreadService', ['getThread', 'getMessages']);
    mockMessageService = jasmine.createSpyObj('MessageService', ['createMessage']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({ id: threadId }))
    };
    mockMessageContainer = new MockElementRef();

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        ThreadChatComponent // Standalone
      ],
      providers: [
        { provide: ThreadService, useValue: mockThreadService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        DatePipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThreadChatComponent);
    component = fixture.componentInstance;
    component.messageContainer = mockMessageContainer; // Assign mock ElementRef
  });

  afterEach(() => {
    try {
      discardPeriodicTasks(); // Clean up any pending timers if used by component (not currently, but good practice)
    } catch (e) {}
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call getThread and getMessages on init, and display data', fakeAsync(() => {
      mockThreadService.getThread.and.returnValue(of({ ...mockThread }));
      mockThreadService.getMessages.and.returnValue(of([...mockMessages]));

      fixture.detectChanges(); // ngOnInit
      tick(); // Resolve forkJoin
      fixture.detectChanges(); // Update view

      expect(mockThreadService.getThread).toHaveBeenCalledWith(threadId);
      expect(mockThreadService.getMessages).toHaveBeenCalledWith(threadId);
      expect(component.thread).toEqual(mockThread);
      expect(component.messages.length).toBe(2);
      expect(fixture.debugElement.query(By.css('.chat-header h4')).nativeElement.textContent).toContain(threadId);
      const messageElements = fixture.debugElement.queryAll(By.css('.message-wrapper'));
      expect(messageElements.length).toBe(2);
      expect(messageElements[0].nativeElement.textContent).toContain('Hello');
    }));

    it('should handle loading states correctly during init', fakeAsync(() => {
      mockThreadService.getThread.and.returnValue(of({ ...mockThread }).pipe(delay(50)));
      mockThreadService.getMessages.and.returnValue(of([...mockMessages]).pipe(delay(100)));

      fixture.detectChanges(); // ngOnInit
      expect(component.isLoadingThread).toBeTrue();
      expect(component.isLoadingMessages).toBeTrue();

      tick(50); // Resolve getThread
      fixture.detectChanges();
      expect(component.isLoadingThread).toBeFalse();
      expect(component.isLoadingMessages).toBeTrue(); // Still waiting for messages

      tick(50); // Resolve getMessages (total 100ms)
      fixture.detectChanges();
      expect(component.isLoadingMessages).toBeFalse();
    }));

    it('should display error if getThread fails', fakeAsync(() => {
      mockThreadService.getThread.and.returnValue(throwError(() => new Error('Fetch thread failed')));
      mockThreadService.getMessages.and.returnValue(of([...mockMessages])); // Messages might still load or also fail
      fixture.detectChanges(); tick(); fixture.detectChanges();
      expect(component.error).toContain('Failed to load thread information.');
    }));

    it('should display error if getMessages fails', fakeAsync(() => {
      mockThreadService.getThread.and.returnValue(of({...mockThread}));
      mockThreadService.getMessages.and.returnValue(throwError(() => new Error('Fetch messages failed')));
      fixture.detectChanges(); tick(); fixture.detectChanges();
      expect(component.error).toContain('Failed to load thread information.'); // Error from forkJoin
    }));

    it('should display "No messages" if messages array is empty', fakeAsync(() => {
      mockThreadService.getThread.and.returnValue(of({...mockThread}));
      mockThreadService.getMessages.and.returnValue(of([]));
      fixture.detectChanges(); tick(); fixture.detectChanges();
      const noMessages = fixture.debugElement.query(By.css('.text-muted.mt-5'));
      expect(noMessages.nativeElement.textContent).toContain('No messages in this thread yet.');
    }));
  });

  describe('Sending a Message', () => {
    beforeEach(fakeAsync(() => {
      mockThreadService.getThread.and.returnValue(of({ ...mockThread }));
      mockThreadService.getMessages.and.returnValue(of([...mockMessages]));
      fixture.detectChanges(); tick(); fixture.detectChanges();
    }));

    it('should call createMessage, add optimistic message, then refresh messages', fakeAsync(() => {
      const newMessageContent = 'Test new message';
      component.newMessageContent = newMessageContent;
      mockMessageService.createMessage.and.returnValue(of({ ...mockSentMessage, content: newMessageContent }));
      // For refresh call after sending:
      const refreshedMessages = [...mockMessages, { ...mockSentMessage, content: newMessageContent }];
      mockThreadService.getMessages.and.returnValue(of(refreshedMessages));

      fixture.detectChanges();
      component.sendMessage();
      tick(); // Resolve createMessage
      fixture.detectChanges();

      expect(mockMessageService.createMessage).toHaveBeenCalledWith(threadId, newMessageContent);
      expect(component.messages.some(m => m.id.startsWith('temp-') && m.content === newMessageContent)).toBeFalse(); // Optimistic removed
      expect(mockThreadService.getMessages).toHaveBeenCalledTimes(2); // Initial + after send
      expect(component.messages.length).toBe(3);
      expect(component.messages[2].content).toBe(newMessageContent);
      expect(component.newMessageContent).toBe(''); // Input cleared
    }));

    it('should handle error when sending message and restore input', fakeAsync(() => {
      const failedMessageContent = 'This will fail';
      component.newMessageContent = failedMessageContent;
      mockMessageService.createMessage.and.returnValue(throwError(() => new Error('Send failed')));

      fixture.detectChanges();
      component.sendMessage();
      tick(); // Resolve createMessage error
      fixture.detectChanges();

      expect(component.sendError).toContain('Failed to send message.');
      expect(component.messages.some(m => m.content === failedMessageContent && m.id.startsWith('temp-'))).toBeFalse(); // Optimistic removed
      expect(component.newMessageContent).toBe(failedMessageContent); // Input restored
    }));

    it('should show sending state and disable input/button', fakeAsync(() => {
        component.newMessageContent = "Sending this...";
        mockMessageService.createMessage.and.returnValue(of(mockSentMessage).pipe(delay(100)));
        mockThreadService.getMessages.and.returnValue(of(mockMessages)); // For refresh call

        fixture.detectChanges();
        component.sendMessage();
        fixture.detectChanges();

        expect(component.isSendingMessage).toBeTrue();
        const sendButton = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
        expect(sendButton.disabled).toBeTrue();
        expect(sendButton.textContent).toContain('Sending...');
        const messageInput = fixture.debugElement.query(By.css('input[name="newMessageContent"]')).nativeElement;
        expect(messageInput.disabled).toBeTrue();

        tick(100); // Resolve createMessage
        fixture.detectChanges();
        tick(); // Resolve getMessages for refresh
        fixture.detectChanges();
        expect(component.isSendingMessage).toBeFalse();
    }));
  });

  describe('Manual Message Refresh', () => {
    beforeEach(fakeAsync(() => {
      mockThreadService.getThread.and.returnValue(of({ ...mockThread }));
      mockThreadService.getMessages.and.returnValue(of([...mockMessages]));
      fixture.detectChanges(); tick(); fixture.detectChanges();
    }));

    it('should call getMessages on refresh button click', fakeAsync(() => {
      const updatedMessages = [...mockMessages, mockSentMessage];
      mockThreadService.getMessages.calls.reset(); // Reset from init
      mockThreadService.getMessages.and.returnValue(of(updatedMessages));

      const refreshButton = fixture.debugElement.query(By.css('button[title="Refresh Messages"]'));
      refreshButton.triggerEventHandler('click', null);
      tick();
      fixture.detectChanges();

      expect(mockThreadService.getMessages).toHaveBeenCalledWith(threadId);
      expect(component.messages.length).toBe(3);
      expect(component.messages[2].id).toBe(mockSentMessage.id);
    }));
  });

  describe('Auto-scrolling', () => {
    it('should attempt to scroll to bottom after view checked', fakeAsync(() => {
      mockThreadService.getThread.and.returnValue(of({ ...mockThread }));
      mockThreadService.getMessages.and.returnValue(of([...mockMessages]));
      fixture.detectChanges(); // ngOnInit, ngAfterViewInit, ngAfterViewChecked
      tick();
      fixture.detectChanges();

      const initialScrollTop = mockMessageContainer.nativeElement.scrollTop;
      mockMessageContainer.nativeElement.scrollHeight = 200; // Simulate content height

      component.ngAfterViewChecked(); // Manually trigger for test clarity

      // Check if scrollTop was set to scrollHeight
      // This is a basic check; precise behavior might vary based on browser/timing in real scenario
      expect(mockMessageContainer.nativeElement.scrollTop).toBe(mockMessageContainer.nativeElement.scrollHeight);
    }));
  });

  describe('Navigation', () => {
    it('should navigate back to threads list', () => {
      component.navigateBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/threads']);
    });
  });
});

// Helper for delay
import { Observable } from 'rxjs';
import { delay as rxDelay } from 'rxjs/operators';

function delay<T>(ms: number): (source: Observable<T>) => Observable<T> {
  return rxDelay(ms);
}
