import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ThreadService } from '../../../services/thread.service';
import { MessageService } from '../../../services/message.service';
import { Thread } from '../../../core/models/thread.model';
import { Message } from '../../../core/models/message.model';
import { Observable, of, Subscription, forkJoin } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-thread-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './thread-chat.component.html',
  styleUrls: ['./thread-chat.component.css']
})
export class ThreadChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  thread: Thread | null = null;
  messages: Message[] = [];
  threadId: string | null = null;

  newMessageContent = '';

  isLoadingThread = false;
  isLoadingMessages = false;
  isSendingMessage = false;

  error: string | null = null;
  sendError: string | null = null;

  private routeSub: Subscription | undefined;
  private autoRefreshSub: Subscription | undefined; // For potential future auto-refresh/polling

  constructor(
    private threadService: ThreadService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.threadId = params.get('id');
      if (this.threadId) {
        this.loadInitialData();
      } else {
        this.error = 'Thread ID not found in route.';
        this.isLoadingThread = false;
        this.isLoadingMessages = false;
      }
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  loadInitialData(): void {
    if (!this.threadId) return;

    this.isLoadingThread = true;
    this.isLoadingMessages = true;
    this.error = null;

    forkJoin({
      thread: this.threadService.getThread(this.threadId),
      messages: this.threadService.getMessages(this.threadId)
    }).pipe(
      catchError(err => {
        console.error('Error loading initial thread data:', err);
        this.error = `Failed to load thread information. ${err.error?.detail || ''}`;
        return of({ thread: null, messages: [] as Message[] }); // Return empty/null on error
      }),
      finalize(() => {
        this.isLoadingThread = false;
        this.isLoadingMessages = false;
      })
    ).subscribe(response => {
      if (response.thread) {
        this.thread = response.thread;
      } else if (!this.error) {
        this.error = 'Could not load thread details.';
      }
      this.messages = response.messages.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }

  refreshMessages(): void {
    if (!this.threadId) return;

    this.isLoadingMessages = true;
    this.error = null; // Clear previous general errors
    this.threadService.getMessages(this.threadId).pipe(
      catchError(err => {
        console.error('Error refreshing messages:', err);
        this.error = `Failed to refresh messages. ${err.error?.detail || ''}`;
        return of([] as Message[]);
      }),
      finalize(() => {
        this.isLoadingMessages = false;
      })
    ).subscribe(loadedMessages => {
      this.messages = loadedMessages.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }

  sendMessage(): void {
    if (!this.threadId || !this.newMessageContent.trim()) {
      return;
    }

    this.isSendingMessage = true;
    this.sendError = null;

    const tempUserMessage: Message = { // Optimistic update
      id: `temp-${Date.now()}`,
      thread_id: this.threadId,
      role: 'user',
      content: this.newMessageContent.trim(),
      created_at: new Date().toISOString()
    };
    this.messages.push(tempUserMessage);
    const currentMessageContent = this.newMessageContent;
    this.newMessageContent = ''; // Clear input immediately

    this.messageService.createMessage(this.threadId, tempUserMessage.content).pipe(
      catchError(err => {
        console.error('Error sending message:', err);
        this.sendError = `Failed to send message. ${err.error?.detail || 'Please try again.'}`;
        // Remove optimistic message or mark as failed
        this.messages = this.messages.filter(m => m.id !== tempUserMessage.id);
        this.newMessageContent = currentMessageContent; // Restore content on error
        return of(null);
      }),
      finalize(() => {
        this.isSendingMessage = false;
      })
    ).subscribe(sentMessage => {
      if (sentMessage) {
        // Replace optimistic message with actual from backend & refresh all messages
        // This also helps get any assistant response that might have been triggered
        this.messages = this.messages.filter(m => m.id !== tempUserMessage.id);
        // this.messages.push(sentMessage); // Could push just the sent one if backend returns it
        // this.messages.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        this.refreshMessages(); // Refresh to get this message and any assistant response
      }
    });
  }

  scrollToBottom(): void {
    try {
      if (this.messageContainer?.nativeElement) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  navigateBack(): void {
    this.router.navigate(['/threads']);
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.autoRefreshSub) { // For future polling
      this.autoRefreshSub.unsubscribe();
    }
  }
}
