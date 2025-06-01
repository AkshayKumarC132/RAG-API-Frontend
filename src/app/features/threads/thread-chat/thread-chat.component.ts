import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { ThreadService } from "../../../services/thread.service";
import { MessageService } from "../../../services/message.service";
import { AssistantService } from "../../../services/assistant.service";
import { Thread } from "../../../core/models/thread.model";
import { Message } from "../../../core/models/message.model";
import { Assistant } from "../../../core/models/assistant.model";
import { Observable, of, Subscription, forkJoin, interval } from "rxjs";
import {
  catchError,
  finalize,
  switchMap,
  tap,
  takeWhile,
  filter,
} from "rxjs/operators";

@Component({
  selector: "app-thread-chat",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: "./thread-chat.component.html",
  styleUrls: ["./thread-chat.component.css"],
})
export class ThreadChatComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  @ViewChild("messageContainer") private messageContainer!: ElementRef;

  thread: Thread | null = null;
  messages: Message[] = [];
  threadId: string | null = null;
  assistants: Assistant[] = [];
  selectedAssistantId: string | null = null;

  newMessageContent = "";
  isLoadingThread = false;
  isLoadingMessages = false;
  isSendingMessage = false;

  error: string | null = null;
  sendError: string | null = null;

  private routeSub: Subscription | undefined;
  private autoRefreshSub: Subscription | undefined;

  isString(value: any): boolean {
    return typeof value === "string";
  }

  constructor(
    private threadService: ThreadService,
    private messageService: MessageService,
    private assistantService: AssistantService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.threadId = params.get("id");
      if (this.threadId) {
        this.loadInitialData();
        this.loadAssistants();
      } else {
        this.error = "Thread ID not found in route.";
        this.isLoadingThread = false;
        this.isLoadingMessages = false;
      }
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  // Initialize Bootstrap tooltips
  initializeTooltip(): void {
    const inputElement = document.querySelector(
      'input[name="newMessageContent"]'
    );
    if (inputElement && !this.selectedAssistantId) {
      // Bootstrap 5 tooltip initialization
      import("bootstrap").then((bootstrap) => {
        new bootstrap.Tooltip(inputElement, {
          trigger: "focus",
          placement: "top",
          title:
            this.assistants.length > 0
              ? "Please select an assistant from the dropdown."
              : "Please create an assistant first.",
        });
      });
    }
  }

  loadInitialData(): void {
    if (!this.threadId) return;

    this.isLoadingThread = true;
    this.isLoadingMessages = true;
    this.error = null;

    forkJoin({
      thread: this.threadService.getThread(this.threadId),
      messages: this.threadService.getMessages(this.threadId),
    })
      .pipe(
        catchError((err) => {
          console.error("Error loading initial thread data:", err);
          this.error = `Failed to load thread information. ${
            err.error?.detail || ""
          }`;
          return of({ thread: null, messages: [] as Message[] });
        }),
        finalize(() => {
          this.isLoadingThread = false;
          this.isLoadingMessages = false;
        })
      )
      .subscribe((response) => {
        if (response.thread) {
          this.thread = response.thread;
        } else if (!this.error) {
          this.error = "Could not load thread details.";
        }
        this.messages = response.messages.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
  }

  loadAssistants(): void {
    this.assistantService
      .getAssistants()
      .pipe(
        catchError((err) => {
          console.error("Error loading assistants:", err);
          this.error = "Failed to load assistants.";
          return of([]);
        })
      )
      .subscribe((assistants) => {
        this.assistants = assistants;
        if (assistants.length > 0 && !this.selectedAssistantId) {
          this.selectedAssistantId = null;
        }
      });
  }

  onAssistantChange(): void {
    this.sendError = null;
    // Dispose of any existing tooltip when assistant is selected
    if (this.selectedAssistantId) {
      const inputElement = document.querySelector(
        'input[name="newMessageContent"]'
      );
      if (inputElement) {
        import("bootstrap").then((bootstrap) => {
          const tooltip = bootstrap.Tooltip.getInstance(inputElement);
          if (tooltip) {
            tooltip.dispose();
          }
        });
      }
    }
  }

  navigateToCreateAssistant(): void {
    this.router.navigate(["/assistants/create"]);
  }

  refreshMessages(): void {
    if (!this.threadId) return;

    this.isLoadingMessages = true;
    this.error = null;
    this.threadService
      .getMessages(this.threadId)
      .pipe(
        catchError((err) => {
          console.error("Error refreshing messages:", err);
          this.error = `Failed to refresh messages. ${err.error?.detail || ""}`;
          return of([] as Message[]);
        }),
        finalize(() => {
          this.isLoadingMessages = false;
        })
      )
      .subscribe((loadedMessages) => {
        this.messages = loadedMessages.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
  }

  sendMessage(): void {
    if (
      !this.threadId ||
      !this.newMessageContent.trim() ||
      !this.selectedAssistantId ||
      this.isSendingMessage
    ) {
      this.sendError = !this.selectedAssistantId
        ? "Please select an assistant."
        : "No message content provided.";
      return;
    }

    this.isSendingMessage = true;
    this.sendError = null;

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      thread_id: this.threadId,
      role: "user",
      content: this.newMessageContent.trim(),
      created_at: new Date().toISOString(),
    };
    this.messages.push(tempUserMessage);
    const currentMessageContent = this.newMessageContent;
    this.newMessageContent = "";

    this.messageService
      .createMessage(this.threadId, tempUserMessage.content)
      .pipe(
        switchMap((sentMessage) => {
          if (!sentMessage) {
            throw new Error("Message creation failed");
          }
          this.messages = this.messages.filter(
            (m) => m.id !== tempUserMessage.id
          );
          this.messages.push(sentMessage);
          this.messages.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );

          return this.threadService
            .createRun(this.threadId!, this.selectedAssistantId!)
            .pipe(
              switchMap(() => {
                return interval(2000).pipe(
                  switchMap(() =>
                    this.threadService.getRunStatus(this.threadId!)
                  ),
                  takeWhile(
                    (runStatus: any) => runStatus.status === "in_progress",
                    true
                  ), // Continue while "in_progress"
                  filter((runStatus: any) => runStatus.status === "completed"), // Process only when "completed"
                  switchMap(() =>
                    this.threadService.getMessages(this.threadId!)
                  )
                );
              })
            );
        }),
        catchError((err) => {
          console.error("Error in sendMessage pipeline:", err);
          this.sendError = `Failed to send message or process run. ${
            err.error?.detail || "Please try again."
          }`;
          this.messages = this.messages.filter(
            (m) => m.id !== tempUserMessage.id
          );
          this.newMessageContent = currentMessageContent;
          return of(null);
        }),
        finalize(() => {
          this.isSendingMessage = false;
        })
      )
      .subscribe((finalMessages) => {
        if (finalMessages) {
          this.messages = finalMessages.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        }
      });
  }

  scrollToBottom(): void {
    try {
      if (this.messageContainer?.nativeElement) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  navigateBack(): void {
    this.router.navigate(["/threads"]);
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
    }
    // Dispose of all tooltips on destroy
    const inputElement = document.querySelector(
      'input[name="newMessageContent"]'
    );
    if (inputElement) {
      import("bootstrap").then((bootstrap) => {
        const tooltip = bootstrap.Tooltip.getInstance(inputElement);
        if (tooltip) {
          tooltip.dispose();
        }
      });
    }
  }
}
