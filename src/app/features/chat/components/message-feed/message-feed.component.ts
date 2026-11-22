import { A2uiSurfaceComponent } from '../a2ui/a2ui-surface.component';
import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, input, output, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { ChatMessageDto, UiActionIntent } from '../../models/chat.models';

@Component({
  selector: 'ngx-chat-message-feed',
  imports: [DatePipe, A2uiSurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="feed" #feed role="log" aria-label="Conversation messages" aria-live="polite"
      (scroll)="trackScroll()" tabindex="0">
      @if (!messages().length) {
        <div class="feed__empty"><h2>What would you like to explore?</h2>
          <p>Ask about a workshop, work through an idea, or practice something new.</p></div>
      }
      @for (message of messages(); track message.id) {
        <article class="feed__message" [class.feed__message--user]="message.role === 'user'"
          [attr.aria-label]="message.role === 'user' ? 'Your message' : 'Assistant response'">
          <div class="feed__meta"><strong>{{ message.role === 'user' ? 'You' : 'Workshop assistant' }}</strong>
            <time>{{ message.createdAt | date:'shortTime' }}</time></div>
          @for (part of message.parts; track $index) {
            @switch (part.kind) {
              @case ('text') { <p class="feed__text">{{ part.text }}</p> }
              @case ('tool') { <p class="feed__activity">{{ part.text || 'Tool activity' }}</p> }
              @case ('a2ui') {
                @if (part.ui; as ui) { <ngx-chat-learning-surface [ui]="ui" [messageId]="message.id" [disabled]="disabled()" (action)="action.emit($event)" /> }
                @else { <p class="feed__activity">{{ part.text || 'This saved interactive content is unavailable. Ask for a fresh explanation.' }}</p> }
              }
            }
          }
          @if (message.status === 'streaming') { <p class="feed__status" role="status">Responding…</p> }
          @if (message.status === 'canceled') { <p class="feed__status">Response stopped</p> }
          @if (message.error) { <p class="feed__error">{{ message.error }}</p> }
        </article>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex: 1; min-height: 0; }
    .feed { flex: 1; overflow-y: auto; padding: 1.5rem; scroll-behavior: auto; }
    .feed__empty { max-width: 34rem; margin: 12vh auto; text-align: center; color: var(--mat-sys-on-surface-variant, #666); }
    .feed__message { max-width: 48rem; margin: 0 auto 1.25rem; padding: 1.1rem 1.3rem; border-radius: 1rem; }
    .feed__message--user { background: var(--mat-sys-surface-container-high, #edf1f5); }
    .feed__meta { display: flex; justify-content: space-between; gap: 1rem; font-size: .8rem; }
    .feed__meta time, .feed__status, .feed__activity { color: var(--mat-sys-on-surface-variant, #666); }
    .feed__text { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.65; }
    .feed__error { color: var(--mat-sys-error, #b3261e); }
    .feed__status { font-size: .8rem; }
    @media (max-width: 600px) { .feed { padding: .75rem; } }
  `],
})
export class MessageFeedComponent {
  readonly disabled = input(false);
  readonly action = output<UiActionIntent>();
  readonly messages = input.required<ChatMessageDto[]>();
  private readonly feed = viewChild<ElementRef<HTMLElement>>('feed');
  private follow = true;
  private conversationMessageId?: string;
  constructor() {
    afterRenderEffect(() => {
      const messages = this.messages();
      if (messages[0]?.id !== this.conversationMessageId) { this.follow = true; this.conversationMessageId = messages[0]?.id; }
      const feed = this.feed()?.nativeElement;
      if (feed && this.follow) feed.scrollTop = feed.scrollHeight;
    });
  }
  trackScroll() { const feed = this.feed()!.nativeElement; this.follow = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 100; }
}
