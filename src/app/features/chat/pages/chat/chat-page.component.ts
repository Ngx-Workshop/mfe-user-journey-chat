import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChatViewModel } from './chat.view-model';
import { MessageFeedComponent } from '../../components/message-feed/message-feed.component';
import { ChatComposerComponent } from '../../components/composer/chat-composer.component';

@Component({
  selector: 'ngx-chat-page',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule, MessageFeedComponent, ChatComposerComponent],
  providers: [ChatViewModel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="chat" aria-label="Workshop chat">
      <aside class="chat__sidebar" aria-label="Conversations">
        <div class="chat__brand"><mat-icon aria-hidden="true">forum</mat-icon><strong>Workshop chat</strong></div>
        <button mat-flat-button class="chat__new" [disabled]="vm.busy() || vm.sending() || vm.connection() !== 'connected'" (click)="vm.create()">
          <mat-icon>add</mat-icon> New conversation</button>
        <p class="chat__label">RECENT CONVERSATIONS</p>
        @if (vm.loading()) { <mat-progress-bar mode="indeterminate" aria-label="Loading conversations" /> }
        @if (vm.loadError()) {
          <p class="chat__error" role="alert">{{ vm.loadError() }}</p>
          <button mat-button (click)="vm.reload()">Retry loading</button>
        }
        <nav class="chat__list" aria-label="Recent conversations">
          @for (conversation of vm.conversations(); track conversation.id) {
            <button class="chat__conversation" [class.chat__conversation--active]="vm.current()?.id === conversation.id"
              [attr.aria-current]="vm.current()?.id === conversation.id ? 'true' : null"
              [disabled]="vm.sending() || vm.busy() || vm.connection() !== 'connected'" (click)="vm.select(conversation.id)">
              <mat-icon aria-hidden="true">chat_bubble_outline</mat-icon><span>{{ conversation.title }}</span></button>
          } @empty {
            @if (!vm.loading() && !vm.loadError()) { <p class="chat__muted">Your conversations will appear here.</p> }
          }
        </nav>
        <p class="chat__privacy">Your conversations are private to your account.</p>
      </aside>
      <main class="chat__main">
        <header class="chat__header"><div><h1>{{ vm.current()?.title || 'Your learning companion' }}</h1>
          <span class="chat__status" role="status">{{ vm.connection() === 'sign-in-required' ? 'Sign in required' : vm.connection() }}</span></div>
          @if (vm.connection() === 'disconnected' || vm.connection() === 'sign-in-required') {
            <button mat-stroked-button (click)="vm.reconnect()">Reconnect</button>
          }
        </header>
        @if (vm.error()) { <div class="chat__error" role="alert">{{ vm.error() }}</div> }
        @if (vm.busy()) { <mat-progress-bar mode="indeterminate" aria-label="Opening conversation" /> }
        @if (vm.current(); as current) {
          <ngx-chat-message-feed [messages]="current.messages" />
          <ngx-chat-composer [form]="vm.form" [enabled]="vm.canSend()" [connected]="vm.connection() === 'connected'"
            [sending]="vm.sending()" [running]="!!vm.activeRun()" [stopping]="vm.stopping()"
            (send)="vm.send()" (stop)="vm.cancel()" />
        } @else {
          <div class="chat__welcome"><mat-icon aria-hidden="true">auto_awesome</mat-icon>
            <h2>A little curiosity goes a long way.</h2><p>Start a conversation to explore ideas and learn at your own pace.</p>
            <button mat-flat-button [disabled]="vm.busy() || vm.connection() !== 'connected'" (click)="vm.create()">Start a conversation</button>
          </div>
        }
      </main>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--mat-sys-on-surface, #202124); }
    .chat { display: grid; grid-template-columns: 17rem minmax(0, 1fr); height: calc(100dvh - 9rem); min-height: 32rem;
      max-height: 64rem; background: var(--mat-sys-surface, #fff); border: 1px solid var(--mat-sys-outline-variant, #ddd); border-radius: 1rem; overflow: hidden; }
    .chat__sidebar { display: flex; flex-direction: column; min-height: 0; padding: 1.25rem; background: var(--mat-sys-surface-container-low, #f7f8fa); border-right: 1px solid var(--mat-sys-outline-variant, #ddd); }
    .chat__brand { display: flex; align-items: center; gap: .75rem; margin-bottom: 1.5rem; }
    .chat__new { width: 100%; }
    .chat__label { margin-top: 2rem; font-size: .65rem; letter-spacing: .1em; color: var(--mat-sys-on-surface-variant, #666); }
    .chat__list { overflow-y: auto; flex: 1; }
    .chat__conversation { display: flex; gap: .65rem; align-items: center; width: 100%; border: 0; border-radius: .6rem;
      background: transparent; color: inherit; padding: .85rem .65rem; cursor: pointer; text-align: left; font: inherit; font-size: .85rem; }
    .chat__conversation span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .chat__conversation--active { background: var(--mat-sys-secondary-container, #e2e8f0); color: var(--mat-sys-on-secondary-container, #29354b); }
    .chat__conversation:focus-visible { outline: 2px solid var(--mat-sys-primary, #405cb5); outline-offset: -2px; }
    .chat__conversation:disabled { opacity: .6; cursor: default; }
    .chat__conversation mat-icon { flex-shrink: 0; font-size: 1.15rem; width: 1.15rem; height: 1.15rem; }
    .chat__privacy, .chat__muted { font-size: .8rem; color: var(--mat-sys-on-surface-variant, #666); }
    .chat__privacy { padding-top: 1rem; }
    .chat__main { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
    .chat__header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid var(--mat-sys-outline-variant, #ddd); }
    .chat__header h1 { margin: 0 0 .3rem; font-size: 1.1rem; overflow-wrap: anywhere; }
    .chat__status { font-size: .75rem; text-transform: capitalize; color: var(--mat-sys-on-surface-variant, #666); }
    .chat__welcome { display: grid; place-content: center; justify-items: center; flex: 1; text-align: center; padding: 2rem; }
    .chat__welcome p { max-width: 28rem; line-height: 1.6; color: var(--mat-sys-on-surface-variant, #666); }
    .chat__welcome > mat-icon { color: var(--mat-sys-primary, #405cb5); font-size: 2.5rem; width: 2.5rem; height: 2.5rem; }
    .chat__error { padding: .75rem 1rem; color: var(--mat-sys-error, #b3261e); font-size: .85rem; }
    @media (max-width: 800px) {
      .chat { grid-template-columns: minmax(0, 1fr); height: calc(100dvh - 7rem); }
      .chat__sidebar { padding: .75rem; border-right: 0; border-bottom: 1px solid var(--mat-sys-outline-variant, #ddd); max-height: 11rem; }
      .chat__brand, .chat__label, .chat__privacy { display: none; }
      .chat__list { display: flex; flex: initial; margin-top: .5rem; overflow-x: auto; flex-shrink: 0; }
      .chat__conversation { width: auto; min-width: 9rem; max-width: 14rem; flex-shrink: 0; }
      .chat__main { flex: 1; }
      .chat { display: flex; flex-direction: column; }
    }
  `],
})
export class ChatPageComponent { readonly vm = inject(ChatViewModel); }
