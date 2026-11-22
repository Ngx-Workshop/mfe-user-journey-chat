import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, OnDestroy, inject, signal } from '@angular/core';
import { Observable, Subject, Subscription, timer } from 'rxjs';
import { ChatApiService } from '../api/chat-api.service';
import type { ChatCommandDto, ChatEventDto, ConnectionStatus } from '../models/chat.models';

export const CHAT_SOCKET_FACTORY = new InjectionToken<(url: string) => WebSocket>('CHAT_SOCKET_FACTORY', {
  providedIn: 'root', factory: () => url => new WebSocket(url),
});
/** Stateful transport; HTTP clients remain stateless. */
@Injectable({ providedIn: 'root' })
export class ChatConnectionService implements OnDestroy {
  private readonly api = inject(ChatApiService);
  private readonly document = inject(DOCUMENT);
  private readonly factory = inject(CHAT_SOCKET_FACTORY);
  private readonly statusState = signal<ConnectionStatus>('disconnected');
  readonly status = this.statusState.asReadonly();
  readonly events = new Subject<ChatEventDto>();
  readonly ready = new Subject<void>();
  private socket?: WebSocket;
  private work = new Subscription();
  private stopped = true;
  private retries = 0;
  private readonly pending = new Map<string, { resolve: (event: ChatEventDto) => void; reject: (error: Error) => void }>();

  connect() {
    this.disconnect(); this.stopped = false; this.retries = 0; this.open();
  }
  disconnect() {
    this.stopped = true; this.work.unsubscribe(); this.work = new Subscription();
    this.disposeSocket(); this.rejectPending(); this.statusState.set('disconnected');
  }
  ngOnDestroy() { this.disconnect(); this.events.complete(); this.ready.complete(); }
  command$(command: ChatCommandDto): Observable<ChatEventDto> {
    return new Observable(observer => {
      if (this.socket?.readyState !== WebSocket.OPEN || this.status() !== 'connected') {
        observer.error(new Error('Chat is disconnected. Your draft is kept.')); return;
      }
      const deadline = timer(15000).subscribe(() => {
        this.pending.delete(command.requestId);
        observer.error(new Error('Delivery is uncertain. Retry to check the saved message safely.'));
      });
      this.pending.set(command.requestId, {
        resolve: event => { observer.next(event); observer.complete(); },
        reject: error => observer.error(error),
      });
      this.socket.send(JSON.stringify(command));
      return () => { deadline.unsubscribe(); this.pending.delete(command.requestId); };
    });
  }
  private open() {
    if (this.stopped) return;
    this.statusState.set(this.retries ? 'reconnecting' : 'connecting');
    this.work.add(this.api.ticket$().subscribe({
      next: ({ ticket }) => {
        const location = this.document.location;
        const url = new URL('/api/ai-chat/socket', location.href);
        url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = this.factory(url.toString()); this.socket = socket;
        const deadline = timer(10000).subscribe(() => { socket.close(); });
        this.work.add(deadline);
        socket.onopen = () => socket.send(JSON.stringify({ type: 'authenticate', ticket }));
        socket.onmessage = event => {
          try {
            const value = JSON.parse(String(event.data)) as ChatEventDto;
            if (!['ready', 'snapshot', 'error'].includes(value.type)) throw new Error('Unsupported event');
            if (value.type === 'ready') {
              deadline.unsubscribe(); this.retries = 0; this.statusState.set('connected');
            }
            this.events.next(value);
            if (value.type === 'ready') this.ready.next();
            const pending = value.requestId ? this.pending.get(value.requestId) : undefined;
            if (pending) {
              this.pending.delete(value.requestId!);
              if (value.type === 'error') pending.reject(new Error(value.message || 'Chat command failed.'));
              else pending.resolve(value);
            }
          } catch { socket.close(1002, 'Invalid chat event'); }
        };
        socket.onerror = () => socket.close();
        socket.onclose = () => {
          deadline.unsubscribe(); this.socket = undefined; this.rejectPending(); this.scheduleRetry();
        };
      },
      error: error => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.statusState.set('sign-in-required'); this.stopped = true;
        } else this.scheduleRetry();
      },
    }));
  }
  private scheduleRetry() {
    if (this.stopped) return;
    if (this.retries >= 6) { this.statusState.set('disconnected'); return; }
    this.statusState.set('reconnecting');
    this.work.add(timer(Math.min(1000 * 2 ** this.retries++, 15000)).subscribe(() => this.open()));
  }
  private disposeSocket() {
    if (!this.socket) return;
    const socket = this.socket; this.socket = undefined;
    socket.onclose = null; socket.onmessage = null; socket.onopen = null; socket.onerror = null;
    socket.close();
  }
  private rejectPending() {
    for (const pending of this.pending.values()) pending.reject(new Error('Connection lost. Your draft is kept; retry safely after reconnecting.'));
    this.pending.clear();
  }
}
