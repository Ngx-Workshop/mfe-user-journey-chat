import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, finalize, switchMap, tap } from 'rxjs';
import { ChatApiService } from '../api/chat-api.service';
import type { ChatEventDto, ConversationDto, UiActionIntent } from '../models/chat.models';
import { ChatConnectionService } from './chat-connection.service';

@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly api = inject(ChatApiService);
  private readonly connection = inject(ChatConnectionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly listState = signal<ConversationDto[]>([]);
  private readonly currentState = signal<ConversationDto | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal('');
  private readonly refresh = new Subject<void>();
  private principalId?: string;
  private refreshSubscription?: ReturnType<Observable<ConversationDto[]>['subscribe']>;
  readonly conversations = this.listState.asReadonly();
  readonly current = this.currentState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly connectionStatus = this.connection.status;
  readonly activeRun = computed(() => this.current()?.activeRunId);

  constructor() {
    effect(() => {
      if (this.connectionStatus() === 'sign-in-required') {
        this.currentState.set(null); this.listState.set([]);
        this.errorState.set('Sign in to load your conversations.');
      }
    });
    this.connection.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event.type === 'ready' && event.userId) {
        if (this.principalId && this.principalId !== event.userId) { this.currentState.set(null); this.listState.set([]); }
        this.principalId = event.userId;
      }
      if (event.conversation) this.apply(event.conversation);
    });
    this.connection.ready.pipe(takeUntilDestroyed()).subscribe(() => {
      this.reload();
      const current = this.current();
      if (current) this.subscribe$(current.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: error => this.fail(error) });
    });
  }
  start() {
    this.refreshSubscription?.unsubscribe();
    this.refreshSubscription = this.refresh.pipe(
      switchMap(() => {
        this.loadingState.set(true); this.errorState.set('');
        return this.api.list$().pipe(
        tap(rows => {
          // Preserve snapshots newer than an in-flight list request.
          const existing = this.listState();
          this.listState.set(rows.map(row => existing.find(item => item.id === row.id && item.revision > row.revision) ?? row));
        }),
        catchError(error => { this.fail(error); return EMPTY; }),
        finalize(() => this.loadingState.set(false)),
      ); }), takeUntilDestroyed(this.destroyRef),
    ).subscribe();
    this.connection.connect(); this.reload();
  }
  stop() { this.refreshSubscription?.unsubscribe(); this.connection.disconnect(); this.currentState.set(null); this.listState.set([]); }
  reconnect() { this.connection.connect(); }
  reload() { this.refresh.next(); }
  create$() {
    return this.api.create$().pipe(tap(conversation => {
      this.currentState.set(conversation); this.apply(conversation);
      this.subscribe$(conversation.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: error => this.fail(error) });
    }));
  }
  open$(id: string) {
    this.errorState.set('');
    return this.api.get$(id).pipe(tap(conversation => {
      const existing = this.current();
      if (existing?.id !== conversation.id || existing.revision <= conversation.revision) this.currentState.set(conversation);
      this.apply(conversation);
      this.subscribe$(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: error => this.fail(error) });
    }));
  }
  send$(conversationId: string, clientMessageId: string, text: string) {
    return this.connection.command$({ type: 'send_message', requestId: crypto.randomUUID(), conversationId, clientMessageId, text });
  }
  uiAction$(intent: UiActionIntent, clientMessageId: string) {
    return this.connection.command$({ type: 'ui_action', requestId: crypto.randomUUID(), conversationId: this.current()!.id, clientMessageId, ...intent });
  }
  cancel$() {
    const current = this.current()!;
    return this.connection.command$({ type: 'cancel_run', requestId: crypto.randomUUID(), conversationId: current.id, runId: current.activeRunId });
  }
  private subscribe$(conversationId: string): Observable<ChatEventDto> {
    return this.connection.command$({ type: 'subscribe', requestId: crypto.randomUUID(), conversationId });
  }
  private apply(conversation: ConversationDto) {
    const current = this.current();
    if (current?.id === conversation.id && conversation.revision >= current.revision) this.currentState.set(conversation);
    const existing = this.listState().find(row => row.id === conversation.id);
    if (existing && existing.revision > conversation.revision) return;
    this.listState.update(rows => [{ ...conversation, messages: [] }, ...rows.filter(row => row.id !== conversation.id)]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }
  private fail(error: unknown) {
    const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
    this.errorState.set(status === 401 || status === 403 ? 'Sign in to load your conversations.' : 'Could not load chat. Please retry.');
  }
}
