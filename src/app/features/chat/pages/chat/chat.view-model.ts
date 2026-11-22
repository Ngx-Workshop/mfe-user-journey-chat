import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, exhaustMap, finalize, switchMap, tap } from 'rxjs';
import { ChatStore } from '../../state/chat.store';

@Injectable()
export class ChatViewModel {
  private readonly store = inject(ChatStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly conversations = this.store.conversations;
  readonly current = this.store.current;
  readonly loading = this.store.loading;
  readonly loadError = this.store.error;
  readonly connection = this.store.connectionStatus;
  readonly activeRun = this.store.activeRun;
  readonly sending = signal(false);
  readonly busy = signal(false);
  readonly stopping = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({ text: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(8000)] }) });
  readonly canSend = computed(() => this.connection() === 'connected' && !!this.current() && !this.activeRun() && !this.sending() && !this.busy());
  private readonly sends = new Subject<void>();
  private readonly creates = new Subject<void>();
  private readonly selections = new Subject<string>();
  private readonly cancels = new Subject<void>();
  private retry?: { conversationId: string; text: string; id: string };
  private readonly drafts = new Map<string, string>();

  constructor() {
    this.sends.pipe(exhaustMap(() => {
      const text = this.form.controls.text.value.trim();
      const conversationId = this.current()?.id;
      if (!conversationId || !text || this.form.invalid || !this.canSend()) return EMPTY;
      this.sending.set(true); this.error.set('');
      if (this.retry?.conversationId !== conversationId || this.retry.text !== text) {
        this.retry = { conversationId, text, id: crypto.randomUUID() };
      }
      return this.store.send$(conversationId, this.retry.id, text).pipe(
        tap(() => { this.form.reset(); this.retry = undefined; this.drafts.delete(conversationId); }),
        catchError(error => { this.error.set(error.message || 'Message failed. Your draft is kept.'); return EMPTY; }),
        finalize(() => this.sending.set(false)),
      );
    }), takeUntilDestroyed()).subscribe();
    this.creates.pipe(exhaustMap(() => {
      this.saveDraft(); this.busy.set(true); this.error.set('');
      return this.store.create$().pipe(tap(() => this.restoreDraft()),
        catchError(() => { this.error.set('Could not create a conversation. Please retry.'); return EMPTY; }),
        finalize(() => this.busy.set(false)));
    }), takeUntilDestroyed()).subscribe();
    this.selections.pipe(tap(() => { this.saveDraft(); this.error.set(''); }),
      switchMap(id => {
        this.busy.set(true);
        return this.store.open$(id).pipe(tap(() => this.restoreDraft()),
          catchError(() => { this.error.set('Could not open the conversation. Please retry.'); return EMPTY; }),
          finalize(() => this.busy.set(false)));
      }), takeUntilDestroyed()).subscribe();
    this.cancels.pipe(exhaustMap(() => {
      if (!this.activeRun()) return EMPTY;
      this.stopping.set(true);
      return this.store.cancel$().pipe(catchError(() => { this.error.set('Could not stop the response. Reconnect and try again.'); return EMPTY; }),
        finalize(() => this.stopping.set(false)));
    }), takeUntilDestroyed()).subscribe();
    this.store.start();
    this.destroyRef.onDestroy(() => this.store.stop());
  }
  send() { this.sends.next(); }
  create() { if (!this.sending() && !this.busy()) this.creates.next(); }
  select(id: string) { if (!this.sending() && !this.busy()) this.selections.next(id); }
  cancel() { this.cancels.next(); }
  reconnect() { this.store.reconnect(); }
  reload() { this.store.reload(); }
  private saveDraft() { const id = this.current()?.id; if (id) this.drafts.set(id, this.form.controls.text.value); }
  private restoreDraft() { this.form.controls.text.setValue(this.drafts.get(this.current()!.id) || ''); }
}
